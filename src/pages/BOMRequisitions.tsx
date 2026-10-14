import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import {
  ArrowLeft, Beaker, CheckCircle2, Package,
  Truck, ChevronRight, XCircle,
  ClipboardList, MapPin, User, Calendar,
} from "lucide-react";
import type { BOMRequisition, BOMRequisitionItem } from "@/data/mockData";

const statusColors: Record<string, string> = {
  draft: "bg-gray-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-gray-200 dark:border-slate-700",
  approved: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
  picking: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
  prepared: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
  delivered: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
  rejected: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30",
};

const itemStatusColors: Record<string, string> = {
  pending: "text-amber-600 dark:text-amber-400",
  fetched: "text-blue-600 dark:text-blue-400",
  verified: "text-emerald-600 dark:text-emerald-400",
};

export default function BOMRequisitions() {
  const navigate = useNavigate();
  const { requisitions, updateRequisition, user, hasPermission } = useAppStore();
  const [filter, setFilter] = useState<"all" | "approved" | "picking" | "prepared" | "delivered">("all");
  const [selectedReq, setSelectedReq] = useState<BOMRequisition | null>(null);
  const canExecute = hasPermission("ops-mixer-execute");

  const filtered = requisitions.filter((r: BOMRequisition) => {
    if (filter === "all") return r.status !== "draft" && r.status !== "rejected";
    return r.status === filter;
  });

  const stats = {
    approved: requisitions.filter((r: BOMRequisition) => r.status === "approved").length,
    picking: requisitions.filter((r: BOMRequisition) => r.status === "picking").length,
    prepared: requisitions.filter((r: BOMRequisition) => r.status === "prepared").length,
    delivered: requisitions.filter((r: BOMRequisition) => r.status === "delivered").length,
  };

  const startPicking = (req: BOMRequisition) => {
    updateRequisition(req.id, { status: "picking", preparedBy: user?.name });
  };

  const markPrepared = (req: BOMRequisition) => {
    const now = new Date().toISOString();
    const updatedItems = req.items.map((item: BOMRequisitionItem) => ({
      ...item,
      qtyFetched: item.qtyRequired,
      status: "verified" as const,
    }));
    updateRequisition(req.id, {
      status: "prepared",
      items: updatedItems,
      preparedBy: user?.name,
      preparedAt: now,
    });
  };

  const markDelivered = (req: BOMRequisition) => {
    const now = new Date().toISOString();
    updateRequisition(req.id, {
      status: "delivered",
      deliveredTo: `Production - ${req.woName}`,
      deliveredAt: now,
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">BOM Requisitions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ingredient pick lists & handover to production</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Approved", val: stats.approved, color: "text-blue-600 dark:text-blue-400" },
          { label: "Picking", val: stats.picking, color: "text-amber-600 dark:text-amber-400" },
          { label: "Prepared", val: stats.prepared, color: "text-purple-600 dark:text-purple-400" },
          { label: "Delivered", val: stats.delivered, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 cursor-pointer" onClick={() => setFilter(s.label.toLowerCase() as any)}>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-1">
        {(["all", "approved", "picking", "prepared", "delivered"] as const).map((f) => (
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

      {/* Requisition Cards */}
      <div className="space-y-2">
        {filtered.map((req: BOMRequisition) => (
          <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      req.status === "delivered" ? "bg-emerald-50 dark:bg-emerald-500/15" :
                      req.status === "prepared" ? "bg-purple-50 dark:bg-purple-500/15" :
                      req.status === "picking" ? "bg-amber-50 dark:bg-amber-500/15" : "bg-blue-50 dark:bg-blue-500/15"
                    }`}>
                      <Beaker className={`w-4 h-4 ${
                        req.status === "delivered" ? "text-emerald-500" :
                        req.status === "prepared" ? "text-purple-500" :
                        req.status === "picking" ? "text-amber-500" : "text-blue-500"
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{req.bomName}</p>
                        <Badge className={`text-[10px] border ${statusColors[req.status]}`}>{req.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{req.product} — {req.variant} — Batch {req.batchQty.toLocaleString()}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> {req.woName}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {req.requestedBy}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(req.requestedAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {req.items.length} items</span>
                      </div>
                      {req.preparedBy && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          Prepared by {req.preparedBy}
                          {req.deliveredTo && ` — Delivered to ${req.deliveredTo}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 dark:text-slate-400" onClick={() => setSelectedReq(req)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Action buttons */}
                {canExecute && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                    {req.status === "approved" && (
                      <Button size="sm" className="flex-1 h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={() => startPicking(req)}>
                        <Package className="w-3.5 h-3.5 mr-1" /> Start Picking
                      </Button>
                    )}
                    {req.status === "picking" && (
                      <Button size="sm" className="flex-1 h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white" onClick={() => markPrepared(req)}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Prepared
                      </Button>
                    )}
                    {req.status === "prepared" && (
                      <Button size="sm" className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => markDelivered(req)}>
                        <Truck className="w-3.5 h-3.5 mr-1" /> Deliver to Production
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReq(null)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedReq.status === "delivered" ? "bg-emerald-50 dark:bg-emerald-500/15" : "bg-gray-50 dark:bg-slate-800"
                }`}>
                  <Beaker className={`w-4 h-4 ${selectedReq.status === "delivered" ? "text-emerald-500" : "text-slate-500 dark:text-slate-400"}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{selectedReq.bomName}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedReq.woName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</p>
                  <p className="text-xs font-medium text-slate-800 dark:text-white">{selectedReq.product}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedReq.variant}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Batch Qty</p>
                  <p className="text-xs font-medium text-slate-800 dark:text-white">{selectedReq.batchQty.toLocaleString()} units</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</p>
                  <Badge className={`mt-1 text-[10px] border ${statusColors[selectedReq.status]}`}>{selectedReq.status}</Badge>
                </div>
              </div>

              {/* Pick List */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-cyan-500" /> Pick List
                </h4>
                <div className="space-y-1.5">
                  {selectedReq.items.map((item: BOMRequisitionItem) => (
                    <div key={item.id} className={`flex items-center justify-between p-2.5 rounded-lg border ${
                      item.status === "verified" ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/20" :
                      item.status === "fetched" ? "bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-900/20" :
                      "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-800"
                    }`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-slate-800 dark:text-white">{item.ingredient}</p>
                          {item.lotNo && <span className="text-[9px] text-slate-500 dark:text-slate-400">Lot: {item.lotNo}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>
                          {item.expiryDate && <span>Exp: {new Date(item.expiryDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white">
                          {item.qtyFetched > 0 ? `${item.qtyFetched} / ` : ""}{item.qtyRequired} {item.unit}
                        </p>
                        <p className={`text-[10px] ${itemStatusColors[item.status]}`}>{item.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit trail */}
              <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                <p><span className="text-slate-700 dark:text-slate-300">Requested by:</span> {selectedReq.requestedBy} — {new Date(selectedReq.requestedAt).toLocaleString()}</p>
                {selectedReq.preparedBy && <p><span className="text-slate-700 dark:text-slate-300">Prepared by:</span> {selectedReq.preparedBy} — {selectedReq.preparedAt ? new Date(selectedReq.preparedAt).toLocaleString() : "N/A"}</p>}
                {selectedReq.deliveredTo && <p><span className="text-slate-700 dark:text-slate-300">Delivered to:</span> {selectedReq.deliveredTo} — {selectedReq.deliveredAt ? new Date(selectedReq.deliveredAt).toLocaleString() : "N/A"}</p>}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
