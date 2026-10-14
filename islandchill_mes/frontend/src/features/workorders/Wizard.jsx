import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../stores/session";
import { call } from "../../lib/api/client";

const STEPS = ["Product", "BOM", "Line & Schedule", "Review"];

export function Wizard() {
  const navigate = useNavigate();
  const bootstrap = useSession((s) => s.bootstrap);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState("");
  const [uom, setUom] = useState("");
  const [fillingLine, setFillingLine] = useState("");
  const [plannedStart, setPlannedStart] = useState("");

  const families = bootstrap?.product_families || [];
  const lines = bootstrap?.filling_lines || [];

  async function createWO() {
    if (!selectedVariant || !qty || !fillingLine) {
      setError("Please fill all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await call("work_order.create", {
        item: selectedVariant.item,
        qty: parseFloat(qty),
        uom: uom || "Nos",
        filling_line: fillingLine,
        planned_start: plannedStart || undefined,
      });
      navigate(`/workorders/${result.work_order}`);
    } catch (e) {
      setError(e.message || "Failed to create work order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="app-header">
        <button onClick={() => navigate("/")}>&larr; Back</button>
        <h2>New Work Order</h2>
      </header>

      <div className="wizard">
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={`step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{s}</span>
            </div>
          ))}
        </div>

        {step === 0 && (
          <section className="wizard-step">
            <h3>Select Product Family</h3>
            <div className="product-grid">
              {families.map((fam) => (
                <div
                  key={fam.name}
                  className={`product-card ${selectedFamily?.name === fam.name ? "selected" : ""}`}
                  onClick={() => { setSelectedFamily(fam); setSelectedVariant(null); }}
                >
                  {fam.image && <img src={fam.image} alt={fam.family_name} />}
                  <span>{fam.family_name}</span>
                </div>
              ))}
            </div>

            {selectedFamily && (
              <>
                <h4>Select Variant</h4>
                <div className="variant-grid">
                  {selectedFamily.variants?.map((v) => (
                    <div
                      key={v.variant_label}
                      className={`variant-card ${selectedVariant?.variant_label === v.variant_label ? "selected" : ""}`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v.image && <img src={v.image} alt={v.variant_label} />}
                      <span>{v.variant_label}</span>
                      <small>{v.pack_config}</small>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="wizard-step">
            <h3>Quantity & UOM</h3>
            <label>Quantity</label>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
            <label>UOM</label>
            <input value={uom} onChange={(e) => setUom(e.target.value)} placeholder="Nos" />
          </section>
        )}

        {step === 2 && (
          <section className="wizard-step">
            <h3>Line & Schedule</h3>
            <label>Filling Line</label>
            <select value={fillingLine} onChange={(e) => setFillingLine(e.target.value)}>
              <option value="">Select…</option>
              {lines.map((l) => (
                <option key={l.name} value={l.name}>{l.line_name}</option>
              ))}
            </select>
            <label>Planned Start (optional)</label>
            <input type="datetime-local" value={plannedStart} onChange={(e) => setPlannedStart(e.target.value)} />
          </section>
        )}

        {step === 3 && (
          <section className="wizard-step">
            <h3>Review</h3>
            <div className="review-summary">
              <p><strong>Product:</strong> {selectedFamily?.family_name} — {selectedVariant?.variant_label}</p>
              <p><strong>Item:</strong> {selectedVariant?.item}</p>
              <p><strong>Quantity:</strong> {qty} {uom || "Nos"}</p>
              <p><strong>Line:</strong> {lines.find((l) => l.name === fillingLine)?.line_name}</p>
              {plannedStart && <p><strong>Start:</strong> {plannedStart}</p>}
            </div>
            {error && <p className="error">{error}</p>}
            <button className="btn-primary" onClick={createWO} disabled={loading}>
              {loading ? "Creating…" : "Create Work Order"}
            </button>
          </section>
        )}

        <div className="wizard-nav">
          {step > 0 && <button onClick={() => setStep((s) => s - 1)}>Back</button>}
          {step < STEPS.length - 1 && (
            <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
