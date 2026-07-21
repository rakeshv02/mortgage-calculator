import { useState } from "react";

const fmt = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtD = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function calcMonthly(principal, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export default function App() {
  const [income, setIncome]       = useState("");
  const [debts, setDebts]         = useState("");
  const [down, setDown]           = useState("");
  const [rate, setRate]           = useState("");
  const [years, setYears]         = useState("30");
  const [tax, setTax]             = useState("");
  const [insurance, setInsurance] = useState("");
  const [result, setResult]       = useState(null);

  const calculate = () => {
    const monthlyIncome = parseFloat(income) / 12;
    const monthlyDebts  = parseFloat(debts) || 0;
    const downPayment   = parseFloat(down) || 0;
    const r             = parseFloat(rate);
    const y             = parseFloat(years);
    const monthlyTax    = (parseFloat(tax) || 0) / 12;
    const monthlyIns    = (parseFloat(insurance) || 0) / 12;
    if (!monthlyIncome || !r || !y) return;

    // Front-end DTI: 28% of gross monthly income for housing
    const maxHousingPayment = monthlyIncome * 0.28;
    // Back-end DTI: 36% of gross monthly income for all debt
    const maxTotalDebt = monthlyIncome * 0.36;
    const maxHousingFromBackEnd = maxTotalDebt - monthlyDebts;
    const conservativeHousing = Math.min(maxHousingPayment, maxTotalDebt - monthlyDebts);

    // Available for P&I after tax and insurance
    const availablePI = conservativeHousing - monthlyTax - monthlyIns;

    // Work backwards from monthly payment to max loan
    const rMonthly = r / 100 / 12;
    const n = y * 12;
    const maxLoan = availablePI > 0
      ? (availablePI * (Math.pow(1 + rMonthly, n) - 1)) / (rMonthly * Math.pow(1 + rMonthly, n))
      : 0;
    const maxHomePrice = maxLoan + downPayment;
    const actualMonthly = calcMonthly(maxLoan, r, y);
    const frontEndDTI = ((actualMonthly + monthlyTax + monthlyIns) / monthlyIncome) * 100;
    const backEndDTI  = ((actualMonthly + monthlyTax + monthlyIns + monthlyDebts) / monthlyIncome) * 100;

    // Scenarios
    const scenarios = [
      { label: "Conservative", pct: 0.25, color: "#22c55e" },
      { label: "Standard", pct: 0.28, color: "#6366f1" },
      { label: "Aggressive", pct: 0.36, color: "#f97316" },
    ].map(s => {
      const avail = monthlyIncome * s.pct - monthlyTax - monthlyIns;
      const loan  = avail > 0 ? (avail * (Math.pow(1 + rMonthly, n) - 1)) / (rMonthly * Math.pow(1 + rMonthly, n)) : 0;
      return { ...s, maxHome: loan + downPayment, monthly: calcMonthly(loan, r, y) };
    });

    setResult({ maxHomePrice, maxLoan, downPayment, actualMonthly, monthlyTax, monthlyIns, monthlyDebts, frontEndDTI, backEndDTI, monthlyIncome, scenarios, conservativeHousing });
  };

  const reset = () => { setIncome(""); setDebts(""); setDown(""); setRate(""); setTax(""); setInsurance(""); setResult(null); };

  const inputStyle = { width: "100%", padding: "11px 14px", fontSize: "15px", border: "1.5px solid #e5e7eb", borderRadius: "10px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fff" };
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" };

  const dtiColor = (pct) => pct <= 28 ? "#22c55e" : pct <= 36 ? "#f97316" : "#ef4444";
  const dtiLabel = (pct) => pct <= 28 ? "Excellent" : pct <= 36 ? "Acceptable" : "High Risk";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@media print { .no-print { display:none!important; } } html { scroll-behavior: smooth; }`}</style>

      {/* Header */}
      <div className="no-print" style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="https://tabutility.com" style={{ fontSize: "15px", fontWeight: "700", color: "#6366f1", textDecoration: "none" }}>⌘ Tabutility</a>
          <button onClick={() => window.print()} style={{ padding: "8px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>🖨️ Print / Save PDF</button>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontSize: "30px", fontWeight: "900", color: "#0f172a", margin: "0 0 6px" }}>Mortgage Affordability Calculator</h1>
        <p style={{ fontSize: "15px", color: "#6b7280", margin: "0 0 28px" }}>Find out how much house you can afford based on your income, debts, and down payment.</p>

        {/* Inputs */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Annual Gross Income</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>$</span>
                <input type="number" placeholder="e.g. 80000" value={income} onChange={e => setIncome(e.target.value)} style={{ ...inputStyle, paddingLeft: "26px" }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Monthly Debts</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>$</span>
                <input type="number" placeholder="Car, student loans..." value={debts} onChange={e => setDebts(e.target.value)} style={{ ...inputStyle, paddingLeft: "26px" }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Down Payment</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>$</span>
                <input type="number" placeholder="e.g. 40000" value={down} onChange={e => setDown(e.target.value)} style={{ ...inputStyle, paddingLeft: "26px" }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Interest Rate</label>
              <div style={{ position: "relative" }}>
                <input type="number" placeholder="e.g. 6.5" value={rate} onChange={e => setRate(e.target.value)} step="0.01" style={{ ...inputStyle, paddingRight: "30px" }} />
                <span style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>%</span>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Loan Term</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {["15", "20", "30"].map(y => (
                  <button key={y} onClick={() => setYears(y)} style={{ flex: 1, padding: "11px 4px", borderRadius: "10px", border: "1.5px solid", borderColor: years === y ? "#6366f1" : "#e5e7eb", background: years === y ? "#6366f1" : "#fff", color: years === y ? "#fff" : "#374151", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>{y}yr</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Annual Property Tax</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: "700" }}>$</span>
                <input type="number" placeholder="Optional" value={tax} onChange={e => setTax(e.target.value)} style={{ ...inputStyle, paddingLeft: "26px" }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={calculate} disabled={!income || !rate} style={{ flex: 1, padding: "13px", background: (!income || !rate) ? "#e5e7eb" : "#6366f1", color: (!income || !rate) ? "#9ca3af" : "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: (!income || !rate) ? "not-allowed" : "pointer" }}>
              Calculate Affordability
            </button>
            <button onClick={reset} style={{ padding: "13px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>Reset</button>
          </div>
        </div>

        {result && (
          <>
            {/* Hero result */}
            <div style={{ background: "linear-gradient(135deg, #1e1b4b, #4338ca)", borderRadius: "20px", padding: "32px 28px", marginBottom: "16px", color: "#fff" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>You Can Afford Up To</div>
              <div style={{ fontSize: "52px", fontWeight: "900", lineHeight: 1 }}>${fmt(result.maxHomePrice)}</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginTop: "8px" }}>Loan: ${fmt(result.maxLoan)} · Down: ${fmt(result.downPayment)}</div>
              <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "20px" }}>
                {[
                  { label: "Monthly Payment", value: `$${fmtD(result.actualMonthly)}` },
                  { label: "Front-End DTI", value: `${result.frontEndDTI.toFixed(1)}%` },
                  { label: "Back-End DTI", value: `${result.backEndDTI.toFixed(1)}%` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: "20px", fontWeight: "800" }}>{value}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* DTI gauges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              {[
                { label: "Front-End DTI", desc: "Housing costs vs income", value: result.frontEndDTI, max: 50 },
                { label: "Back-End DTI", desc: "All debts vs income", value: result.backEndDTI, max: 60 },
              ].map(d => (
                <div key={d.label} style={{ background: "#fff", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#374151" }}>{d.label}</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "12px" }}>{d.desc}</div>
                  <div style={{ background: "#f3f4f6", borderRadius: "6px", height: "10px", marginBottom: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (d.value / d.max) * 100)}%`, height: "100%", background: dtiColor(d.value), borderRadius: "6px", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "20px", fontWeight: "900", color: dtiColor(d.value) }}>{d.value.toFixed(1)}%</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: dtiColor(d.value), alignSelf: "center" }}>{dtiLabel(d.value)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 3 Scenarios */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>Affordability Scenarios</h2>
              <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>Based on different debt-to-income guidelines</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                {result.scenarios.map(s => (
                  <div key={s.label} style={{ borderRadius: "12px", padding: "18px", border: `2px solid ${s.label === "Standard" ? s.color : "#e5e7eb"}`, background: s.label === "Standard" ? "#f5f3ff" : "#f9fafb" }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: s.color, marginBottom: "10px" }}>{s.label} ({(s.pct * 100).toFixed(0)}% DTI)</div>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>${fmt(s.maxHome)}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>${fmtD(s.monthly)}/mo payment</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly breakdown */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "32px" }}>
              <h2 style={{ margin: "0 0 16px", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>Monthly Payment Breakdown</h2>
              {[
                { label: "Principal & Interest", value: result.actualMonthly, color: "#6366f1" },
                { label: "Property Tax", value: result.monthlyTax, color: "#f59e0b" },
                { label: "Insurance", value: result.monthlyIns, color: "#10b981" },
                { label: "Other Debts", value: result.monthlyDebts, color: "#ef4444" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: row.color }} />
                    <span style={{ fontSize: "14px", color: "#374151" }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>${fmtD(row.value)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0" }}>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>Total Monthly</span>
                <span style={{ fontSize: "18px", fontWeight: "900", color: "#6366f1" }}>${fmtD(result.actualMonthly + result.monthlyTax + result.monthlyIns + result.monthlyDebts)}</span>
              </div>
            </div>
          </>
        )}

        {/* Resources */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "32px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>🏠 Find Your Rate</h2>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>Compare live mortgage rates before you apply</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {[
              { label: "Today's Mortgage Rates", url: "https://www.bankrate.com/mortgages/mortgage-rates/", source: "Bankrate" },
              { label: "Mortgage Pre-Approval", url: "https://www.nerdwallet.com/mortgages/pre-approval", source: "NerdWallet" },
              { label: "First-Time Buyer Guide", url: "https://www.consumerfinance.gov/owning-a-home/", source: "CFPB" },
              { label: "Down Payment Assistance", url: "https://www.hud.gov/topics/buying_a_home", source: "HUD.gov" },
            ].map(r => (
              <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "14px", background: "#f9fafb", borderRadius: "10px", border: "1px solid #e5e7eb", textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#f5f3ff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f9fafb"; }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "3px" }}>{r.label}</div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.04em" }}>via {r.source} →</div>
              </a>
            ))}
          </div>
        </div>

        <div className="no-print" style={{ textAlign: "center" }}>
          <a href="https://tabutility.com" style={{ fontSize: "14px", color: "#6366f1", textDecoration: "none", fontWeight: "600" }}>← Back to all free tools</a>
        </div>
      </div>
    </div>
  );
}
