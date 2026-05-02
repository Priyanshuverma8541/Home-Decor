import { createContext, useContext, useState, useCallback } from "react";
import { authAPI } from "../services/api.js";
import toast from "react-hot-toast";

const Ctx = createContext(null);
export const useAuth = () => { const c = useContext(Ctx); if (!c) throw new Error("useAuth outside provider"); return c; };

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem("sl_user")) || null; } catch { return null; } });
  const [token,   setToken]   = useState(() => localStorage.getItem("sl_token") || "");
  const [loading, setLoading] = useState(false);
  const isAuthenticated = Boolean(token && user);

  const login = useCallback(async (identifier, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ identifier, password });
      localStorage.setItem("sl_token", data.token);
      localStorage.setItem("sl_user",  JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
      toast.success(`Welcome back, ${data.user.fullName.split(" ")[0]}!`);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
      return { success: false, message: msg };
    } finally { setLoading(false); }
  }, []);

  const register = useCallback(async (body) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register(body);
      localStorage.setItem("sl_token", data.token);
      localStorage.setItem("sl_user",  JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
      toast.success("Account created! Welcome to Savitri Livings.");
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      toast.error(msg);
      return { success: false, message: msg };
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sl_token");
    localStorage.removeItem("sl_user");
    setToken(""); setUser(null);
    toast.success("Logged out");
  }, []);

  return (
    <Ctx.Provider value={{ user, token, isAuthenticated, loading, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}
