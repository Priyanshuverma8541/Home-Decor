/**
 * fetcher.js — small, dependency-free helpers for talking to the network.
 *
 *   fetchJSON(url, options?)     GET  → parsed JSON
 *   postJSON(url, body, options?) POST → parsed JSON (or text / null)
 *   loadStylesheet(href)         inject a <link> and resolve once it has loaded
 *
 * Options accepted by fetchJSON / postJSON:
 *   timeout  (ms, default 10000)   abort the request after this long
 *   retries  (default 1 for GET, 0 for POST)   retry on network errors / 5xx
 *   headers, signal, ...any other fetch() option
 */

export class FetchError extends Error {
  constructor(message, { status = 0, url = '', cause } = {}) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.url = url;
    if (cause) this.cause = cause;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url, { timeout = 10000, retries = 0, signal, ...init } = {}) {
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });

      if (!res.ok) {
        const retryable = res.status >= 500 && attempt < retries;
        if (retryable) {
          attempt += 1;
          await sleep(300 * attempt);
          continue;
        }
        throw new FetchError(`Request failed with status ${res.status}`, { status: res.status, url });
      }
      return res;
    } catch (err) {
      if (err instanceof FetchError) throw err;

      if (attempt < retries) {
        attempt += 1;
        await sleep(300 * attempt);
        continue;
      }
      const reason = err.name === 'AbortError' ? 'Request timed out' : 'Network error';
      throw new FetchError(reason, { url, cause: err });
    } finally {
      clearTimeout(timer);
    }
  }
}

export async function fetchJSON(url, options = {}) {
  const res = await request(url, {
    retries: 1,
    ...options,
    method: 'GET',
    headers: { Accept: 'application/json', ...(options.headers || {}) },
  });
  try {
    return await res.json();
  } catch (err) {
    throw new FetchError('Response was not valid JSON', { url, cause: err });
  }
}

export async function postJSON(url, body, options = {}) {
  const res = await request(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
  });

  if (res.status === 204) return null;
  const type = res.headers.get('content-type') || '';
  return type.includes('application/json') ? res.json() : res.text();
}

const loadedStyles = new Map();

/** Inject a stylesheet once; resolves when it is ready so components never flash unstyled. */
export function loadStylesheet(href) {
  const url = new URL(href, document.baseURI).href;
  if (loadedStyles.has(url)) return loadedStyles.get(url);

  const promise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new FetchError('Stylesheet failed to load', { url }));
    document.head.appendChild(link);
  });

  loadedStyles.set(url, promise);
  return promise;
}
