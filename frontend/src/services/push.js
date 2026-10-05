import { API_BASE_URL } from "./api.js";
const API = API_BASE_URL;


const base64 = (value) => {
  const padded = value + "=".repeat((4 - value.length % 4) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

const request = async (path, options = {}) => {
  if (!API) throw new Error("The API base URL is not configured. Set VITE_API_URL.");
  const token = localStorage.getItem("sl_token");
  const response = await fetch(`${API}/api/push${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) throw new Error(json.message || "Push notifications could not be updated");
  return json;
};

export const pushClient = {
  async status() {
    const config = await request("/config", { method: "GET" });
    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
    const subscription = registration ? await registration.pushManager.getSubscription() : null;

    return {
      ...config,
      supported: "serviceWorker" in navigator && "PushManager" in window && "Notification" in window,
      permission: "Notification" in window ? Notification.permission : "unsupported",
      subscribed: Boolean(subscription),
    };
  },

  async enable() {
    if (!("serviceWorker" in navigator && "PushManager" in window && "Notification" in window)) {
      throw new Error("This browser does not support push notifications");
    }

    // Resolve configuration before showing a permission prompt. Permission is
    // requested only from this explicit user action, never on page load.
    const config = await request("/config", { method: "GET" });
    if (!config.configured || !config.publicKey) {
      throw new Error("Notifications are not configured yet. Please try again later.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error(permission === "denied" ? "Notifications are blocked in your browser settings" : "Notification permission was not granted");
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: "CONFIG_PUSH_API", apiBase: API });

    const existing = await registration.pushManager.getSubscription();
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64(config.publicKey),
    });

    await request("/subscribe", {
      method: "POST",
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
        browser: getBrowserFamily(),
        platform: getPlatformFamily(),
        language: navigator.language,
        expirationTime: subscription.expirationTime,
      }),
    });

    return true;
  },

  async disable() {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = registration ? await registration.pushManager.getSubscription() : null;
    if (subscription) {
      await request("/unsubscribe", { method: "POST", body: JSON.stringify({ endpoint: subscription.endpoint }) }).catch(() => {});
      await subscription.unsubscribe();
    }
  },
};

function getBrowserFamily() {
  const ua = navigator.userAgent || "";
  if (/Edg\//.test(ua)) return "Edge";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/CriOS|Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

function getPlatformFamily() {
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}
