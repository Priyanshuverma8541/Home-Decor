import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { pushClient } from "../../services/push.js";

export default function NotificationButton({ appId = "app_savitri_livings", appName = "Savitri Livings" }) {
  const browserSupported = typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [state, setState] = useState({ supported: browserSupported, subscribed: false });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { let active = true; pushClient.status(appId).then((value) => { if (active) setState(value); }).catch((error) => { if (active) setMessage(error.message); }); return () => { active = false; }; }, [appId]);
  const toggle = async () => {
    setBusy(true); setMessage("");
    try {
      if (state.subscribed) { await pushClient.disable(appId); setState((current) => ({ ...current, subscribed: false })); setMessage(`${appName} notifications turned off.`); }
      else { await pushClient.enable(appId); setState((current) => ({ ...current, subscribed: true, supported: true })); setMessage(`You’ll now receive ${appName} updates.`); }
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  return <div style={{ position: "relative" }}><button type="button" onClick={toggle} disabled={busy || state.supported === false} title={state.subscribed ? `Turn off ${appName} notifications` : `Enable ${appName} notifications`} aria-label={state.subscribed ? `Turn off ${appName} notifications` : `Enable ${appName} notifications`} style={{ height: 40, minWidth: 40, padding: "0 10px", borderRadius: 20, border: "1px solid currentColor", background: "transparent", color: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, cursor: busy ? "wait" : "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{state.subscribed ? <BellRing size={17}/> : <Bell size={17}/>}<span>{state.subscribed ? "On" : "Enable"}</span></button>{message && <span role="status" aria-live="polite" style={{ position: "absolute", right: 0, top: 45, width: 220, padding: 9, background: "#fffdf9", color: "#593c20", fontSize: ".72rem", lineHeight: 1.35, borderRadius: 8, boxShadow: "0 8px 25px rgba(0,0,0,.2)", zIndex: 110 }}>{message}</span>}</div>;
}