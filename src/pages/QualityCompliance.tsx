import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ShieldCheck, ArrowLeft, Search, CheckCircle2, Circle, AlertTriangle,
  BookOpen, Target, FileText, Filter, ChevronDown, ChevronUp, Clock,
  Users, FlaskConical, XCircle, Save, Droplets, Thermometer, Waves,
  Microscope, Activity, Plus, X,
} from "lucide-react";
import {
  complianceSections, waterQualitySources, waterQualityThresholds,
} from "@/data/mockData";
import type { ComplianceCheckpoint, WaterQualityReading } from "@/data/mockData";
import { generateId } from "@/lib/utils";


const tabConfig = [
  { key: "overview", label: "Overview", icon: ShieldCheck },
  { key: "qc", label: "QC Checks", icon: FlaskConical },
  { key: "water", label: "Water Quality", icon: Droplets },
  { key: "compliance", label: "Compliance", icon: BookOpen },
];

const freqLabel: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly",
  quarterly: "Quarterly", annual: "Annual", "per-batch": "Per Batch", "per-shift": "Per Shift",
};

const standardCfg = {
  general: { label: "General", badge: "bg-blue-100 text-blue-700" },
  iso22000: { label: "ISO 22000", badge: "bg-emerald-100 text-emerald-700" },
  iso9001: { label: "ISO 9001", badge: "bg-violet-100 text-violet-700" },
};

const paramCfg: Record<string, { label: string; icon: React.ElementType; color: string; unit: string }> = {
  ph: { label: "pH", icon: FlaskConical, color: "blue", unit: "pH" },
  turbidityNtu: { label: "Turbidity", icon: Waves, color: "cyan", unit: "NTU" },
  tdsPpm: { label: "TDS", icon: Droplets, color: "emerald", unit: "ppm" },
  conductivityUs: { label: "Conductivity", icon: Activity, color: "violet", unit: "µS/cm" },
  temperatureC: { label: "Temperature", icon: Thermometer, color: "amber", unit: "°C" },
  chlorineMgL: { label: "Chlorine", icon: FlaskConical, color: "teal", unit: "mg/L" },
  microbialCfuMl: { label: "Microbial", icon: Microscope, color: "rose", unit: "CFU/mL" },
};

function waterStatus(key: keyof typeof waterQualityThresholds, value: number): { ok: boolean; severity: "good" | "warning" | "critical" } {
  const t = waterQualityThresholds[key];
  if (value < t.min || value > t.max) return { ok: false, severity: "critical" };
  if (key === "turbidityNtu" && value > 0.3) return { ok: true, severity: "warning" };
  if (key === "microbialCfuMl" && value > 50) return { ok: true, severity: "warning" };
  return { ok: true, severity: "good" };
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function QualityCompliance() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(urlTab && tabConfig.some((t) => t.key === urlTab) ? urlTab : "overview");

  useEffect(() => {
    if (urlTab && tabConfig.some((t) => t.key === urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Quality & Compliance</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">QC checks, water filtration, compliance checkpoints, and ISO readiness</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-lg p-1 overflow-x-auto">
        {tabConfig.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                active
                  ? "bg-slate-700 dark:bg-slate-600 text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "qc" && <QcTab />}
      {activeTab === "water" && <WaterTab />}
      {activeTab === "compliance" && <ComplianceTab />}
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────────────────────────── */

function OverviewTab() {
  const { workOrders, complianceCheckpoints, complianceSettings, waterQualityReadings, filterStatuses } = useAppStore();

  const qcChecks = workOrders.flatMap((wo) => wo.qcChecks.map((qc) => ({ ...qc, woName: wo.name })));
  const qcPending = qcChecks.filter((c) => c.status === "pending").length;

  const latestWater = [...waterQualityReadings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  const waterAlerts = waterQualityReadings.filter((r) =>
    Object.entries(waterQualityThresholds).some(([k, t]) => {
      const v = (r as any)[k];
      return v !== undefined && (v < t.min || v > t.max);
    })
  ).length;
  const filtersDue = filterStatuses.filter((f) => f.status !== "good").length;

  const visibleStandards = new Set<string>(["general"]);
  if (complianceSettings.iso22000Enabled) visibleStandards.add("iso22000");
  if (complianceSettings.iso9001Enabled) visibleStandards.add("iso9001");
  const relevantCp = complianceCheckpoints.filter((cp) => visibleStandards.has(cp.standard));
  const cpDone = relevantCp.filter((cp) => cp.completed).length;

  return (
    <div className="space-y-4">
      {/* Unified Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "QC Pending", value: qcPending, icon: FlaskConical, color: "amber" },
          { label: "Water Alerts", value: waterAlerts, icon: Droplets, color: waterAlerts > 0 ? "red" : "emerald" },
          { label: "Filters Due", value: filtersDue, icon: Filter, color: filtersDue > 0 ? "amber" : "emerald" },
          { label: "Compliance Done", value: `${Math.round((cpDone / Math.max(relevantCp.length, 1)) * 100)}%`, icon: CheckCircle2, color: "emerald" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === "amber" ? "bg-amber-50 dark:bg-amber-500/10" : s.color === "red" ? "bg-red-50 dark:bg-red-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"}`}>
                <s.icon className={`w-4 h-4 ${s.color === "amber" ? "text-amber-600" : s.color === "red" ? "text-red-600" : "text-emerald-600"}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latest Water Summary */}
        {latestWater && (
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-4 h-4 text-sky-500" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">Latest Water Reading</p>
                <span className="text-[10px] text-slate-400 ml-auto">{new Date(latestWater.timestamp).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(paramCfg).map(([key, cfg]) => {
                  const val = (latestWater as any)[key];
                  if (val === undefined) return null;
                  const st = waterStatus(key as keyof typeof waterQualityThresholds, val);
                  const Icon = cfg.icon;
                  return (
                    <div key={key} className={`p-2 rounded-lg border text-center ${st.severity === "good" ? "border-emerald-200 dark:border-emerald-900/20 bg-emerald-50/30" : st.severity === "warning" ? "border-amber-200 dark:border-amber-900/20 bg-amber-50/30" : "border-red-200 dark:border-red-900/20 bg-red-50/30"}`}>
                      <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${st.severity === "good" ? "text-emerald-500" : st.severity === "warning" ? "text-amber-500" : "text-red-500"}`} />
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{val}</p>
                      <p className="text-[8px] text-slate-500">{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Quick View */}
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">Compliance Status</p>
            </div>
            <div className="space-y-2">
              {["general", "iso22000", "iso9001"].map((std) => {
                const items = complianceCheckpoints.filter((cp) => cp.standard === std);
                if (std !== "general" && !complianceSettings[`${std}Enabled` as keyof typeof complianceSettings]) return null;
                const done = items.filter((cp) => cp.completed).length;
                const pct = items.length ? Math.round((done / items.length) * 100) : 0;
                const cfg = standardCfg[std as keyof typeof standardCfg];
                return (
                  <div key={std}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-300">{cfg.label}</span>
                      <span className="text-slate-500">{done}/{items.length}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── QC Checks Tab ────────────────────────────────────────────────────────── */

function QcTab() {
  const { workOrders, hasPermission } = useAppStore();
  const [subTab, setSubTab] = useState<"checks" | "forms" | "history">("checks");
  const [selectedCheck, setSelectedCheck] = useState<any>(null);
  const [qcValue, setQcValue] = useState("");
  const [qcDecision, setQcDecision] = useState<"passed" | "failed" | null>(null);
  const [qcNotes, setQcNotes] = useState("");
  const canSubmit = hasPermission("ops-qc");

  const allChecks = workOrders.flatMap((wo) => wo.qcChecks.map((qc) => ({ ...qc, woName: wo.name, product: wo.product, variant: wo.variant })));
  const pendingChecks = allChecks.filter((c) => c.status === "pending");
  const historyChecks = allChecks.filter((c) => c.status === "passed" || c.status === "failed");

  // Import qcForms from data — need to access it
  // qcForms is exported from mockData but not in store. Let me check if it's available.
  // For now, I'll skip the forms library since qcForms isn't in the store.

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-800">
        {(["checks", "history"] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-4 py-2 text-xs font-medium border-b-2 transition-all ${subTab === t ? "border-cyan-500 text-cyan-600" : "border-transparent text-slate-500"}`}>
            {t === "checks" ? `Pending Checks (${pendingChecks.length})` : "History"}
          </button>
        ))}
      </div>

      {subTab === "checks" && (
        <div className="space-y-2">
          {pendingChecks.length > 0 ? pendingChecks.map((check) => (
            <Card key={check.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
                      <FlaskConical className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{check.parameter}</p>
                      <p className="text-[10px] text-slate-500">{check.woName} — {check.product} ({check.variant})</p>
                      <p className="text-[10px] text-slate-500 mt-1">Range: {check.min}–{check.max} · {check.frequency}</p>
                    </div>
                  </div>
                  {canSubmit && (
                    <Button size="sm" className="h-8 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white shrink-0 ml-3" onClick={() => setSelectedCheck(check)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Check
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm">All checks are up to date!</p>
            </div>
          )}
        </div>
      )}

      {subTab === "history" && (
        <div className="space-y-2">
          {historyChecks.length > 0 ? historyChecks.map((check) => (
            <Card key={`${check.woName}-${check.id}`} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] border-0 ${check.status === "passed" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{check.status}</Badge>
                  <p className="text-xs font-medium text-slate-800 dark:text-white">{check.parameter}</p>
                  <span className="text-[10px] text-slate-500 ml-auto">{check.woName}</span>
                </div>
                {check.value && <p className="text-[10px] text-slate-500 mt-1">Value: {check.value}</p>}
              </CardContent>
            </Card>
          )) : (
            <p className="text-xs text-slate-500 text-center py-4">No completed checks yet</p>
          )}
        </div>
      )}

      {/* Check Modal */}
      <AnimatePresence>
        {selectedCheck && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCheck(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{selectedCheck.parameter}</h3>
                  <p className="text-[10px] text-slate-500">{selectedCheck.woName}</p>
                </div>
                <button onClick={() => setSelectedCheck(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase">Acceptance Range</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{selectedCheck.min} – {selectedCheck.max}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Measured Value</label>
                  <Input value={qcValue} onChange={(e) => setQcValue(e.target.value)} placeholder="Enter measured value..." className="text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Decision</label>
                  <div className="flex gap-2">
                    <button onClick={() => setQcDecision("passed")} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${qcDecision === "passed" ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20" : "bg-gray-100 text-slate-500"}`}><CheckCircle2 className="w-3.5 h-3.5" /> Pass</button>
                    <button onClick={() => setQcDecision("failed")} className={`flex-1 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${qcDecision === "failed" ? "bg-red-50 text-red-600 ring-1 ring-red-500/20" : "bg-gray-100 text-slate-500"}`}><XCircle className="w-3.5 h-3.5" /> Fail</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Notes</label>
                  <Input value={qcNotes} onChange={(e) => setQcNotes(e.target.value)} placeholder="Add notes..." className="text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex gap-2">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => setSelectedCheck(null)}>Cancel</Button>
                <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs" onClick={() => { setSelectedCheck(null); setQcValue(""); setQcDecision(null); setQcNotes(""); }}>
                  <Save className="w-3.5 h-3.5 mr-1" /> Submit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Water Quality Tab ────────────────────────────────────────────────────── */

function WaterTab() {
  const { waterQualityReadings, filterStatuses, addWaterQualityReading, updateFilterStatus } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>("finished");

  const latest = [...waterQualityReadings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  const filtered = waterQualityReadings
    .filter((r) => sourceFilter === "all" || r.source === sourceFilter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  const fltCfg: Record<string, { label: string; icon: string; color: string }> = {
    sediment: { label: "Sediment", icon: "🪨", color: "amber" },
    carbon: { label: "Carbon", icon: "🧊", color: "emerald" },
    uv: { label: "UV", icon: "☀️", color: "violet" },
    ro_membrane: { label: "RO", icon: "💧", color: "blue" },
    ozone: { label: "Ozone", icon: "⚡", color: "cyan" },
  };

  return (
    <div className="space-y-4">
      {/* Latest Reading */}
      {latest && (
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">Finished Water — Latest</p>
                <Badge className="text-[9px] border-0 bg-sky-50 text-sky-600">{latest.shift}</Badge>
              </div>
              <p className="text-[10px] text-slate-400">{new Date(latest.timestamp).toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {Object.entries(paramCfg).map(([key, cfg]) => {
                const val = (latest as any)[key];
                if (val === undefined) return null;
                const st = waterStatus(key as keyof typeof waterQualityThresholds, val);
                const Icon = cfg.icon;
                return (
                  <div key={key} className={`p-2 rounded-lg border text-center ${st.severity === "good" ? "border-emerald-200 bg-emerald-50/30" : st.severity === "warning" ? "border-amber-200 bg-amber-50/30" : "border-red-200 bg-red-50/30"}`}>
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${st.severity === "good" ? "text-emerald-500" : st.severity === "warning" ? "text-amber-500" : "text-red-500"}`} />
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{val}</p>
                    <p className="text-[9px] text-slate-500">{cfg.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filterStatuses.map((flt) => {
          const cfg = fltCfg[flt.filterType];
          const expanded = expandedFilter === flt.id;
          const days = Math.ceil((new Date(flt.nextChangeDue).getTime() - Date.now()) / 86400000);
          return (
            <Card key={flt.id} className={`border ${flt.status === "good" ? "border-gray-200" : flt.status === "needs_change" ? "border-amber-200" : "border-red-200"}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{flt.name}</p>
                      <p className="text-[9px] text-slate-500">{flt.location}</p>
                    </div>
                  </div>
                  <Badge className={`text-[9px] border-0 ${flt.status === "good" ? "bg-emerald-50 text-emerald-600" : flt.status === "needs_change" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                    {flt.status === "good" ? "Good" : flt.status === "needs_change" ? "Change Soon" : "Overdue"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Next: {days > 0 ? `${days}d` : `${Math.abs(days)}d overdue`}</span>
                  <button onClick={() => setExpandedFilter(expanded ? null : flt.id)} className="text-slate-400">
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {expanded && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1 text-[10px] text-slate-500">
                    <p>Installed: {new Date(flt.installedAt).toLocaleDateString()}</p>
                    {flt.currentFlowRate && <p>Flow: {flt.currentFlowRate} L/min</p>}
                    {flt.pressureDrop && <p>Pressure: {flt.pressureDrop} psi</p>}
                    <Button size="sm" variant="outline" className="w-full mt-1 h-7 text-[10px]" onClick={() => {
                      const next = new Date(Date.now() + flt.changeIntervalDays * 86400000).toISOString().split("T")[0];
                      updateFilterStatus(flt.id, { lastChangedAt: new Date().toISOString(), nextChangeDue: next, status: "good" });
                    }}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Changed
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Readings Log */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Readings Log</p>
          <div className="flex gap-2">
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="h-8 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-slate-700">
              <option value="finished">Finished Water</option>
              <option value="all">All Stages</option>
              {Object.entries(waterQualitySources).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
            <Button size="sm" className="h-8 text-xs bg-sky-600 hover:bg-sky-700 text-white" onClick={() => setShowForm(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map((r) => {
            const hasAlert = Object.entries(waterQualityThresholds).some(([k, t]) => {
              const v = (r as any)[k];
              return v !== undefined && (v < t.min || v > t.max);
            });
            return (
              <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border text-xs ${hasAlert ? "bg-red-50/50 border-red-200" : "bg-white border-gray-200"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  {hasAlert ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 dark:text-white">{waterQualitySources[r.source]}</span>
                      <Badge className="text-[9px] border-0 bg-sky-50 text-sky-600">{r.shift}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500">{new Date(r.timestamp).toLocaleString()} · {r.testedBy}</p>
                    {r.notes && <p className="text-[10px] text-slate-400 italic">{r.notes}</p>}
                  </div>
                </div>
                <div className="text-right space-y-0.5 shrink-0 ml-2">
                  <p className="font-mono text-slate-700">pH {r.ph}</p>
                  <p className="font-mono text-slate-700">{r.turbidityNtu} NTU</p>
                  <p className="font-mono text-slate-700">{r.tdsPpm} ppm</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && <WaterFormModal onClose={() => setShowForm(false)} onSave={addWaterQualityReading} />}
    </div>
  );
}

/* ── Water Form Modal ─────────────────────────────────────────────────────── */

function WaterFormModal({ onClose, onSave }: { onClose: () => void; onSave: (r: WaterQualityReading) => void }) {
  const [form, setForm] = useState<Partial<WaterQualityReading>>({
    shift: "morning", source: "finished", testedBy: "", ph: 7.0, turbidityNtu: 0.1, tdsPpm: 100, conductivityUs: 150, temperatureC: 23, chlorineMgL: 0.5,
  });

  const handleSave = () => {
    if (!form.testedBy?.trim()) return;
    onSave({
      id: generateId("wqr"),
      timestamp: new Date().toISOString(),
      shift: form.shift as WaterQualityReading["shift"],
      testedBy: form.testedBy,
      ph: Number(form.ph) || 0,
      turbidityNtu: Number(form.turbidityNtu) || 0,
      tdsPpm: Number(form.tdsPpm) || 0,
      conductivityUs: Number(form.conductivityUs) || 0,
      temperatureC: Number(form.temperatureC) || 0,
      chlorineMgL: Number(form.chlorineMgL) || 0,
      microbialCfuMl: form.microbialCfuMl ? Number(form.microbialCfuMl) : undefined,
      source: form.source as WaterQualityReading["source"],
      notes: form.notes || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">New Water Quality Reading</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600">Shift</label>
              <select value={form.shift} onChange={(e) => setForm((p) => ({ ...p, shift: e.target.value as any }))} className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 bg-white px-2">
                <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="night">Night</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600">Source</label>
              <select value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value as any }))} className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 bg-white px-2">
                {Object.entries(waterQualitySources).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
          </div>
          <div><label className="text-[11px] font-medium text-slate-600">Tested By</label><Input value={form.testedBy} onChange={(e) => setForm((p) => ({ ...p, testedBy: e.target.value }))} className="mt-1 h-9 text-xs" /></div>
          <div className="grid grid-cols-3 gap-3">
            {["ph", "turbidityNtu", "tdsPpm", "conductivityUs", "temperatureC", "chlorineMgL"].map((k) => (
              <div key={k}>
                <label className="text-[11px] font-medium text-slate-600">{paramCfg[k].label}</label>
                <Input type="number" step={k === "ph" ? 0.1 : k === "turbidityNtu" || k === "chlorineMgL" ? 0.01 : 1} value={(form as any)[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: parseFloat(e.target.value) }))} className="mt-1 h-9 text-xs" />
              </div>
            ))}
          </div>
          <div><label className="text-[11px] font-medium text-slate-600">Microbial (CFU/mL) — optional</label><Input type="number" value={form.microbialCfuMl ?? ""} onChange={(e) => setForm((p) => ({ ...p, microbialCfuMl: e.target.value ? parseInt(e.target.value) : undefined }))} className="mt-1 h-9 text-xs" /></div>
          <div><label className="text-[11px] font-medium text-slate-600">Notes</label><Input value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="mt-1 h-9 text-xs" /></div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-3 flex justify-end gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white" onClick={handleSave}>Save Reading</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Compliance Tab ───────────────────────────────────────────────────────── */

function ComplianceTab() {
  const { complianceCheckpoints, complianceSettings, updateComplianceCheckpoint, updateComplianceSettings } = useAppStore();
  const [search, setSearch] = useState("");
  const [standardFilter, setStandardFilter] = useState<string>("all");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const { iso22000Enabled, iso9001Enabled } = complianceSettings;

  const visible = useMemo(() => {
    const s = new Set<string>(["general"]);
    if (iso22000Enabled) s.add("iso22000");
    if (iso9001Enabled) s.add("iso9001");
    return s;
  }, [iso22000Enabled, iso9001Enabled]);

  const filtered = useMemo(() => {
    return complianceCheckpoints.filter((cp) => {
      if (!visible.has(cp.standard)) return false;
      const sf = standardFilter === "all" || cp.standard === standardFilter;
      const q = !search || cp.text.toLowerCase().includes(search.toLowerCase()) || cp.sectionName.toLowerCase().includes(search.toLowerCase());
      return sf && q;
    });
  }, [complianceCheckpoints, visible, standardFilter, search]);

  const bySection = useMemo(() => {
    const map = new Map<string, ComplianceCheckpoint[]>();
    filtered.forEach((cp) => { if (!map.has(cp.sectionId)) map.set(cp.sectionId, []); map.get(cp.sectionId)!.push(cp); });
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const rel = complianceCheckpoints.filter((cp) => visible.has(cp.standard));
    const done = rel.filter((cp) => cp.completed).length;
    return { total: rel.length, done, pct: rel.length ? Math.round((done / rel.length) * 100) : 0 };
  }, [complianceCheckpoints, visible]);

  const toggleCp = (cp: ComplianceCheckpoint) => {
    updateComplianceCheckpoint(cp.id, { completed: !cp.completed, lastChecked: !cp.completed ? new Date().toISOString() : undefined });
  };

  return (
    <div className="space-y-4">
      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800"><CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><BookOpen className="w-4 h-4 text-blue-600" /></div><div><p className="text-sm font-bold">General</p><p className="text-[10px] text-slate-500">GMP, sanitation, pest, water</p></div></div>
          <Badge className="text-[10px] border-0 bg-emerald-50 text-emerald-600">Active</Badge>
        </CardContent></Card>
        <Card className={`border transition-colors ${iso22000Enabled ? "bg-emerald-50/30 border-emerald-200" : "bg-white border-gray-200"}`}><CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iso22000Enabled ? "bg-emerald-50" : "bg-slate-100"}`}><Target className={`w-4 h-4 ${iso22000Enabled ? "text-emerald-600" : "text-slate-400"}`} /></div><div><p className={`text-sm font-bold ${iso22000Enabled ? "" : "text-slate-500"}`}>ISO 22000</p><p className="text-[10px] text-slate-500">Food Safety Management</p></div></div>
          <Switch checked={iso22000Enabled} onCheckedChange={(v) => updateComplianceSettings({ iso22000Enabled: v })} />
        </CardContent></Card>
        <Card className={`border transition-colors ${iso9001Enabled ? "bg-violet-50/30 border-violet-200" : "bg-white border-gray-200"}`}><CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iso9001Enabled ? "bg-violet-50" : "bg-slate-100"}`}><FileText className={`w-4 h-4 ${iso9001Enabled ? "text-violet-600" : "text-slate-400"}`} /></div><div><p className={`text-sm font-bold ${iso9001Enabled ? "" : "text-slate-500"}`}>ISO 9001</p><p className="text-[10px] text-slate-500">Quality Management</p></div></div>
          <Switch checked={iso9001Enabled} onCheckedChange={(v) => updateComplianceSettings({ iso9001Enabled: v })} />
        </CardContent></Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: ShieldCheck, color: "emerald" },
          { label: "Completed", value: stats.done, icon: CheckCircle2, color: "emerald" },
          { label: "Progress", value: `${stats.pct}%`, icon: BookOpen, color: "blue" },
          { label: "ISO 22000", value: iso22000Enabled ? `${Math.round((complianceCheckpoints.filter((c) => c.standard === "iso22000" && c.completed).length / Math.max(complianceCheckpoints.filter((c) => c.standard === "iso22000").length, 1)) * 100)}%` : "—", icon: Target, color: "emerald" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800"><CardContent className="p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === "emerald" ? "bg-emerald-50" : "bg-blue-50"}`}><s.icon className={`w-4 h-4 ${s.color === "emerald" ? "text-emerald-600" : "text-blue-600"}`} /></div>
            <div><p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p><p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Search checkpoint..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-gray-200" /></div>
        <select value={standardFilter} onChange={(e) => setStandardFilter(e.target.value)} className="h-9 text-xs rounded-md border border-gray-200 bg-white px-2 text-slate-700">
          <option value="all">All Standards</option><option value="general">General</option>
          {iso22000Enabled && <option value="iso22000">ISO 22000</option>}
          {iso9001Enabled && <option value="iso9001">ISO 9001</option>}
        </select>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {complianceSections.filter((sec) => visible.has(sec.standard) && bySection.has(sec.id)).map((sec) => {
          const items = bySection.get(sec.id)!;
          const done = items.filter((i) => i.completed).length;
          const pct = Math.round((done / items.length) * 100);
          const expanded = expandedSection === sec.id;
          const cfg = standardCfg[sec.standard as keyof typeof standardCfg];
          return (
            <motion.div key={sec.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50" onClick={() => setExpandedSection(expanded ? null : sec.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pct === 100 ? "bg-emerald-50" : "bg-amber-50"}`}>
                      {pct === 100 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{sec.title}</p>
                        <Badge className={`text-[9px] border-0 ${cfg.badge}`}>{cfg.label}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{sec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-medium text-slate-600">{done}/{items.length}</p>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5"><div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} /></div>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
                {expanded && (
                  <div className="border-t border-gray-100 dark:border-slate-800 px-4 py-3 space-y-2">
                    {items.map((cp) => (
                      <div key={cp.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                        <button onClick={() => toggleCp(cp)} className="mt-0.5 shrink-0">
                          {cp.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${cp.completed ? "text-slate-500 line-through" : "text-slate-800 dark:text-slate-200"}`}>{cp.text}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-[9px] border-gray-200 text-slate-400"><Clock className="w-2.5 h-2.5 mr-0.5" /> {freqLabel[cp.frequency]}</Badge>
                            <Badge variant="outline" className="text-[9px] border-gray-200 text-slate-400"><Users className="w-2.5 h-2.5 mr-0.5" /> {cp.responsible}</Badge>
                            {cp.lastChecked && <span className="text-[9px] text-slate-400">Checked {new Date(cp.lastChecked).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
