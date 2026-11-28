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
export const mediaDownloaderAPI = {
  inspect: (url) => api.post("/api/media-downloader/inspect", { url }),
  download: (url, onDownloadProgress) => api.get("/api/media-downloader/download", {
    params: { url }, responseType: "blob", timeout: 180000,
    onDownloadProgress,
  }),
};
export const moduleAPI = {
  discover: (placement) => api.get(`/api/modules/discover/${encodeURIComponent(placement)}`),
  resolve: (section, productId) => api.get(`/api/modules/resolve/${encodeURIComponent(section)}/${encodeURIComponent(productId)}`),
  assignments: () => api.get("/api/modules/developer/assignments"),
  updateAssignment: (id, data) => api.patch(`/api/modules/developer/assignments/${encodeURIComponent(id)}`, data),
  submit: (id, data) => api.post(`/api/modules/developer/assignments/${encodeURIComponent(id)}/submissions`, data),
};
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

export const checklistAPI = {
  templates: () => api.get("/api/checklists/templates"),
  template: (id, version) => api.get(`/api/checklists/templates/${encodeURIComponent(id)}`, { params: version ? { version } : {} }),
  drafts: () => api.get("/api/checklists/drafts"),
  draft: (id) => api.get(`/api/checklists/drafts/${encodeURIComponent(id)}`),
  createDraft: (data) => api.post("/api/checklists/drafts", data),
  saveDraft: (id, data) => api.put(`/api/checklists/drafts/${encodeURIComponent(id)}`, data),
  exportValues: (data) => api.post("/api/checklists/drafts/export", data, { responseType: "blob" }),
  guidance: (data) => api.post("/api/checklists/guidance", data),
  exportDraft: (id) => api.get(`/api/checklists/drafts/${encodeURIComponent(id)}/export`, { responseType: "blob" }),
};

export const livingsAIAPI = {
  chat: (data) => api.post("/api/livings-ai/chat", data),
};
export const careerGrowthAPI = {
  summary: () => api.get("/api/career-growth/summary"),
  profile: () => api.get("/api/career-growth/profile"),
  companies: (params) => api.get("/api/career-growth/companies", { params }),
  jobs: (params) => api.get("/api/career-growth/jobs", { params }),
  applications: (params) => api.get("/api/career-growth/applications", { params }),
  createApplication: (data) => api.post("/api/career-growth/applications", data),
  updateApplication: (id, data) => api.patch(`/api/career-growth/applications/${id}`, data),
};

export const skillUpAPI = {
  content: (params) => api.get("/api/skillup/content", { params }),
  mine: () => api.get("/api/skillup/mine"),
  createBlog: (data) => api.post("/api/skillup/blogs", data),
};
export const earnAPI = { opportunities: () => api.get("/api/earn/opportunities") };
export const walletAPI = {
  summary: () => api.get("/api/wallet"),
  startGame: () => api.post("/api/wallet/games/start"),
  revealCard: (id, index) => api.post(`/api/wallet/games/${id}/reveal`, { index }),
  requestWithdrawal: (data) => api.post("/api/wallet/withdrawals", data),
  requestPurchase: (data) => api.post("/api/wallet/purchases", data),
};

export const buildHubAPI = {
  settings: () => api.get("/api/buildhub/settings"),
  projects: (params) => api.get("/api/buildhub/projects", { params }),
  project: (slug) => api.get(`/api/buildhub/projects/${encodeURIComponent(slug)}`),
  validateCoupon: (data) => api.post("/api/buildhub/settings/validate-coupon", data),
  createOrder: (data) => api.post("/api/buildhub/orders", data),
  lookupOrder: (number) => api.get(`/api/buildhub/orders/lookup/${encodeURIComponent(number)}`),
  createLead: (data) => api.post("/api/buildhub/leads", data),
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
