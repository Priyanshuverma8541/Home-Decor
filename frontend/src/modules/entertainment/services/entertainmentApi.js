import api from "../../../services/api.js";

export const entertainmentAPI = {
  search: (q) => api.get("/api/entertainment/search", { params: { q } }),
  trending: () => api.get("/api/entertainment/trending"),
  featured: () => api.get("/api/entertainment/featured"),
  category: (slug) => api.get(`/api/entertainment/category/${slug}`),
  content: () => api.get("/api/entertainment/content"),
};
