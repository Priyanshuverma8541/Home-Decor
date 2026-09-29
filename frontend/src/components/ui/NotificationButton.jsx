import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { pushClient } from "../../services/push.js";

export default function NotificationButton() {
  const browserSupported = typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [state,setState]=useState({supported:browserSupported,subscribed:false}),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  useEffect(()=>{pushClient.status().then(setState).catch(error=>setMessage(error.message))},[]);
  const toggle=async()=>{setBusy(true);setMessage("");try{if(state.subscribed){await pushClient.disable();setState(current=>({...current,subscribed:false}));setMessage("Notifications turned off.")}else{await pushClient.enable();setState(current=>({...current,subscribed:true,supported:true}));setMessage("You’ll now receive Savitri Livings updates.")}}catch(error){setMessage(error.message)}finally{setBusy(false)}};
  const label = state.subscribed ? "On" : "Enable";
  return <div style={{position:"relative"}}><button type="button" onClick={toggle} disabled={busy} title={state.subscribed?"Turn off notifications":"Enable notifications"} aria-label={state.subscribed?"Turn off notifications":"Enable push notifications"} style={{height:40,minWidth:40,padding:"0 10px",borderRadius:20,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",gap:5,cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{state.subscribed?<BellRing size={17} color="#f4ce7c"/>:<Bell size={17}/>}<span>{label}</span></button>{message&&<span role="status" aria-live="polite" style={{position:"absolute",right:0,top:45,width:220,padding:9,background:"#fffdf9",color:"#593c20",fontSize:".72rem",lineHeight:1.35,borderRadius:8,boxShadow:"0 8px 25px rgba(0,0,0,.2)",zIndex:110}}>{message}</span>}</div>;
}
