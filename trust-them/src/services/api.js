const API = (import.meta.env.VITE_API_URL || "http://localhost:8081").replace(/\/api\/?$/, "").replace(/\/+$/, "");
export function token() { return localStorage.getItem("sl_token") || ""; }
export async function request(path, options = {}) {
  const response = await fetch(`${API}/api/growth-livings${path}`, { ...options, headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}
export const saveProfile = (profile) => request("/me/profile", { method: "PUT", body: JSON.stringify(profile) });
export async function authenticate(mode, values) {
  const response = await fetch(`${API}/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Sign in could not be completed.");
  const authToken = data.token || data.accessToken;
  if (authToken) { localStorage.setItem("sl_token", authToken); if (data.user) localStorage.setItem("sl_user", JSON.stringify(data.user)); }
  return data;
}
