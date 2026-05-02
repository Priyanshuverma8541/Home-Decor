import { motion } from "framer-motion";
import { useState } from "react";
import { Leaf, Phone, Mail, MapPin, Instagram, MessageCircle, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const WA = import.meta.env.VITE_WHATSAPP  || "6207855397";
const IG = import.meta.env.VITE_INSTAGRAM || "livingcrafts__";
const up = (d=0) => ({ initial:{opacity:0,y:20}, whileInView:{opacity:1,y:0}, viewport:{once:true,margin:"-60px"}, transition:{duration:.65,delay:d} });

function HeroBand({ tag, title, sub }) {
  return (
    <section style={{ background:"linear-gradient(135deg,#1a3c34,#0f2419)", padding:"4rem 1rem", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"url('https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1200&q=80') center/cover", opacity:.08 }}/>
      <div style={{ maxWidth:768, margin:"0 auto", textAlign:"center", position:"relative" }}>
        <motion.p {...up(0)} className="section-tag" style={{ color:"#30ac90" }}>{tag}</motion.p>
        <motion.h1 {...up(.1)} style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(2rem,6vw,3.5rem)", color:"white" }}>{title}</motion.h1>
        {sub && <motion.p {...up(.2)} style={{ color:"rgba(255,255,255,.5)", marginTop:"0.75rem", maxWidth:480, margin:"0.75rem auto 0" }}>{sub}</motion.p>}
      </div>
    </section>
  );
}

export function About() {
  return (
    <div style={{ overflowX:"hidden" }}>
      <HeroBand tag="Our Story" title="Handcrafted with love" sub="A family business that brings the beauty of the ocean into your home"/>

      <section style={{ padding:"3.5rem 1rem", background:"#fdf6ee" }}>
        <div style={{ maxWidth:800, margin:"0 auto" }}>
          <motion.div {...up(0)} style={{ display:"grid", gridTemplateColumns:"1fr", gap:"2rem" }} className="about-grid">
            <div>
              <p className="section-tag">Who we are</p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2rem", color:"#1c1409", marginBottom:"1rem" }}>Savitri Livings</h2>
              <p style={{ color:"#5c4a32", lineHeight:1.85, marginBottom:"1rem" }}>
                We are a small family-run home decor business based in Buxar, Bihar. We specialise in handcrafted seashell products, natural home decor, and thoughtfully curated gift collections.
              </p>
              <p style={{ color:"#5c4a32", lineHeight:1.85, marginBottom:"1rem" }}>
                Every piece is made with natural materials — seashells, bamboo, jute, and wood — and crafted with care. We believe your home should tell a story, and we are here to help you tell yours.
              </p>
              <p style={{ color:"#5c4a32", lineHeight:1.85 }}>
                Currently delivering in Buxar, with Varanasi and Kolkata coming soon. Follow us on Instagram at <a href={`https://instagram.com/${IG}`} target="_blank" rel="noopener noreferrer" style={{ color:"#1a3c34", fontWeight:500 }}>@{IG}</a> for new arrivals and behind-the-scenes craft.
              </p>
            </div>
            <div>
              <div style={{ borderRadius:"1.25rem", overflow:"hidden", aspectRatio:"4/3", background:"#f0e6d0" }}>
                <img src="https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&q=80" alt="Handcrafted seashell decor" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding:"3rem 1rem", background:"#1a3c34" }}>
        <div style={{ maxWidth:800, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1.5rem" }} className="vals-grid">
          {[
            { emoji:"🌿", t:"Natural Materials", d:"Every product uses responsibly sourced natural materials" },
            { emoji:"🤝", t:"Local Partnership", d:"We work with local artisans and delivery partners" },
            { emoji:"🐚", t:"Coastal Inspiration", d:"Designs inspired by India's rich coastal traditions" },
            { emoji:"💝", t:"Made with Love", d:"Every piece handcrafted with attention and care" },
          ].map(({ emoji, t, d }, i) => (
            <motion.div key={t} {...up(i*.1)}
              style={{ background:"rgba(255,255,255,.05)", borderRadius:"1rem", padding:"1.25rem", border:"1px solid rgba(255,255,255,.1)" }}>
              <span style={{ fontSize:24, display:"block", marginBottom:8 }}>{emoji}</span>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", color:"white", marginBottom:4 }}>{t}</h3>
              <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,.5)", lineHeight:1.6 }}>{d}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <style>{`@media(min-width:768px){.about-grid{grid-template-columns:1fr 1fr!important}.vals-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
    </div>
  );
}

export function Contact() {
  const [form,    setForm]    = useState({ name:"", phone:"", city:"Buxar", message:"" });
  const [sending, setSending] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const msg = `Hi Savitri Livings!\n\nName: ${form.name}\nPhone: ${form.phone}\nCity: ${form.city}\n\n${form.message}`;
    window.open(`https://wa.me/91${WA}?text=${encodeURIComponent(msg)}`, "_blank");
    setSending(true);
    setTimeout(() => setSending(false), 2000);
  };

  return (
    <div style={{ overflowX:"hidden" }}>
      <HeroBand tag="Get in Touch" title="Contact Us" sub="We would love to hear from you — reach out any time"/>
      <section style={{ padding:"3.5rem 1rem", background:"#fdf6ee" }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr", gap:"2rem" }} className="con-grid">
          <div>
            <p className="section-tag">Contact Info</p>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.75rem", color:"#1c1409", marginBottom:"1.25rem" }}>Always happy to help</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[{ Icon:Phone,     t:`+91 ${WA}`,          href:`tel:+91${WA}`,                desc:"Call or WhatsApp" },
                { Icon:Instagram, t:`@${IG}`,              href:`https://instagram.com/${IG}`, desc:"Follow for new drops" },
                { Icon:MapPin,    t:"Buxar, Bihar 802101", href:null,                          desc:"Launch city"         },
              ].map(({ Icon,t,href,desc }) => (
                <div key={t} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"#e8f5f0", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon style={{ width:16, height:16, color:"#1a3c34" }}/>
                  </div>
                  <div>
                    {href ? <a href={href} target={href.startsWith("http")?"_blank":undefined} rel="noopener noreferrer" style={{ fontWeight:500, color:"#1c1409", textDecoration:"none" }}>{t}</a>
                          : <p style={{ fontWeight:500, color:"#1c1409" }}>{t}</p>}
                    <p style={{ fontSize:"0.75rem", color:"#8c7258" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href={`https://wa.me/91${WA}`} target="_blank" rel="noopener noreferrer"
              className="btn-wa" style={{ display:"inline-flex", marginTop:"1.5rem" }}>
              <MessageCircle style={{ width:16,height:16 }}/>Chat on WhatsApp
            </a>
          </div>
          <div className="card" style={{ padding:"1.5rem" }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", color:"#1c1409", marginBottom:"1.25rem" }}>Send a message</h3>
            <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[{ k:"name",l:"Your Name",t:"text",ph:"Priya Sharma" },{ k:"phone",l:"Phone",t:"tel",ph:"9876543210" }].map(({ k,l,t,ph }) => (
                <div key={k}>
                  <label className="label">{l}</label>
                  <input required type={t} className="input" placeholder={ph} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <label className="label">City</label>
                <select className="input" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}>
                  {["Buxar","Varanasi","Kolkata","Other"].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Message</label>
                <textarea required className="input" rows={4} style={{ resize:"vertical" }} placeholder="How can we help you?" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))}/>
              </div>
              <button type="submit" disabled={sending} className="btn-primary" style={{ justifyContent:"center" }}>
                {sending?"Sending…":"Send via WhatsApp"}
              </button>
            </form>
          </div>
        </div>
      </section>
      <style>{`@media(min-width:768px){.con-grid{grid-template-columns:1fr 1fr!important}}`}</style>
    </div>
  );
}

export function FAQs() {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q:"Where do you deliver?",             a:"Currently delivering in Buxar, Bihar. Varanasi and Kolkata are coming very soon." },
    { q:"How do I place an order?",           a:"You can order directly on our website, via WhatsApp (+91 6207855397), or through Instagram DM (@livingcrafts__)." },
    { q:"What payment methods do you accept?",a:"UPI/QR (PhonePe, GPay, Paytm), Razorpay online, and cash on delivery within Buxar." },
    { q:"How long does delivery take?",       a:"Same-day delivery in Buxar for orders placed before 2pm. Standard delivery is 1-2 days." },
    { q:"What is your return policy?",        a:"We accept returns within 7 days if the product is in original condition. WhatsApp us with a photo of the issue." },
    { q:"Can I customise a product?",         a:"Yes! Many of our pieces can be customised. Contact us on WhatsApp to discuss your requirements." },
    { q:"Are the products eco-friendly?",     a:"Yes. We use natural, sustainably sourced materials — seashells, bamboo, jute, and natural wood." },
    { q:"Can I order in bulk for events?",    a:"Absolutely. We offer bulk and event orders. WhatsApp us for pricing and timelines." },
  ];
  return (
    <div>
      <HeroBand tag="Help Centre" title="Frequently Asked Questions"/>
      <section style={{ padding:"3.5rem 1rem", background:"#fdf6ee" }}>
        <div style={{ maxWidth:640, margin:"0 auto", display:"flex", flexDirection:"column", gap:"0.625rem" }}>
          {faqs.map(({ q,a },i) => (
            <motion.div key={q} {...up(i*.05)} className="card" style={{ overflow:"hidden" }}>
              <button onClick={() => setOpen(open===i?null:i)}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1rem 1.25rem", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", gap:"0.75rem" }}>
                <span style={{ fontSize:"0.9rem", fontWeight:500, color:"#1c1409" }}>{q}</span>
                <ChevronDown style={{ width:15, height:15, color:"#1a3c34", flexShrink:0, transform: open===i ? "rotate(180deg)" : "none", transition:"transform .2s" }}/>
              </button>
              {open===i && (
                <div style={{ padding:"0 1.25rem 1rem", borderTop:"1px solid #e8dfd0" }}>
                  <p style={{ fontSize:"0.875rem", color:"#5c4a32", lineHeight:1.75, paddingTop:"0.75rem" }}>{a}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function Legal() {
  const secs = [
    { id:"terms",   t:"Terms & Conditions",  b:"By using our website or placing an order, you agree to these terms. All content on this site belongs to Savitri Livings. Prices are subject to change without notice." },
    { id:"privacy", t:"Privacy Policy",       b:"We collect your name, phone, and address only to process and deliver your order. Your data is never sold or shared with third parties." },
    { id:"returns", t:"Returns & Refunds",    b:"We accept returns within 7 days of delivery for products in original condition. WhatsApp us with a photo of the issue for fastest resolution. Refunds processed in 3-5 working days." },
    { id:"delivery",t:"Delivery Policy",      b:"We currently deliver in Buxar. Standard delivery is 1-2 days. Express same-day delivery is available for orders placed before 2pm. Delivery fees apply for orders below Rs.500." },
    { id:"contact", t:"Report an Issue",      b:`For any complaints or issues, reach us on WhatsApp at +91 ${WA} or Instagram @${IG}. We respond within 24 hours.` },
  ];
  return (
    <div style={{ minHeight:"100vh", background:"#fdf6ee", padding:"2.5rem 1rem" }}>
      <div style={{ maxWidth:640, margin:"0 auto" }}>
        <p className="section-tag">Legal</p>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(2rem,5vw,3rem)", color:"#1c1409", marginBottom:"2rem" }}>Policies</h1>
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {secs.map(({ id,t,b }) => (
            <div key={id} id={id} className="card" style={{ padding:"1.5rem 2rem", scrollMarginTop:"5rem" }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.4rem", marginBottom:"0.625rem" }}>{t}</h2>
              <div className="divider"/>
              <p style={{ fontSize:"0.9rem", color:"#5c4a32", lineHeight:1.85 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
