const DEFAULT_MODEL = "gemini-3.8-flash";
const DEFAULT_FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"];
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

class GeminiRequestError extends Error {
  constructor(status, code) {
    super("Gemini request failed");
    this.name = "GeminiRequestError";
    this.status = status;
    this.code = code;
  }
}

async function generateGeminiContent({ contents, generationConfig, systemInstruction, timeoutMs = 25000 }) {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) throw new GeminiRequestError(503, "NOT_CONFIGURED");

  const primary = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
  const configuredFallbacks = (process.env.GEMINI_FALLBACK_MODELS || "").split(",").map((model) => model.trim()).filter(Boolean);
  const models = [...new Set([primary, ...configuredFallbacks, ...DEFAULT_FALLBACK_MODELS])].filter(Boolean);
  let lastError = new GeminiRequestError(503, "UNAVAILABLE");

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const requestTimeoutMs = Math.min(timeoutMs, index === 0 ? 10000 : 15000);
    let response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents, generationConfig, ...(systemInstruction ? { systemInstruction } : {}) }),
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
    } catch (error) {
      const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
      lastError = new GeminiRequestError(503, timedOut ? "TIMEOUT" : "NETWORK_ERROR");
      console.warn("Gemini request could not reach the provider", { model, code: lastError.code });
      continue;
    }

    const payload = await response.json().catch(() => null);
    if (response.ok) {
      const candidate = payload?.candidates?.[0];
      const hasText = candidate?.content?.parts?.some((part) => typeof part.text === "string" && part.text.trim());
      if (candidate?.finishReason !== "MAX_TOKENS" && hasText) return { payload, model };
      lastError = new GeminiRequestError(503, candidate?.finishReason === "MAX_TOKENS" ? "INCOMPLETE" : "EMPTY_RESPONSE");
      console.warn("Gemini returned an incomplete response", { model, finishReason: candidate?.finishReason || "NO_CANDIDATE" });
      continue;
    }

    const providerCode = payload?.error?.status || "PROVIDER_ERROR";
    lastError = new GeminiRequestError(response.status, providerCode);
    console.warn("Gemini provider returned an error", { model, status: response.status, providerCode });
    if (!RETRYABLE_STATUSES.has(response.status)) throw lastError;
  }
  throw lastError;
}

function publicGeminiError(error) {
  if (!(error instanceof GeminiRequestError)) return null;
  if (error.code === "NOT_CONFIGURED") return { status: 503, code: "NOT_CONFIGURED", message: "Gemini is not configured on the backend. Add GEMINI_API_KEY to the backend service environment and redeploy." };
  if ([401, 403].includes(error.status)) return { status: 503, code: "KEY_REJECTED", message: "Gemini rejected the backend API key. Check the key and its Google AI project configuration." };
  if (error.status === 404) return { status: 503, code: "MODEL_UNAVAILABLE", message: "No configured Gemini model is available. Check the backend model settings." };
  if (error.status === 429) return { status: 429, code: "RATE_LIMIT", message: "Gemini capacity or quota is temporarily unavailable. Please wait a moment and retry." };
  return { status: 503, code: error.code === "TIMEOUT" ? "TIMEOUT" : "UNAVAILABLE", message: "Gemini is temporarily unavailable after trying the configured fallback models. Please retry shortly." };
}

module.exports = { generateGeminiContent, publicGeminiError };
