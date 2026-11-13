import { useState, useEffect } from "react";
import type React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { erpApi } from "@/lib/erpApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ClipboardList, PlusCircle, Search, Filter,
  CheckCircle2, Clock, AlertTriangle, Factory, ChevronRight, GitBranch,
} from "lucide-react";
import type { WorkOrder } from "@/data/mockData";

export default function WorkOrdersList() {
  const navigate = useNavigate();
  const { hasPermission } = useAppStore();
  const canCreate = hasPermission("ops-wo-create");

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    erpApi
      .listWorkOrders()
      .then((data) => setWorkOrders(data as WorkOrder[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    draft: { label: "Draft", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", icon: Clock },
    in_process: { label: "In Process", color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-500/10", icon: Factory },
    completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "text-red-600", bg: "bg-red-50 dark:bg-red-500/10", icon: AlertTriangle },
  };

  const filtered = workOrders.filter((wo) => {
    const matchesSearch = !search ||
      wo.name.toLowerCase().includes(search.toLowerCase()) ||
      wo.product.toLowerCase().includes(search.toLowerCase()) ||
      wo.fillingLine.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workOrders.length,
    draft: workOrders.filter((w) => w.status === "draft").length,
    active: workOrders.filter((w) => w.status === "in_process").length,
    completed: workOrders.filter((w) => w.status === "completed").length,
    cancelled: workOrders.filter((w) => w.status === "cancelled").length,
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Work Orders</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage production runs and track progress</p>
          </div>
        </div>
        {canCreate && (
          <Button size="sm" className="h-9 text-xs bg-cyan-600 text-white" onClick={() => navigate("/workorders/new")}>
            <PlusCircle className="w-4 h-4 mr-1" /> New Work Order
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "blue" },
          { label: "Draft", value: stats.draft, color: "amber" },
          { label: "In Process", value: stats.active, color: "cyan" },
          { label: "Completed", value: stats.completed, color: "emerald" },
          { label: "Cancelled", value: stats.cancelled, color: "red" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold text-${s.color}-600 dark:text-${s.color}-400`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, product, or line..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {["all", "draft", "in_process", "completed", "cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                statusFilter === st
                  ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                  : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {st === "all" ? "All" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* WO Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-50 animate-spin" />
            <p className="text-sm">Loading work orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No work orders found matching your filters.</p>
          </div>
        ) : (
          filtered.map((wo, i) => {
            const cfg = statusConfig[wo.status] || statusConfig.draft;
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={wo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/workorders/${wo.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{wo.name}</p>
                          <Badge className={`text-[9px] border-0 ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span>{wo.product} {wo.variant}</span>
                          <span className="text-slate-300">|</span>
                          <span>{wo.fillingLine}</span>
                          <span className="text-slate-300">|</span>
                          <span>{wo.qty.toLocaleString()} {wo.uom}</span>
                        </div>
                        {wo.status === "in_process" && (
                          <div className="mt-2">
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                                style={{ width: `${wo.progress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{wo.progress}% complete</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 hidden sm:flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            {wo.qcChecks.filter((q) => q.status === "passed").length}/{wo.qcChecks.length} QC
                          </p>
                          <p className="text-[10px] text-slate-400">checks passed</p>
                        </div>
                        {wo.processFlow && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-500/10"
                            onClick={(e) => { e.stopPropagation(); navigate(`/workorders/${wo.id}`); }} title="Process flow defined">
                            <GitBranch className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
