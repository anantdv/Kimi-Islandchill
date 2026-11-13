import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Truck, ArrowLeft, Search, Plus, CheckCircle2, Clock, Package,
  X, MapPin, User, FileText, ChevronDown, ChevronUp, Send, Loader,
  Camera, Upload, Signature, AlertCircle,
} from "lucide-react";
import type { GatePass, GatePassStatus, CartonLabel } from "@/data/mockData";
import { erpApi } from "@/lib/erpApi";

const statusConfig: Record<GatePassStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800", icon: FileText },
  approved: { label: "Approved", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", icon: CheckCircle2 },
  loading: { label: "Loading", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", icon: Loader },
  dispatched: { label: "Dispatched", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", icon: Send },
  delivered: { label: "Delivered", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle2 },
};

const itemStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-slate-500" },
  picked: { label: "Picked", color: "text-amber-600" },
  loaded: { label: "Loaded", color: "text-violet-600" },
  delivered: { label: "Delivered", color: "text-emerald-600" },
};

export default function GatePass() {
  const navigate = useNavigate();
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transitionModal, setTransitionModal] = useState<{ gp: GatePass; action: "dispatch" | "deliver" } | null>(null);

  const fetchPasses = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const rows = await erpApi.listGatePasses({ status: statusParam, search: search || undefined });
      setGatePasses(Array.isArray(rows) ? (rows as GatePass[]) : []);
    } catch (e: any) {
      setError(e.message || "Failed to load gate passes");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchPasses(true), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    return gatePasses.filter((gp) => {
      const m = !search ||
        gp.passNumber.toLowerCase().includes(search.toLowerCase()) ||
        gp.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
        gp.driverName.toLowerCase().includes(search.toLowerCase()) ||
        gp.destination.toLowerCase().includes(search.toLowerCase());
      const s = statusFilter === "all" || gp.status === statusFilter;
      return m && s;
    });
  }, [gatePasses, search, statusFilter]);

  const stats = useMemo(() => ({
    total: gatePasses.length,
    draft: gatePasses.filter((g) => g.status === "draft").length,
    inTransit: gatePasses.filter((g) => g.status === "approved" || g.status === "loading" || g.status === "dispatched").length,
    delivered: gatePasses.filter((g) => g.status === "delivered").length,
  }), [gatePasses]);

  const doTransition = async (gp: GatePass, action: "approve" | "start_loading" | "dispatch" | "deliver", payload?: Record<string, any>) => {
    setActionLoading(gp.id);
    setError("");
    try {
      await erpApi.transitionGatePass(gp.id, action, payload);
      fetchPasses(true);
    } catch (e: any) {
      setError(e.message || `${action} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteDraft = async (gp: GatePass) => {
    if (!confirm("Delete this draft gate pass?")) return;
    setActionLoading(gp.id);
    setError("");
    try {
      await erpApi.deleteGatePass(gp.id);
      fetchPasses(true);
    } catch (e: any) {
      setError(e.message || "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const nextAction = (gp: GatePass): { label: string; icon: React.ElementType; action: "approve" | "start_loading" | "dispatch" | "deliver" } | null => {
    switch (gp.status) {
      case "draft": return { label: "Approve", icon: CheckCircle2, action: "approve" };
      case "approved": return { label: "Start Loading", icon: Loader, action: "start_loading" };
      case "loading": return { label: "Dispatch", icon: Send, action: "dispatch" };
      case "dispatched": return { label: "Mark Delivered", icon: CheckCircle2, action: "deliver" };
      default: return null;
    }
  };

  const handleActionClick = (gp: GatePass, action: "approve" | "start_loading" | "dispatch" | "deliver") => {
    if (action === "dispatch" || action === "deliver") {
      setTransitionModal({ gp, action });
    } else {
      doTransition(gp, action);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Gate Pass</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Vehicle dispatch control synced with ERPNext</p>
          </div>
        </div>
        <Button size="sm" className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Gate Pass
        </Button>
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Passes", value: stats.total, icon: Truck, color: "violet" },
          { label: "Draft", value: stats.draft, icon: FileText, color: "slate" },
          { label: "In Transit", value: stats.inTransit, icon: Send, color: "amber" },
          { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "emerald" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color === "violet" ? "bg-violet-50 dark:bg-violet-500/10" : s.color === "slate" ? "bg-slate-100 dark:bg-slate-800" : s.color === "amber" ? "bg-amber-50 dark:bg-amber-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"}`}>
                <s.icon className={`w-4 h-4 ${s.color === "violet" ? "text-violet-600" : s.color === "slate" ? "text-slate-500" : s.color === "amber" ? "text-amber-600" : "text-emerald-600"}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search pass no, vehicle, driver, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Status</option>
          {Object.entries(statusConfig).map(([k, c]) => (<option key={k} value={k}>{c.label}</option>))}
        </select>
      </div>

      {loading && <p className="text-sm text-slate-500 text-center py-8">Loading gate passes…</p>}

      {!loading && (
        <div className="space-y-3">
          {filtered.map((gp, i) => {
            const cfg = statusConfig[gp.status];
            const StatusIcon = cfg.icon;
            const action = nextAction(gp);
            const expanded = expandedId === gp.id;
            return (
              <motion.div key={gp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                          <Truck className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">{gp.passNumber}</p>
                            <Badge className={`text-[10px] border-0 ${cfg.bg} ${cfg.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" /> {cfg.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {gp.driverName}</span>
                            <span className="flex items-center gap-1 font-mono">{gp.vehicleNumber}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {gp.destination}</span>
                            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {gp.items.length} item{gp.items.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-slate-500" onClick={() => setExpandedId(expanded ? null : gp.id)}>
                          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Items
                        </Button>
                        {action && (
                          <Button size="sm" className="h-7 text-[10px] bg-violet-600 hover:bg-violet-700 text-white" onClick={() => handleActionClick(gp, action.action)} disabled={actionLoading === gp.id}>
                            <action.icon className={`w-3 h-3 mr-1 ${actionLoading === gp.id ? "animate-spin" : ""}`} /> {action.label}
                          </Button>
                        )}
                        {gp.status === "draft" && (
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-red-500" onClick={() => deleteDraft(gp)} disabled={actionLoading === gp.id}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Created: {new Date(gp.createdAt).toLocaleString()}</span>
                      {gp.approvedAt && <span>✓ Approved: {new Date(gp.approvedAt).toLocaleString()}</span>}
                      {gp.dispatchedAt && <span>🚚 Dispatched: {new Date(gp.dispatchedAt).toLocaleString()}</span>}
                      {gp.deliveredAt && <span>📦 Delivered: {new Date(gp.deliveredAt).toLocaleString()}</span>}
                    </div>

                    {gp.notes && <p className="text-[11px] text-slate-500 mt-2 italic">"{gp.notes}"</p>}

                    {expanded && (
                      <div className="mt-3 border-t border-gray-100 dark:border-slate-800 pt-3 space-y-2">
                        {gp.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-200">{it.product} — {it.variant}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{it.labelCode} · Batch {it.batchNumber} · Qty {it.quantity}</p>
                            </div>
                            <span className={`text-[10px] font-medium ${itemStatusConfig[it.status]?.color}`}>{itemStatusConfig[it.status]?.label}</span>
                          </div>
                        ))}
                        {gp.items.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No items on this pass.</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Truck className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No gate passes found.</p>
            </div>
          )}
        </div>
      )}

      {createOpen && <CreateGatePassModal onClose={() => setCreateOpen(false)} onCreated={() => fetchPasses()} />}
      {transitionModal && (
        <TransitionModal
          gp={transitionModal.gp}
          action={transitionModal.action}
          onClose={() => setTransitionModal(null)}
          onSubmit={(payload) => {
            doTransition(transitionModal.gp, transitionModal.action, payload);
            setTransitionModal(null);
          }}
        />
      )}
    </div>
  );
}

function CreateGatePassModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [eligible, setEligible] = useState<CartonLabel[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadingLabels, setLoadingLabels] = useState(true);
  const [form, setForm] = useState({ vehicleNumber: "", driver: "", destination: "", notes: "" });
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [labelSearch, setLabelSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    erpApi.listCartonLabels({ eligible_only: true })
      .then((data) => setEligible(Array.isArray(data) ? (data as CartonLabel[]) : []))
      .catch(() => setEligible([]))
      .finally(() => setLoadingLabels(false));

    erpApi.getDrivers()
      .then((data) => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => setDrivers([]))
      .finally(() => setLoadingDrivers(false));
  }, []);

  const filteredEligible = eligible.filter((cl) =>
    !labelSearch ||
    cl.labelCode.toLowerCase().includes(labelSearch.toLowerCase()) ||
    cl.product.toLowerCase().includes(labelSearch.toLowerCase()) ||
    cl.batchNumber.toLowerCase().includes(labelSearch.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (touched.vehicleNumber && !form.vehicleNumber.trim()) errs.vehicleNumber = "Vehicle number is required";
    if (touched.driver && !form.driver) errs.driver = "Driver is required";
    if (touched.destination && !form.destination.trim()) errs.destination = "Destination is required";
    if (touched.labels && selectedLabels.size === 0) errs.labels = "Select at least one item";
    return errs;
  }, [form, touched, selectedLabels]);

  const handleCreate = async () => {
    setTouched({ vehicleNumber: true, driver: true, destination: true, labels: true });
    setError("");
    if (!form.vehicleNumber.trim() || !form.driver || !form.destination.trim() || selectedLabels.size === 0) {
      return;
    }
    setSaving(true);
    try {
      const items = eligible
        .filter((cl) => selectedLabels.has(cl.id))
        .map((cl) => ({
          cartonLabelId: cl.id,
          labelCode: cl.labelCode,
          product: cl.product,
          variant: cl.variant,
          batchNumber: cl.batchNumber,
          quantity: cl.quantity,
        }));
      await erpApi.createGatePass({
        vehicleNumber: form.vehicleNumber.toUpperCase(),
        driver: form.driver,
        destination: form.destination,
        notes: form.notes,
        items,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to create gate pass");
    } finally {
      setSaving(false);
    }
  };

  const selectedDriverName = drivers.find((d) => d.id === form.driver)?.name || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">New Gate Pass</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Vehicle Number <span className="text-red-500">*</span></label>
              <Input
                value={form.vehicleNumber}
                onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value }))}
                onBlur={() => setTouched((p) => ({ ...p, vehicleNumber: true }))}
                placeholder="FJ123-ABC"
                className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 font-mono"
              />
              {validationErrors.vehicleNumber && <p className="text-[10px] text-red-500 mt-1">{validationErrors.vehicleNumber}</p>}
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Driver <span className="text-red-500">*</span></label>
              <select
                value={form.driver}
                onChange={(e) => setForm((p) => ({ ...p, driver: e.target.value }))}
                onBlur={() => setTouched((p) => ({ ...p, driver: true }))}
                className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white"
                disabled={loadingDrivers}
              >
                <option value="">{loadingDrivers ? "Loading drivers…" : "Select driver"}</option>
                {drivers.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
              </select>
              {validationErrors.driver && <p className="text-[10px] text-red-500 mt-1">{validationErrors.driver}</p>}
              {selectedDriverName && <p className="text-[10px] text-slate-500 mt-1">{selectedDriverName}</p>}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Destination <span className="text-red-500">*</span></label>
            <Input
              value={form.destination}
              onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
              onBlur={() => setTouched((p) => ({ ...p, destination: true }))}
              placeholder="e.g. Nadi Distribution Centre"
              className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
            />
            {validationErrors.destination && <p className="text-[10px] text-red-500 mt-1">{validationErrors.destination}</p>}
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Notes</label>
            <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Items — pick from warehouse stock ({selectedLabels.size} selected) <span className="text-red-500">*</span></label>
            <Input value={labelSearch} onChange={(e) => setLabelSearch(e.target.value)} placeholder="Search label code, product, batch..." className="mt-1 mb-2 h-8 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
              {loadingLabels && <p className="text-xs text-slate-400 text-center py-4">Loading labels…</p>}
              {!loadingLabels && filteredEligible.map((cl: CartonLabel) => (
                <label key={cl.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <input type="checkbox" checked={selectedLabels.has(cl.id)} onChange={() => toggle(cl.id)} className="accent-violet-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{cl.product} — {cl.variant}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{cl.labelCode} · {cl.batchNumber} · {cl.quantity} {cl.uom}</p>
                  </div>
                  <Badge className="text-[9px] border-0 bg-blue-50 dark:bg-blue-500/10 text-blue-600">{cl.status === "in_warehouse" ? "Warehouse" : "Produced"}</Badge>
                </label>
              ))}
              {!loadingLabels && filteredEligible.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No available stock.</p>}
            </div>
            {validationErrors.labels && <p className="text-[10px] text-red-500 mt-1">{validationErrors.labels}</p>}
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-5 py-3 flex justify-end gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs h-8 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleCreate} disabled={saving}>
            {saving ? "Creating…" : <>Create Pass ({selectedLabels.size} items)</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TransitionModal({ gp, action, onClose, onSubmit }: { gp: GatePass; action: "dispatch" | "deliver"; onClose: () => void; onSubmit: (payload: Record<string, any>) => void }) {
  const isDispatch = action === "dispatch";
  const [form, setForm] = useState({
    pickupLocation: gp.pickupLocation || "",
    pickupDatetime: gp.pickupDatetime ? gp.pickupDatetime.slice(0, 16) : new Date().toISOString().slice(0, 16),
    pickupNotes: gp.pickupNotes || "",
    deliveryLocation: gp.deliveryLocation || gp.destination || "",
    deliveryDatetime: gp.deliveryDatetime ? gp.deliveryDatetime.slice(0, 16) : new Date().toISOString().slice(0, 16),
    receiverName: gp.receiverName || "",
    deliveryNotes: gp.deliveryNotes || "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setError("");
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const res = await erpApi.uploadFile(file, { folder: "Gate Pass", isPrivate: false });
        uploadedUrls.push(res.file_url || res.fileUrl || "");
      }

      // Add each uploaded image as attachment
      for (const url of uploadedUrls) {
        if (url) {
          await erpApi.addGatePassAttachment(gp.id, isDispatch ? "Pickup Photo" : "Delivery Photo", url, "");
        }
      }

      const payload = isDispatch
        ? {
            pickupLocation: form.pickupLocation,
            pickupDatetime: form.pickupDatetime,
            pickupNotes: form.pickupNotes,
          }
        : {
            deliveryLocation: form.deliveryLocation,
            deliveryDatetime: form.deliveryDatetime,
            receiverName: form.receiverName,
            deliveryNotes: form.deliveryNotes,
          };

      onSubmit(payload);
    } catch (e: any) {
      setError(e.message || "Failed to save transition details");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{isDispatch ? "Dispatch Gate Pass" : "Mark as Delivered"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isDispatch ? (
            <>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Pickup Location</label>
                <Input value={form.pickupLocation} onChange={(e) => setForm((p) => ({ ...p, pickupLocation: e.target.value }))} placeholder="Warehouse loading bay" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Pickup Datetime</label>
                <Input type="datetime-local" value={form.pickupDatetime} onChange={(e) => setForm((p) => ({ ...p, pickupDatetime: e.target.value }))} className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Pickup Notes</label>
                <Input value={form.pickupNotes} onChange={(e) => setForm((p) => ({ ...p, pickupNotes: e.target.value }))} className="mt-1 h-9 text-xs" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Delivery Location</label>
                <Input value={form.deliveryLocation} onChange={(e) => setForm((p) => ({ ...p, deliveryLocation: e.target.value }))} placeholder="Customer location" className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Delivery Datetime</label>
                <Input type="datetime-local" value={form.deliveryDatetime} onChange={(e) => setForm((p) => ({ ...p, deliveryDatetime: e.target.value }))} className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Receiver Name</label>
                <Input value={form.receiverName} onChange={(e) => setForm((p) => ({ ...p, receiverName: e.target.value }))} className="mt-1 h-9 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Delivery Notes</label>
                <Input value={form.deliveryNotes} onChange={(e) => setForm((p) => ({ ...p, deliveryNotes: e.target.value }))} className="mt-1 h-9 text-xs" />
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <Camera className="w-3 h-3" /> Capture {isDispatch ? "Pickup" : "Delivery"} Photos
            </label>
            <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" capture="environment" />
            <div className="mt-1 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3 h-3 mr-1" /> Add Photo
              </Button>
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300">
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-5 py-3 flex justify-end gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs h-8 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Saving…" : (isDispatch ? "Dispatch" : "Mark Delivered")}
          </Button>
        </div>
      </div>
    </div>
  );
}
