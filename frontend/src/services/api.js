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

export const privacyAPI = {
  getMine: (subjectId) => api.get("/api/privacy/mine", { headers: { "X-Privacy-Subject-Id": subjectId } }),
  saveConsent: (data) => api.post("/api/privacy/consents", data),
};

export const overviewAPI = {
  get: () => api.get("/api/overview"),
};

export const leadAPI = {
  create: (d) => api.post("/api/leads", d),
};

export const ecosystemAPI = { getAll: () => api.get("/api/ecosystem") };
export const pagesAPI = {
  published: (slug) => api.get(`/api/pages/${encodeURIComponent(slug)}`),
  preview: (slug, token) => api.get(`/api/pages/preview/${encodeURIComponent(slug)}`, { headers: { "X-Page-Preview": token } }),
  track: (slug, event) => api.post(`/api/pages/${encodeURIComponent(slug)}/events`, event),
  submit: (slug, formId, data) => api.post(`/api/pages/${encodeURIComponent(slug)}/forms/${encodeURIComponent(formId)}`, data),
};
export const partnerBusinessAPI = {
  getAll: (params) => api.get("/api/partner-businesses", { params }),
  apply: (data) => api.post("/api/partner-businesses/apply", data),
};

export const marketplaceAPI = {
  categories: () => api.get("/api/marketplace/categories"),
  listings: (params) => api.get("/api/marketplace/listings", { params }),
  listing: (id) => api.get(`/api/marketplace/listings/${id}`),
  becomeSeller: (data) => api.post("/api/marketplace/become-seller", data),
  myListings: () => api.get("/api/marketplace/me/listings"),
  uploadListingImage: (data) => api.post("/api/marketplace/upload", data, { headers: { "Content-Type": "multipart/form-data" } }),
  createListing: (data) => api.post("/api/marketplace/listings", data),
};

export default api;
