import axios from "axios";

const productionApi = "https://home-decor-0rfj.onrender.com";
const configuredApi = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? productionApi : "http://localhost:8081");
export const API_BASE_URL = (import.meta.env.PROD && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(configuredApi) ? productionApi : configuredApi).replace(/\/api\/?$/, "").replace(/\/+$/, "");
const api = axios.create({
  baseURL: API_BASE_URL,
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

export const marketplaceAPI = {
  summary:    () => api.get("/api/marketplace/admin/summary"),
  listings:   (status) => api.get("/api/marketplace/admin/listings", { params: status ? { status } : {} }),
  moderate:   (id, data) => api.patch(`/api/marketplace/admin/listings/${id}`, data),
  categories: () => api.get("/api/marketplace/admin/categories"),
  addCategory:(data) => api.post("/api/marketplace/admin/categories", data),
  updateCategory:(id, data) => api.patch(`/api/marketplace/admin/categories/${id}`, data),
};

export const marketingAPI = {
  dashboard: () => api.get("/api/marketing/dashboard"),
  audiences: () => api.get("/api/marketing/audiences"),
  integrations: () => api.get("/api/marketing/integrations"),
};

export const overviewAPI = {
  get: () => api.get("/api/overview/admin"),
};

export const privacyAPI = {
  summary: () => api.get("/api/privacy/admin/summary"),
  consents: (params) => api.get("/api/privacy/admin/consents", { params }),
  removeConsent: (id) => api.delete(`/api/privacy/admin/consents/${id}`),
};

export const pagesAPI = {
  getAll: () => api.get("/api/pages/admin"),
  templates: () => api.get("/api/pages/admin/templates"),
  createTemplate: (data) => api.post("/api/pages/admin/templates", data),
  updateTemplate: (id, data) => api.patch(`/api/pages/admin/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/api/pages/admin/templates/${id}`),
  getOne: (id) => api.get(`/api/pages/admin/${id}`),
  create: (data) => api.post("/api/pages/admin", data),
  update: (id, data) => api.patch(`/api/pages/admin/${id}`, data),
  publish: (id) => api.post(`/api/pages/admin/${id}/publish`),
  unpublish: (id) => api.post(`/api/pages/admin/${id}/unpublish`),
  archive: (id) => api.post(`/api/pages/admin/${id}/archive`),
  duplicate: (id) => api.post(`/api/pages/admin/${id}/duplicate`),
  uploadHtml: (data) => api.post("/api/pages/admin/upload-html", data, { headers: { "Content-Type": "multipart/form-data" } }),
  analytics: (id) => api.get(`/api/pages/admin/${id}/analytics`),
  versions: (id) => api.get(`/api/pages/admin/${id}/versions`),
  restore: (id, version) => api.post(`/api/pages/admin/${id}/versions/${version}/restore`),
  previewToken: (id) => api.post(`/api/pages/admin/${id}/preview-token`),
};

export const partnerBusinessAPI = {
  getAll: (params) => api.get("/api/partner-businesses/admin", { params }),
  create: (data) => api.post("/api/partner-businesses/admin", data),
  update: (id, data) => api.patch(`/api/partner-businesses/admin/${id}`, data),
};

export const pushAPI = {
  summary: (appId) => api.get("/api/push/admin/summary", { params: appId ? { appId } : {} }),
  subscribers: (appId) => api.get("/api/push/admin/subscribers", { params: appId ? { appId } : {} }),
  createCampaign: (data) => api.post("/api/push/admin/campaigns", data),
  updateCampaign: (id, data, appId) => api.patch(`/api/push/admin/campaigns/${id}`, data, { params: appId ? { appId } : {} }),
  deleteCampaign: (id, appId) => api.delete(`/api/push/admin/campaigns/${id}`, { params: appId ? { appId } : {} }),
  sendCampaign: (id, appId) => api.post(`/api/push/admin/campaigns/${id}/send`, appId ? { appId } : {}, { params: appId ? { appId } : {} }),
  cancelCampaign: (id, appId) => api.post(`/api/push/admin/campaigns/${id}/cancel`, appId ? { appId } : {}, { params: appId ? { appId } : {} }),
  test: (data) => api.post("/api/push/admin/test", data, { params: data?.appId ? { appId: data.appId } : {} }),
};

export const audienceAPI = {
  getAll: () => api.get("/api/audience/admin"),
};

export const savinexaAPI = {
  talent: () => api.get("/api/savinexa/admin/talent"),
  createJob: (data) => api.post("/api/savinexa/admin/jobs", data),
  updateJob: (id, data) => api.patch(`/api/savinexa/admin/jobs/${id}`, data),
  updateEnquiry: (id, data) => api.patch(`/api/savinexa/admin/enquiries/${id}`, data),
  dashboard: () => api.get("/api/savinexa/admin/dashboard"),
  products: (params = {}) => api.get("/api/savinexa/admin/products", { params }),
  createProduct: (data) => api.post("/api/savinexa/admin/products", data),
  updateProduct: (id, data) => api.put(`/api/savinexa/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/savinexa/admin/products/${id}`),
  categories: () => api.get("/api/savinexa/admin/categories"),
  createCategory: (data) => api.post("/api/savinexa/admin/categories", data),
  updateCategory: (id, data) => api.put(`/api/savinexa/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/api/savinexa/admin/categories/${id}`),
  collections: () => api.get("/api/savinexa/admin/collections"),
  createCollection: (data) => api.post("/api/savinexa/admin/collections", data),
  updateCollection: (id, data) => api.put(`/api/savinexa/admin/collections/${id}`, data),
  deleteCollection: (id) => api.delete(`/api/savinexa/admin/collections/${id}`),
  settings: () => api.get("/api/savinexa/settings"),
  saveSettings: (data) => api.put("/api/savinexa/settings", data),
  analytics: () => api.get("/api/savinexa/analytics"),
  banners: () => api.get("/api/savinexa/admin/banners"),
  createBanner: (data) => api.post("/api/savinexa/admin/banners", data),
  updateBanner: (id, data) => api.put(`/api/savinexa/admin/banners/${id}`, data),
  deleteBanner: (id) => api.delete(`/api/savinexa/admin/banners/${id}`),
  pages: () => api.get("/api/savinexa/admin/pages"),
  createPage: (data) => api.post("/api/savinexa/admin/pages", data),
  updatePage: (id, data) => api.put(`/api/savinexa/admin/pages/${id}`, data),
  deletePage: (id) => api.delete(`/api/savinexa/admin/pages/${id}`),
  uploadImage: (data) => api.post("/api/savinexa/admin/media", data, { headers: { "Content-Type": "multipart/form-data" } }),
};

export default api;

export const platformAPI = {
  applications: () => api.get("/api/platform/v1/admin/applications"),
  createApplication: (data) => api.post("/api/platform/v1/admin/applications", data),
  updateApplication: (appId, data) => api.patch(`/api/platform/v1/admin/applications/${appId}`, data),
  keys: (appId) => api.get(`/api/platform/v1/admin/applications/${appId}/keys`),
  createKey: (appId, data) => api.post(`/api/platform/v1/admin/applications/${appId}/keys`, data),
  rotateKey: (appId, id) => api.post(`/api/platform/v1/admin/applications/${appId}/keys/${id}/rotate`),
  revokeKey: (appId, id) => api.delete(`/api/platform/v1/admin/applications/${appId}/keys/${id}`),
};
