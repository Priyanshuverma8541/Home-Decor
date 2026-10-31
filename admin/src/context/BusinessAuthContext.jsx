import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";

const base = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://home-decor-0rfj.onrender.com" : "http://localhost:8081");
const client = axios.create({ baseURL: base.replace(/\/+$/, ""), withCredentials: true, headers: { "Content-Type": "application/json" } });
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("sl_business_token");
  if (token) config.headers["X-Tenant-Session"] = token;
  return config;
});
const apiPath = (slug, path) => `/api/tenants/${encodeURIComponent(slug)}/admin${path}`;
export const businessAPI = {
  login: (slug, email, password) => client.post(apiPath(slug, "/login"), { email, password }),
  setup: (slug, data) => client.post(apiPath(slug, "/setup"), data),
  logout: (slug) => client.post(apiPath(slug || "", "/logout")),
  me: (slug) => client.get(apiPath(slug, "/me")),
  products: (slug) => client.get(apiPath(slug, "/products")),
  createProduct: (slug, data) => client.post(apiPath(slug, "/products"), data),
  updateProduct: (slug, id, data) => client.put(apiPath(slug, `/products/${id}`), data),
  deleteProduct: (slug, id) => client.delete(apiPath(slug, `/products/${id}`)),
  orders: (slug) => client.get(apiPath(slug, "/orders")),
  updateOrder: (slug, id, status) => client.patch(apiPath(slug, `/orders/${id}`), { status }),
  enquiries: (slug) => client.get(apiPath(slug, "/enquiries")),
  updateEnquiry: (slug, id, status) => client.patch(apiPath(slug, `/enquiries/${id}`), { status }),
  analytics: (slug) => client.get(apiPath(slug, "/analytics")),
  updateWebsite: (slug, website) => client.put(apiPath(slug, "/website"), website),
};

const Ctx = createContext(null);
export const BUSINESS_OPTIONS = [
  { slug: "gangabhog", name: "GangaBhog" },
  { slug: "savinexa", name: "SaviNexa" },
  { slug: "savitri-kolkata", name: "Savitri Kolkata" },
  { slug: "maa-vidhyavashini-jewellers", name: "Maa Vidhyavashini Jewellers" },
];
export const useBusinessAuth = () => { const value = useContext(Ctx); if (!value) throw new Error("useBusinessAuth must be within BusinessAuthProvider"); return value; };

export function BusinessAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async (slug) => {
    if (!slug) { setSession(null); return false; }
    try { const { data } = await businessAPI.me(slug); setSession({ slug, ...data }); return true; }
    catch { setSession(null); return false; }
  }, []);
  useEffect(() => {
    const saved = sessionStorage.getItem("sl_business_slug");
    if (saved) refresh(saved).finally(() => setLoading(false)); else setLoading(false);
  }, [refresh]);
  const login = useCallback(async (slug, email, password) => {
    setLoading(true);
    try {
      const { data } = await businessAPI.login(slug, email, password);
      localStorage.removeItem("sl_admin_token"); localStorage.removeItem("sl_admin_user");
      sessionStorage.setItem("sl_business_slug", slug);
      if (data.token) sessionStorage.setItem("sl_business_token", data.token);
      const { data: current } = await businessAPI.me(slug);
      setSession({ slug, ...current });
      return { success: true, business: data };
    } catch (error) { return { success: false, message: error.response?.data?.message || "Business sign-in failed" }; }
    finally { setLoading(false); }
  }, []);
  const setup = useCallback(async (slug, data) => {
    setLoading(true);
    try {
      const { data: created } = await businessAPI.setup(slug, data);
      if (created.token) sessionStorage.setItem("sl_business_token", created.token);
      localStorage.removeItem("sl_admin_token"); localStorage.removeItem("sl_admin_user");
      sessionStorage.setItem("sl_business_slug", slug);
      const { data: current } = await businessAPI.me(slug);
      setSession({ slug, ...current });
      return { success: true };
    } catch (error) { return { success: false, message: error.response?.data?.message || "Business account setup failed" }; }
    finally { setLoading(false); }
  }, []);
  const logout = useCallback(async () => {
    const slug = session?.slug || sessionStorage.getItem("sl_business_slug");
    if (slug) { try { await businessAPI.logout(slug); } catch { /* clear local state even if offline */ } }
    sessionStorage.removeItem("sl_business_slug"); sessionStorage.removeItem("sl_business_token"); setSession(null);
  }, [session?.slug]);
  return <Ctx.Provider value={{ session, loading, login, setup, logout, refresh }}>{children}</Ctx.Provider>;
}

export function BusinessProtectedRoute({ children }) {
  const { session, loading } = useBusinessAuth();
  if (loading) return <div style={{ padding: 32 }}>Loading business workspace…</div>;
  if (!session) return <NavigateBusinessLogin />;
  return children;
}
function NavigateBusinessLogin() { window.location.replace("/login?mode=business"); return null; }




