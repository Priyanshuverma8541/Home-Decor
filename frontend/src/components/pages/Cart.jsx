import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ArrowRight, ShoppingCart, CreditCard, QrCode, MessageCircle } from "lucide-react";
import { useCart }    from "../../context/CartContext.jsx";
import { useAuth }    from "../../context/AuthContext.jsx";
import { useCity }    from "../../context/CityContext.jsx";
import { usePayment } from "../../hooks/usePayment.js";
import { EmptyState, QRPayModal } from "../ui/Shared.jsx";
import { orderAPI }   from "../../services/api.js";
import toast from "react-hot-toast";

export default function Cart() {
  const { items, removeFromCart, updateQty, totalPrice, totalItems, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { city }   = useCity();
  const { placeWithUPI, payWithRazorpay, orderViaWhatsApp, UPI_ID } = usePayment();
  const navigate   = useNavigate();

  const [step,     setStep]     = useState(1); // 1=cart, 2=details, 3=payment
  const [details,  setDetails]  = useState({ name: user?.fullName||"", phone: user?.phone||"", address:"", city, notes:"" });
  const [busy,     setBusy]     = useState(false);
  const [qrModal,  setQrModal]  = useState(null); // { orderId, amount }

  const DELIVERY_FEE = 30;
  const FREE_ABOVE   = 500;
  const deliveryFee  = totalPrice >= FREE_ABOVE ? 0 : DELIVERY_FEE;
  const grandTotal   = totalPrice + deliveryFee;

  if (items.length === 0) return (
    <EmptyState title="Your cart is empty" message="Discover our seashell home decor and gift collections."
      action={<Link to="/shop" className="btn-primary">Browse Collection <ArrowRight style={{ width:15,height:15 }}/></Link>}/>
  );

  const orderPayload = () => ({
    items:          items.map(i => ({ productId:i._id, quantity:i.quantity, price:i.price })),
    deliveryAddress: details.address,
    city:            details.city || city,
    guestName:       isAuthenticated ? undefined : details.name,
    guestPhone:      isAuthenticated ? undefined : details.phone,
    orderSource:     "website",
  });

  const handleUPI = async () => {
    setBusy(true);
    const order = await placeWithUPI({ orderPayload: orderPayload(), onSuccess:(o) => setQrModal({ orderId: o._id, amount: o.grandTotal }) });
    setBusy(false);
  };

  const handleRazorpay = async () => {
    setBusy(true);
    await payWithRazorpay({ orderPayload: orderPayload(), onSuccess:() => navigate("/account/orders") });
    setBusy(false);
  };

  const handleWhatsApp = () => {
    orderViaWhatsApp({ items, totalPrice: grandTotal, city: details.city||city, address: details.address });
  };

  return (
    <div style={{ minHeight:"100vh", background:"#fdf6ee", padding:"1.5rem 1rem 5rem" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"2rem", color:"#1c1409", marginBottom:"1.5rem" }}>
          {step===1 ? "Your Cart" : step===2 ? "Delivery Details" : "Choose Payment"}
        </h1>

        {/* Progress */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:"1.5rem", gap:0 }}>
          {["Cart","Details","Payment"].map((s,i)=>(
            <div key={s} style={{ display:"flex", alignItems:"center", flex:1 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background: step>i ? "#1a3c34" : step===i+1 ? "#1a3c34" : "#e8dfd0", color: step>=i+1 ? "white" : "#8c7258", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600 }}>{i+1}</div>
                <span style={{ fontSize:"0.65rem", color: step>=i+1 ? "#1a3c34" : "#8c7258" }}>{s}</span>
              </div>
              {i<2 && <div style={{ flex:1, height:2, background: step>i+1 ? "#1a3c34" : "#e8dfd0", marginBottom:18 }}/>}
            </div>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }} className="cart-layout">
          <div>
            {/* STEP 1 — Cart items */}
            {step===1 && (
              <AnimatePresence>
                {items.map(item => (
                  <motion.div key={item._id} layout initial={{ opacity:0,x:-12 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0 }}
                    className="card" style={{ padding:"0.875rem 1rem", display:"flex", alignItems:"center", gap:"0.875rem", marginBottom:"0.75rem" }}>
                    <Link to={`/product/${item._id}`} style={{ flexShrink:0 }}>
                      <div style={{ width:64, height:64, borderRadius:10, overflow:"hidden", background:"#f0e6d0" }}>
                        <img src={item.image||"https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=200"} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      </div>
                    </Link>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1rem", color:"#1c1409", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</p>
                      <p style={{ fontSize:"0.7rem", color:"#8c7258", textTransform:"capitalize" }}>{item.category}</p>
                      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem", color:"#c96030", marginTop:2 }}>Rs.{(item.price*item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, flexShrink:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, border:"1px solid #e8dfd0", borderRadius:20, padding:"4px 10px" }}>
                        <button onClick={() => updateQty(item._id, item.quantity-1)} style={{ width:20, height:20, border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#5c4a32" }}>−</button>
                        <span style={{ minWidth:18, textAlign:"center", fontSize:"0.875rem" }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item._id, item.quantity+1)} style={{ width:20, height:20, border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:"#5c4a32" }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item._id)} style={{ width:28, height:28, borderRadius:8, border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#c8b89a" }}>
                        <Trash2 style={{ width:13, height:13 }}/>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* STEP 2 — Details */}
            {step===2 && (
              <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} className="card" style={{ padding:"1.5rem" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {!isAuthenticated && <>
                    <div>
                      <label className="label">Your Name *</label>
                      <input required className="input" placeholder="Priya Sharma" value={details.name} onChange={e=>setDetails(d=>({...d,name:e.target.value}))}/>
                    </div>
                    <div>
                      <label className="label">Phone Number *</label>
                      <input required type="tel" className="input" placeholder="9876543210" value={details.phone} onChange={e=>setDetails(d=>({...d,phone:e.target.value}))}/>
                    </div>
                  </>}
                  <div>
                    <label className="label">Delivery Address *</label>
                    <textarea required className="input" rows={3} style={{ resize:"vertical" }} placeholder="House no., street, area…" value={details.address} onChange={e=>setDetails(d=>({...d,address:e.target.value}))}/>
                  </div>
                  <div>
                    <label className="label">City</label>
                    <select className="input" value={details.city||city} onChange={e=>setDetails(d=>({...d,city:e.target.value}))}>
                      {["Buxar","Varanasi","Kolkata"].map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Order Notes (optional)</label>
                    <input className="input" placeholder="Any special instructions…" value={details.notes} onChange={e=>setDetails(d=>({...d,notes:e.target.value}))}/>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Payment */}
            {step===3 && (
              <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} className="card" style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:12 }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"#1c1409", marginBottom:4 }}>Choose how to pay</p>
                <button onClick={handleRazorpay} disabled={busy} className="btn-primary" style={{ justifyContent:"center", gap:8 }}>
                  <CreditCard style={{ width:16,height:16 }}/>Pay Online (Razorpay)
                </button>
                <button onClick={handleUPI} disabled={busy} className="btn-outline" style={{ justifyContent:"center", gap:8 }}>
                  <QrCode style={{ width:16,height:16 }}/>Pay via UPI / QR
                </button>
                <button onClick={handleWhatsApp} className="btn-wa" style={{ justifyContent:"center", gap:8 }}>
                  <MessageCircle style={{ width:16,height:16 }}/>Order on WhatsApp (pay later)
                </button>
                <p style={{ fontSize:"0.75rem", color:"#8c7258", textAlign:"center" }}>All payments are secure. For WhatsApp orders, we confirm stock before collecting payment.</p>
              </motion.div>
            )}
          </div>

          {/* Summary sidebar */}
          <div>
            <div className="card" style={{ padding:"1.25rem 1.5rem", position:"sticky", top:"80px" }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.25rem", color:"#1c1409", marginBottom:"1rem" }}>Summary</h2>
              {items.map(item => (
                <div key={item._id} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", color:"#5c4a32", marginBottom:6 }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"55%" }}>{item.name} x{item.quantity}</span>
                  <span>Rs.{(item.price*item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="divider"/>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", color:"#5c4a32", marginBottom:6 }}>
                <span>Delivery</span>
                <span>{deliveryFee===0 ? <span style={{ color:"#1a8e72", fontWeight:500 }}>Free</span> : `Rs.${deliveryFee}`}</span>
              </div>
              {deliveryFee>0 && <p style={{ fontSize:"0.7rem", color:"#8c7258", marginBottom:8 }}>Free delivery above Rs.{FREE_ABOVE}</p>}
              <div className="divider"/>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"1.25rem" }}>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:"#1c1409" }}>Total</span>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.5rem", color:"#c96030" }}>Rs.{grandTotal.toLocaleString("en-IN")}</span>
              </div>

              {step===1 && (
                <button onClick={() => setStep(2)} className="btn-primary" style={{ width:"100%", justifyContent:"center" }}>
                  Proceed to Details <ArrowRight style={{ width:15,height:15 }}/>
                </button>
              )}
              {step===2 && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <button onClick={() => {
                    if (!details.address) { toast.error("Please enter delivery address"); return; }
                    if (!isAuthenticated && (!details.name || !details.phone)) { toast.error("Please enter name and phone"); return; }
                    setStep(3);
                  }} className="btn-primary" style={{ width:"100%", justifyContent:"center" }}>
                    Choose Payment <ArrowRight style={{ width:15,height:15 }}/>
                  </button>
                  <button onClick={() => setStep(1)} className="btn-ghost" style={{ justifyContent:"center", fontSize:"0.875rem" }}>← Back to Cart</button>
                </div>
              )}
              {step===3 && (
                <button onClick={() => setStep(2)} className="btn-ghost" style={{ width:"100%", justifyContent:"center", fontSize:"0.875rem" }}>← Back to Details</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR modal */}
      {qrModal && (
        <QRPayModal amount={qrModal.amount} orderId={qrModal.orderId} upiId={UPI_ID}
          onClose={() => { setQrModal(null); navigate("/account/orders"); }}/>
      )}

      <style>{`@media(min-width:768px){.cart-layout{display:grid!important;grid-template-columns:1fr 360px!important;gap:1.5rem!important;align-items:start!important}}`}</style>
    </div>
  );
}
