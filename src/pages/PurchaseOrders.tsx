import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { workOrders } from "@/data/mockData";
import type { PurchaseOrder, PurchaseOrderItem } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Truck, XCircle, FileText, Link2,
  DollarSign, Plus, Save, X, Trash2,
} from "lucide-react";
import { generateId } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", icon: FileText },
  approved: { label: "Approved", color: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400", icon: CheckCircle2 },
  sent: { label: "Sent", color: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: Truck },
  partial: { label: "Partial", color: "bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400", icon: Clock },
  received: { label: "Received", color: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400", icon: XCircle },
};

const itemStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  partial: { label: "Partial", color: "bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  received: { label: "Received", color: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
};

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = useAppStore();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // New PO modal
  const [showForm, setShowForm] = useState(false);
  const [poNumber, setPoNumber] = useState("");
  const [poSupplier, setPoSupplier] = useState("");
  const [poStatus, setPoStatus] = useState<PurchaseOrder["status"]>("draft");
  const [poItems, setPoItems] = useState<{ itemName: string; qtyOrdered: number; uom: string; unitPrice: number }[]>([{ itemName: "", qtyOrdered: 1, uom: "pc", unitPrice: 0 }]);

  const filtered = purchaseOrders.filter((po: PurchaseOrder) => {
    const matchesSearch = !search ||
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.supplier.toLowerCase().includes(search.toLowerCase()) ||
      po.notes?.toLowerCase().includes(search.toLowerCase()) ||
      po.items.some((it: PurchaseOrderItem) => it.itemName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === "all" || po.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPOs = purchaseOrders.length;
  const receivedPOs = purchaseOrders.filter((p) => p.status === "received").length;
  const pendingPOs = purchaseOrders.filter((p) => p.status === "approved" || p.status === "sent").length;
  const partialPOs = purchaseOrders.filter((p) => p.status === "partial").length;
  const totalValue = purchaseOrders.reduce((sum, p) => sum + p.totalValue, 0);

  const openCreatePO = () => {
    setPoNumber("");
    setPoSupplier("");
    setPoStatus("draft");
    setPoItems([{ itemName: "", qtyOrdered: 1, uom: "pc", unitPrice: 0 }]);
    setShowForm(true);
  };

  const handleSavePO = () => {
    if (!poNumber.trim() || !poSupplier.trim() || poItems.length === 0) return;
    const items: PurchaseOrderItem[] = poItems.map((it) => ({
      id: generateId("poi"),
      itemCode: "",
      itemName: it.itemName,
      qtyOrdered: it.qtyOrdered,
      qtyReceived: 0,
      uom: it.uom,
      unitPrice: it.unitPrice,
      status: "pending" as const,
    }));
    const total = items.reduce((sum, it) => sum + it.qtyOrdered * it.unitPrice, 0);
    const newPO: PurchaseOrder = {
      id: generateId("po"),
      poNumber,
      supplier: poSupplier,
      status: poStatus,
      orderDate: new Date().toISOString(),
      expectedDelivery: new Date(Date.now() + 7 * 86400000).toISOString(),
      items,
      totalValue: total,
      notes: "",
    };
    addPurchaseOrder(newPO);
    setShowForm(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Purchase Orders</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage POs and link to Work Orders for production planning</p>
          </div>
        </div>
        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={openCreatePO}>
          <Plus className="w-4 h-4 mr-1" /> New P.O
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total POs", value: totalPOs, icon: FileText },
          { label: "Received", value: receivedPOs, icon: CheckCircle2 },
          { label: "Pending", value: pendingPOs, icon: Clock },
          { label: "Partial", value: partialPOs, icon: Truck },
          { label: "Total Value", value: `$${(totalValue / 1000).toFixed(1)}k`, icon: DollarSign },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <s.icon className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
          <Input placeholder="Search POs, suppliers, items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800" />
        </div>
        {["all", "approved", "sent", "partial", "received", "cancelled"].map((t) => (
          <Button key={t} size="sm" variant={filterStatus === t ? "default" : "outline"} onClick={() => setFilterStatus(t)}
            className={filterStatus === t ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {/* PO List */}
      <div className="space-y-3">
        {filtered.map((po: PurchaseOrder) => {
          const cfg = statusConfig[po.status] || statusConfig.draft;
          const StatusIcon = cfg.icon;
          const expanded = expandedId === po.id;
          const linkedWO = po.linkedWorkOrder ? workOrders.find((w) => w.id === po.linkedWorkOrder) : null;
          return (
            <Card key={po.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setExpandedId(expanded ? null : po.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.color.split(" ")[0]}`}>
                      <StatusIcon className={`w-5 h-5 ${cfg.color.split(" ")[1]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-white">{po.poNumber}</span>
                        <Badge className={`text-[10px] border-0 ${cfg.color}`}>{cfg.label}</Badge>
                        {linkedWO && <Badge className="text-[10px] border-0 bg-violet-50 text-violet-600"><Link2 className="w-2.5 h-2.5 mr-0.5" />{linkedWO.name}</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{po.supplier} · {po.items.length} items · ${po.totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {po.status !== "received" && po.status !== "cancelled" && po.status !== "draft" && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-emerald-600 border-emerald-200 dark:border-emerald-500/30" onClick={(e) => {
                        e.stopPropagation();
                        updatePurchaseOrder(po.id, {
                          status: "received",
                          actualDelivery: new Date().toISOString(),
                          items: po.items.map((it) => ({ ...it, qtyReceived: it.qtyOrdered, status: "received" as const })),
                        });
                      }}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Receive
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400" onClick={(e) => { e.stopPropagation(); deletePurchaseOrder(po.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-slate-500">Order Date</p><p className="text-slate-800">{new Date(po.orderDate).toLocaleDateString()}</p></div>
                        <div><p className="text-xs text-slate-500">Expected Delivery</p><p className="text-slate-800">{new Date(po.expectedDelivery).toLocaleDateString()}</p></div>
                      </div>
                      <div className="rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 text-[10px] font-semibold text-slate-500 uppercase">
                          <div className="col-span-5">Item</div><div className="col-span-2 text-right">Qty</div><div className="col-span-2 text-right">Unit</div><div className="col-span-2 text-right">Status</div><div className="col-span-1 text-right">Price</div>
                        </div>
                        {po.items.map((it) => (
                          <div key={it.id} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-gray-100 items-center">
                            <div className="col-span-5 text-xs">{it.itemName}</div>
                            <div className="col-span-2 text-right text-xs">{it.qtyOrdered} {it.uom}</div>
                            <div className="col-span-2 text-right text-xs">${it.unitPrice}</div>
                            <div className="col-span-2 text-right"><Badge className={`text-[9px] border-0 ${itemStatusConfig[it.status]?.color || ""}`}>{itemStatusConfig[it.status]?.label || it.status}</Badge></div>
                            <div className="col-span-1 text-right text-xs font-medium">${(it.qtyOrdered * it.unitPrice).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                      {po.notes && <p className="text-xs text-slate-500 italic">{po.notes}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-sm text-slate-500 py-8">No purchase orders found</p>}
      </div>

      {/* New PO Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 shadow-xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">New Purchase Order</h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-medium text-slate-500">PO Number</label><Input className="h-8 text-xs mt-1" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="PO-2025-001" /></div>
                  <div><label className="text-[10px] font-medium text-slate-500">Status</label>
                    <select className="w-full h-8 text-xs rounded-md border border-gray-200 px-2 mt-1" value={poStatus} onChange={(e) => setPoStatus(e.target.value as PurchaseOrder["status"])}>
                      <option value="draft">Draft</option><option value="approved">Approved</option><option value="sent">Sent</option>
                    </select>
                  </div>
                </div>
                <div><label className="text-[10px] font-medium text-slate-500">Supplier</label><Input className="h-8 text-xs mt-1" value={poSupplier} onChange={(e) => setPoSupplier(e.target.value)} placeholder="Supplier name" /></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-slate-500">Items</label>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setPoItems((p) => [...p, { itemName: "", qtyOrdered: 1, uom: "pc", unitPrice: 0 }])}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                  </div>
                  {poItems.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="col-span-5"><Input className="h-7 text-[11px]" placeholder="Item name" value={it.itemName} onChange={(e) => setPoItems((p) => p.map((x, i) => i === idx ? { ...x, itemName: e.target.value } : x))} /></div>
                      <div className="col-span-2"><Input className="h-7 text-[11px]" type="number" value={it.qtyOrdered} onChange={(e) => setPoItems((p) => p.map((x, i) => i === idx ? { ...x, qtyOrdered: Number(e.target.value) } : x))} /></div>
                      <div className="col-span-2"><Input className="h-7 text-[11px]" placeholder="UOM" value={it.uom} onChange={(e) => setPoItems((p) => p.map((x, i) => i === idx ? { ...x, uom: e.target.value } : x))} /></div>
                      <div className="col-span-2"><Input className="h-7 text-[11px]" type="number" value={it.unitPrice} onChange={(e) => setPoItems((p) => p.map((x, i) => i === idx ? { ...x, unitPrice: Number(e.target.value) } : x))} /></div>
                      <div className="col-span-1 text-right"><Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => setPoItems((p) => p.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3" /></Button></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="text-xs bg-cyan-600 text-white" onClick={handleSavePO}><Save className="w-3.5 h-3.5 mr-1" /> Create PO</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
