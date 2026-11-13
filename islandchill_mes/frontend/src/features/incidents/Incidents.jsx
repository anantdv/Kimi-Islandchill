import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { call } from "../../lib/api/client";

export function Incidents() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    filling_line: "",
    incident_type: "Breakdown",
    severity: "Medium",
    description: "",
  });

  const { data } = useQuery({
    queryKey: ["incidents-open"],
    queryFn: () => call("incident.list_open", {}, { get: true }),
    refetchInterval: 10000,
  });

  const raiseMutation = useMutation({
    mutationFn: (args) => call("incident.raise_incident", args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents-open"] });
      setShowNew(false);
      setForm({ filling_line: "", incident_type: "Breakdown", severity: "Medium", description: "" });
    },
  });

  const incidents = data?.incidents || [];

  return (
    <div className="page">
      <header className="app-header">
        <button onClick={() => navigate("/")}>&larr; Back</button>
        <h2>Incidents</h2>
        <button className="btn-primary" onClick={() => setShowNew(true)}>+ New</button>
      </header>

      {showNew && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Raise Incident</h3>
            <label>Filling Line</label>
            <input value={form.filling_line} onChange={(e) => setForm({ ...form, filling_line: e.target.value })} />
            <label>Type</label>
            <select value={form.incident_type} onChange={(e) => setForm({ ...form, incident_type: e.target.value })}>
              {["Breakdown", "Jam", "Parameter Deviation", "Quality Fault", "Material Shortage", "Safety", "Other"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <label>Severity</label>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              {["Critical", "High", "Medium", "Low"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="modal-actions">
              <button onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => raiseMutation.mutate(form)} disabled={raiseMutation.isPending}>
                {raiseMutation.isPending ? "Raising…" : "Raise"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="incident-list">
        {incidents.length === 0 && <p>No open incidents</p>}
        {incidents.map((inc) => (
          <div key={inc.name} className={`card incident-card ${inc.severity?.toLowerCase()}`}>
            <div className="incident-header">
              <span className={`severity-badge ${inc.severity?.toLowerCase()}`}>{inc.severity}</span>
              <span>{inc.incident_type}</span>
              <span className="time">{inc.raised_time}</span>
            </div>
            <p>{inc.description}</p>
            <div className="incident-meta">
              <span>Line: {inc.filling_line}</span>
              <span className={`status ${inc.status?.toLowerCase()}`}>{inc.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
