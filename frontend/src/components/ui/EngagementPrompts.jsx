import { useEffect, useState } from "react";
import { ArrowDownToLine, BellRing, X } from "lucide-react";
import NotificationButton from "./NotificationButton.jsx";
import { pushClient } from "../../services/push.js";

const INSTALL_DISMISSED = "sl-install-prompt-dismissed-at";
const PUSH_DISMISSED = "sl-promo-push-prompt-dismissed-at";
const daysSince = (value, days) => value && Date.now() - Number(value) < days * 86400000;
const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

export default function EngagementPrompts() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installVisible, setInstallVisible] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  const [pushVisible, setPushVisible] = useState(false);
  const [pushReady, setPushReady] = useState(false);

  useEffect(() => {
    if (isStandalone()) return undefined;
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    let installTimer;
    let pushTimer;
    const eligibleToSuggest = () => !daysSince(localStorage.getItem(INSTALL_DISMISSED), 7);
    const onInstallAvailable = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      if (eligibleToSuggest()) installTimer = window.setTimeout(() => setInstallVisible(true), 28000);
    };
    const onInstalled = () => { setInstallVisible(false); setInstallEvent(null); localStorage.setItem(INSTALL_DISMISSED, String(Date.now())); };
    window.addEventListener("beforeinstallprompt", onInstallAvailable);
    window.addEventListener("appinstalled", onInstalled);
    if (mobile && eligibleToSuggest()) installTimer = window.setTimeout(() => setInstallVisible(true), 28000);

    const schedulePushSuggestion = () => {
      if (daysSince(localStorage.getItem(PUSH_DISMISSED), 30)) return;
      pushTimer = window.setTimeout(async () => {
        if (isStandalone() || typeof Notification === "undefined" || Notification.permission !== "default") return;
        const iosBrowser = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !isStandalone();
        if (iosBrowser) return;
        try {
          const status = await pushClient.status("app_savitri_livings");
          if (status.supported && status.configured && !status.subscribed) { setPushReady(true); setPushVisible(true); }
        } catch { /* Leave push opt-in available from the bell and privacy center. */ }
      }, 90000);
    };
    const onInstallResolved = () => schedulePushSuggestion();
    window.addEventListener("sl-install-prompt-resolved", onInstallResolved);
    if (!mobile) schedulePushSuggestion();
    return () => {
      window.clearTimeout(installTimer); window.clearTimeout(pushTimer);
      window.removeEventListener("beforeinstallprompt", onInstallAvailable);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("sl-install-prompt-resolved", onInstallResolved);
    };
  }, []);

  const dismissInstall = () => {
    setInstallVisible(false); setInstallHelp(false); localStorage.setItem(INSTALL_DISMISSED, String(Date.now()));
    window.dispatchEvent(new Event("sl-install-prompt-resolved"));
  };
  const install = async () => {
    if (!installEvent) { setInstallHelp(true); return; }
    try { await installEvent.prompt(); await installEvent.userChoice; }
    finally { setInstallEvent(null); dismissInstall(); }
  };
  const dismissPush = () => { setPushVisible(false); localStorage.setItem(PUSH_DISMISSED, String(Date.now())); };

  if (!installVisible && !pushVisible) return null;
  return <>
    {installVisible && <aside className="sl-engagement-card sl-install-card" role="dialog" aria-label="Install Savitri Livings">
      <button className="sl-engagement-close" type="button" aria-label="Not now" onClick={dismissInstall}><X size={16} /></button>
      <div className="sl-engagement-icon"><ArrowDownToLine size={20} /></div>
      <div className="sl-engagement-copy"><strong>Take Savitri Livings with you</strong><span>Add the app to your home screen for a quicker way back.</span></div>
      <button className="sl-engagement-action" type="button" onClick={install}>Add app</button>
      {installHelp && <div className="sl-install-help" role="status">{/iphone|ipad|ipod/i.test(navigator.userAgent) ? "In Safari, tap Share, then choose Add to Home Screen." : "Open your browser menu and choose Install app or Add to Home screen."}</div>}
    </aside>}
    {pushVisible && pushReady && <aside className="sl-engagement-card sl-push-card" role="dialog" aria-label="Savitri Livings updates">
      <button className="sl-engagement-close" type="button" aria-label="Not now" onClick={dismissPush}><X size={16} /></button>
      <div className="sl-engagement-icon"><BellRing size={20} /></div>
      <div className="sl-engagement-copy"><strong>Hear about what’s new?</strong><span>Opt in to occasional new arrivals, Savitri news and offers. You can turn these off at any time.</span></div>
      <div className="sl-engagement-action"><NotificationButton appName="Savitri updates" label="Choose updates" onEnabled={dismissPush} /></div>
    </aside>}
    <style>{`
      .sl-engagement-card{position:fixed;z-index:145;left:clamp(14px,3vw,32px);bottom:calc(94px + env(safe-area-inset-bottom,0px));display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;width:min(440px,calc(100vw - 28px));padding:15px 42px 15px 15px;border:1px solid #e7d8c4;border-radius:17px;background:rgba(255,253,249,.98);color:#3b2c20;box-shadow:0 16px 48px rgba(40,27,16,.2);backdrop-filter:blur(16px)}
      .sl-engagement-icon{display:grid;width:38px;height:38px;place-items:center;border-radius:12px;background:#f5e8d2;color:#865e2e}.sl-engagement-copy{display:grid;gap:4px}.sl-engagement-copy strong{font:600 .85rem 'DM Sans',sans-serif}.sl-engagement-copy span{color:#796a58;font:400 .7rem/1.45 'DM Sans',sans-serif}.sl-engagement-action{display:flex;justify-content:flex-end}.sl-engagement-action>button,.sl-engagement-action>div>button,.sl-engagement-action button{min-height:37px;padding:0 12px!important;border:0!important;border-radius:999px!important;background:#6f481f!important;color:white!important;font:600 .7rem 'DM Sans',sans-serif!important;white-space:nowrap}
      .sl-engagement-close{position:absolute;top:8px;right:8px;display:grid;width:25px;height:25px;place-items:center;border:0;border-radius:50%;background:transparent;color:#7b6b56;cursor:pointer}.sl-install-help{grid-column:1/-1;padding:10px;border-radius:10px;background:#f6efe4;color:#684924;font:400 .75rem/1.5 'DM Sans',sans-serif}
      @media(max-width:520px){.sl-engagement-card{left:10px;bottom:calc(83px + env(safe-area-inset-bottom,0px));gap:9px;padding:13px 36px 13px 11px;border-radius:15px}.sl-engagement-icon{width:33px;height:33px}.sl-engagement-copy strong{font-size:.78rem}.sl-engagement-copy span{font-size:.65rem}.sl-engagement-action>button,.sl-engagement-action>div>button,.sl-engagement-action button{min-height:34px;padding:0 9px!important;font-size:.64rem!important}}
    `}</style>
  </>;
}
