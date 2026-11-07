import api from "./api.js";

export const growthLivingsAPI = {
  settings: () => api.get("/api/growth-livings/public/config"),
};
