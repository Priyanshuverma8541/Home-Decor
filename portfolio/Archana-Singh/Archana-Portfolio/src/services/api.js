const API = (import.meta.env.VITE_API_URL || "http://localhost:8081").replace(/\/api\/?$/, "").replace(/\/+$/, "");

export async function getPublishedPortfolio(slug) {
  const response = await fetch(`${API}/api/growth-livings/public/portfolio/${encodeURIComponent(slug)}`, { headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.message || "Portfolio is not available."); error.status = response.status; throw error; }
  return data.profile;
}
