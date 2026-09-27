import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Camera,
  Mic,
  MapPin,
  ShieldCheck,
  Smartphone,
  Clipboard,
  KeyRound,
  FileImage,
  CheckCircle2,
  AlertCircle,
  X,
  Wifi,
  Share2,
  CalendarRange,
  Mail,
  Phone,
  MessageSquare,
  ScanLine,
  MonitorUp,
  Lock,
  ShoppingCart,
  Cookie,
  Zap,
} from "lucide-react";
import { privacyAPI, settingsAPI } from "../../services/api.js";

const getPrivacySubjectId = () => {
  let subjectId = localStorage.getItem("savitri-privacy-subject");
  if (!subjectId) {
    subjectId = globalThis.crypto?.randomUUID?.() || `sl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("savitri-privacy-subject", subjectId);
  }
  return subjectId;
};

const iconMap = {
  location: MapPin,
  camera: Camera,
  microphone: Mic,
  notifications: Bell,
  contacts: Smartphone,
  files: FileImage,
  clipboard: Clipboard,
  speech: Mic,
  vibration: Zap,
  motion: Wifi,
  bluetooth: Wifi,
  nfc: ScanLine,
  usb: MonitorUp,
  screenShare: MonitorUp,
  wakeLock: Lock,
  storage: Smartphone,
  cookies: Cookie,
  credentials: KeyRound,
  webauthn: KeyRound,
  calendar: CalendarRange,
  phone: Phone,
  sms: MessageSquare,
  email: Mail,
  share: Share2,
  futureCapability: ShoppingCart,
};

const getInitialPermissions = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("savitri-permissions") || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
};

export default function PermissionCenter({ open, onClose }) {
  const [capabilities, setCapabilities] = useState([]);
  const [permissions, setPermissions] = useState(getInitialPermissions());
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [failedKey, setFailedKey] = useState("");
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    let mounted = true;
    const subjectId = getPrivacySubjectId();

    settingsAPI.get()
      .then(({ data }) => {
        if (!mounted) return;
        const catalog = Array.isArray(data?.settings?.permissionCapabilities)
          ? data.settings.permissionCapabilities
          : [];
        setCapabilities(catalog.filter((cap) => cap.enabled));
      })
      .catch(() => {
        if (!mounted) return;
        setCapabilities([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    privacyAPI.getMine(subjectId)
      .then(({ data }) => {
        if (!mounted || !Array.isArray(data?.decisions)) return;
        setPermissions((previous) => ({
          ...previous,
          ...Object.fromEntries(data.decisions.map(({ key, status }) => [key, status])),
        }));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("savitri-permissions", JSON.stringify(permissions));
  }, [permissions]);

  const visibleCapabilities = useMemo(() => {
    const base = capabilities.length ? capabilities : [];
    return base.map((cap) => ({
      ...cap,
      status: permissions[cap.key] || cap.status || "not-granted",
      icon: iconMap[cap.key] || ShieldCheck,
    }));
  }, [capabilities, permissions]);

  const saveDecision = async (key, status) => {
    setPermissions((previous) => ({ ...previous, [key]: status }));
    setSavingKey(key);
    setSyncError("");
    try {
      const capability = capabilities.find((item) => item.key === key);
      await privacyAPI.saveConsent({
        subjectId: getPrivacySubjectId(),
        decisions: [{ key, status }],
      });
      localStorage.setItem("savitri-permissions", JSON.stringify({ ...permissions, [key]: status }));
      setFailedKey("");
      setSyncError("");
      return capability;
    } catch {
      setFailedKey(key);
      setSyncError("Your choice is saved on this device, but could not sync to Savitri Livings. Try again when you are online.");
    } finally {
      setSavingKey("");
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.52)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: 16 }}>
      <div style={{ width: "min(820px, 100%)", maxHeight: "85vh", overflowY: "auto", background: "#fffaf3", borderRadius: 22, boxShadow: "0 24px 80px rgba(21,16,10,0.18)", border: "1px solid #ecdfd1", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 34, height: 34, borderRadius: "50%", border: "1px solid #e5d9ca", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#5c4a32" }} aria-label="Close permissions panel">
          <X size={16} />
        </button>

        <div style={{ padding: "2rem 1.5rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <ShieldCheck style={{ width: 20, height: 20, color: "#1a3c34" }} />
            <p className="section-tag">Privacy & Permissions</p>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2rem", color: "#1c1409", margin: 0 }}>Permission Center</h2>
          <p style={{ color: "#5c4a32", lineHeight: 1.7, marginTop: 8, marginBottom: 20 }}>
            Choose whether Savitri Livings may use each capability when a related feature is used. Browser prompts appear only when a feature needs them; this choice does not itself grant operating-system access.
          </p>

          {loading ? (
            <div style={{ color: "#5c4a32", padding: "0.5rem 0" }}>Loading capability catalog…</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {visibleCapabilities.map(({ key, label, purpose, status, icon: Icon }) => {
                const isAllowed = status === "consented" || status === "granted";
                return (
                  <div key={key} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", background: "#fff", borderRadius: 14, border: "1px solid #f0e6d6", padding: "0.9rem 1rem" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: "#eef8f4", display: "flex", alignItems: "center", justifyContent: "center", color: "#1a3c34" }}>
                      <Icon size={18} />
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <strong style={{ color: "#1c1409", fontSize: "0.95rem" }}>{label}</strong>
                        <span style={{ color: "#8c7258", fontSize: "0.74rem" }}>| {purpose}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: isAllowed ? "#166534" : status === "denied" ? "#b42318" : "#8c7258", fontSize: "0.75rem" }}>
                        {isAllowed ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        {isAllowed ? "Allowed by you" : status === "denied" ? "Denied by you" : "No choice recorded"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" disabled={savingKey === key || (isAllowed && failedKey !== key)} onClick={() => saveDecision(key, "consented")} style={{ border: "1px solid #b8d8c5", background: isAllowed ? "#eaf7ef" : "#fff", color: "#166534", borderRadius: 8, padding: "0.45rem 0.65rem", fontWeight: 600, cursor: isAllowed && failedKey !== key ? "default" : "pointer", opacity: savingKey === key ? 0.6 : 1 }}>
                        {savingKey === key ? "Saving" : failedKey === key ? "Retry sync" : isAllowed ? "Allowed" : "Allow"}
                      </button>
                      <button type="button" disabled={savingKey === key || (status === "denied" && failedKey !== key)} onClick={() => saveDecision(key, "denied")} style={{ border: "1px solid #e4c4bd", background: status === "denied" ? "#fff0ed" : "#fff", color: "#9b2c1c", borderRadius: 8, padding: "0.45rem 0.65rem", fontWeight: 600, cursor: status === "denied" && failedKey !== key ? "default" : "pointer", opacity: savingKey === key ? 0.6 : 1 }}>
                        {failedKey === key && status === "denied" ? "Retry sync" : "Deny"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {syncError && <p role="alert" style={{ color: "#9b2c1c", fontSize: "0.82rem", lineHeight: 1.5 }}>{syncError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
