import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8081";

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("sl_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sl_token");
      localStorage.removeItem("sl_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d) => api.post("/api/auth/register", d),
  login:    (d) => api.post("/api/auth/login", d),
  me:       ()  => api.get("/api/auth/me"),
};

export const productAPI = {
  getAll: (p) => api.get("/api/products", { params: p }),
  getOne: (id) => api.get(`/api/products/${id}`),
};

export const orderAPI = {
  create:   (d) => api.post("/api/orders", d),
  myOrders: ()  => api.get("/api/orders/mine"),
};

export const settingsAPI = {
  get: () => api.get("/api/settings"),
};

export const leadAPI = {
  create: (d) => api.post("/api/leads", d),
};

export default api;
