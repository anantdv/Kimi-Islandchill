import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, Clock, CheckCircle2,
  Search, XCircle, Camera,
  ClipboardCheck, ImagePlus, Save,
  ShieldCheck, Eye, AlertOctagon, Edit2,
} from "lucide-react";
import type { Incident, IncidentInvestigation } from "@/data/mockData";
import { investigationChecklistTemplate, rootCauseCategories } from "@/data/mockData";

const severityColors: Record<string, string> = {
  critical: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400",
  high: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  medium: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  low: "bg-gray-50 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

const statusColors: Record<string, string> = {
  open: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30",
  acknowledged: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
  resolved: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
  pending: "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
};

export default function Incidents() {
  const navigate = useNavigate();
  const { incidents, investigations, addInvestigation, updateInvestigation, updateIncident, user, hasPermission } = useAppStore();
  const canInvestigate = hasPermission("ops-incidents-investigate");
  const [filter, setFilter] = useState<"all" | "open" | "acknowledged" | "resolved" | "pending">("all");
  const [search, setSearch] = useState("");
  const [investigating, setInvestigating] = useState<Incident | null>(null);
  const [viewingInv, setViewingInv] = useState<IncidentInvestigation | null>(null);

  const [chkItems, setChkItems] = useState<{ id: string; step: string; checked: boolean; notes: string }[]>([]);
  const [rootCauseCat, setRootCauseCat] = useState("");
  const [rootCauseDetail, setRootCauseDetail] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [resStatus, setResStatus] = useState<"resolved" | "pending">("pending");
  const [pendingReason, setPendingReason] = useState("");

  const filtered = incidents.filter((inc: Incident) => {
    const matchesFilter = filter === "all" || inc.status === filter;
    const matchesSearch =
      search.trim() === "" ||
      inc.description.toLowerCase().includes(search.toLowerCase()) ||
      inc.type.toLowerCase().includes(search.toLowerCase()) ||
      inc.line.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const startInvestigation = (inc: Incident) => {
    setInvestigating(inc);
    const existing = investigations.find((inv: IncidentInvestigation) => inv.incidentId === inc.id);
    if (existing) {
      setChkItems(existing.checklist.map((c) => ({ id: c.id, step: c.step, checked: c.checked, notes: c.notes || "" })));
      setRootCauseCat(existing.rootCauseCategory);
      setRootCauseDetail(existing.rootCauseDetail);
      setActionTaken(existing.actionTaken);
      setPhotos([...existing.photos]);
      setResStatus(existing.resolutionStatus);
      setPendingReason(existing.pendingReason || "");
    } else {
      setChkItems(investigationChecklistTemplate.map((c) => ({ id: c.id, step: c.step, checked: false, notes: "" })));
      setRootCauseCat("");
      setRootCauseDetail("");
      setActionTaken("");
      setPhotos([]);
      setResStatus("pending");
      setPendingReason("");
    }
  };

  const toggleChk = (id: string) => {
    setChkItems((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)));
  };

  const updateChkNotes = (id: string, notes: string) => {
    setChkItems((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
  };

  const addPhoto = () => setPhotos((prev) => [...prev, `photo-${Date.now()}`]);
  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const saveInvestigation = () => {
    if (!investigating) return;
    const now = new Date().toISOString();
    const existing = investigations.find((inv: IncidentInvestigation) => inv.incidentId === investigating.id);
    const payload: IncidentInvestigation = {
      id: existing?.id || `inv-${Date.now()}`,
      incidentId: investigating.id,
      incidentTitle: investigating.type,
      checklist: chkItems.map((c) => ({
        id: c.id, step: c.step, checked: c.checked,
        checkedAt: c.checked ? now : undefined,
        checkedBy: c.checked ? (user?.name || "System") : undefined,
        notes: c.notes || undefined,
      })),
      rootCauseCategory: rootCauseCat,
      rootCauseDetail: rootCauseDetail,
      actionTaken: actionTaken,
      photos: photos,
      resolutionStatus: resStatus,
      pendingReason: resStatus === "pending" ? pendingReason : undefined,
      investigatedBy: user?.name || "System",
      investigatedAt: now,
    };
    if (existing) updateInvestigation(existing.id, payload);
    else addInvestigation(payload);

    updateIncident(investigating.id, {
      status: resStatus === "resolved" ? "resolved" : "pending",
      resolvedAt: resStatus === "resolved" ? now : undefined,
    });
    setInvestigating(null);
  };

  const checkedCount = chkItems.filter((c) => c.checked).length;
  const progress = chkItems.length > 0 ? Math.round((checkedCount / chkItems.length) * 100) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Incidents</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Investigation, root cause analysis & resolution tracking</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", val: incidents.length, color: "text-slate-800 dark:text-white" },
          { label: "Open", val: incidents.filter((i) => i.status === "open").length, color: "text-red-600 dark:text-red-400" },
          { label: "Acknowledged", val: incidents.filter((i) => i.status === "acknowledged").length, color: "text-amber-600 dark:text-amber-400" },
          { label: "Pending", val: incidents.filter((i) => i.status === "pending").length, color: "text-purple-600 dark:text-purple-400" },
          { label: "Resolved", val: incidents.filter((i) => i.status === "resolved").length, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 cursor-pointer" onClick={() => setFilter(s.label.toLowerCase() as any)}>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-300" />
          <Input
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "open", "acknowledged", "pending", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Incident Cards */}
      <div className="space-y-2">
        {filtered.map((inc: Incident) => {
          const inv = investigations.find((i: IncidentInvestigation) => i.incidentId === inc.id);
          const hasInvestigation = !!inv;
          return (
            <motion.div key={inc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        inc.severity === "critical" ? "bg-red-50 dark:bg-red-500/15" :
                        inc.severity === "high" ? "bg-amber-50 dark:bg-amber-500/15" :
                        inc.severity === "medium" ? "bg-blue-50 dark:bg-blue-500/15" : "bg-gray-50 dark:bg-slate-800"
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${
                          inc.severity === "critical" ? "text-red-600 dark:text-red-400" :
                          inc.severity === "high" ? "text-amber-600 dark:text-amber-400" :
                          inc.severity === "medium" ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{inc.type}</p>
                          <Badge className={`text-[10px] border-0 ${severityColors[inc.severity] || ""}`}>{inc.severity}</Badge>
                          <Badge className={`text-[10px] border ${statusColors[inc.status] || ""}`}>{inc.status}</Badge>
                          {hasInvestigation && (
                            <Badge className={`text-[10px] border-0 ${inv?.resolutionStatus === "resolved"
                              ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            }`}>
                              {inv?.resolutionStatus === "resolved" ? "Investigation: Resolved" : "Investigation: Pending"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{inc.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {inc.raisedAt}</span>
                          <span>{inc.line}</span>
                          {inc.downtime ? <span className="text-amber-600 dark:text-amber-400">{inc.downtime} min downtime</span> : null}
                          {inc.wastageQty ? <span className="text-red-600 dark:text-red-400">{inc.wastageQty} units rejected</span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {hasInvestigation && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 dark:text-slate-400" onClick={() => setViewingInv(inv!)}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                      )}
                      {canInvestigate && (
                        <Button size="sm" className="h-8 text-xs bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => startInvestigation(inc)}>
                          {hasInvestigation ? <><Edit2 className="w-3 h-3 mr-1" /> Edit</> : <><ClipboardCheck className="w-3 h-3 mr-1" /> Investigate</>}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── INVESTIGATION MODAL ── */}
      <AnimatePresence>
        {investigating && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setInvestigating(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-white">Incident Investigation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{investigating.type} — {investigating.line} — {investigating.raisedAt}</p>
                </div>
                <button onClick={() => setInvestigating(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"><XCircle className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Investigation Checklist</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{checkedCount}/{chkItems.length}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-1">
                  {chkItems.map((item) => (
                    <div key={item.id} className={`p-2.5 rounded-lg border transition-colors ${
                      item.checked
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/30"
                        : "bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-800"
                    }`}>
                      <div className="flex items-start gap-2">
                        <button onClick={() => toggleChk(item.id)} className="mt-0.5 shrink-0">
                          {item.checked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-slate-600" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${item.checked ? "text-emerald-700 dark:text-emerald-400 line-through" : "text-slate-700 dark:text-slate-300"}`}>
                            {item.step}
                          </p>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => updateChkNotes(item.id, e.target.value)}
                            placeholder="Notes (optional)..."
                            className="mt-1 w-full text-[11px] bg-transparent border-0 border-b border-gray-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-0 px-0 py-0.5 text-slate-600 dark:text-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Root Cause */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-500" /> Root Cause Analysis
                  </h4>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
                    <select
                      value={rootCauseCat}
                      onChange={(e) => setRootCauseCat(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">Select root cause category...</option>
                      {rootCauseCategories.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 block">Detailed Root Cause</label>
                    <textarea
                      value={rootCauseDetail}
                      onChange={(e) => setRootCauseDetail(e.target.value)}
                      placeholder="Describe the root cause in detail..."
                      rows={3}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                    />
                  </div>
                </div>

                {/* Action Taken */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" /> Corrective Action Taken
                  </h4>
                  <textarea
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="Describe the corrective actions taken..."
                    rows={3}
                    className="w-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                  />
                </div>

                {/* Photos */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-cyan-500" /> Photos ({photos.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {photos.map((_, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center relative group">
                        <Camera className="w-6 h-6 text-gray-400 dark:text-slate-500" />
                        <button onClick={() => removePhoto(idx)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                          <XCircle className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-slate-400">IMG{idx + 1}</span>
                      </div>
                    ))}
                    <button onClick={addPhoto} className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors">
                      <ImagePlus className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px]">Add</span>
                    </button>
                  </div>
                </div>

                {/* Resolution */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resolution Decision
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResStatus("resolved")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                        resStatus === "resolved"
                          ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Resolved
                    </button>
                    <button
                      onClick={() => setResStatus("pending")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                        resStatus === "pending"
                          ? "bg-purple-50 dark:bg-purple-500/15 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-400"
                          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> Pending
                    </button>
                  </div>
                  {resStatus === "pending" && (
                    <textarea
                      value={pendingReason}
                      onChange={(e) => setPendingReason(e.target.value)}
                      placeholder="Reason for pending status — what is blocking resolution?"
                      rows={2}
                      className="w-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    />
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 text-xs" onClick={() => setInvestigating(null)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs" onClick={saveInvestigation}>
                  <Save className="w-3.5 h-3.5 mr-1" /> Save Investigation
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIEW INVESTIGATION MODAL ── */}
      <AnimatePresence>
        {viewingInv && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setViewingInv(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    viewingInv.resolutionStatus === "resolved" ? "bg-emerald-50 dark:bg-emerald-500/15" : "bg-purple-50 dark:bg-purple-500/15"
                  }`}>
                    {viewingInv.resolutionStatus === "resolved" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{viewingInv.incidentTitle}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Investigated by {viewingInv.investigatedBy} — {new Date(viewingInv.investigatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => setViewingInv(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"><XCircle className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Checklist summary */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Investigation Checklist</h4>
                  <div className="space-y-1">
                    {viewingInv.checklist.map((c) => (
                      <div key={c.id} className={`flex items-start gap-2 p-2 rounded-lg ${
                        c.checked ? "bg-emerald-50 dark:bg-emerald-500/5" : "bg-gray-50 dark:bg-slate-800/30"
                      }`}>
                        {c.checked ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> : <div className="w-3.5 h-3.5 rounded border-2 border-gray-300 dark:border-slate-600 shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <p className={`text-[11px] ${c.checked ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}>{c.step}</p>
                          {c.notes && <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5 italic">{c.notes}</p>}
                          {c.checkedBy && <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{c.checkedBy} — {new Date(c.checkedAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Root cause */}
                <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-900/20 rounded-lg p-3">
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-medium uppercase tracking-wider mb-1">Root Cause — {viewingInv.rootCauseCategory}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{viewingInv.rootCauseDetail}</p>
                </div>

                {/* Action taken */}
                <div className="bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-200 dark:border-cyan-900/20 rounded-lg p-3">
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium uppercase tracking-wider mb-1">Corrective Action Taken</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{viewingInv.actionTaken}</p>
                </div>

                {/* Photos */}
                {viewingInv.photos.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Evidence Photos ({viewingInv.photos.length})</h4>
                    <div className="flex gap-2">
                      {viewingInv.photos.map((_, idx) => (
                        <div key={idx} className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-gray-400 dark:text-slate-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution */}
                <div className={`border rounded-lg p-3 ${
                  viewingInv.resolutionStatus === "resolved"
                    ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/20"
                    : "bg-purple-50 dark:bg-purple-500/5 border-purple-200 dark:border-purple-900/20"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {viewingInv.resolutionStatus === "resolved" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-purple-500" />
                    )}
                    <p className={`text-xs font-semibold ${
                      viewingInv.resolutionStatus === "resolved" ? "text-emerald-700 dark:text-emerald-400" : "text-purple-700 dark:text-purple-400"
                    }`}>
                      {viewingInv.resolutionStatus === "resolved" ? "Resolved" : "Pending — Action Required"}
                    </p>
                  </div>
                  {viewingInv.resolutionStatus === "pending" && viewingInv.pendingReason && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">{viewingInv.pendingReason}</p>
                  )}
                  {viewingInv.reviewedBy && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Reviewed by {viewingInv.reviewedBy} — {new Date(viewingInv.reviewedAt!).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-slate-800">
                <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs" onClick={() => setViewingInv(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
