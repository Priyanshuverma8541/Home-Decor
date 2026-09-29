import api from "./api";

export const savinexaAPI = {
  getHome: () => api.get("/api/savinexa/home"),
  getProducts: (params = {}) => api.get("/api/savinexa/products", { params }),
  getProductBySlug: (slug) => api.get(`/api/savinexa/products/${encodeURIComponent(slug)}`),
  getCategories: () => api.get("/api/savinexa/categories"),
  getCollections: () => api.get("/api/savinexa/collections"),
  getBanners: () => api.get("/api/savinexa/banners"),
  getSettings: () => api.get("/api/savinexa/settings"),
  track: (event) => api.post("/api/savinexa/events", event),
};

export default savinexaAPI;
