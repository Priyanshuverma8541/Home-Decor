import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BUSINESS_OPTIONS, useBusinessAuth } from "../../context/BusinessAuthContext.jsx";

const inputStyle={width:"100%",border:0,outline:0,padding:"10px 0",font:"inherit",background:"transparent"};
export default function BusinessSetup() {
  const [form,setForm]=useState({slug:BUSINESS_OPTIONS[0].slug,fullName:"",email:"",accessCode:"",password:"",confirmPassword:""});
  const [error,setError]=useState("");
  const {setup,loading}=useBusinessAuth(); const navigate=useNavigate();
  const update=(key,value)=>setForm(current=>({...current,[key]:value}));
  const submit=async(event)=>{event.preventDefault();setError("");if(form.password!==form.confirmPassword)return setError("Passwords do not match.");if(form.password.length<12)return setError("Use a password with at least 12 characters.");const result=await setup(form.slug,{fullName:form.fullName,email:form.email,password:form.password,accessCode:form.accessCode});if(result.success)navigate("/business",{replace:true});else setError(result.message);};
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20,background:"linear-gradient(135deg,#2c1f14,#4a3728)",color:"#38271e"}}><section style={{width:"min(100%,470px)",background:"#fffaf4",borderRadius:18,padding:26,boxShadow:"0 20px 60px #0005"}}><p style={{color:"#a16a36",fontSize:11,fontWeight:800,letterSpacing:".14em"}}>SAVITRI LIVINGS · CLIENT SETUP</p><h1 style={{font:"600 29px Georgia",margin:"5px 0 8px"}}>Create your business login</h1><p style={{color:"#7c6c60",marginTop:0}}>Use the one-time setup code shared by the Savitri super admin. This account will be limited to the selected business.</p>{error&&<p role="alert" style={{color:"#9c3428"}}>{error}</p>}<form onSubmit={submit} style={{display:"grid",gap:12}}>
    <label style={label}>Business<select required style={selectStyle} value={form.slug} onChange={e=>update("slug",e.target.value)}>{BUSINESS_OPTIONS.map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
    <Field label="Full name" name="fullName" autoComplete="name" value={form.fullName} update={update}/><Field label="Business email" name="email" type="email" autoComplete="email" value={form.email} update={update}/><Field label="One-time setup code" name="accessCode" inputMode="numeric" pattern="[0-9]{5,12}" value={form.accessCode} update={update}/><Field label="Password (12 characters minimum)" name="password" type="password" autoComplete="new-password" minLength={12} value={form.password} update={update}/><Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} value={form.confirmPassword} update={update}/>
    <button disabled={loading} style={{border:0,borderRadius:10,padding:12,background:"#563326",color:"white",fontWeight:700,cursor:"pointer"}}>{loading?"Creating account…":"Create account"}</button></form><p style={{textAlign:"center",marginBottom:0}}><Link to="/login?mode=business" style={{color:"#8f5c30"}}>Back to business login</Link></p></section></main>;
}
const label={display:"grid",gap:5,fontSize:12,fontWeight:700,color:"#69594d"};
const selectStyle={width:"100%",border:"1px solid #e3d8cb",borderRadius:9,background:"white",padding:"10px",font:"inherit"};
function Field({label:caption,name,type="text",update,value,...props}){return <label style={label}>{caption}<span style={{border:"1px solid #e3d8cb",borderRadius:9,background:"white",padding:"0 10px"}}><input {...props} name={name} type={type} value={value} onChange={event=>update(name,event.target.value)} style={inputStyle}/></span></label>}
