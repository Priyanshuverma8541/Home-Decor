import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8081",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("sl_admin_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sl_admin_token");
      localStorage.removeItem("sl_admin_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (d) => api.post("/api/auth/login", d),
  me:    ()  => api.get("/api/auth/me"),
};
export const productAPI = {
  getAll:  (p) => api.get("/api/products", { params: p }),
  getOne:  (id)=> api.get(`/api/products/${id}`),
  create:  (d) => api.post("/api/products", d, { headers: { "Content-Type": "multipart/form-data" } }),
  update:  (id, d) => api.put(`/api/products/${id}`, d, { headers: { "Content-Type": "multipart/form-data" } }),
  remove:  (id)=> api.delete(`/api/products/${id}`),
  toggle:  (id)=> api.patch(`/api/products/${id}/toggle`),
};
export const orderAPI = {
  getAll:      (p) => api.get("/api/orders", { params: p }),
  analytics:   ()  => api.get("/api/orders/analytics"),
  updateStatus:(id, d) => api.patch(`/api/orders/${id}/status`, d),
};
export const leadAPI = {
  getAll:  (p) => api.get("/api/leads", { params: p }),
  getStats:()  => api.get("/api/leads/stats"),
  create:  (d) => api.post("/api/leads", d),
  update:  (id, d) => api.patch(`/api/leads/${id}`, d),
  remove:  (id)=> api.delete(`/api/leads/${id}`),
};
export const userAPI = {
  getAll:          (p) => api.get("/api/users", { params: p }),
  getDelivery:     (p) => api.get("/api/users/delivery", { params: p }),
  createPartner:   (d) => api.post("/api/users/partner", d),
  update:          (id, d) => api.patch(`/api/users/${id}`, d),
  toggle:          (id)=> api.patch(`/api/users/${id}/toggle`),
};
export const campaignAPI = {
  getAll:  ()  => api.get("/api/campaigns"),
  create:  (d) => api.post("/api/campaigns", d, { headers: { "Content-Type": "multipart/form-data" } }),
  update:  (id, d) => api.put(`/api/campaigns/${id}`, d, { headers: { "Content-Type": "multipart/form-data" } }),
  send:    (id)=> api.post(`/api/campaigns/${id}/send`),
  remove:  (id)=> api.delete(`/api/campaigns/${id}`),
};
export const settingsAPI = {
  get:      ()  => api.get("/api/settings/admin"),
  update:   (d) => api.put("/api/settings", d),
  uploadQR: (d) => api.post("/api/settings/qr", d, { headers: { "Content-Type": "multipart/form-data" } }),
};

export default api;
