export class SavitriApiError extends Error {
  constructor(message, status = 0, body = null) {
    super(message);
    this.name = "SavitriApiError";
    this.status = status;
    this.body = body;
  }
}

export function createSavitriApi({ baseUrl = "", getToken = () => "", trustedTokenOrigins = [], fetchImpl = fetch } = {}) {
  const request = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    const token = await getToken();
    const currentOrigin = globalThis.location?.origin || "";
    const absolute = baseUrl ? new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`) : (currentOrigin ? new URL(path, currentOrigin) : null);
    const requestOrigin = absolute?.origin || currentOrigin;
    const tokenOriginApproved = requestOrigin && (requestOrigin === currentOrigin || trustedTokenOrigins.includes(requestOrigin));
    if (token && tokenOriginApproved) headers.set("Authorization", `Bearer ${token}`);
    const multipart = typeof FormData !== "undefined" && options.body instanceof FormData;
    if (options.body && !multipart && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const target = absolute || (path.startsWith("/") ? path : `/${path}`);
    const response = await fetchImpl(target, { ...options, headers, credentials: options.credentials || "same-origin" });
    const type = response.headers.get("content-type") || "";
    const body = type.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) throw new SavitriApiError(body?.message || `Request failed (${response.status})`, response.status, body);
    return body;
  };
  return {
    request,
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body: typeof FormData !== "undefined" && body instanceof FormData ? body : JSON.stringify(body) }),
    patch: (path, body, options) => request(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    put: (path, body, options) => request(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
  };
}
