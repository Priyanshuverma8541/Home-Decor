import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { pushClient } from "../../services/push.js";

export default function NotificationButton() {
  const [state,setState]=useState({supported:false,subscribed:false}),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  useEffect(()=>{pushClient.status().then(setState).catch(()=>{})},[]);
  const toggle=async()=>{setBusy(true);setMessage("");try{if(state.subscribed){await pushClient.disable();setState(current=>({...current,subscribed:false}));setMessage("Notifications turned off.")}else{await pushClient.enable();setState(current=>({...current,subscribed:true}));setMessage("You’ll now receive Savitri Livings updates.")}}catch(error){setMessage(error.message)}finally{setBusy(false)}};
  if(!state.supported)return null;
  return <div style={{position:"relative"}}><button type="button" onClick={toggle} disabled={busy} title={state.subscribed?"Turn off notifications":"Enable notifications"} style={{width:40,height:40,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.1)",color:"white",display:"grid",placeItems:"center",cursor:"pointer"}}>{state.subscribed?<BellRing size={18} color="#f4ce7c"/>:<Bell size={18}/>}</button>{message&&<span style={{position:"absolute",right:0,top:45,width:220,padding:9,background:"#fffdf9",color:"#593c20",fontSize:".72rem",lineHeight:1.35,borderRadius:8,boxShadow:"0 8px 25px rgba(0,0,0,.2)",zIndex:110}}>{message}</span>}</div>;
}
