import { useEffect, useState } from "react";
import { Archive, BarChart2, Clock3, Code2, Copy, Eye, FileText, Image, LayoutTemplate, Plus, RotateCcw, Save, Send, Trash2, Upload, X } from "lucide-react";
import { pagesAPI, productAPI } from "../../services/api.js";

const SECTION_TYPES = ["hero", "heading", "text", "image", "imageText", "video", "button", "products", "productCarousel", "categoryGrid", "collection", "faq", "form", "countdown", "testimonials", "socialLinks", "whatsapp", "referral", "custom"];
const SECTION_FIELDS = {
  hero: ["title", "text", "image", "ctaText", "ctaUrl"],
  heading: ["title"],
  text: ["text"],
  image: ["image", "alt"],
  imageText: ["title", "text", "image", "ctaText", "ctaUrl"],
  video: ["title", "videoUrl"],
  button: ["title", "ctaText", "ctaUrl", "action", "productId"],
  products: ["title", "category", "limit", "productIds"],
  productCarousel: ["title", "category", "limit", "productIds"],
  collection: ["title", "category", "limit", "productIds"],
  categoryGrid: ["title", "categories"],
  countdown: ["title", "targetDate"],
  testimonials: ["title", "text"],
  socialLinks: ["title", "text"],
  whatsapp: ["title", "ctaText", "ctaUrl"],
  referral: ["title", "ctaText", "ctaUrl"],
  faq: ["title", "text"],
  custom: ["title", "text", "image", "ctaText", "ctaUrl"],
};
const blankPage = () => ({
  name: "", slug: "", description: "", sourceType: "builder", htmlContent: "", sections: [], campaignName: "",
  settings: { showNavbar: true, showFooter: true, fullWidth: false, background: "#fffaf3", primaryColor: "#9d6a27", secondaryColor: "#1a3c34", fontFamily: "DM Sans", productCategory: "", productId: "" },
  customizations: { title: "", description: "", ctaText: "", ctaUrl: "", offerText: "", bannerImage: "" },
  seo: { title: "", description: "", keywords: "", ogTitle: "", ogDescription: "", ogImage: "", canonicalUrl: "", robots: "index,follow" },
  schedule: { publishAt: "", expiresAt: "" },
});

const PAGE_TEMPLATES = [
  { name:"Product sale", slug:"product-sale", description:"Campaign landing page for a featured collection.", sections:[{ type:"hero", title:"A little something special", text:"Discover pieces chosen for the season.", ctaText:"Shop the collection", ctaUrl:"/shop" }, { type:"products", title:"Shop the collection", limit:8 }] },
  { name:"Jewellery campaign", slug:"jewellery-campaign", description:"A focused jewellery collection page.", sections:[{ type:"hero", title:"Made for your moments", text:"Find your next everyday favourite.", ctaText:"Explore jewellery", ctaUrl:"/shop?category=jewellery" }, { type:"products", title:"Jewellery picks", category:"jewellery", limit:8 }] },
  { name:"Lead generation", slug:"business-inquiry", description:"Collect enquiries with privacy-first consent.", sections:[{ id:"lead-form", type:"form", visible:true, title:"Get in touch", fields:[{ name:"name", label:"Name", type:"text", required:true }, { name:"email", label:"Email", type:"email", required:false }], consents:[{ type:"privacy", label:"I agree to the Privacy Policy.", required:true, version:"1" }], submitText:"Submit", successMessage:"Thanks, your response has been received." }] },
  { name:"Coming soon", slug:"coming-soon", description:"A simple launch announcement.", sections:[{ type:"hero", title:"Something is on its way", text:"Join us for the launch.", ctaText:"Contact us", ctaUrl:"/contact" }, { type:"countdown", title:"Launching soon", targetDate:"" }] },
];

const makeSection = (type) => ({
  id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type,
  visible: true,
  ...(type === "form" ? {
    title: "Get in touch",
    fields: [{ name: "name", label: "Name", type: "text", required: true }, { name: "email", label: "Email", type: "email", required: false }],
    consents: [{ type: "privacy", label: "I agree to the Privacy Policy.", required: true, version: "1" }, { type: "email-marketing", label: "I agree to receive promotional emails.", required: false, version: "1" }, { type: "whatsapp-marketing", label: "I agree to receive WhatsApp updates.", required: false, version: "1" }],
    submitText: "Submit", successMessage: "Thanks, your response has been received.",
  } : {}),
});

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toLocalDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const toIsoDate = (value) => value ? new Date(value).toISOString() : null;
const pageUrl = (slug) => {
  const base = import.meta.env.VITE_PUBLIC_SITE_URL || (window.location.hostname === "localhost" ? `${window.location.protocol}//${window.location.hostname}:5176` : "https://home-decor-inky.vercel.app");
  return `${base.replace(/\/$/, "")}/p/${slug}`;
};

export default function Pages() {
  const [pages, setPages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [editor, setEditor] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [versions, setVersions] = useState([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadInfo, setUploadInfo] = useState("");

  const loadPages = async () => {
    setLoading(true);
    try {
      const { data } = await pagesAPI.getAll();
      setPages(data.pages || []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Could not load pages. Check the API connection and admin access.");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadPages(); }, []);
  useEffect(() => { productAPI.getAll({ limit:100 }).then(({ data }) => setProducts(data.products || [])).catch(() => {}); }, []);
  useEffect(() => { pagesAPI.templates().then(({ data }) => setTemplates(data.templates || [])).catch(() => {}); }, []);

  const openPage = async (page) => {
    setNotice(""); setError(""); setAnalytics(null); setVersions([]); setUploadInfo("");
    if (!page) { setEditor(blankPage()); return; }
    setEditor(null);
    try {
      const [{ data: pageData }, { data: analyticsData }, { data: versionData }] = await Promise.all([
        pagesAPI.getOne(page._id), pagesAPI.analytics(page._id), pagesAPI.versions(page._id),
      ]);
      setEditor(pageData.page);
      setAnalytics(analyticsData.analytics);
      setVersions(versionData.versions || []);
    } catch (loadError) { setError(loadError.response?.data?.message || "Could not open this page."); }
  };

  const patchEditor = (key, value) => setEditor((previous) => ({ ...previous, [key]: value }));
  const patchNested = (key, value) => setEditor((previous) => ({ ...previous, [key]: { ...previous[key], ...value } }));
  const patchSection = (id, values) => setEditor((previous) => ({ ...previous, sections: previous.sections.map((section) => section.id === id ? { ...section, ...values } : section) }));
  const startTemplate = (template) => setEditor({
    ...blankPage(),
    name: template.name,
    slug: template.slug || slugify(template.name),
    description: template.description,
    sourceType: template.sourceType || "builder",
    htmlContent: template.htmlContent || "",
    sections: (template.sections || []).map((section) => ({ ...section, id:`section-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    settings: { ...blankPage().settings, ...template.settings },
    customizations: { ...blankPage().customizations, ...template.customizations },
    seo: { ...blankPage().seo, ...template.seo },
  });

  const saveAsTemplate = async () => {
    const name = window.prompt("Name this page template", `${editor.name || "Page"} template`);
    if (!name?.trim()) return;
    try {
      const { data } = await pagesAPI.createTemplate({ ...editor, name:name.trim() });
      setTemplates((previous) => [data.template, ...previous]);
      setNotice("Template saved.");
    } catch (templateError) { setError(templateError.response?.data?.message || "Could not save template."); }
  };

  const renameTemplate = async (template) => {
    const name = window.prompt("Template name", template.name);
    if (!name?.trim() || name.trim() === template.name) return;
    try {
      const { data } = await pagesAPI.updateTemplate(template._id, { name:name.trim() });
      setTemplates((previous) => previous.map((item) => item._id === template._id ? data.template : item));
    } catch (templateError) { setError(templateError.response?.data?.message || "Could not update template."); }
  };

  const removeTemplate = async (template) => {
    if (!window.confirm(`Delete template “${template.name}”? Existing pages will not be changed.`)) return;
    try { await pagesAPI.deleteTemplate(template._id); setTemplates((previous) => previous.filter((item) => item._id !== template._id)); }
    catch (templateError) { setError(templateError.response?.data?.message || "Could not delete template."); }
  };

  const persist = async () => {
    const payload = {
      ...editor,
      schedule: { publishAt: toIsoDate(editor.schedule?.publishAt), expiresAt: toIsoDate(editor.schedule?.expiresAt) },
    };
    const { data } = editor._id ? await pagesAPI.update(editor._id, payload) : await pagesAPI.create(payload);
    setEditor(data.page);
    await loadPages();
    return data.page;
  };

  const runAction = async (action) => {
    if (!editor) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const page = await persist();
      if (action === "publish") {
        const { data } = await pagesAPI.publish(page._id);
        setEditor(data.page); setNotice(data.page.status === "scheduled" ? "Page scheduled." : "Page published.");
      } else if (action === "draft") {
        const { data } = await pagesAPI.unpublish(page._id);
        setEditor(data.page); setNotice("Draft saved and unpublished.");
      } else setNotice("Changes saved.");
      await loadPages();
    } catch (saveError) { setError(saveError.response?.data?.message || "Could not save this page."); }
    finally { setBusy(false); }
  };

  const uploadHtml = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setUploadInfo("");
    if (!/\.html?$/i.test(file.name) || file.size > 1024 * 1024) {
      setError("Choose an .html or .htm file up to 1 MB."); event.target.value = ""; return;
    }
    const formData = new FormData(); formData.append("file", file);
    setBusy(true);
    try {
      const { data } = await pagesAPI.uploadHtml(formData);
      patchEditor("sourceType", "html"); patchEditor("htmlContent", data.htmlContent);
      setUploadInfo(`${data.fileName} · ${(data.fileSize / 1024).toFixed(1)} KB · ${data.message}`);
    } catch (uploadError) { setError(uploadError.response?.data?.message || "HTML upload failed."); }
    finally { setBusy(false); event.target.value = ""; }
  };

  const previewPage = async () => {
    setBusy(true); setError("");
    const previewWindow = window.open("about:blank", "_blank");
    if (previewWindow) previewWindow.opener = null;
    try {
      if (!previewWindow) throw new Error("Allow popups to open the page preview.");
      const page = await persist();
      const { data } = await pagesAPI.previewToken(page._id);
      const url = new URL(pageUrl(data.slug));
      url.searchParams.set("preview", "true");
      url.searchParams.set("previewToken", data.token);
      previewWindow.location.href = url.toString();
    } catch (previewError) { previewWindow?.close(); setError(previewError.response?.data?.message || previewError.message || "Save the page before previewing."); }
    finally { setBusy(false); }
  };

  const duplicatePage = async (page) => {
    try { await pagesAPI.duplicate(page._id); await loadPages(); setNotice(`${page.name} duplicated as a draft.`); }
    catch (actionError) { setError(actionError.response?.data?.message || "Could not duplicate page."); }
  };

  const archivePage = async (page) => {
    if (!window.confirm(`Archive “${page.name}”? Its public URL will stop resolving.`)) return;
    try { await pagesAPI.archive(page._id); await loadPages(); if (editor?._id === page._id) setEditor(null); }
    catch (actionError) { setError(actionError.response?.data?.message || "Could not archive page."); }
  };

  const restoreVersion = async (version) => {
    if (!editor?._id) return;
    try {
      const { data } = await pagesAPI.restore(editor._id, version);
      setEditor(data.page); await loadPages(); setNotice(`Version ${version} restored as a draft.`);
    } catch (restoreError) { setError(restoreError.response?.data?.message || "Could not restore this version."); }
  };

  return <div>
    <header style={{ display:"flex", alignItems:"start", justifyContent:"space-between", gap:16, marginBottom:20 }}>
      <div><p className="section-tag">Campaign publishing</p><h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", color:"#2c1f14" }}>Savitri Pages</h1><p style={{ color:"#8c7060", marginTop:4 }}>Build, publish, and measure campaign pages at /p/your-slug.</p></div>
      {!editor && <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}><select className="input" aria-label="Start from template" value="" onChange={(event) => { const [kind, id] = event.target.value.split(":"); const template = kind === "saved" ? templates.find((item) => item._id === id) : PAGE_TEMPLATES.find((item) => item.name === id); if (template) startTemplate(template); }} style={{ width:"auto", minWidth:170 }}><option value="">Start from template</option><optgroup label="Built-in">{PAGE_TEMPLATES.map((template) => <option key={template.name} value={`builtin:${template.name}`}>{template.name}</option>)}</optgroup>{templates.length > 0 && <optgroup label="Saved by your team">{templates.map((template) => <option key={template._id} value={`saved:${template._id}`}>{template.name}</option>)}</optgroup>}</select><button type="button" className="btn-clay" onClick={() => openPage(null)}><Plus size={16}/> Create page</button></div>}
    </header>

    {notice && <div role="status" style={{ padding:".75rem 1rem", marginBottom:14, borderRadius:8, background:"#eaf7ef", color:"#166534" }}>{notice}</div>}
    {error && <div role="alert" style={{ padding:".75rem 1rem", marginBottom:14, borderRadius:8, background:"#fff0ed", color:"#9b2c1c" }}>{error}</div>}

    {!editor ? (
      <>
      <section className="card" style={{ padding:"1.25rem", overflowX:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:14 }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem" }}>Pages</h2><span style={{ color:"#8c7060", fontSize:".82rem" }}>{pages.length} total</span></div>
        {loading ? <p style={{ padding:"1rem 0", color:"#8c7060" }}>Loading pages…</p> : pages.length === 0 ? <div style={{ padding:"2.5rem 1rem", textAlign:"center", color:"#8c7060" }}><FileText size={26} style={{ margin:"0 auto .6rem", color:"#c96030" }}/><p>No pages yet. Create a builder page or upload an HTML campaign.</p></div> : (
          <table style={{ width:"100%", minWidth:700, borderCollapse:"collapse", textAlign:"left" }}>
            <thead><tr>{["Page", "Status", "URL", "Views", "Updated", "Actions"].map((heading) => <th key={heading} style={{ padding:".7rem .6rem", borderBottom:"1px solid #eee3d8", color:"#8c7060", fontSize:".72rem", textTransform:"uppercase", fontWeight:600 }}>{heading}</th>)}</tr></thead>
            <tbody>{pages.map((page) => <tr key={page._id}>
              <td style={{ padding:".8rem .6rem", borderBottom:"1px solid #f3ece4" }}><button type="button" onClick={() => openPage(page)} style={{ padding:0, border:0, background:"none", color:"#2c1f14", fontWeight:600, textAlign:"left", cursor:"pointer" }}>{page.name}</button><small style={{ display:"block", color:"#8c7060", marginTop:3 }}>{page.sourceType === "html" ? "HTML import" : "Visual builder"}</small></td>
              <td style={{ padding:".8rem .6rem", borderBottom:"1px solid #f3ece4" }}><span className={`badge ${page.status === "published" ? "badge-green" : page.status === "scheduled" ? "badge-blue" : page.status === "expired" || page.status === "archived" ? "badge-gray" : "badge-sand"}`}>{page.status}</span></td>
              <td style={{ padding:".8rem .6rem", borderBottom:"1px solid #f3ece4" }}><a href={pageUrl(page.slug)} target="_blank" rel="noopener noreferrer" style={{ color:"#a84a22", fontSize:".82rem" }}>/p/{page.slug}</a></td>
              <td style={{ padding:".8rem .6rem", borderBottom:"1px solid #f3ece4", color:"#6b5040" }}>{page.analytics?.page_view || 0}</td>
              <td style={{ padding:".8rem .6rem", borderBottom:"1px solid #f3ece4", color:"#8c7060", whiteSpace:"nowrap" }}>{new Date(page.updatedAt).toLocaleDateString()}</td>
              <td style={{ padding:".8rem .6rem", borderBottom:"1px solid #f3ece4", whiteSpace:"nowrap" }}>
                <button type="button" title="Edit page" aria-label={`Edit ${page.name}`} onClick={() => openPage(page)} style={iconButton}><FileText size={15}/></button>
                <button type="button" title="Duplicate page" aria-label={`Duplicate ${page.name}`} onClick={() => duplicatePage(page)} style={iconButton}><Copy size={15}/></button>
                <button type="button" title="Archive page" aria-label={`Archive ${page.name}`} onClick={() => archivePage(page)} style={{ ...iconButton, color:"#a84a22" }}><Archive size={15}/></button>
              </td>
            </tr>)}</tbody>
          </table>
        )}
      </section>
      <section className="card" style={{ padding:"1.25rem", marginTop:16 }}><div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:10 }}><h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem" }}>Saved templates</h2><span style={{ color:"#8c7060", fontSize:".82rem" }}>{templates.length}</span></div>{templates.length ? templates.map((template) => <div key={template._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:".65rem 0", borderTop:"1px solid #f3ece4" }}><div><strong>{template.name}</strong><small style={{ display:"block", color:"#8c7060", marginTop:2 }}>{template.description || `${template.sections?.length || 0} sections`}</small></div><div style={{ display:"flex", gap:6 }}><button type="button" className="btn-ghost" style={{ minHeight:32, padding:"0 .65rem", fontSize:12 }} onClick={() => startTemplate(template)}>Use</button><button type="button" className="btn-ghost" style={{ minHeight:32, padding:"0 .65rem", fontSize:12 }} onClick={() => renameTemplate(template)}>Rename</button><button type="button" title="Delete template" aria-label={`Delete ${template.name}`} onClick={() => removeTemplate(template)} style={iconButton}><Trash2 size={14}/></button></div></div>) : <p style={{ color:"#8c7060", fontSize:".85rem" }}>Save a page as a template to reuse its sections and settings.</p>}</section>
      </>
    ) : (
      <>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:16 }}>
          <button type="button" className="btn-ghost" onClick={() => { setEditor(null); setError(""); setNotice(""); }}><X size={15}/> Back to pages</button>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {editor._id && <button type="button" className="btn-ghost" onClick={previewPage} disabled={busy}><Eye size={15}/> Preview</button>}
            <button type="button" className="btn-ghost" onClick={saveAsTemplate} disabled={busy}><Copy size={15}/> Save as template</button>
            <button type="button" className="btn-ghost" onClick={() => runAction("save")} disabled={busy}><Save size={15}/> Save</button>
            <button type="button" className="btn-clay" onClick={() => runAction("publish")} disabled={busy}><Send size={15}/> Publish</button>
          </div>
        </div>

        <div className="pages-editor-grid" style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 300px", alignItems:"start", gap:16 }}>
          <main style={{ display:"grid", gap:14, minWidth:0 }}>
            <section className="card" style={panelStyle}>
              <PanelTitle icon={FileText} title="Page details"/>
              <div className="pages-form-grid">
                <Field label="Page name"><input className="input" value={editor.name || ""} onChange={(event) => { const name = event.target.value; setEditor((previous) => ({ ...previous, name, slug: previous._id || previous.slug ? previous.slug : slugify(name) })); }}/></Field>
                <Field label="URL slug"><div style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ color:"#8c7060", fontSize:13 }}>/p/</span><input className="input" value={editor.slug || ""} onChange={(event) => patchEditor("slug", slugify(event.target.value))}/></div></Field>
                <Field label="Description" wide><textarea className="input" rows={2} maxLength={500} value={editor.description || ""} onChange={(event) => patchEditor("description", event.target.value)}/></Field>
                <Field label="Campaign"><input className="input" value={editor.campaignName || ""} onChange={(event) => patchEditor("campaignName", event.target.value)} placeholder="Optional campaign name"/></Field>
                <Field label="Page mode"><select className="input" value={editor.sourceType || "builder"} onChange={(event) => patchEditor("sourceType", event.target.value)}><option value="builder">Visual builder</option><option value="html">Upload HTML</option></select></Field>
              </div>
            </section>

            {editor.sourceType === "html" ? (
              <section className="card" style={panelStyle}>
                <PanelTitle icon={Code2} title="HTML import"/>
                <p style={{ color:"#8c7060", fontSize:".83rem", lineHeight:1.6, margin:"0 0 12px" }}>Scripts, embedded stylesheets, forms, and unsafe markup are removed; supported inline styles are retained. Imported HTML runs in an isolated sandbox and cannot read Savitri cookies or storage.</p>
                <label className="btn-ghost" style={{ display:"inline-flex", cursor:busy?"wait":"pointer" }}><Upload size={15}/> Choose .html file<input type="file" accept=".html,.htm,text/html" onChange={uploadHtml} disabled={busy} style={{ display:"none" }}/></label>
                {uploadInfo && <p role="status" style={{ margin:"10px 0 0", color:"#166534", fontSize:".8rem" }}>{uploadInfo}</p>}
                <Field label="Sanitized HTML" style={{ marginTop:14 }}><textarea className="input" rows={14} value={editor.htmlContent || ""} onChange={(event) => patchEditor("htmlContent", event.target.value)} spellCheck="false" style={{ fontFamily:"monospace", fontSize:12 }}/></Field>
                <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid #eee3d8" }}><strong style={{ display:"block", marginBottom:10, fontSize:13 }}>HTML placeholder overrides</strong><div className="pages-form-grid">{[["title","Hero heading"],["description","Hero description"],["offerText","Offer text"],["ctaText","CTA text"],["ctaUrl","CTA URL"],["bannerImage","Banner image URL"]].map(([key,label])=><Field key={key} label={label} wide={key==="description"}><input className="input" value={editor.customizations?.[key] || ""} onChange={(event)=>patchNested("customizations",{[key]:event.target.value})}/></Field>)}</div></div>
              </section>
            ) : (
              <section className="card" style={panelStyle}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap", marginBottom:12 }}><PanelTitle icon={LayoutTemplate} title="Visual builder"/><select aria-label="Add content block" className="input" style={{ width:"auto", minWidth:170 }} value="" onChange={(event) => { if (event.target.value) patchEditor("sections", [...(editor.sections || []), makeSection(event.target.value)]); }}><option value="">+ Add section</option>{SECTION_TYPES.map((type) => <option key={type} value={type}>{type === "imageText" ? "Image + text" : type}</option>)}</select></div>
                {(editor.sections || []).length === 0 && <p style={{ color:"#8c7060", padding:"1rem 0" }}>Add a hero, text, product grid, form, or other reusable section.</p>}
                <div style={{ display:"grid", gap:10 }}>{(editor.sections || []).map((section, index) => <section key={section.id} style={{ border:"1px solid #eee3d8", borderRadius:10, padding:14 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:12 }}><strong style={{ color:"#4a3728", textTransform:"capitalize" }}>{index + 1}. {section.type === "imageText" ? "Image + text" : section.type}</strong><div style={{ display:"flex", alignItems:"center", gap:10 }}><label style={{ display:"flex", alignItems:"center", gap:5, color:"#8c7060", fontSize:12 }}><input type="checkbox" checked={section.visible !== false} onChange={(event) => patchSection(section.id, { visible:event.target.checked })}/> Visible</label><button type="button" onClick={() => patchEditor("sections", editor.sections.filter((item) => item.id !== section.id))} aria-label="Remove section" style={iconButton}><Trash2 size={15}/></button></div></div>
                  {section.type === "form" ? <FormSection section={section} onChange={(value) => patchSection(section.id, value)}/> : (
                    <div className="pages-form-grid">{(SECTION_FIELDS[section.type] || SECTION_FIELDS.custom).map((key) => <Field key={key} label={fieldLabel(key)} wide={key === "text" || key === "categories"}>
                      {key === "productIds" ? <select multiple className="input" value={section.productIds || []} onChange={(event) => patchSection(section.id, { productIds:Array.from(event.target.selectedOptions, (option) => option.value) })} style={{ minHeight:100 }}>{products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}</select> : key === "action" ? <select className="input" value={section[key] || "link"} onChange={(event) => patchSection(section.id, { [key]:event.target.value })}><option value="link">Open link</option><option value="add_to_cart">Add to cart</option><option value="whatsapp">WhatsApp</option></select> : key === "limit" ? <input className="input" type="number" min="1" max="24" value={section[key] || 8} onChange={(event) => patchSection(section.id, { [key]:Number(event.target.value) })}/> : key === "text" || key === "categories" ? <textarea className="input" rows={3} value={section[key] || ""} onChange={(event) => patchSection(section.id, { [key]:event.target.value })}/> : <input className="input" type={key === "targetDate" ? "datetime-local" : "text"} value={key === "targetDate" ? toLocalDate(section[key]) : section[key] || ""} onChange={(event) => patchSection(section.id, { [key]:key === "targetDate" && event.target.value ? new Date(event.target.value).toISOString() : event.target.value })} placeholder={key.endsWith("Url") || key === "image" || key === "videoUrl" ? "https://…" : ""}/>}</Field>)}</div>
                  )}
                </section>)}</div>
              </section>
            )}

            <section className="card" style={panelStyle}>
              <PanelTitle icon={FileText} title="Search and social metadata"/>
              <div className="pages-form-grid">
                {[ ["title", "Meta title", 70], ["description", "Meta description", 180], ["keywords", "Keywords", 300], ["ogTitle", "Open Graph title", 70], ["ogDescription", "Open Graph description", 180], ["ogImage", "Open Graph image URL", 1000], ["canonicalUrl", "Canonical URL", 1000], ["robots", "Robots", 80] ].map(([key, label, maxLength]) => <Field key={key} label={label} wide={key === "description" || key === "ogDescription"}><input className="input" maxLength={maxLength} value={editor.seo?.[key] || ""} onChange={(event) => patchNested("seo", { [key]:event.target.value })}/></Field>)}
              </div>
            </section>
          </main>

          <aside style={{ display:"grid", gap:14 }}>
            <section className="card" style={panelStyle}>
              <PanelTitle icon={Clock3} title="Publishing"/>
              <p style={{ margin:"0 0 12px", color:"#8c7060", fontSize:".82rem" }}>Current status: <strong style={{ color:"#2c1f14", textTransform:"capitalize" }}>{editor.status || "draft"}</strong></p>
              <Field label="Schedule publish"><input type="datetime-local" className="input" value={toLocalDate(editor.schedule?.publishAt)} onChange={(event) => patchNested("schedule", { publishAt:event.target.value })}/></Field>
              <Field label="Expire at" style={{ marginTop:10 }}><input type="datetime-local" className="input" value={toLocalDate(editor.schedule?.expiresAt)} onChange={(event) => patchNested("schedule", { expiresAt:event.target.value })}/></Field>
              {editor._id && editor.status !== "draft" && <button type="button" className="btn-ghost" style={{ width:"100%", marginTop:12 }} onClick={() => runAction("draft")} disabled={busy}><RotateCcw size={14}/> Unpublish to draft</button>}
            </section>

            <section className="card" style={panelStyle}>
              <PanelTitle icon={Image} title="Page layout"/>
              {[["showNavbar", "Show Savitri navbar"], ["showFooter", "Show Savitri footer"], ["fullWidth", "Use full width"]].map(([key, label]) => <label key={key} style={{ display:"flex", alignItems:"center", gap:8, padding:".4rem 0", color:"#6b5040", fontSize:".84rem" }}><input type="checkbox" checked={editor.settings?.[key] !== false} onChange={(event) => patchNested("settings", { [key]:event.target.checked })}/>{label}</label>)}
              <div className="pages-form-grid" style={{ marginTop:10 }}>{[["background", "Background"], ["primaryColor", "Primary"], ["secondaryColor", "Secondary"]].map(([key, label]) => <Field key={key} label={label}><input type="color" className="input" value={editor.settings?.[key] || "#fffaf3"} onChange={(event) => patchNested("settings", { [key]:event.target.value })} style={{ padding:4 }}/></Field>)}<Field label="Font"><select className="input" value={editor.settings?.fontFamily || "DM Sans"} onChange={(event) => patchNested("settings", { fontFamily:event.target.value })}><option>DM Sans</option><option>Cormorant Garamond</option><option>Georgia</option><option>Arial</option></select></Field><Field label="HTML product category"><input className="input" value={editor.settings?.productCategory || ""} onChange={(event) => patchNested("settings", { productCategory:event.target.value })}/></Field><Field label="Featured HTML product"><select className="input" value={editor.settings?.productId || ""} onChange={(event) => patchNested("settings", { productId:event.target.value })}><option value="">First active product</option>{products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}</select></Field></div>
            </section>

            {editor._id && <>
              <section className="card" style={panelStyle}><PanelTitle icon={BarChart2} title="Page analytics"/>{analytics ? <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>{[["Views", analytics.page_view || 0], ["Sessions", analytics.sessions || 0], ["CTA clicks", analytics.cta_click || 0], ["Product clicks", analytics.product_click || 0], ["Add to cart", analytics.add_to_cart || 0], ["Form submits", analytics.form_submissions || 0], ["Orders", analytics.purchase || 0], ["Revenue", `₹${Number(analytics.revenue || 0).toLocaleString("en-IN")}`]].map(([label, value]) => <div key={label} style={{ padding:9, background:"#fbf6f0", borderRadius:8 }}><small style={{ color:"#8c7060" }}>{label}</small><strong style={{ display:"block", marginTop:3 }}>{value}</strong></div>)}</div> : <p style={{ color:"#8c7060", fontSize:".82rem" }}>Analytics unavailable.</p>}</section>
              <section className="card" style={panelStyle}><PanelTitle icon={RotateCcw} title="Versions"/>{versions.length ? versions.map((version) => <div key={version._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, padding:".5rem 0", borderTop:"1px solid #f3ece4" }}><span style={{ fontSize:".82rem" }}>Version {version.version}</span><button type="button" className="btn-ghost" style={{ minHeight:30, padding:"0 .55rem", fontSize:12 }} onClick={() => restoreVersion(version.version)}>Restore</button></div>) : <p style={{ color:"#8c7060", fontSize:".82rem" }}>Saved edits will appear here.</p>}</section>
            </>}
          </aside>
        </div>
      </>
    )}
    <style>{`@media(max-width:900px){.pages-editor-grid{grid-template-columns:1fr!important}} @media(max-width:560px){.pages-form-grid{grid-template-columns:1fr!important}} .pages-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px} .pages-form-grid>*{min-width:0} @media(max-width:560px){.pages-form-grid{grid-template-columns:1fr!important}}`}</style>
  </div>;
}

function FormSection({ section, onChange }) {
  const patchField = (index, values) => onChange({ fields: section.fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...values } : field) });
  const patchConsent = (index, values) => onChange({ consents: section.consents.map((consent, consentIndex) => consentIndex === index ? { ...consent, ...values } : consent) });
  return <div style={{ display:"grid", gap:12 }}>
    <Field label="Form title"><input className="input" value={section.title || ""} onChange={(event) => onChange({ title:event.target.value })}/></Field>
    <div><div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><strong style={{ fontSize:13 }}>Fields</strong><button type="button" className="btn-ghost" style={{ minHeight:30, padding:"0 .55rem", fontSize:12 }} onClick={() => onChange({ fields:[...(section.fields || []), { name:`field${(section.fields || []).length + 1}`, label:"New field", type:"text", required:false }] })}><Plus size={13}/> Add field</button></div>
      {(section.fields || []).map((field, index) => <div key={`${field.name}-${index}`} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr)) auto", alignItems:"center", gap:6, marginBottom:10 }}>
        <input className="input" aria-label="Field label" value={field.label} onChange={(event) => patchField(index, { label:event.target.value, name:field.name || slugify(event.target.value) })}/>
        <input className="input" aria-label="Field key" value={field.name} onChange={(event) => patchField(index, { name:slugify(event.target.value) })}/>
        <select className="input" aria-label="Field type" value={field.type || "text"} onChange={(event) => patchField(index, { type:event.target.value })}><option value="text">Text</option><option value="email">Email</option><option value="tel">Phone</option><option value="textarea">Message</option><option value="select">Dropdown</option><option value="radio">Radio</option><option value="checkbox">Checkbox</option></select>
        <button type="button" aria-label="Remove field" onClick={() => onChange({ fields:section.fields.filter((_, fieldIndex) => fieldIndex !== index) })} style={iconButton}><X size={14}/></button>
        <label style={{ gridColumn:"1 / -1", fontSize:12, color:"#8c7060" }}><input type="checkbox" checked={Boolean(field.required)} onChange={(event) => patchField(index, { required:event.target.checked })}/> Required</label>
        {["select", "radio"].includes(field.type) && <Field label="Options, one per line" wide><textarea className="input" rows={3} value={field.options || ""} onChange={(event) => patchField(index, { options:event.target.value })}/></Field>}
      </div>)}
    </div>
    <div><strong style={{ display:"block", fontSize:13, marginBottom:5 }}>Consent</strong>{(section.consents || []).map((consent, index) => <div key={consent.type} style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:8, padding:".35rem 0" }}><input className="input" value={consent.label} onChange={(event) => patchConsent(index, { label:event.target.value })}/><label style={{ color:"#8c7060", fontSize:12, whiteSpace:"nowrap" }}><input type="checkbox" checked={Boolean(consent.required)} onChange={(event) => patchConsent(index, { required:event.target.checked })}/> Required</label></div>)}</div>
    <div className="pages-form-grid"><Field label="Submit button"><input className="input" value={section.submitText || "Submit"} onChange={(event) => onChange({ submitText:event.target.value })}/></Field><Field label="Success message"><input className="input" value={section.successMessage || ""} onChange={(event) => onChange({ successMessage:event.target.value })}/></Field></div>
  </div>;
}

function PanelTitle({ icon: Icon, title }) { return <h2 style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"'Playfair Display',serif", fontSize:"1.05rem", margin:"0 0 14px", color:"#2c1f14" }}><Icon size={17} color="#c96030"/>{title}</h2>; }
function Field({ label, children, wide, style }) { return <label style={{ display:"block", gridColumn:wide ? "1 / -1" : undefined, ...style }}><span className="label">{label}</span>{children}</label>; }
function fieldLabel(key) { return ({ ctaText:"Button text", ctaUrl:"Button URL", videoUrl:"Video URL", productId:"Product ID", limit:"Product limit", image:"Image URL", alt:"Image description" })[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }

const panelStyle = { padding:"1.15rem", minWidth:0 };
const iconButton = { width:32, height:32, display:"inline-flex", alignItems:"center", justifyContent:"center", border:0, borderRadius:7, background:"transparent", color:"#6b5040", cursor:"pointer" };