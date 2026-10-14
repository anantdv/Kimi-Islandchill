import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { call } from "../../lib/api/client";

export function Execution() {
  const { woId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["wo-state", woId],
    queryFn: () => call("work_order.get_state", { work_order: woId }, { get: true }),
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="page"><p>Loading…</p></div>;

  const wo = data?.work_order || {};
  const jobCards = data?.job_cards || [];
  const incidents = data?.incidents || [];
  const qcDue = data?.qc_due || [];

  return (
    <div className="page">
      <header className="app-header">
        <button onClick={() => navigate("/")}>&larr; Back</button>
        <h2>WO {woId}</h2>
      </header>

      <div className="wo-header">
        <div className="wo-meta">
          <span className={`status-badge ${wo.status?.toLowerCase()}`}>{wo.status}</span>
          <span>{wo.item}</span>
          <span>{wo.produced_qty}/{wo.qty} produced</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((wo.produced_qty || 0) / (wo.qty || 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="tabs">
        {["overview", "job-cards", "qc", "incidents"].map((t) => (
          <button
            key={t}
            className={activeTab === t ? "active" : ""}
            onClick={() => setActiveTab(t)}
          >
            {t.replace("-", " ").toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <section className="tab-content">
          <div className="card">
            <h4>Checklists</h4>
            {(data?.checklists || []).length === 0 && <p>No checklists</p>}
            {(data?.checklists || []).map((c) => (
              <div key={c.name} className="list-row">
                <span>{c.equipment}</span>
                <span className={`badge ${c.status?.toLowerCase()}`}>{c.status}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h4>Stock Entries</h4>
            {(data?.stock_entries || []).length === 0 && <p>No stock entries</p>}
            {(data?.stock_entries || []).map((s) => (
              <div key={s.name} className="list-row">
                <span>{s.purpose}</span>
                <span>{s.docstatus === 1 ? "Submitted" : "Draft"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "job-cards" && (
        <section className="tab-content">
          {jobCards.map((jc) => (
            <div key={jc.name} className="card job-card">
              <div className="jc-header">
                <strong>{jc.operation}</strong>
                <span className={`status-badge ${jc.status?.toLowerCase()}`}>{jc.status}</span>
              </div>
              <p>Qty: {jc.total_completed_qty}/{jc.for_quantity}</p>
            </div>
          ))}
        </section>
      )}

      {activeTab === "qc" && (
        <section className="tab-content">
          {qcDue.length === 0 && <p>No QC samples due</p>}
          {qcDue.map((q) => (
            <div key={q.name} className={`card qc-row ${q.status?.toLowerCase()}`}>
              <span>{q.parameter}</span>
              <span>{q.status}</span>
              <span>{q.due_time}</span>
            </div>
          ))}
        </section>
      )}

      {activeTab === "incidents" && (
        <section className="tab-content">
          {incidents.length === 0 && <p>No incidents</p>}
          {incidents.map((inc) => (
            <div key={inc.name} className="card incident-row">
              <span className={`severity ${inc.severity?.toLowerCase()}`}>{inc.severity}</span>
              <span>{inc.incident_type}</span>
              <span>{inc.status}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
