import { useMemo, useState } from "react";
import { ArrowRight, Calculator, Ruler, Wallet } from "lucide-react";

const inputStyle = { width: "100%", minHeight: 44, border: "1px solid #dfd2bd", borderRadius: 10, padding: "10px 12px", background: "#fffdf9", color: "#3e3028", font: "inherit" };
const panel = { background: "#fffdf9", border: "1px solid #e9dfd0", borderRadius: 16, padding: "clamp(18px,3vw,28px)" };

function ToolCard({ icon: Icon, title, description, children }) {
  return <section style={panel}><div style={{ display: "flex", gap: 11, alignItems: "center", marginBottom: 7 }}><span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 12, background: "#f4ead8", color: "#8e6a37" }}><Icon size={19} /></span><h2 style={{ margin: 0, color: "#423326", fontSize: "1.4rem" }}>{title}</h2></div><p style={{ margin: "0 0 20px", color: "#806f59", fontSize: ".82rem", lineHeight: 1.6 }}>{description}</p>{children}</section>;
}

export default function Tools() {
  const [principal, setPrincipal] = useState("500000");
  const [rate, setRate] = useState("10");
  const [years, setYears] = useState("5");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlySpend, setMonthlySpend] = useState("");
  const [unitValue, setUnitValue] = useState("1");
  const [unit, setUnit] = useState("cm");
  const result = useMemo(() => {
    const amount = Math.max(0, Number(principal) || 0); const monthlyRate = (Number(rate) || 0) / 1200; const months = Math.max(1, (Number(years) || 1) * 12);
    const emi = monthlyRate ? amount * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1) : amount / months;
    return { emi, total: emi * months, interest: emi * months - amount };
  }, [principal, rate, years]);
  const savings = (Number(monthlyIncome) || 0) - (Number(monthlySpend) || 0);
  const converted = useMemo(() => { const value = Number(unitValue) || 0; return unit === "cm" ? { cm: value, inch: value / 2.54 } : { cm: value * 2.54, inch: value }; }, [unitValue, unit]);
  const inr = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

  return <main className="sl-tools"><header><span className="section-tag">SAVITRI LIVINGS · TOOLS</span><h1>Small tools for everyday decisions.</h1><p>Useful calculators that run on your device. Values are not saved or sent to the server.</p></header>
    <div className="sl-tools-grid">
      <ToolCard icon={Calculator} title="EMI calculator" description="Estimate a monthly instalment from the principal, annual interest rate and term you enter.">
        <div className="tool-input-grid"><label>Loan amount (₹)<input type="number" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} style={inputStyle} /></label><label>Annual interest (%)<input type="number" min="0" step=".1" value={rate} onChange={(e) => setRate(e.target.value)} style={inputStyle} /></label><label>Term (years)<input type="number" min="1" max="50" value={years} onChange={(e) => setYears(e.target.value)} style={inputStyle} /></label></div>
        <div className="tool-result"><span>Estimated monthly EMI</span><strong>{inr(result.emi)}</strong><small>Total {inr(result.total)} · Interest {inr(result.interest)}</small></div>
      </ToolCard>
      <ToolCard icon={Wallet} title="Monthly budget check" description="Compare the monthly income and planned spend you enter to see the remaining amount.">
        <div className="tool-input-grid"><label>Monthly income (₹)<input type="number" min="0" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="e.g. 40000" style={inputStyle} /></label><label>Planned spend (₹)<input type="number" min="0" value={monthlySpend} onChange={(e) => setMonthlySpend(e.target.value)} placeholder="e.g. 28000" style={inputStyle} /></label></div>
        <div className="tool-result"><span>Remaining after planned spend</span><strong style={{ color: savings < 0 ? "#aa493c" : undefined }}>{inr(savings)}</strong><small>Based only on the numbers entered above.</small></div>
      </ToolCard>
      <ToolCard icon={Ruler} title="Length converter" description="Convert centimetres and inches for jewellery sizing, décor and product dimensions.">
        <div className="tool-input-grid"><label>Measurement<input type="number" min="0" step="any" value={unitValue} onChange={(e) => setUnitValue(e.target.value)} style={inputStyle} /></label><label>Entered in<select value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle}><option value="cm">Centimetres</option><option value="inch">Inches</option></select></label></div>
        <div className="tool-result"><span>Converted measurement</span><strong>{converted.cm.toFixed(2)} cm <ArrowRight size={15} /> {converted.inch.toFixed(2)} in</strong><small>1 inch = 2.54 centimetres.</small></div>
      </ToolCard>
    </div>
    <style>{`.sl-tools{min-height:calc(100vh - 120px);padding:clamp(24px,5vw,58px) clamp(16px,4vw,52px);background:#faf7f0}.sl-tools>header{max-width:1050px;margin:0 auto 25px}.sl-tools>header h1{max-width:700px;margin:8px 0;color:#3e3028;font-size:clamp(2.25rem,5vw,3.75rem);line-height:1.02}.sl-tools>header p{margin:0;color:#786b5d;font-size:.88rem;line-height:1.7}.sl-tools-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;max-width:1050px;margin:auto}.sl-tools-grid>section:first-child{grid-column:1/-1}.tool-input-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.tool-input-grid label{display:grid;gap:7px;color:#68553b;font-size:.72rem;font-weight:600}.tool-result{display:grid;gap:4px;margin-top:18px;padding:15px 16px;border-radius:12px;background:#f4ecdf;color:#715b3b}.tool-result span{font-size:.69rem}.tool-result strong{display:flex;align-items:center;gap:7px;color:#503b24;font-size:1.45rem}.tool-result small{font-size:.66rem;color:#89785f}@media(max-width:680px){.sl-tools-grid{grid-template-columns:1fr}.sl-tools-grid>section:first-child{grid-column:auto}}`}</style>
  </main>;
}
