import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowDownAZ, ArrowLeft, Check, ChevronDown, Cloud, Download, Eye, FilePlus2, Filter, Redo2, Save, Search, Sparkles, Undo2, X } from "lucide-react";
import toast from "react-hot-toast";
import { checklistAPI } from "../../services/api.js";

const guidanceLabels = { meaning:"What this field means", enter:"What to enter", source:"Where to get the information", verify:"How to verify it", example:"Illustrative example", mistakes:"Common mistakes", warnings:"Warnings or unknowns" };
const developerSuggestions = ["Implemented as specified", "Ready for review", "Not applicable", "Blocked — waiting for input", "Custom entry…"];
const reviewerSuggestions = ["Verified and approved", "Changes required", "Please recheck", "Not applicable", "Custom entry…"];
const excelColumn = (number) => { let value = number; let label = ""; while (value > 0) { const remainder = (value - 1) % 26; label = String.fromCharCode(65 + remainder) + label; value = Math.floor((value - 1) / 26); } return label; };
const cleanValue = (value) => typeof value === "string" ? value : value == null ? "" : String(value);

function makeRows(fields, sheet) {
  const rows = new Map();
  for (const field of fields.filter((item) => item.sheet === sheet)) {
    const key = field.row || field.id;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(field);
  }
  return [...rows.entries()].map(([rowNumber, items]) => {
    const sorted = items.sort((a, b) => (a.col || 0) - (b.col || 0));
    const statuses = sorted.filter((field) => field.label?.toLowerCase() === "status");
    const developer = sorted.find((field) => /developer comments?/i.test(field.label || ""));
    const reviewer = sorted.find((field) => /reviewer comments?/i.test(field.label || ""));
    const description = sorted.find((field) => field.description);
    const category = sorted.find((field) => field.category)?.category || description?.section || "Checklist";
    return { rowNumber: Number(rowNumber) || 0, fields: sorted, statuses, developer, reviewer, description, category };
  }).sort((a, b) => a.rowNumber - b.rowNumber);
}

function DropdownEntry({ field, value, onChange, onFocus, onKeyDown, inputRef, choices, preview, placeholder }) {
  const options = [...new Set(choices)];
  const [customMode, setCustomMode] = useState(Boolean(value) && !options.includes(value));
  const isCustom = (Boolean(value) && !options.includes(value)) || (customMode && !value);
  if (preview) return <span className="sl-xcell-readonly">{value || <em>Blank</em>}</span>;
  return <div className={`sl-x-cell-control${isCustom ? " is-custom" : ""}`}>
    <select ref={inputRef} className="sl-x-cell-select" aria-label={`${field.label || "Checklist value"}, row ${field.row}`} value={isCustom ? "__custom" : value} onChange={(event) => { if (event.target.value === "__custom") { setCustomMode(true); if (!isCustom) onChange(field.id, ""); } else { setCustomMode(false); onChange(field.id, event.target.value); } }} onFocus={() => onFocus(field)}>
      <option value="">Choose…</option>{options.map((choice) => <option key={choice} value={choice}>{choice}</option>)}<option value="__custom">Custom entry…</option>
    </select>
    <ChevronDown className="sl-x-cell-chevron" size={13} aria-hidden="true" />
    {isCustom && <input className="sl-x-custom-input" aria-label={`Custom ${field.label || "value"}`} value={value} onChange={(event) => onChange(field.id, event.target.value)} onFocus={() => onFocus(field)} onKeyDown={onKeyDown} placeholder={placeholder || "Type a custom value…"} maxLength={5000} />}
    {!isCustom && onKeyDown && <span className="sl-x-key-help" aria-hidden="true">↵</span>}
  </div>;
}

export default function ChecklistEditor() {
  const { templateId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const draftId = search.get("draft");
  const [template, setTemplate] = useState(null);
  const [values, setValues] = useState({});
  const [evidence, setEvidence] = useState({});
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [guidance, setGuidance] = useState(null);
  const [helperMinimized, setHelperMinimized] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Not saved yet");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const [currentId, setCurrentId] = useState(draftId || "");
  const [activeSheet, setActiveSheet] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [sortAlpha, setSortAlpha] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("Yes");
  const [freezeColumns, setFreezeColumns] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [ribbonTab, setRibbonTab] = useState("Home");
  const [evidenceSheet, setEvidenceSheet] = useState(false);
  const cellRefs = useRef({});
  const draftReady = useRef(false);
  const saveRequest = useRef(null);
  const saveCallCount = useRef(0);
  const editRevision = useRef(0);
  const savedRevision = useRef(0);
  const latestDraft = useRef(null);
  const skipNextDraftLoad = useRef("");

  useEffect(() => {
    if (draftId && skipNextDraftLoad.current === draftId) { skipNextDraftLoad.current = ""; return undefined; }
    let live = true;
    draftReady.current = false;
    editRevision.current = 0; savedRevision.current = 0; saveRequest.current = null;
    setLoading(true); setError(""); setDirty(false); setEvidenceSheet(false); setGuidance(null); setActiveField(null); setSelectedCell(null); setUndoStack([]); setRedoStack([]);
    (async () => {
      try {
        let saved = null;
        if (draftId) { const draftResponse = await checklistAPI.draft(draftId); saved = draftResponse.data.draft; }
        const { data } = await checklistAPI.template(templateId, saved?.templateVersion);
        if (!live) return;
        setTemplate(data.template);
        setTitle(saved?.title || data.template.name);
        setValues(saved?.values || {});
        setEvidence(saved?.evidence || {});
        setCurrentId(saved?._id || "");
        setSaveLabel(saved ? "All changes saved" : "Not saved yet");
        const primarySheet = data.template.worksheets?.find((sheet) => sheet !== "Peer Review" && !(data.template.evidenceSheets || []).includes(sheet)) || data.template.worksheets?.[0] || "";
        setActiveSheet(primarySheet);
        draftReady.current = true;
      } catch (e) {
        if (live) setError(e.response?.data?.message || "This checklist could not be loaded.");
      } finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [templateId, draftId]);

  const fields = template?.fields || [];
  latestDraft.current = { template, title, values, evidence, currentId };
  const rows = useMemo(() => makeRows(fields, activeSheet), [fields, activeSheet]);
  const categories = useMemo(() => [...new Set(rows.map((row) => row.category).filter(Boolean))], [rows]);
  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    let result = rows.filter((row) => {
      const statusValues = row.statuses.map((field) => cleanValue(values[field.id]));
      const comments = [row.developer, row.reviewer].map((field) => cleanValue(values[field?.id]));
      const text = `${row.category} ${row.description?.description || ""} ${comments.join(" ")}`.toLowerCase();
      const matchesSearch = !term || text.includes(term);
      const matchesCategory = categoryFilter === "All categories" || row.category === categoryFilter;
      const matchesStatus = statusFilter === "All statuses" || (statusFilter === "Blank" ? statusValues.every((value) => !value) : statusValues.some((value) => value.toLowerCase().includes(statusFilter.toLowerCase())));
      const complete = Boolean(statusValues[0]);
      return matchesSearch && matchesCategory && matchesStatus && (!showIncomplete || !complete);
    });
    if (sortAlpha) result = [...result].sort((a, b) => (a.description?.description || "").localeCompare(b.description?.description || ""));
    return result;
  }, [rows, query, categoryFilter, statusFilter, showIncomplete, sortAlpha, values]);

  const allRows = useMemo(() => {
    const sheetNames = [...new Set(fields.filter((field) => field.sheet !== "Peer Review" && !(template?.evidenceSheets || []).includes(field.sheet)).map((field) => field.sheet))];
    return sheetNames.flatMap((sheet) => makeRows(fields, sheet));
  }, [fields, template]);
  const completion = allRows.filter((row) => row.statuses[0] && cleanValue(values[row.statuses[0].id])).length;
  const total = allRows.length;
  const progress = total ? Math.round((completion / total) * 100) : 0;
  const activeColumn = selectedCell ? excelColumn(selectedCell.col || 1) : "A";
  const activeCellName = selectedCell ? `${activeColumn}${selectedCell.row || 1}` : "A1";
  const activeCellValue = selectedCell ? cleanValue(values[selectedCell.id]) : "";

  const setValue = useCallback((id, value) => {
    setUndoStack((stack) => [...stack.slice(-49), values]);
    setRedoStack([]);
    setValues((previous) => ({ ...previous, [id]: value }));
    editRevision.current += 1; setDirty(true);
    setSaveLabel("Unsaved changes");
  }, [values]);

  const saveNow = useCallback(async ({ quiet = false } = {}) => {
    if (!template) return null;
    if (saveRequest.current) {
      try {
        const completedId = await saveRequest.current;
        if (completedId) return savedRevision.current === editRevision.current ? completedId : saveNow({ quiet });
      } catch { /* Retry below so a failed background save does not block an explicit save/export. */ }
    }
    saveCallCount.current += 1;
    setSaving(true);
    if (!quiet) setSaveLabel("Saving…");
    const runSave = async () => {
      while (true) {
        const snapshot = latestDraft.current;
        if (!snapshot?.template) return null;
        const revision = editRevision.current;
        const body = { templateId: snapshot.template.templateId, templateVersion: snapshot.template.version, title: snapshot.title, values: snapshot.values, evidence: snapshot.evidence };
        let response;
        try {
          response = snapshot.currentId ? await checklistAPI.saveDraft(snapshot.currentId, body) : await checklistAPI.createDraft(body);
          const id = response?.data?.draft?._id;
          if (!id) throw new Error(response?.data?.message || "The server did not return a saved checklist ID. Please retry.");
        }
        catch (e) {
          setSaveLabel("Save failed — retry");
          if (!quiet) toast.error(e.response?.data?.message || e.message || "Could not save this checklist");
          return null;
        }
        const id = response.data.draft._id;
        setCurrentId(id);
        latestDraft.current = { ...latestDraft.current, currentId: id };
        if (!snapshot.currentId) { skipNextDraftLoad.current = id; navigate(`/tools/developer-zone/checklist/${encodeURIComponent(templateId)}?draft=${encodeURIComponent(id)}`, { replace: true }); }
        savedRevision.current = revision;
        if (editRevision.current === revision) {
          setDirty(false); setSaveLabel("All changes saved");
          if (!quiet) toast.success("Checklist saved");
          return id;
        }
        setDirty(true); setSaveLabel("Newer edits are waiting to save");
      }
    };
    const saveTask = runSave();
    saveRequest.current = saveTask;
    try { return await saveTask; }
    finally {
      if (saveRequest.current === saveTask) saveRequest.current = null;
      saveCallCount.current -= 1;
      if (saveCallCount.current <= 0) { saveCallCount.current = 0; setSaving(false); }
    }
  }, [navigate, templateId]);

  useEffect(() => {
    if (!draftReady.current || !dirty || preview) return undefined;
    let timer;
    const persist = () => { saveNow({ quiet: true }); };
    timer = window.setTimeout(persist, 1000);
    return () => window.clearTimeout(timer);
  }, [dirty, preview, saveNow, values, title, evidence]);

  const changeTitle = (value) => { setTitle(value); editRevision.current += 1; setDirty(true); setSaveLabel("Unsaved changes"); };
  const undo = () => {
    if (!undoStack.length) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((stack) => [...stack, values]);
    setUndoStack((stack) => stack.slice(0, -1));
    setValues(previous); editRevision.current += 1; setDirty(true); setSaveLabel("Unsaved changes");
  };
  const redo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((stack) => [...stack, values]);
    setRedoStack((stack) => stack.slice(0, -1));
    setValues(next); editRevision.current += 1; setDirty(true); setSaveLabel("Unsaved changes");
  };

  const addEvidence = async (sheet, event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    const existing = (evidence[sheet] || []).length;
    if (existing + files.length > 5) { toast.error("Add up to 5 screenshots per evidence sheet"); event.target.value = ""; return; }
    try {
      const next = [];
      for (const file of files) {
        if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error("Use PNG or JPEG images up to 2 MB each");
        const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); });
        next.push({ type: file.type, data });
      }
      setEvidence((previous) => ({ ...previous, [sheet]: [...(previous[sheet] || []), ...next] })); editRevision.current += 1; setDirty(true); setSaveLabel("Unsaved changes");
    } catch (e) { toast.error(e.message || "Could not read screenshot"); }
    event.target.value = "";
  };

  const requestGuidance = async (field) => {
    if (!field || !template) return;
    setGuidance({ state: "loading" });
    try {
      const { data } = await checklistAPI.guidance({ templateId: template.templateId, templateVersion: template.version, fieldId: field.id, context });
      setGuidance({ state: "ready", data: data.guidance });
    } catch (e) { setGuidance({ state: "error", message: e.response?.data?.message || "Guidance could not be loaded. Retry when ready." }); }
  };

  const download = async () => {
    try {
      const id = await saveNow({ quiet: true });
      setSaveLabel("Preparing Excel workbook…");
      const response = id
        ? await checklistAPI.exportDraft(id)
        : await checklistAPI.exportValues({ templateId: template.templateId, templateVersion: template.version, title, values, evidence });
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      if (!blob.size) throw new Error("The exported workbook is empty. Save the checklist and try again.");
      if (blob.type.includes("application/json")) {
        const payload = await blob.text().then((text) => JSON.parse(text)).catch(() => ({}));
        throw new Error(payload.message || "The server returned an export error.");
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url;
      const disposition = response.headers?.["content-disposition"] || "";
      const filename = disposition.match(/filename\*=(?:UTF-8'')?([^;]+)|filename="?([^";]+)"?/i);
      const rawFilename = (filename?.[1] || filename?.[2] || `SFMC_${templateId}_${new Date().toISOString().slice(0, 10)}.xlsx`).replace(/^"|"$/g, "");
      try { anchor.download = decodeURIComponent(rawFilename); } catch { anchor.download = rawFilename; }
      anchor.style.position = "fixed"; anchor.style.left = "-10000px"; anchor.style.top = "0"; anchor.style.width = "1px"; anchor.style.height = "1px"; anchor.style.opacity = "0"; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 120000);
      setSaveLabel(id ? "Excel workbook ready" : "Workbook downloaded · draft not saved");
      toast.success(<span>{id ? "Workbook ready." : "Workbook ready; the draft could not be saved."} If the download did not start, <a href={url} download={anchor.download} style={{ color: "#c2ee6a", textDecoration: "underline", fontWeight: 700 }}>click here to download it</a>.</span>, { duration: 15000 });
    } catch (e) {
      let message = e.response?.data?.message || e.message || "Workbook export failed";
      if (e.response?.data instanceof Blob) {
        const responseText = await e.response.data.text().catch(() => "");
        try { message = JSON.parse(responseText).message || message; } catch { /* retain the readable fallback */ }
      }
      setSaveLabel("Export failed — retry"); toast.error(message);
    }
  };

  const fillVisibleDeveloperStatuses = () => {
    const status = bulkStatus.trim();
    if (!status || !filteredRows.length) return;
    const patch = {};
    filteredRows.forEach((row) => { if (row.statuses[0]) patch[row.statuses[0].id] = status; });
    setUndoStack((stack) => [...stack.slice(-49), values]); setRedoStack([]); setValues((previous) => ({ ...previous, ...patch })); editRevision.current += 1; setDirty(true); setSaveLabel("Unsaved changes");
  };

  if (loading) return <main className="sl-check-app"><div className="sl-check-loading">Opening your spreadsheet…</div></main>;
  if (error || !template) return <main className="sl-check-app"><div className="sl-check-error">{error || "Checklist unavailable"}</div><Link to="/tools/developer-zone">Back to Developer Zone</Link></main>;

  const checklistSheets = (template.worksheets || []).filter((sheet) => sheet !== "Peer Review" && !(template.evidenceSheets || []).includes(sheet));
  const isPeerReview = activeSheet === "Peer Review";
  const isEvidence = evidenceSheet;
  const peerFields = fields.filter((field) => field.sheet === "Peer Review");
  const activeReference = activeField || selectedCell;
  const categoryChoices = [...new Set(rows.map((row) => row.category).filter(Boolean))];
  const statusChoices = [...new Set(rows.flatMap((row) => row.statuses.flatMap((field) => field.choices || [])))];

  return <main className="sl-check-app">
    <header className="sl-x-topbar">
      <Link to="/tools/developer-zone" className="sl-x-brand"><span className="sl-x-brand-mark">SL</span><span><b>Savitri Livings</b><small>SFMC CHECKLIST STUDIO</small></span></Link>
      <span className="sl-x-divider" />
      <label className="sl-x-workbook-title"><input aria-label="Checklist name" value={title} onChange={(event) => changeTitle(event.target.value)} maxLength={140} /><ChevronDown size={14}/></label>
      <span className={`sl-x-save-state${saving ? " is-saving" : ""}`} role="status"><Cloud size={14}/>{saveLabel}</span>
      <div className="sl-x-top-actions"><button type="button" aria-label="Undo" title="Undo (Ctrl+Z)" onClick={undo} disabled={!undoStack.length || preview}><Undo2 size={17}/></button><button type="button" aria-label="Redo" title="Redo (Ctrl+Y)" onClick={redo} disabled={!redoStack.length || preview}><Redo2 size={17}/></button><button type="button" className="sl-x-export" onClick={download}><Download size={15}/> Export Excel</button><button type="button" className="sl-x-mobile-save" onClick={() => saveNow()} disabled={saving}><Save size={15}/></button></div>
    </header>

    <nav className="sl-x-ribbon-tabs" aria-label="Spreadsheet tools">{["Home", "Insert", "Review", "View"].map((tab) => <button key={tab} type="button" className={ribbonTab === tab ? "is-active" : ""} onClick={() => setRibbonTab(tab)}>{tab}</button>)}<span className="sl-x-ribbon-spacer"/><span className="sl-x-template-tag">{template.name} · v{template.version}</span></nav>
    <section className="sl-x-ribbon" aria-label={`${ribbonTab} spreadsheet toolbar`}>
      {ribbonTab === "Home" && <><div className="sl-x-toolgroup"><b>Checklist</b><small>{template.category}</small></div><div className="sl-x-toolgroup sl-x-tool-buttons"><button type="button" title="Undo" onClick={undo} disabled={!undoStack.length}><Undo2 size={16}/></button><button type="button" title="Redo" onClick={redo} disabled={!redoStack.length}><Redo2 size={16}/></button><span className="sl-x-vrule"/><button type="button" onClick={fillVisibleDeveloperStatuses}><Check size={15}/> Fill visible statuses</button></div><div className="sl-x-toolgroup"><label>Fill with<select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>{[...new Set(["Yes", "No", "In progress", "NA", ...statusChoices])].map((value) => <option key={value}>{value}</option>)}</select></label></div><div className="sl-x-toolgroup"><label><input type="checkbox" checked={showIncomplete} onChange={(event) => setShowIncomplete(event.target.checked)}/> Incomplete only</label></div></>}
      {ribbonTab === "Insert" && <><div className="sl-x-toolgroup"><b><FilePlus2 size={16}/> Evidence</b><small>Add screenshots in the Evidence sheet tab</small></div><div className="sl-x-toolgroup sl-x-tool-buttons"><button type="button" onClick={() => { setEvidenceSheet(true); setActiveSheet(""); }}>Open evidence sheet <ArrowDownAZ size={15}/></button></div></>}
      {ribbonTab === "Review" && <><div className="sl-x-toolgroup"><b>Review status</b><small>Developer and reviewer fields accept preset values or custom text.</small></div><div className="sl-x-toolgroup"><button type="button" onClick={() => setShowIncomplete((value) => !value)}><Filter size={15}/>{showIncomplete ? "Show all rows" : "Show incomplete"}</button></div></>}
      {ribbonTab === "View" && <><div className="sl-x-toolgroup"><label><input type="checkbox" checked={freezeColumns} onChange={(event) => setFreezeColumns(event.target.checked)}/> Freeze first columns</label></div><div className="sl-x-toolgroup"><button type="button" onClick={() => setPreview((value) => !value)}><Eye size={15}/>{preview ? "Return to editing" : "Read-only preview"}</button></div><div className="sl-x-toolgroup"><button type="button" onClick={() => setSortAlpha((value) => !value)}><ArrowDownAZ size={15}/>{sortAlpha ? "Original order" : "Sort A to Z"}</button></div></>}
      <div className="sl-x-progress"><span>{completion}/{total} rows started</span><div><i style={{ width: `${progress}%` }}/></div></div>
    </section>

    <div className="sl-x-formula-row"><div className="sl-x-name-box">{activeCellName}<ChevronDown size={12}/></div><span className="sl-x-formula-mark">fx</span><input aria-label="Selected cell value" value={activeCellValue || (selectedCell?.description || "")} readOnly placeholder="Select a checklist cell to see its value"/></div>

    <section className="sl-x-meta" aria-label="Checklist details"><label>Checklist title<input value={title} onChange={(event) => changeTitle(event.target.value)} maxLength={140}/></label><label>Project context <textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="Optional context for AI field guidance; avoid credentials or personal data." maxLength={1200}/></label></section>

    <div className="sl-x-toolbar"><div className="sl-x-sheet-summary"><span className="sl-x-section-count">{filteredRows.length} rows</span><span className="sl-x-summary-divider"/><label className="sl-x-category-filter"><Filter size={14}/><select aria-label="Filter category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All categories</option>{categoryChoices.map((category) => <option key={category}>{category}</option>)}</select></label><select className="sl-x-status-filter" aria-label="Filter status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{statusChoices.map((choice) => <option key={choice}>{choice}</option>)}<option>Blank</option></select></div><label className="sl-x-search"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this sheet…"/><kbd>Ctrl+F</kbd>{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={13}/></button>}</label></div>

    <div className="sl-x-sheet-wrap"><div className="sl-x-table-scroll"><table className={`sl-x-table${freezeColumns ? " freeze-columns" : ""}`}><colgroup><col className="col-rownum"/><col className="col-category"/><col className="col-description"/><col className="col-status"/><col className="col-dev-comment"/><col className="col-review-status"/><col className="col-review-comment"/></colgroup><thead><tr className="sl-x-letters"><th/><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th><th>G</th></tr><tr className="sl-x-headings"><th className="row-number">#</th><th>Component / Category</th><th>Description</th><th>Developer Status</th><th>Developer Comments</th><th>Reviewer Status</th><th>Reviewer Comments</th></tr></thead><tbody>
      {isEvidence ? <tr><td colSpan="7" className="sl-x-empty"><FilePlus2 size={21}/><b>Choose an evidence sheet below</b><span>Attach up to five PNG or JPEG screenshots per sheet.</span></td></tr> : isPeerReview ? peerFields.map((field, index) => <tr key={field.id}><th className="row-number">{index + 2}</th><td className="sl-x-category-cell">Project details</td><td className="sl-x-description-cell"><strong>{field.label}</strong></td><td colSpan="4" className="sl-x-peer-input"><input aria-label={field.label} value={cleanValue(values[field.id])} onFocus={() => { setActiveField(field); setSelectedCell(field); }} onChange={(event) => setValue(field.id, event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} disabled={preview} placeholder={`Enter ${field.label.toLowerCase()}…`}/></td></tr>) : filteredRows.map((row, index) => {
        const developerStatus = row.statuses[0]; const reviewerStatus = row.statuses[1];
        const cells = [developerStatus, row.developer, reviewerStatus, row.reviewer].filter(Boolean);
        const val = (field) => field ? cleanValue(values[field.id]) : "";
        const onFieldKey = (field, position) => (event) => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(event.key) && (event.key !== "ArrowLeft" && event.key !== "ArrowRight" || event.currentTarget.selectionStart === 0 || event.currentTarget.selectionStart === event.currentTarget.value.length)) { event.preventDefault(); const nextRow = event.key === "ArrowUp" ? index - 1 : event.key === "ArrowDown" || event.key === "Enter" ? index + 1 : index; let nextPos = event.key === "Tab" || event.key === "ArrowRight" ? position + 1 : event.key === "ArrowLeft" ? position - 1 : position; let targetRow = nextRow; if (nextPos < 0) { targetRow -= 1; nextPos = 3; } if (nextPos > 3) { targetRow += 1; nextPos = 0; } const next = filteredRows[targetRow]; const refs = next ? [next.statuses[0], next.developer, next.statuses[1], next.reviewer].filter(Boolean) : []; if (refs[nextPos]) cellRefs.current[refs[nextPos].id]?.focus(); } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); } };
        const dropdown = (field, position, type) => field ? <DropdownEntry key={field.id} field={field} value={val(field)} onChange={setValue} onFocus={(item) => { setActiveField(item); setSelectedCell(item); setGuidance(null); }} inputRef={(element) => { cellRefs.current[field.id] = element; }} onKeyDown={onFieldKey(field, position)} preview={preview} choices={type === "status" ? [...new Set([...(field.choices || []), "Yes", "No", "In progress", "Passed", "Failed", "Needs review", "NA", "Not applicable"])] : type === "developer" ? developerSuggestions : reviewerSuggestions} placeholder={type === "status" ? "Choose / type…" : "Choose or add a comment…"}/> : <span className="sl-x-not-mapped">—</span>;
        return <tr key={`${activeSheet}-${row.rowNumber}`} className={selectedCell?.row === row.rowNumber ? "is-active-row" : ""}><th className="row-number">{row.rowNumber}</th><td className="sl-x-category-cell" onClick={() => setSelectedCell({ row: row.rowNumber, col: 2, description: row.category })}><span className="sl-x-category-pill">{row.category}</span></td><td className="sl-x-description-cell" onClick={() => { setSelectedCell({ row: row.rowNumber, col: 3, description: row.description?.description || "" }); setActiveField(row.description || null); }}><strong>{row.description?.description || row.fields.find((field) => field.label !== "Status")?.label || "Checklist item"}</strong>{row.description?.description && <button type="button" className="sl-x-guidance-inline" onClick={(event) => { event.stopPropagation(); setActiveField(row.description); setSelectedCell(row.description); requestGuidance(row.description); }}><Sparkles size={12}/> Guidance</button>}</td><td className="sl-x-edit-cell" onClick={() => setSelectedCell(developerStatus || { row: row.rowNumber, col: 4 })}>{dropdown(developerStatus, 0, "status")}</td><td className="sl-x-edit-cell sl-x-comment-cell" onClick={() => row.developer && setSelectedCell(row.developer)}>{dropdown(row.developer, 1, "developer")}</td><td className="sl-x-edit-cell" onClick={() => reviewerStatus && setSelectedCell(reviewerStatus)}>{dropdown(reviewerStatus, 2, "status")}</td><td className="sl-x-edit-cell sl-x-comment-cell" onClick={() => row.reviewer && setSelectedCell(row.reviewer)}>{dropdown(row.reviewer, 3, "reviewer")}</td></tr>;
      })}
      {!isPeerReview && !isEvidence && filteredRows.length === 0 && <tr><td colSpan="7" className="sl-x-empty"><Search size={20}/><b>No matching checklist rows</b><span>Clear the search or filters to see more rows.</span></td></tr>}
    </tbody></table></div></div>

    <nav className="sl-x-sheet-tabs" aria-label="Workbook sheets"><button type="button" className="sl-x-sheet-arrow" aria-label="Previous worksheet" onClick={() => { setEvidenceSheet(false); const index = (template.worksheets || []).indexOf(activeSheet); setActiveSheet(checklistSheets[Math.max(0, index - 1)] || checklistSheets[0] || "Peer Review"); }}><ArrowLeft size={14}/></button>{checklistSheets.map((sheet) => <button type="button" key={sheet} className={`sl-x-sheet-tab${activeSheet === sheet && !evidenceSheet ? " is-active" : ""}`} onClick={() => { setActiveSheet(sheet); setEvidenceSheet(false); }}>{sheet}</button>)}{peerFields.length > 0 && <button type="button" className={`sl-x-sheet-tab${isPeerReview && !evidenceSheet ? " is-active" : ""}`} onClick={() => { setActiveSheet("Peer Review"); setEvidenceSheet(false); }}>Project details</button>}{(template.evidenceSheets || []).length > 0 && <button type="button" className={`sl-x-sheet-tab${evidenceSheet ? " is-active" : ""}`} onClick={() => setEvidenceSheet(true)}>Evidence</button>}<button type="button" className="sl-x-sheet-arrow" aria-label="Next worksheet" onClick={() => { setEvidenceSheet(false); const index = checklistSheets.indexOf(activeSheet); setActiveSheet(checklistSheets[Math.min(checklistSheets.length - 1, index + 1)] || checklistSheets[0] || "Peer Review"); }}><ArrowDownAZ size={14}/></button></nav>

    {isEvidence && <section className="sl-x-evidence-sheet"><div className="sl-x-evidence-title"><span className="sl-x-section-label">WORKBOOK EVIDENCE</span><h2>Screenshots & supporting proof</h2><p>These images are inserted into the matching evidence worksheet when you export the Excel file. Sample screenshots from the original template are never copied.</p></div>{template.evidenceSheets.map((sheet) => <article key={sheet} className="sl-x-evidence-card"><div><b>{sheet}</b><small>PNG or JPEG · up to 2 MB each · maximum 5 per sheet</small></div><label className="sl-x-file-button">Add screenshots<input type="file" accept="image/png,image/jpeg" multiple onChange={(event) => addEvidence(sheet, event)}/></label><div className="sl-x-thumbs">{(evidence[sheet] || []).map((item, index) => <div key={`${sheet}-${index}`}><img src={`data:${item.type};base64,${item.data}`} alt={`${sheet} evidence ${index + 1}`}/><button type="button" onClick={() => { setEvidence((previous) => ({ ...previous, [sheet]: previous[sheet].filter((_, i) => i !== index) })); editRevision.current += 1; setDirty(true); setSaveLabel("Unsaved changes"); }}>Remove</button></div>)}</div></article>)}</section>}

    {helperMinimized ? <button type="button" className="sl-x-guidance-launcher" aria-label="Open LivingsAI checklist helper" onClick={() => setHelperMinimized(false)}><Sparkles size={16}/><span>LivingsAI</span></button> : <aside className="sl-x-guidance-panel" aria-label="Cell guidance"><div className="sl-x-guidance-head"><div><span>CHECKLIST HELPER</span><b>{activeReference?.label || "Selected cell"}</b></div><div className="sl-x-guidance-controls"><button type="button" title="Minimize LivingsAI" aria-label="Minimize LivingsAI" onClick={() => setHelperMinimized(true)}><ChevronDown size={16}/></button><button type="button" title="Clear selected guidance" aria-label="Clear selected guidance" onClick={() => setGuidance(null)}><X size={16}/></button></div></div>{activeReference?.description && <><span className="sl-x-guidance-tag">{activeReference.section || activeReference.category || "Checklist item"}</span><p className="sl-x-guidance-description">{activeReference.description}</p></>}{guidance?.state === "loading" && <p className="sl-x-guidance-muted">Gemini is preparing field guidance…</p>}{guidance?.state === "error" && <p className="sl-x-guidance-error">{guidance.message}</p>}{guidance?.state === "ready" && Object.entries(guidanceLabels).map(([key, label]) => guidance.data?.[key] && <div className="sl-x-guidance-entry" key={key}><b>{label}</b><p>{guidance.data[key]}</p></div>)}{!guidance && <p className="sl-x-guidance-muted">Select a field or choose Guidance on a checklist item to see help here.</p>}{activeReference && <button className="sl-x-guidance-button" type="button" onClick={() => requestGuidance(activeReference)} disabled={guidance?.state === "loading"}><Sparkles size={14}/>{guidance?.state === "loading" ? "Getting guidance…" : "Explain selected item"}</button>}</aside>}

    <footer className="sl-x-footer"><span><Cloud size={14}/>{saveLabel}</span><span>Changes save automatically · Export preserves the original workbook format</span><button type="button" onClick={() => saveNow()} disabled={saving}><Save size={14}/>{saving ? "Saving…" : "Save now"}</button><button type="button" className="sl-x-export" onClick={download}><Download size={14}/>Download .xlsx</button></footer>

    <style>{`
      .sl-check-app{--x-ink:#33261c;--x-muted:#796a59;--x-gold:#b78943;--x-line:#ddd8cf;min-height:100vh;background:#f4f2ed;color:var(--x-ink);font:13px 'DM Sans',Arial,sans-serif;padding-bottom:24px}
      .sl-x-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:15px;min-height:62px;padding:8px clamp(12px,2vw,28px);background:#fffdfa;border-bottom:1px solid #e8e3da;box-shadow:0 2px 8px #3829190c}
      .sl-x-brand{display:flex;align-items:center;gap:10px;min-width:max-content;color:inherit;text-decoration:none}.sl-x-brand-mark{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:linear-gradient(145deg,#f1dfba,#c59d55);color:#603d16;font:600 16px Georgia,serif}.sl-x-brand b{display:block;font:600 17px 'Cormorant Garamond',Georgia,serif}.sl-x-brand small{display:block;margin-top:2px;color:#997642;font-size:8px;font-weight:800;letter-spacing:.11em}.sl-x-divider{width:1px;height:32px;background:#e4ddd1}.sl-x-workbook-title{display:flex;align-items:center;gap:5px;min-width:0;color:#4c3927}.sl-x-workbook-title input{width:min(340px,30vw);min-width:100px;border:0;background:transparent;color:inherit;font-weight:700;outline:0}.sl-x-workbook-title input:focus{box-shadow:0 1px #be944b}.sl-x-save-state{display:flex;align-items:center;gap:6px;margin-left:auto;color:#6e8b68;font-size:11px;white-space:nowrap}.sl-x-save-state.is-saving{color:#9a743d}.sl-x-top-actions{display:flex;align-items:center;gap:6px}.sl-x-top-actions>button,.sl-x-mobile-save{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:0 8px;border:1px solid transparent;border-radius:7px;background:transparent;color:#654d32;cursor:pointer}.sl-x-top-actions>button:hover{background:#f5efe4}.sl-x-top-actions>button:disabled{opacity:.35;cursor:default}.sl-x-top-actions .sl-x-export,.sl-x-export{padding:0 12px;border-color:#d7c59f;background:#b3873f;color:#fff;font-weight:700}.sl-x-mobile-save{display:none}
      .sl-x-ribbon-tabs{display:flex;align-items:center;gap:4px;padding:0 22px;background:#fffdfa;border-bottom:1px solid #e5e0d7}.sl-x-ribbon-tabs>button{min-width:57px;height:37px;border:0;border-bottom:2px solid transparent;background:transparent;color:#655a4c;cursor:pointer}.sl-x-ribbon-tabs>button.is-active{border-bottom-color:#b58a42;color:#714c1e;font-weight:700}.sl-x-ribbon-spacer{flex:1}.sl-x-template-tag{color:#8e806d;font-size:10px}
      .sl-x-ribbon{display:flex;align-items:stretch;gap:0;min-height:66px;padding:7px 18px;background:#fbfaf7;border-bottom:1px solid #dcd7ce;overflow:auto}.sl-x-toolgroup{display:flex;align-items:center;gap:9px;padding:3px 14px;border-right:1px solid #e2ddd4;white-space:nowrap}.sl-x-toolgroup:first-child{padding-left:3px}.sl-x-toolgroup>b{display:inline-flex;align-items:center;gap:6px;color:#5c482d}.sl-x-toolgroup>small{display:block;color:#9a8b78;font-size:10px}.sl-x-toolgroup label{display:flex;align-items:center;gap:7px;color:#75634c;font-size:11px}.sl-x-toolgroup select{height:28px;padding:0 8px;border:1px solid #ded4c3;border-radius:5px;background:white;color:#513c25}.sl-x-tool-buttons button,.sl-x-toolgroup>button{display:inline-flex;align-items:center;gap:6px;min-height:29px;padding:0 8px;border:1px solid #e5ded2;border-radius:5px;background:#fff;color:#66533c;font-size:11px;cursor:pointer}.sl-x-tool-buttons button:disabled{opacity:.4}.sl-x-vrule{width:1px;height:26px;background:#e4ddd1}.sl-x-progress{display:grid;align-content:center;gap:6px;min-width:130px;margin-left:auto;padding:0 5px;color:#79674e;font-size:10px}.sl-x-progress>div{height:5px;overflow:hidden;border-radius:9px;background:#e9e2d7}.sl-x-progress i{display:block;height:100%;border-radius:inherit;background:#ad8240;transition:width .25s}
      .sl-x-formula-row{display:flex;align-items:center;gap:10px;height:38px;padding:4px 18px;background:#fffdfa;border-bottom:1px solid #ddd8cf}.sl-x-name-box{display:flex;align-items:center;justify-content:space-between;gap:18px;width:88px;height:26px;padding:0 8px;border:1px solid #d9d4cb;border-radius:4px;color:#635641;font-size:11px}.sl-x-formula-mark{font:italic 15px Georgia,serif;color:#87785f}.sl-x-formula-row input{flex:1;min-width:0;height:27px;padding:0 8px;border:1px solid #dedbd4;border-radius:4px;color:#514331;font-size:11px}
      .sl-x-meta{display:grid;grid-template-columns:minmax(210px,.65fr) minmax(360px,1.35fr);gap:12px;padding:12px clamp(12px,2vw,24px);background:#f4f2ed;border-bottom:1px solid #e0dbd2}.sl-x-meta label{display:grid;gap:5px;color:#82715a;font-size:10px;font-weight:700;letter-spacing:.04em}.sl-x-meta input,.sl-x-meta textarea{width:100%;height:31px;padding:6px 9px;border:1px solid #dcd5c9;border-radius:5px;background:#fffefa;color:#423326;font:12px 'DM Sans',Arial,sans-serif;letter-spacing:normal}.sl-x-meta textarea{resize:vertical;min-height:31px;max-height:80px}
      .sl-x-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:45px;padding:6px clamp(12px,2vw,22px);background:#f9f8f5}.sl-x-sheet-summary{display:flex;align-items:center;gap:11px;color:#766955;font-size:10px}.sl-x-section-count{font-weight:700}.sl-x-summary-divider{height:20px;width:1px;background:#ddd4c4}.sl-x-category-filter{display:flex;align-items:center;gap:5px}.sl-x-category-filter select,.sl-x-status-filter{max-width:180px;height:29px;padding:0 7px;border:1px solid #dfd8cc;border-radius:5px;background:#fffdfa;color:#665740;font-size:10px}.sl-x-search{display:flex;align-items:center;gap:7px;width:min(340px,42vw);height:31px;padding:0 8px;border:1px solid #ddd8ce;border-radius:6px;background:white;color:#897d6c}.sl-x-search input{flex:1;min-width:0;border:0;outline:0;color:#43372a;font-size:11px}.sl-x-search kbd{padding:2px 4px;border:1px solid #e3ded5;border-radius:3px;color:#968a78;font-size:9px}.sl-x-search button{display:grid;place-items:center;border:0;background:transparent;color:#877961;cursor:pointer}
      .sl-x-sheet-wrap{padding:0 clamp(8px,1.4vw,20px)}.sl-x-table-scroll{max-height:calc(100vh - 405px);min-height:300px;overflow:auto;border:1px solid #d9d5cd;background:#fff}.sl-x-table{width:100%;min-width:1250px;border-collapse:separate;border-spacing:0;table-layout:fixed;font-size:11px}.sl-x-table .col-rownum{width:42px}.sl-x-table .col-category{width:180px}.sl-x-table .col-description{width:min(38vw,470px)}.sl-x-table .col-status{width:146px}.sl-x-table .col-dev-comment{width:245px}.sl-x-table .col-review-status{width:146px}.sl-x-table .col-review-comment{width:245px}.sl-x-table th,.sl-x-table td{height:39px;padding:0 8px;border-right:1px solid #e1ded8;border-bottom:1px solid #e1ded8;text-align:left;vertical-align:middle}.sl-x-table thead{position:sticky;top:0;z-index:12}.sl-x-table thead th{position:sticky;background:#f5f3ee}.sl-x-table .sl-x-letters th{height:23px;background:#efede8;color:#7b725f;text-align:center;font-size:10px;font-weight:600}.sl-x-table .sl-x-headings th{height:38px;background:#f5d37b;color:#392a16;font-size:10px;font-weight:800;white-space:nowrap}.sl-x-table .sl-x-headings .row-number,.sl-x-table .sl-x-letters th:first-child{background:#ece9e2}.sl-x-table .row-number{width:42px;background:#f5f3ee;color:#847a69;text-align:center;font-weight:500}.sl-x-table tbody tr:hover td,.sl-x-table tbody tr:hover th{background-color:#fffaf0}.sl-x-table tbody tr.is-active-row td{background-color:#fffaf0}.sl-x-table .sl-x-category-cell{background:#fbfaf7;color:#604b30;font-weight:700}.sl-x-category-pill{display:inline-block;max-width:100%;overflow:hidden;padding:4px 7px;border:1px solid #e8dec9;border-radius:5px;background:#f9f2e5;text-overflow:ellipsis;white-space:nowrap;font-size:10px}.sl-x-description-cell{position:relative;white-space:normal;line-height:1.4}.sl-x-description-cell>strong{font-weight:550}.sl-x-guidance-inline{display:inline-flex;align-items:center;gap:4px;margin-left:7px;padding:3px 5px;border:0;border-radius:4px;background:#f5f0e7;color:#96703a;font-size:9px;cursor:pointer;opacity:.5}.sl-x-description-cell:hover .sl-x-guidance-inline,.sl-x-guidance-inline:focus-visible{opacity:1}.sl-x-table.freeze-columns tbody .sl-x-category-cell,.sl-x-table.freeze-columns tbody .sl-x-description-cell{position:sticky;z-index:3}.sl-x-table.freeze-columns tbody .sl-x-category-cell{left:42px}.sl-x-table.freeze-columns tbody .sl-x-description-cell{left:222px;background:#fff}.sl-x-table.freeze-columns tbody tr:hover .sl-x-description-cell,.sl-x-table.freeze-columns tbody tr.is-active-row .sl-x-description-cell{background:#fffaf0}.sl-x-table.freeze-columns thead .sl-x-letters th:nth-child(2),.sl-x-table.freeze-columns thead .sl-x-letters th:nth-child(3),.sl-x-table.freeze-columns thead .sl-x-headings th:nth-child(2),.sl-x-table.freeze-columns thead .sl-x-headings th:nth-child(3){position:sticky;z-index:15}.sl-x-table.freeze-columns thead .sl-x-letters th:nth-child(2),.sl-x-table.freeze-columns thead .sl-x-headings th:nth-child(2){left:42px}.sl-x-table.freeze-columns thead .sl-x-letters th:nth-child(3),.sl-x-table.freeze-columns thead .sl-x-headings th:nth-child(3){left:222px}
      .sl-x-edit-cell{position:relative;padding:0!important}.sl-x-cell-input{width:100%;height:38px;padding:0 24px 0 9px;border:2px solid transparent;outline:0;background:transparent;color:#3d3529;font:11px 'DM Sans',Arial,sans-serif;text-overflow:ellipsis}.sl-x-cell-input:hover{background:#fffcf5}.sl-x-cell-input:focus{position:relative;z-index:5;border-color:#b48635;background:#fffdfa;box-shadow:inset 0 0 0 1px #fff}.sl-x-cell-input::placeholder{color:#b5ac9f}.sl-x-cell-input[list]::-webkit-calendar-picker-indicator{display:none!important}.sl-x-cell-chevron{position:absolute;right:7px;top:13px;color:#9e8b6c;pointer-events:none}.sl-x-comment-cell .sl-x-cell-input{padding-right:8px}.sl-x-comment-cell .sl-xcell-chevron{opacity:.5}.sl-x-cell-readonly{display:block;overflow:hidden;padding:0 9px;color:#53432f;text-overflow:ellipsis;white-space:nowrap}.sl-x-cell-readonly em,.sl-x-not-mapped{color:#aaa194;font-style:italic}.sl-x-not-mapped{display:block;padding:0 9px}.sl-x-empty{height:180px!important;text-align:center!important;color:#98866b!important}.sl-x-empty svg,.sl-x-empty b,.sl-x-empty span{display:block;margin:0 auto 7px}.sl-x-empty b{color:#57442d}
      .sl-x-peer-input input{width:100%;height:30px;padding:0 9px;border:1px solid #e1d9cc;border-radius:4px;outline-color:#bd9148;background:#fff;color:#4c3b27}.sl-x-sheet-tabs{position:sticky;bottom:0;z-index:16;display:flex;align-items:stretch;gap:3px;min-height:39px;padding:5px 12px 0;background:#eeece6;border-top:1px solid #d8d4cb;overflow:auto}.sl-x-sheet-tab{position:relative;min-width:max-content;padding:0 15px;border:1px solid #d8d4cb;border-bottom:0;border-radius:7px 7px 0 0;background:#f7f6f2;color:#6d5a3d;font-size:10px;cursor:pointer}.sl-x-sheet-tab.is-active{background:#fffdfa;color:#865f24;font-weight:800}.sl-x-sheet-tab.is-active:before{content:"";position:absolute;top:-1px;left:0;right:0;height:3px;background:#b78943;border-radius:7px 7px 0 0}.sl-x-sheet-arrow{display:grid;place-items:center;width:27px;border:0;background:transparent;color:#84765f;cursor:pointer}
      .sl-x-evidence-sheet{max-width:1080px;margin:22px auto;padding:0 18px}.sl-x-evidence-title{margin-bottom:15px}.sl-x-section-label{color:#a17a3e;font-size:9px;font-weight:800;letter-spacing:.12em}.sl-x-evidence-title h2{margin:6px 0;font:500 27px 'Cormorant Garamond',Georgia,serif}.sl-x-evidence-title p{max-width:750px;color:#857865;font-size:11px;line-height:1.6}.sl-x-evidence-card{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin:10px 0;padding:15px;border:1px solid #e1d8c9;border-radius:10px;background:#fffdfa}.sl-x-evidence-card>div:first-child{display:grid;gap:4px}.sl-x-evidence-card small{color:#94846d;font-size:10px}.sl-x-file-button{position:relative;display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:0 12px;border:1px solid #c7ae7b;border-radius:5px;background:#fbf4e7;color:#765729;font-size:10px;font-weight:700;cursor:pointer}.sl-x-file-button input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.sl-x-thumbs{grid-column:1/-1;display:flex;gap:12px;flex-wrap:wrap}.sl-x-thumbs>div{display:grid;gap:5px}.sl-x-thumbs img{width:135px;height:94px;object-fit:cover;border-radius:6px;border:1px solid #e2d8c7}.sl-x-thumbs button{border:0;background:transparent;color:#925a45;text-align:left;font-size:10px;cursor:pointer}
      .sl-x-guidance-panel{position:fixed;right:18px;bottom:60px;z-index:25;width:min(330px,calc(100vw - 36px));max-height:min(60vh,540px);overflow:auto;padding:14px;border:1px solid #e5d8c2;border-radius:12px;background:#fffdfa;box-shadow:0 16px 48px #2b1c1021}.sl-x-guidance-head{display:flex;justify-content:space-between;gap:10px}.sl-x-guidance-head>div{display:grid;gap:5px}.sl-x-guidance-head span{color:#9d783f;font-size:8px;font-weight:800;letter-spacing:.14em}.sl-x-guidance-head b{font-size:13px}.sl-x-guidance-head button{align-self:start;display:grid;place-items:center;width:25px;height:25px;border:0;border-radius:5px;background:#f4f0e9;color:#7e6a4f;cursor:pointer}.sl-x-guidance-tag{display:inline-block;margin-top:10px;padding:4px 7px;border-radius:4px;background:#f4eddf;color:#8e6832;font-size:9px;font-weight:700}.sl-x-guidance-description,.sl-x-guidance-muted,.sl-x-guidance-error{color:#796b58;font-size:11px;line-height:1.55}.sl-x-guidance-entry{padding-top:8px;border-top:1px solid #eee6d8}.sl-x-guidance-entry b{font-size:10px;color:#59442b}.sl-x-guidance-entry p{margin:4px 0 0;color:#776b5b;font-size:10px;line-height:1.5}.sl-x-guidance-error{color:#9b503c}.sl-x-guidance-button{display:flex;align-items:center;gap:6px;margin-top:8px;padding:8px 10px;border:0;border-radius:6px;background:#315443;color:white;font-size:10px;cursor:pointer}.sl-x-guidance-button:disabled{opacity:.6}.sl-x-footer{position:fixed;left:0;right:0;bottom:0;z-index:20;display:flex;align-items:center;gap:10px;min-height:43px;padding:5px 16px;background:#fffdfa;border-top:1px solid #e3ded5;color:#827663;font-size:9px}.sl-x-footer>span:first-child{display:flex;align-items:center;gap:5px;color:#698264}.sl-x-footer>span:nth-child(2){margin-right:auto}.sl-x-footer button{display:inline-flex;align-items:center;gap:6px;min-height:29px;padding:0 9px;border:1px solid #ded5c6;border-radius:5px;background:#fff;color:#66543a;font-size:10px;cursor:pointer}.sl-x-footer button.sl-x-export{border-color:#b3873f;background:#b3873f;color:white}
      .sl-check-loading,.sl-check-error{max-width:700px;margin:80px auto;padding:20px;color:#59462e}.sl-check-error{border:1px solid #ecd3c2;border-radius:9px;background:#fff8f3}.sl-check-app button:focus-visible,.sl-check-app a:focus-visible,.sl-check-app select:focus-visible{outline:2px solid #b78943;outline-offset:2px}
      @media(max-width:900px){.sl-x-topbar{gap:9px}.sl-x-workbook-title input{width:min(240px,25vw)}.sl-x-ribbon{padding-inline:10px}.sl-x-toolgroup{padding-inline:9px}.sl-x-table-scroll{max-height:calc(100vh - 425px)}.sl-x-meta{grid-template-columns:1fr 1.4fr}}
      @media(max-width:640px){.sl-check-app{padding-bottom:75px}.sl-x-topbar{position:relative;flex-wrap:wrap;min-height:58px;padding:8px 11px}.sl-x-brand b{font-size:15px}.sl-x-brand-mark{width:30px;height:30px}.sl-x-divider{display:none}.sl-x-workbook-title{flex:1;order:2;width:100%;padding:3px 0}.sl-x-workbook-title input{width:100%;font-size:12px}.sl-x-save-state{margin-left:auto;font-size:9px}.sl-x-top-actions{gap:2px}.sl-x-top-actions>button{min-height:30px;padding-inline:6px}.sl-x-top-actions>button:not(.sl-x-export):not(.sl-x-mobile-save){display:none}.sl-x-top-actions .sl-x-mobile-save{display:inline-flex}.sl-x-top-actions .sl-x-export{font-size:0;gap:0;width:34px;padding:0}.sl-x-top-actions .sl-x-export svg{width:15px}.sl-x-ribbon-tabs{padding-inline:9px}.sl-x-ribbon-tabs>button{height:34px;min-width:53px}.sl-x-template-tag{max-width:42vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:8px}.sl-x-ribbon{min-height:58px;padding:5px 8px}.sl-x-toolgroup{padding-inline:8px}.sl-x-toolgroup>small{max-width:100px;white-space:normal;font-size:8px}.sl-x-toolgroup label{font-size:9px}.sl-x-toolgroup select{max-width:110px}.sl-x-progress{min-width:78px;font-size:8px}.sl-x-progress>div{width:75px}.sl-x-formula-row{padding-inline:8px}.sl-x-name-box{width:65px;gap:8px}.sl-x-meta{grid-template-columns:1fr;padding:8px;gap:7px}.sl-x-meta label{font-size:9px}.sl-x-meta input,.sl-x-meta textarea{font-size:11px}.sl-x-toolbar{align-items:stretch;flex-direction:column;padding:8px;gap:7px}.sl-x-sheet-summary{justify-content:space-between}.sl-x-category-filter select,.sl-x-status-filter{max-width:45vw;font-size:9px}.sl-x-search{width:100%}.sl-x-search kbd{display:none}.sl-x-sheet-wrap{padding:0 5px}.sl-x-table-scroll{max-height:calc(100vh - 420px);min-height:260px}.sl-x-table{min-width:1120px}.sl-x-table .col-rownum{width:35px}.sl-x-table .col-category{width:145px}.sl-x-table .col-description{width:270px}.sl-x-table .col-status,.sl-x-table .col-review-status{width:130px}.sl-x-table .col-dev-comment,.sl-x-table .col-review-comment{width:210px}.sl-x-table th,.sl-x-table td{height:42px;padding-inline:6px}.sl-x-table .sl-x-headings th{font-size:9px}.sl-x-table.freeze-columns tbody .sl-x-category-cell,.sl-x-table.freeze-columns thead .sl-x-letters th:nth-child(2),.sl-x-table.freeze-columns thead .sl-x-headings th:nth-child(2){left:35px}.sl-x-table.freeze-columns tbody .sl-x-description-cell,.sl-x-table.freeze-columns thead .sl-x-letters th:nth-child(3),.sl-x-table.freeze-columns thead .sl-x-headings th:nth-child(3){left:180px}.sl-x-sheet-tabs{position:relative;bottom:auto;padding-inline:6px}.sl-x-sheet-tab{padding-inline:10px;font-size:9px}.sl-x-guidance-panel{right:9px;bottom:65px;width:min(300px,calc(100vw - 18px));max-height:43vh;padding:11px}.sl-x-footer{position:relative;flex-wrap:wrap;padding:8px;min-height:0}.sl-x-footer>span:nth-child(2){display:none}.sl-x-footer button{flex:1;justify-content:center}.sl-x-footer button.sl-x-export{font-size:10px;width:auto}.sl-x-evidence-sheet{padding-inline:9px}.sl-x-evidence-card{grid-template-columns:1fr}.sl-x-file-button{justify-self:start}}
      .sl-x-table .sl-x-letters th{top:0}.sl-x-table .sl-x-headings th{top:23px}.sl-x-cell-control{position:relative;display:flex;align-items:center;width:100%;height:38px}.sl-x-cell-select{flex:1;min-width:0;width:100%;height:38px;padding:0 22px 0 8px;border:2px solid transparent;outline:0;appearance:none;background:transparent;color:#3d3529;font:11px 'DM Sans',Arial,sans-serif;text-overflow:ellipsis;cursor:pointer}.sl-x-cell-select:hover{background:#fffcf5}.sl-x-cell-select:focus{position:relative;z-index:5;border-color:#b48635;background:#fffdfa}.sl-x-cell-control.is-custom .sl-x-cell-select{flex:0 0 43%;width:43%;padding-right:20px;font-size:10px}.sl-x-cell-control.is-custom .sl-x-cell-chevron{right:calc(57% + 2px)}.sl-x-custom-input{flex:1;min-width:0;width:50%;height:29px;margin-right:4px;padding:0 5px;border:1px solid #c9b078;border-radius:3px;outline:0;background:#fffaf0;color:#3d3529;font:10px 'DM Sans',Arial,sans-serif}.sl-x-custom-input:focus{border-color:#a97726;box-shadow:0 0 0 2px #be963433}.sl-x-sheet-tabs{bottom:43px}
      @media(prefers-reduced-motion:reduce){.sl-x-progress i{transition:none}}
    `}</style>
    <style>{`
      .sl-x-guidance-controls{display:flex;gap:4px}
      .sl-x-guidance-controls button{align-self:start;display:grid;place-items:center;width:25px;height:25px;border:0;border-radius:5px;background:#f4f0e9;color:#7e6a4f;cursor:pointer}
      .sl-x-guidance-controls button:hover{background:#eee5d6;color:#59442b}
      .sl-x-guidance-launcher{position:fixed;right:18px;bottom:60px;z-index:26;display:flex;align-items:center;gap:7px;min-height:42px;padding:0 14px;border:1px solid #d4bc8d;border-radius:22px;background:linear-gradient(135deg,#315443,#203d32);box-shadow:0 8px 24px #203d3238;color:#fff;font:700 12px 'DM Sans',Arial,sans-serif;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease}
      .sl-x-guidance-launcher svg{color:#edcf8d}
      .sl-x-guidance-launcher:hover{transform:translateY(-2px);box-shadow:0 11px 27px #203d3248}
      @media(max-width:640px){.sl-x-guidance-launcher{right:9px;bottom:65px;min-height:40px;padding:0 12px}}
      @media(prefers-reduced-motion:reduce){.sl-x-guidance-launcher{transition:none}}
    `}</style>
  </main>;
}
