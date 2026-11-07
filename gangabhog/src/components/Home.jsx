import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Bell, Check, ChevronDown, Heart, Instagram, MapPin, Menu, Phone, ShieldCheck, Sparkles, Wheat, X, Download, ShoppingBag } from "lucide-react";
import HeroCarousel from "./HeroCarousel.jsx";
import ProductQuickView from "./ProductQuickView.jsx";

const whatsappNumber = "919142666059";
const instagramUrl = "https://instagram.com/gangabhog";
const fieldImage = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=85";
const APP_ID = "app_gangabhog";
const api = (import.meta.env.VITE_API_URL || "https://home-decor-0rfj.onrender.com").replace(/\/+$/, "");
const products = [
  { id:"chakki5", name:"GangaBhog Chakki Fresh Atta", size:"5 kg family pack", pack:"/gangabhog/products/ganga-bhog-5kg.jpg", description:"Bihar’s wheat goodness in a convenient family pack, made for fresh rotis every day.", details:["Net weight: 5 kg","Bihar wheat","Chakki fresh"], label:"5 KG FAMILY PACK" },
  { id:"26kg", name:"Ganga Bhog Atta", size:"26 kg family pack", pack:"/gangabhog/products/ganga-bhog-26kg.jpeg", description:"Premium atta made from Bihar wheat. The generous family-size pack for daily rotis, parathas and shared meals.", details:["Net weight: 26 kg","Bihar wheat","Premium nutrition"], label:"FAMILY PACK" },
  { id:"chakki10", name:"Chakki Fresh Atta", size:"10 kg pack", pack:"/gangabhog/products/chakki-fresh-10kg.jpeg", description:"Fresh chakki atta made with whole wheat. The pack lists whole wheat as its ingredient, with no additives or preservatives.", details:["Net weight: 10 kg","Whole wheat","No additives or preservatives"], label:"CHAKKI FRESH" },
  { id:"premium10", name:"Premium Chakki Fresh Atta", size:"10 kg pack", pack:"/gangabhog/products/premium-chakki-10kg.jpeg", description:"Premium chakki fresh atta made from Bihar wheat, packed for the everyday goodness of home-cooked meals.", details:["Net weight: 10 kg","Bihar wheat","100% whole wheat"], label:"PREMIUM" },
];
const benefits = [
  { icon: Wheat, title: "Bihar wheat", copy: "Made with wheat from Bihar" },
  { icon: Sparkles, title: "Chakki fresh", copy: "A familiar taste for everyday meals" },
  { icon: Heart, title: "Goodness at home", copy: "For the meals that bring us together" },
  { icon: ShieldCheck, title: "Packed with care", copy: "Quality packed for your home" },
];
const installKey = "gb-install-dismissed";
const pushKey = "gb-push-dismissed";
const vapidBytes = (value) => { const raw = atob(value.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-value.length%4)%4)); return Uint8Array.from(raw, c=>c.charCodeAt(0)); };

function Brand({ light = false, website }) { return <Link to="/" className={`gb-brand${light ? " gb-brand-light" : ""}`} aria-label="GangaBhog home"><img src={website?.logoUrl || "/gangabhog/logo.png"} alt=""/><span><b>GangaBhog</b><small>{website?.tagline || "PURE TRADITION · SINCE 1980"}</small></span></Link>; }
function SectionHeading({ eyebrow, children, copy, align = "left" }) { return <div className={`gb-heading gb-heading-${align}`}><span className="gb-eyebrow">{eyebrow}</span><h2>{children}</h2>{copy && <p>{copy}</p>}</div>; }
function Engagement({}) {
  const [installPrompt,setInstallPrompt]=useState(null),[installOpen,setInstallOpen]=useState(false),[installHelp,setInstallHelp]=useState(false),[pushOpen,setPushOpen]=useState(false),[pushBusy,setPushBusy]=useState(false),[pushStatus,setPushStatus]=useState("");
  useEffect(()=>{
    const standalone=matchMedia("(display-mode: standalone)").matches || navigator.standalone===true;
    if(standalone)return;
    const onBefore=(event)=>{event.preventDefault();setInstallPrompt(event);if(!localStorage.getItem(installKey))setTimeout(()=>setInstallOpen(true),18000);};
    const onInstalled=()=>{setInstallOpen(false);setInstallPrompt(null);};
    window.addEventListener("beforeinstallprompt",onBefore);window.addEventListener("appinstalled",onInstalled);
    const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    const installTimer=setTimeout(()=>{if(!localStorage.getItem(installKey)&&(ios||/Android/i.test(navigator.userAgent)))setInstallOpen(true);},26000);
    const pushTimer=setTimeout(async()=>{
      if(localStorage.getItem(pushKey)||!("Notification" in window)||Notification.permission!=="default"||ios)return;
      try{const r=await fetch(`${api}/api/push/config`);const c=await r.json();if(c.configured)setPushOpen(true);}catch{}
    },65000);
    return()=>{clearTimeout(installTimer);clearTimeout(pushTimer);window.removeEventListener("beforeinstallprompt",onBefore);window.removeEventListener("appinstalled",onInstalled);};
  },[]);
  const dismissInstall=()=>{setInstallOpen(false);setInstallHelp(false);localStorage.setItem(installKey,"1");};
  const install=async()=>{if(!installPrompt){setInstallHelp(true);return;}try{await installPrompt.prompt();await installPrompt.userChoice;}finally{setInstallPrompt(null);dismissInstall();}};
  const enablePush=async()=>{
    setPushBusy(true);setPushStatus("");
    try{
      if(!("serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window))throw new Error("This browser does not support web notifications.");
      const config=await(await fetch(`${api}/api/push/config`)).json();if(!config.configured||!config.publicKey)throw new Error("Notifications are temporarily unavailable.");
      const permission=await Notification.requestPermission();if(permission!=="granted")throw new Error(permission==="denied"?"Notifications are blocked in browser settings.":"Permission was not granted.");
      const registration=await navigator.serviceWorker.register("/sw.js");await navigator.serviceWorker.ready;
      const existing=await registration.pushManager.getSubscription();const subscription=existing||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:vapidBytes(config.publicKey)});
      const json=subscription.toJSON();const response=await fetch(`${api}/api/push/subscribe`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:json.endpoint,keys:json.keys,appId:APP_ID,browser:"Other",platform:/Android/i.test(navigator.userAgent)?"Android":/iPhone|iPad|iPod/i.test(navigator.userAgent)?"iOS":"Other",language:navigator.language})});
      if(!response.ok)throw new Error("Could not save your notification preference. Please try again.");
      const cfgCache=await caches.open("sl-push-config-v1");await cfgCache.put(new URL("/__savitri_push_config__",location.origin).href,new Response(JSON.stringify({apiBase:api,appId:APP_ID,appIds:[APP_ID]})));
      setPushOpen(false);localStorage.setItem(pushKey,"1");setPushStatus("You’re subscribed to GangaBhog updates.");setTimeout(()=>setPushStatus(""),5000);
    }catch(e){setPushStatus(e.message||"Notifications could not be enabled.");}finally{setPushBusy(false);}
  };
  return <>
    {installOpen&&<aside className="gb-prompt" role="dialog" aria-label="Add GangaBhog to your home screen"><button className="gb-prompt-close" onClick={dismissInstall} aria-label="Close"><X size={17}/></button><span className="gb-prompt-icon"><Download size={19}/></span><div className="gb-prompt-copy"><b>GangaBhog, one tap away</b><span>Add our app for quick access to product updates and local availability.</span></div><button className="gb-prompt-action" onClick={install}>Add app</button>{installHelp&&<p className="gb-prompt-help">{/iphone|ipad|ipod/i.test(navigator.userAgent)?"In Safari, tap Share, then Add to Home Screen.":"Open your browser menu and choose Install app or Add to Home screen."}</p>}</aside>}
    {pushOpen&&<aside className="gb-prompt" role="dialog" aria-label="GangaBhog notifications"><button className="gb-prompt-close" onClick={()=>{setPushOpen(false);localStorage.setItem(pushKey,"1");}} aria-label="Close"><X size={17}/></button><span className="gb-prompt-icon"><Bell size={19}/></span><div className="gb-prompt-copy"><b>Good things, fresh from GangaBhog</b><span>Choose to receive occasional product and availability updates. You can turn notifications off any time.</span></div><button className="gb-prompt-action" onClick={enablePush} disabled={pushBusy}>{pushBusy?"Please wait":"Allow updates"}</button>{pushStatus&&<p className="gb-prompt-help" role="status">{pushStatus}</p>}</aside>}
    {pushStatus&&!pushOpen&&<div className="gb-toast" role="status">{pushStatus}</div>}
  </>;
}

export default function Home() {
  const [menuOpen,setMenuOpen]=useState(false),[website,setWebsite]=useState(null),[remoteProducts,setRemoteProducts]=useState([]),[selectedProduct,setSelectedProduct]=useState(null);
  const closeMenu=()=>setMenuOpen(false);
  useEffect(()=>{let current=true;Promise.all([fetch(`${api}/api/tenants/public/gangabhog`).then(r=>r.ok?r.json():null),fetch(`${api}/api/tenants/public/gangabhog/products?limit=8`).then(r=>r.ok?r.json():null)]).then(([s,p])=>{if(!current)return;setWebsite(s?.store?.website||null);setRemoteProducts(p?.products||[]);}).catch(()=>{});return()=>{current=false;};},[]);
  const phone=(website?.phone||"+91 91426 66059");
  const whatsapp=`https://wa.me/${(website?.whatsappNumber||whatsappNumber).replace(/\D/g,"")}?text=${encodeURIComponent("Namaste GangaBhog, please share atta availability and details.")}`;
  const instagram=website?.instagramUrl||instagramUrl;
  const items=remoteProducts.length?remoteProducts.map((p,i)=>{const description=[p.name,p.category,p.subCategory,...(p.variants||[]).map((variant)=>variant.value)].filter(Boolean).join(" ").toLowerCase();const local=(/\b5\s?kg\b/.test(description)&&products[0])||(/26\s?kg/.test(description)&&products.find((item)=>item.id==="26kg"))||(/premium/.test(description)&&products.find((item)=>item.id==="premium10"))||(/chakki/.test(description)&&products.find((item)=>item.id==="chakki10"))||products[i%products.length];return {...local,...p,pack:p.images?.[0]||local.pack,details:p.tags?.length?p.tags:local.details,size:p.variants?.map((variant)=>variant.value).join(" / ")||local.size};}):products;
  if(remoteProducts.length&&!items.some((product)=>/\b5\s?kg\b/i.test(`${product.name} ${product.size} ${(product.variants||[]).map((variant)=>variant.value).join(" ")}`)))items.unshift(products[0]);
  return <div className="gb-site">
    <div className="gb-topline"><span>⌖ BUXAR, BIHAR</span><i/><span>PURE TRADITION · PREMIUM NUTRITION</span><i/><a href="#contact">CONTACT US</a></div>
    <header className="gb-header"><Brand website={website}/><nav className="gb-desktop-nav" aria-label="Main navigation"><a href="#top">Home</a><a href="#products">Products</a><a href="#story">Our heritage</a><a href="#quality">Why GangaBhog?</a><a href="#faq">FAQs</a><a href="#contact">Contact</a></nav><a className="gb-header-cta" href={whatsapp} target="_blank" rel="noreferrer">Enquire now <ArrowUpRight size={15}/></a><button className="gb-menu-toggle" aria-label={menuOpen?"Close menu":"Open menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button></header>
    <nav className={`gb-mobile-nav${menuOpen?" is-open":""}`} aria-label="Mobile navigation"><a href="#top" onClick={closeMenu}>Home <ArrowRight size={15}/></a><a href="#products" onClick={closeMenu}>Products <ArrowRight size={15}/></a><a href="#story" onClick={closeMenu}>Our heritage <ArrowRight size={15}/></a><a href="#quality" onClick={closeMenu}>Why GangaBhog? <ArrowRight size={15}/></a><a href="#faq" onClick={closeMenu}>FAQs <ArrowRight size={15}/></a><a href="#contact" onClick={closeMenu}>Contact <ArrowRight size={15}/></a></nav>
    <main id="top">
      <HeroCarousel products={items} website={website}/>
      <div className="gb-trust-strip"><span><Wheat/> Bihar wheat</span><i/><span><Heart/> Made for every home</span><i/><span><ShieldCheck/> Packed with care</span></div>
      <section className="gb-story gb-section" id="story"><div className="gb-story-photo"><img src={fieldImage} alt="Golden wheat fields in the evening light"/><span className="gb-photo-note"><Wheat size={15}/> FROM THE FIELDS OF BIHAR</span></div><div className="gb-story-copy"><span className="gb-eyebrow">A LEGACY OF GOODNESS</span><h1>Buxar ka apna atta.<br/><em>Ghar ghar ka saath.</em></h1><p>{website?.heroDescription||"Rooted in Buxar since 1980, GangaBhog brings the familiar goodness of wheat to everyday meals. From the first roti at breakfast to dinner shared around the table, our atta is made to feel like home."}</p><a className="gb-text-link" href="#quality">Why GangaBhog <ArrowRight size={16}/></a><div className="gb-story-seal"><span>G</span><small>ROOTED IN<br/>BIHAR</small></div></div></section>
      <section className="gb-quality" id="quality"><div className="gb-section gb-quality-inner"><SectionHeading eyebrow="GOOD FOOD, ROOTED IN TRADITION" copy="Simple goodness for the everyday meals your family loves." align="center">A little more goodness<br/><em>in every meal.</em></SectionHeading><div className="gb-benefits">{benefits.map(({icon:Icon,title,copy},i)=><article className="gb-benefit" key={title}><span className="gb-benefit-number">0{i+1}</span><span className="gb-benefit-icon"><Icon size={20}/></span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>
      <section className="gb-catalogue gb-section" id="products"><SectionHeading eyebrow="MADE FOR BIHAR’S EVERYDAY TABLE" copy="Find your family’s favourite. Explore every blend and pack size, then ask us about local availability.">Our <em>atta range.</em></SectionHeading><div className="gb-catalogue-grid">{items.map((p,i)=><article className="gb-catalogue-card" key={p._id||p.id||p.name}><div className="gb-product-photo"><span className="gb-product-badge">{p.label||p.category||"GANGA BHOG"}</span><img src={p.pack||p.images?.[0]} alt={`${p.name} ${p.size||"atta pack"}`} loading={i>0?"lazy":"eager"}/></div><div className="gb-product-copy"><span className="gb-product-size"><ShoppingBag size={13}/> {p.size||p.variants?.[0]?.value||"GangaBhog Atta"}</span><h3>{p.name}</h3><p>{p.description}</p><ul>{(p.details||[]).slice(0,3).map(d=><li key={d}><Check size={14}/>{d}</li>)}</ul><button type="button" className="gb-button gb-button-red" onClick={()=>setSelectedProduct(p)}>View product <ArrowRight size={15}/></button><small>{p.price?`From ₹${Number(p.price).toLocaleString("en-IN")}`:"Ask for today’s price"}</small></div></article>)}</div></section>
      <section className="gb-atta gb-section"><div className="gb-atta-copy"><span className="gb-eyebrow">FROM OUR FAMILY TO YOURS</span><h2>Soft rotis.<br/>Warm <em>memories.</em></h2><p>From morning tiffin to dinner with family, a good atta belongs at the heart of the home. GangaBhog brings a taste of Buxar to your table.</p><ul><li><Check size={15}/> Made from Bihar wheat</li><li><Check size={15}/> Multiple pack sizes</li><li><Check size={15}/> Ask for local availability</li></ul><a href={whatsapp} target="_blank" rel="noreferrer" className="gb-button gb-button-red">Chat with GangaBhog <ArrowRight size={16}/></a></div><div className="gb-pack-shot"><span className="gb-pack-rays"/><img src="/gangabhog/products/ganga-bhog-26kg.jpeg" alt="Ganga Bhog Atta 26 kg product pack" loading="lazy"/><div className="gb-pack-caption"><span>GANGA BHOG ATTA</span><b>Pure tradition.<br/>Since 1980.</b></div></div></section>
      <section className="gb-retailer"><div className="gb-retailer-art"><img src="/gangabhog/products/chakki-fresh-10kg.jpeg" alt="GangaBhog Chakki Fresh Atta pack" loading="lazy"/></div><div className="gb-retailer-copy"><span className="gb-eyebrow">GROW WITH GANGABHOG</span><h2>For retailers<br/>& distributors.</h2><p>Bring a trusted Buxar favourite to more homes. Talk to our team about stocking GangaBhog atta and local availability.</p><a href={whatsapp} target="_blank" rel="noreferrer" className="gb-button gb-button-red">Enquire with our team <ArrowRight size={16}/></a></div></section>
      <section className="gb-origin" style={{backgroundImage:`linear-gradient(90deg,rgba(23,39,27,.88),rgba(23,39,27,.38)),url(${fieldImage})`}}><div className="gb-origin-copy"><span className="gb-eyebrow gb-eyebrow-light">FROM BUXAR, WITH PRIDE</span><h2>Made of Bihar.<br/><em>Made for you.</em></h2><p>Good wheat, thoughtful care and the joy of sharing fresh rotis around the table. That’s the GangaBhog way.</p><a href="#contact" className="gb-button gb-button-light">Get in touch <ArrowRight size={16}/></a></div><span className="gb-origin-place"><MapPin size={14}/> BUXAR · BIHAR · INDIA</span></section>
      <section className="gb-faq gb-section" id="faq"><SectionHeading eyebrow="A FEW QUICK ANSWERS" align="center">Good to <em>know.</em></SectionHeading><div className="gb-faq-list"><details><summary>Which pack sizes are available?<ChevronDown size={17}/></summary><p>Our range includes convenient 5 kg and larger family packs. Message us to confirm the sizes available near you.</p></details><details><summary>What is the atta made from?<ChevronDown size={17}/></summary><p>The packs shown list whole wheat and Bihar wheat. Please check the individual pack for ingredient and nutrition details.</p></details><details><summary>Do you deliver in Buxar?<ChevronDown size={17}/></summary><p>Contact us on WhatsApp or phone to confirm delivery availability and pricing for your locality.</p></details><details><summary>How do I place an order?<ChevronDown size={17}/></summary><p>Message GangaBhog on WhatsApp with the pack size and your location. We’ll help with current prices and availability.</p></details></div></section>
      <section className="gb-contact" id="contact"><div className="gb-contact-inner"><div><span className="gb-eyebrow gb-eyebrow-light">WE’D LOVE TO HEAR FROM YOU</span><h2>Let’s bring a little<br/><em>goodness home.</em></h2><p>For atta availability, retail enquiries or just to say namaste.</p></div><div className="gb-contact-actions"><a href={whatsapp} target="_blank" rel="noreferrer" className="gb-button gb-button-gold"><Phone size={17}/> WhatsApp us <ArrowRight size={16}/></a><a href={`tel:${phone}`} className="gb-contact-phone">{phone} <ArrowUpRight size={15}/></a><a href={instagram} target="_blank" rel="noreferrer" className="gb-instagram"><Instagram size={16}/> Follow <b>@gangabhog</b></a></div></div></section>
    </main>
    <ProductQuickView product={selectedProduct} whatsappNumber={website?.whatsappNumber||whatsappNumber} onClose={()=>setSelectedProduct(null)}/>
    <footer className="gb-footer"><div className="gb-footer-main"><div><Brand light website={website}/><p>Har ghar ki sehat. Har din ka saath.</p></div><div className="gb-footer-links"><span className="gb-eyebrow gb-eyebrow-light">FIND US</span><a href={`tel:${phone}`}><Phone size={14}/> {phone}</a><a href={whatsapp} target="_blank" rel="noreferrer"><Phone size={14}/> WhatsApp</a><a href={instagram} target="_blank" rel="noreferrer"><Instagram size={14}/> @gangabhog</a><span><MapPin size={14}/> Buxar, Bihar, India</span></div></div><nav className="gb-footer-nav" aria-label="Footer links"><a href="#story">Our story</a><a href="#quality">Our promise</a><a href="#products">Products</a><a href="#faq">FAQs</a><a href="#contact">Contact</a></nav><div className="gb-footer-bottom"><span>© {new Date().getFullYear()} GangaBhog Atta</span><span>Rooted in tradition since 1980 <Heart size={12}/></span></div></footer>
    <a className="gb-whatsapp-float" href={whatsapp} target="_blank" rel="noreferrer" aria-label="Message GangaBhog on WhatsApp"><Phone size={20}/><span>Chat with us</span></a><Engagement/>
  </div>;
}

