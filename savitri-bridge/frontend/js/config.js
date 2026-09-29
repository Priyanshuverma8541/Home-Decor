// Deployment configuration. Edit this ONE file when the backend URL changes (e.g. your Render URL).
// Nothing here is secret: it is shipped to the browser.
export const CONFIG = {
  // Backend origin (no trailing slash, no /api/v1).
  BACKEND_URL: window.SB_BACKEND_URL || 'http://localhost:5000',
  DEFAULT_TIMEZONE: 'Asia/Kolkata'
};
export const ADMIN_API = `${CONFIG.BACKEND_URL}/api/v1/admin`;
export const PUBLIC_API = `${CONFIG.BACKEND_URL}/api/v1/public`;
