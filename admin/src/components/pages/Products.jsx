import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, ImageIcon } from "lucide-react";
import { productAPI } from "../../services/api.js";
import { PageLoader, EmptyState, Modal, Button } from "../ui/index.jsx";
import toast from "react-hot-toast";

const CATS    = ["seashell","decor","gift","seasonal","other"];
const CITIES  = ["Buxar","Varanasi","Kolkata"];

function ProductForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name:"", description:"", category:"seashell", price:"", comparePrice:"", stock:"", availableCities:["Buxar"], tags:"", material:"", isFeatured:false, isSeasonal:false, isActive:true });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState(initial?.images || []);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const toggle = (k) => setForm(f=>({...f,[k]:!f[k]}));
  const toggleCity = (c) => setForm(f=>({ ...f, availableCities: f.availableCities.includes(c) ? f.availableCities.filter(x=>x!==c) : [...f.availableCities,c] }));

  const handleFiles = (e) => {
    const chosen = Array.from(e.target.files);
    setFiles(chosen);
    setPreviews(chosen.map(f=>URL.createObjectURL(f)));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => {
        if (Array.isArray(v)) v.forEach(i=>fd.append(k, i));
        else fd.append(k, v);
      });
      files.forEach(f => fd.append("images", f));
      if (initial?._id) await productAPI.update(initial._id, fd);
      else              await productAPI.create(fd);
      toast.success(initial ? "Product updated" : "Product created");
      onSave();
    } catch(err) { toast.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div style={{ gridColumn:"span 2" }}>
          <label className="label">Product Name *</label>
          <input required className="input" placeholder="e.g. Hand-painted Conch Shell Frame" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
        </div>
        <div>
          <label className="label">Category *</label>
          <select required className="input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
            {CATS.map(c=><option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Material</label>
          <input className="input" placeholder="e.g. Seashell, bamboo" value={form.material||""} onChange={e=>setForm(f=>({...f,material:e.target.value}))}/>
        </div>
        <div>
          <label className="label">Price (Rs.) *</label>
          <input required type="number" min={0} className="input" placeholder="499" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/>
        </div>
        <div>
          <label className="label">Compare Price (strike-through)</label>
          <input type="number" min={0} className="input" placeholder="699" value={form.comparePrice||""} onChange={e=>setForm(f=>({...f,comparePrice:e.target.value}))}/>
        </div>
        <div>
          <label className="label">Stock *</label>
          <input required type="number" min={0} className="input" placeholder="10" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/>
        </div>
        <div>
          <label className="label">Tags (comma separated)</label>
          <input className="input" placeholder="beach, coastal, gift" value={form.tags||""} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/>
        </div>
        <div style={{ gridColumn:"span 2" }}>
          <label className="label">Description</label>
          <textarea className="input" rows={3} style={{ resize:"vertical" }} placeholder="Describe this product…" value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        </div>
      </div>

      {/* Cities */}
      <div>
        <label className="label">Available in cities</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {CITIES.map(c=>(
            <button type="button" key={c} onClick={()=>toggleCity(c)}
              style={{ padding:"0.4rem 1rem", borderRadius:20, fontSize:"0.8rem", fontWeight:500, cursor:"pointer", border:"1px solid", borderColor: form.availableCities.includes(c)?"#c96030":"#d4c4b0", background: form.availableCities.includes(c)?"#fae8d8":"white", color: form.availableCities.includes(c)?"#a84a22":"#6b5040" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
        {[["isFeatured","Featured"],["isSeasonal","Seasonal"],["isActive","Active"]].map(([k,l])=>(
          <button type="button" key={k} onClick={()=>toggle(k)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"0.4rem 0.875rem", borderRadius:20, fontSize:"0.8rem", fontWeight:500, cursor:"pointer", border:"1px solid", borderColor: form[k]?"#c96030":"#d4c4b0", background: form[k]?"#fae8d8":"white", color: form[k]?"#a84a22":"#6b5040" }}>
            {form[k] ? <ToggleRight style={{ width:15, height:15 }}/> : <ToggleLeft style={{ width:15, height:15 }}/>}{l}
          </button>
        ))}
      </div>

      {/* Images */}
      <div>
        <label className="label">Product Images (up to 5)</label>
        {previews.length > 0 && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
            {previews.map((src,i) => (
              <img key={i} src={src} alt="" style={{ width:72, height:72, objectFit:"cover", borderRadius:8, border:"1px solid #d4c4b0" }}/>
            ))}
          </div>
        )}
        <button type="button" onClick={()=>fileRef.current.click()}
          className="btn-ghost" style={{ gap:6 }}>
          <ImageIcon style={{ width:14, height:14 }}/>{previews.length?"Change images":"Upload images"}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*" style={{ display:"none" }} onChange={handleFiles}/>
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
        <Button variant="clay" type="submit" loading={saving}>{initial?"Update Product":"Add Product"}</Button>
      </div>
    </form>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [catFilter,setCatFilter]= useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit:100 };
      if (catFilter) params.category = catFilter;
      if (search)    params.search   = search;
      const { data } = await productAPI.getAll(params);
      setProducts(data.products || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [catFilter, search]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try { await productAPI.remove(id); setProducts(p=>p.filter(x=>x._id!==id)); toast.success("Deleted"); }
    catch { toast.error("Delete failed"); }
  };

  const handleToggle = async (id) => {
    try { const { data } = await productAPI.toggle(id); setProducts(p=>p.map(x=>x._id===id?data.product:x)); }
    catch { toast.error("Toggle failed"); }
  };

  const onSave = () => { setShowForm(false); setEditing(null); load(); };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:10 }}>
        <div>
          <p className="section-tag">Product Catalogue</p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Products</h1>
        </div>
        <Button variant="clay" onClick={()=>{setEditing(null);setShowForm(true);}}>
          <Plus style={{ width:15, height:15 }}/>Add Product
        </Button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:"1 1 200px" }}>
          <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"#b09880", pointerEvents:"none" }}/>
          <input className="input" style={{ paddingLeft:32, height:38 }} placeholder="Search products…"
            value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="input" style={{ width:"auto", height:38 }} value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {CATS.map(c=><option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <PageLoader/> : products.length===0 ? (
        <EmptyState title="No products yet" message="Add your first product to get started."
          action={<Button onClick={()=>setShowForm(true)}>Add Product</Button>}/>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.875rem" }} className="prod-grid">
          {products.map(p=>(
            <motion.div key={p._id} layout initial={{ opacity:0,scale:.98 }} animate={{ opacity:1,scale:1 }} className="card" style={{ padding:"1rem", display:"flex", gap:"0.875rem" }}>
              <div style={{ width:80, height:80, borderRadius:10, overflow:"hidden", background:"#f0e8e0", flexShrink:0 }}>
                {p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><ImageIcon style={{ width:24, height:24, color:"#d4c4b0" }}/></div>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontWeight:500, color:"#2c1f14", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{p.name}</p>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                  <span className="badge badge-sand" style={{ textTransform:"capitalize" }}>{p.category}</span>
                  {p.isFeatured && <span className="badge badge-clay">Featured</span>}
                  {p.isSeasonal && <span className="badge badge-teal">Seasonal</span>}
                  <span className={`badge ${p.isActive?"badge-green":"badge-gray"}`}>{p.isActive?"Active":"Inactive"}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"1rem", color:"#2c1f14", fontWeight:600 }}>Rs.{p.price?.toLocaleString("en-IN")}</span>
                    {p.comparePrice && <span style={{ fontSize:"0.75rem", color:"#b09880", textDecoration:"line-through", marginLeft:6 }}>Rs.{p.comparePrice?.toLocaleString("en-IN")}</span>}
                    <span style={{ fontSize:"0.75rem", color:"#8c7060", marginLeft:8 }}>Stock: {p.stock}</span>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>{setEditing(p);setShowForm(true);}} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#fae8d8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Edit2 style={{ width:13, height:13, color:"#c96030" }}/>
                    </button>
                    <button onClick={()=>handleToggle(p._id)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#f0f9f6", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {p.isActive ? <ToggleRight style={{ width:13, height:13, color:"#1a8e72" }}/> : <ToggleLeft style={{ width:13, height:13, color:"#b09880" }}/>}
                    </button>
                    <button onClick={()=>handleDelete(p._id)} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#fee2e2", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Trash2 style={{ width:13, height:13, color:"#991b1b" }}/>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <Modal title={editing?"Edit Product":"Add New Product"} onClose={()=>{setShowForm(false);setEditing(null);}} width={600}>
            <ProductForm initial={editing} onSave={onSave} onClose={()=>{setShowForm(false);setEditing(null);}}/>
          </Modal>
        )}
      </AnimatePresence>

      <style>{`@media(min-width:640px){.prod-grid{grid-template-columns:repeat(3,1fr)!important}}@media(min-width:1024px){.prod-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
    </div>
  );
}
