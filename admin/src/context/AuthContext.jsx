import { createContext, useContext, useState, useCallback } from "react";
import { authAPI } from "../services/api.js";
import toast from "react-hot-toast";

const Ctx = createContext(null);
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error("useAuth outside provider"); return c; };

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem("sl_admin_user")) || null; } catch { return null; } });
  const [token,   setToken]   = useState(() => localStorage.getItem("sl_admin_token") || "");
  const [loading, setLoading] = useState(false);
  const isAuthenticated = Boolean(token && user);

  const login = useCallback(async (identifier, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ identifier, password });
      if (!["admin"].includes(data.user?.role))
        return { success: false, message: "Admin access required" };
      localStorage.setItem("sl_admin_token", data.token);
      localStorage.setItem("sl_admin_user",  JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
      toast.success(`Welcome, ${data.user.fullName.split(" ")[0]}!`);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
      return { success: false, message: msg };
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sl_admin_token");
    localStorage.removeItem("sl_admin_user");
    setToken(""); setUser(null);
    toast.success("Logged out");
  }, []);

  return <Ctx.Provider value={{ user, token, isAuthenticated, loading, login, logout }}>{children}</Ctx.Provider>;
}
