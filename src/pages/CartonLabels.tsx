import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tag, ArrowLeft, Search, Plus, Printer, QrCode,
  CheckCircle2, Package, Truck, Warehouse, X, Filter,
} from "lucide-react";
import type { CartonLabel } from "@/data/mockData";
import { erpApi } from "@/lib/erpApi";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  produced: { label: "Produced", color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-500/10", icon: Package },
  in_warehouse: { label: "In Warehouse", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", icon: Warehouse },
  picked: { label: "Picked", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", icon: Package },
  dispatched: { label: "Dispatched", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", icon: Truck },
  delivered: { label: "Delivered", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle2 },
};

export default function CartonLabels() {
  const navigate = useNavigate();
  const [labels, setLabels] = useState<CartonLabel[]>([]);
  const [workOrders, setWorkOrders] = useState<{ id: string; name: string; product: string; variant: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);

  const fetchLabels = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const statusParam = statusFilter === "all" ? undefined : statusFilter;
      const rows = await erpApi.listCartonLabels({ status: statusParam, search: search || undefined });
      setLabels(Array.isArray(rows) ? (rows as CartonLabel[]) : []);
    } catch (e: any) {
      setError(e.message || "Failed to load carton labels");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
    erpApi.listWorkOrders().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setWorkOrders(list.map((w: any) => ({ id: w.id || w.name, name: w.name || w.id, product: w.product || "", variant: w.variant || "" })));
    }).catch(() => setWorkOrders([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchLabels(true), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const filtered = useMemo(() => {
    return labels.filter((cl) => {
      const m = !search ||
        cl.labelCode.toLowerCase().includes(search.toLowerCase()) ||
        cl.product.toLowerCase().includes(search.toLowerCase()) ||
        cl.batchNumber.toLowerCase().includes(search.toLowerCase());
      const s = statusFilter === "all" || cl.status === statusFilter;
      return m && s;
    });
  }, [labels, search, statusFilter]);

  const stats = useMemo(() => ({
    total: labels.length,
    produced: labels.filter((c) => c.status === "produced").length,
    inWarehouse: labels.filter((c) => c.status === "in_warehouse").length,
    dispatched: labels.filter((c) => c.status === "dispatched" || c.status === "delivered").length,
  }), [labels]);

  const openNew = () => { setEditingId(null); setModalOpen(true); };
  const openEdit = (id: string) => { setEditingId(id); setModalOpen(true); };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Carton Labels</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Batch-tracked carton labels synced with ERPNext</p>
          </div>
        </div>
        <Button size="sm" className="h-9 text-xs bg-cyan-600 hover:bg-cyan-700 text-white" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> New Label
        </Button>
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Labels", value: stats.total, color: "blue", icon: Tag },
          { label: "Produced", value: stats.produced, color: "cyan", icon: Package },
          { label: "In Warehouse", value: stats.inWarehouse, color: "blue", icon: Warehouse },
          { label: "Dispatched", value: stats.dispatched, color: "violet", icon: Truck },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${s.color === "blue" ? "bg-blue-50 dark:bg-blue-500/10" : s.color === "cyan" ? "bg-cyan-50 dark:bg-cyan-500/10" : s.color === "violet" ? "bg-violet-50 dark:bg-violet-500/10" : "bg-blue-50 dark:bg-blue-500/10"} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color === "blue" ? "text-blue-600" : s.color === "cyan" ? "text-cyan-600" : "text-violet-600"}`} />
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
            placeholder="Search label code, product, batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Status</option>
          {Object.entries(statusConfig).map(([k, cfg]) => (
            <option key={k} value={k}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-slate-500 text-center py-8">Loading labels…</p>}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((cl, i) => {
            const cfg = statusConfig[cl.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.div key={cl.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:shadow-md transition-all group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-slate-400" />
                          <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">{cl.labelCode}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{cl.product} — {cl.variant}</p>
                      </div>
                      <Badge className={`text-[10px] border-0 ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" /> {cfg.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-gray-50 dark:bg-slate-800/50">
                        <p className="text-slate-400">Batch</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{cl.batchNumber}</p>
                      </div>
                      <div className="p-2 rounded bg-gray-50 dark:bg-slate-800/50">
                        <p className="text-slate-400">Qty</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{cl.quantity} {cl.uom}</p>
                      </div>
                      <div className="p-2 rounded bg-gray-50 dark:bg-slate-800/50">
                        <p className="text-slate-400">Production</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{cl.productionDate}</p>
                      </div>
                      <div className="p-2 rounded bg-gray-50 dark:bg-slate-800/50">
                        <p className="text-slate-400">Expiry</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{cl.expiryDate}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={() => setPrintId(cl.id)}>
                        <Printer className="w-3 h-3 mr-1" /> Print
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-slate-500" onClick={() => openEdit(cl.id)}>
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No carton labels found.</p>
        </div>
      )}

      {modalOpen && (
        <LabelModal
          editingId={editingId}
          onClose={() => setModalOpen(false)}
          workOrders={workOrders}
          onSaved={() => fetchLabels()}
        />
      )}

      {printId && (
        <PrintPreview
          label={labels.find((c) => c.id === printId)!}
          onClose={() => setPrintId(null)}
        />
      )}
    </div>
  );
}

function LabelModal({ editingId, onClose, workOrders, onSaved }: { editingId: string | null; onClose: () => void; workOrders: { id: string; name: string; product: string; variant: string }[]; onSaved: () => void }) {
  const [labels, setLabels] = useState<CartonLabel[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    erpApi.listCartonLabels({ search: editingId }).then((data) => {
      const list = Array.isArray(data) ? (data as CartonLabel[]) : [];
      setLabels(list);
    });
  }, [editingId]);

  const existing = editingId ? labels.find((c) => c.id === editingId) : null;

  const [form, setForm] = useState<Partial<CartonLabel>>({
    labelCode: existing?.labelCode ?? `IC-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
    workOrderId: existing?.workOrderId ?? workOrders[0]?.id ?? "",
    product: existing?.product ?? "",
    variant: existing?.variant ?? "",
    batchNumber: existing?.batchNumber ?? "",
    productionDate: existing?.productionDate ?? new Date().toISOString().split("T")[0],
    expiryDate: existing?.expiryDate ?? "",
    quantity: existing?.quantity ?? 12,
    uom: existing?.uom ?? "bottles",
    status: existing?.status ?? "produced",
    warehouse: existing?.warehouse ?? "",
    warehouseBinId: existing?.warehouseBinId ?? "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        labelCode: existing.labelCode,
        workOrderId: existing.workOrderId,
        product: existing.product,
        variant: existing.variant,
        batchNumber: existing.batchNumber,
        productionDate: existing.productionDate,
        expiryDate: existing.expiryDate,
        quantity: existing.quantity,
        uom: existing.uom,
        status: existing.status,
        warehouse: existing.warehouse,
        warehouseBinId: existing.warehouseBinId,
      });
    }
  }, [existing]);

  const handleSave = async () => {
    if (!form.labelCode?.trim()) return;
    setSaving(true);
    try {
      if (existing) {
        await erpApi.updateCartonLabel(existing.id, { ...form });
      } else {
        await erpApi.createCartonLabel({ ...form });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to save label");
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof CartonLabel>(field: K, value: CartonLabel[K]) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{existing ? "Edit Label" : "New Carton Label"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Label Code</label>
            <Input value={form.labelCode} onChange={(e) => setField("labelCode", e.target.value)} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 font-mono" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Work Order</label>
            <select value={form.workOrderId} onChange={(e) => {
              const wo = workOrders.find((w) => w.id === e.target.value);
              setForm((p) => ({ ...p, workOrderId: e.target.value, product: wo?.product ?? p.product, variant: wo?.variant ?? p.variant }));
            }} className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white">
              <option value="">—</option>
              {workOrders.map((wo) => (<option key={wo.id} value={wo.id}>{wo.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Product</label>
              <Input value={form.product} onChange={(e) => setField("product", e.target.value)} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Variant</label>
              <Input value={form.variant} onChange={(e) => setField("variant", e.target.value)} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Batch Number</label>
            <Input value={form.batchNumber} onChange={(e) => setField("batchNumber", e.target.value)} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Production Date</label>
              <Input type="date" value={form.productionDate} onChange={(e) => setField("productionDate", e.target.value)} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Expiry Date</label>
              <Input type="date" value={form.expiryDate} onChange={(e) => setField("expiryDate", e.target.value)} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Quantity</label>
              <Input type="number" value={form.quantity} onChange={(e) => setField("quantity", parseInt(e.target.value) || 0)} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">UOM</label>
              <Input value={form.uom} onChange={(e) => setField("uom", e.target.value)} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Warehouse</label>
            <Input value={form.warehouse} onChange={(e) => setField("warehouse", e.target.value)} placeholder="Finished Goods - CWFPL" className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Warehouse Bin</label>
            <Input value={form.warehouseBinId} onChange={(e) => setField("warehouseBinId", e.target.value)} className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Status</label>
            <select value={form.status} onChange={(e) => setField("status", e.target.value as CartonLabel["status"])} className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white">
              {Object.entries(statusConfig).map(([k, c]) => (<option key={k} value={k}>{c.label}</option>))}
            </select>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-5 py-3 flex justify-end gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs h-8 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : (existing ? "Save" : "Create")}</Button>
        </div>
      </div>
    </div>
  );
}

function PrintPreview({ label, onClose }: { label: CartonLabel; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">Label Print Preview</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-slate-900 dark:text-white">Island Chill</p>
              <QrCode className="w-10 h-10 text-slate-800 dark:text-white" />
            </div>
            <div className="h-px bg-gray-200 dark:bg-slate-700" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{label.product}</p>
            <p className="text-xs text-slate-500">{label.variant} — {label.quantity} {label.uom}</p>
            <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <p><span className="text-slate-400">Batch:</span> {label.batchNumber}</p>
              <p><span className="text-slate-400">Mfg:</span> {label.productionDate}</p>
              <p><span className="text-slate-400">Exp:</span> {label.expiryDate}</p>
            </div>
            <p className="text-[10px] font-mono text-slate-400 text-center pt-2">{label.labelCode}</p>
          </div>
          <Button size="sm" className="w-full mt-4 h-9 text-xs bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => { window.print(); }}>
            <Printer className="w-4 h-4 mr-1" /> Print Label
          </Button>
        </div>
      </div>
    </div>
  );
}
