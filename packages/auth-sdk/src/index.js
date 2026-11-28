import { createSavitriApi } from "@savitri/api-sdk";

/** Same-origin helper for Savitri hosted modules. It never creates, persists, or forwards tokens. */
export function createSavitriAuth({ apiBaseUrl = "", trustedApiOrigins = [], fetchImpl = fetch } = {}) {
  const api = createSavitriApi({ baseUrl: apiBaseUrl, trustedTokenOrigins: trustedApiOrigins, getToken: () => localStorage.getItem("sl_token") || "", fetchImpl });
  return {
    async getCurrentUser() {
      try { const response = await api.get("/api/auth/me"); return response.user || null; }
      catch (error) { if (error.status === 401) return null; throw error; }
    },
    isAuthenticated: () => Boolean(localStorage.getItem("sl_token")),
    hasRole: (user, roles) => Boolean(user && (!roles?.length || roles.includes(user.role))),
  };
}
