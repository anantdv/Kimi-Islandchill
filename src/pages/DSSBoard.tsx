import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle, Factory, Beaker, Droplets, ClipboardCheck, FlaskConical,
  Wrench, GitBranch, CheckCircle2, ArrowRight, Pause, Play, XCircle,
  ChevronRight, Clock, User, GitBranch as ParallelIcon, LayoutGrid,
  CheckCircle, Loader2, AlertTriangle, FileText, RotateCcw,
  Stethoscope, Wrench as WrenchIcon, Send, Ban, Pencil,
} from "lucide-react";
import type { DSSFlowTemplate, DSSActiveRun, DSSNodeState, DSSFaultReport, DSSFormField } from "@/data/mockData";
import { dssNodeTypes } from "@/data/mockData";
import { generateId, formatTime } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  PlayCircle, Factory, Beaker, Droplets, ClipboardCheck, FlaskConical,
  Wrench, GitBranch, CheckCircle2,
};

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType; pulse?: boolean }> = {
  pending: { label: "Pending", color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700", icon: Clock },
  ready: { label: "Ready", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-800/40", icon: PlayCircle, pulse: true },
  running: { label: "Running", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-800/40", icon: Loader2, pulse: true },
  completed: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-800/40", icon: CheckCircle },
  failed: { label: "Failed", color: "text-red-600", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-800/40", icon: XCircle },
  skipped: { label: "Skipped", color: "text-slate-400", bg: "bg-gray-50 dark:bg-slate-800/30", border: "border-gray-200 dark:border-slate-700", icon: ArrowRight },
  on_hold: { label: "On Hold", color: "text-red-600", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-800/40", icon: AlertTriangle, pulse: true },
};

const colorMap: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-800/40", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-800/40", text: "text-blue-700 dark:text-blue-400", ring: "ring-blue-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-200 dark:border-indigo-800/40", text: "text-indigo-700 dark:text-indigo-400", ring: "ring-indigo-400" },
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-800/40", text: "text-cyan-700 dark:text-cyan-400", ring: "ring-cyan-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-800/40", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-800/40", text: "text-purple-700 dark:text-purple-400", ring: "ring-purple-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-800/40", text: "text-orange-700 dark:text-orange-400", ring: "ring-orange-400" },
  pink: { bg: "bg-pink-50 dark:bg-pink-500/10", border: "border-pink-200 dark:border-pink-800/40", text: "text-pink-700 dark:text-pink-400", ring: "ring-pink-400" },
};

function getNodeStatus(run: DSSActiveRun, nodeId: string): DSSNodeState | undefined {
  return run.nodeStates.find((ns) => ns.nodeId === nodeId);
}

function computeReadyNodes(template: DSSFlowTemplate, run: DSSActiveRun): Set<string> {
  const ready = new Set<string>();
  const completed = new Set(run.nodeStates.filter((ns) => ns.status === "completed" || ns.status === "skipped").map((ns) => ns.nodeId));

  for (const node of template.nodes) {
    const state = getNodeStatus(run, node.id);
    if (state && state.status !== "pending" && state.status !== "on_hold") continue;

    const incoming = template.edges.filter((e) => e.toNodeId === node.id);
    if (incoming.length === 0) {
      ready.add(node.id);
      continue;
    }
    const allDepsMet = incoming.every((e) => completed.has(e.fromNodeId));
    if (allDepsMet) ready.add(node.id);
  }

  return ready;
}


function formatDuration(start?: string, end?: string) {
  if (!start || !end) return "";
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return diff > 0 ? `${diff}m` : "";
}


export default function DSSBoard() {
  const navigate = useNavigate();
  const {
    dssActiveRuns, dssTemplates, updateNodeState, updateRun,
    submitNodeForm, reportFault, resolveFault, hasPermission, user,
  } = useAppStore();
  const canControl = hasPermission("ops-dss");

  const [selectedRunId, setSelectedRunId] = useState<string>(dssActiveRuns[0]?.id || "");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formNodeId, setFormNodeId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number | boolean>>({});
  const [faultModalOpen, setFaultModalOpen] = useState(false);
  const [faultNodeId, setFaultNodeId] = useState<string | null>(null);
  const [faultForm, setFaultForm] = useState({ severity: "major" as const, category: "mechanical" as const, description: "" });
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [repairFaultId, setRepairFaultId] = useState<string | null>(null);
  const [repairForm, setRepairForm] = useState({ repairedBy: user?.name || "", repairNotes: "" });

  const selectedRun = dssActiveRuns.find((r) => r.id === selectedRunId);
  const template = selectedRun ? dssTemplates.find((t) => t.id === selectedRun.templateId) : undefined;
  const readyNodes = useMemo(() => {
    if (!template || !selectedRun) return new Set<string>();
    return computeReadyNodes(template, selectedRun);
  }, [template, selectedRun]);

  const startNode = (nodeId: string) => {
    if (!selectedRun || !canControl) return;
    updateNodeState(selectedRun.id, nodeId, { status: "running", startedAt: new Date().toISOString() });
  };

  const completeNode = (nodeId: string) => {
    if (!selectedRun || !canControl) return;
    const node = template?.nodes.find((n) => n.id === nodeId);
    if (node?.form) {
      setFormNodeId(nodeId);
      setFormValues({});
      setFormModalOpen(true);
      return;
    }
    updateNodeState(selectedRun.id, nodeId, { status: "completed", completedAt: new Date().toISOString() });
  };

  const submitForm = () => {
    if (!selectedRun || !formNodeId) return;
    submitNodeForm(selectedRun.id, formNodeId, formValues);
    setFormModalOpen(false);
    setFormNodeId(null);
  };

  const openFaultModal = (nodeId: string) => {
    setFaultNodeId(nodeId);
    setFaultForm({ severity: "major", category: "mechanical", description: "" });
    setFaultModalOpen(true);
  };

  const submitFault = () => {
    if (!selectedRun || !faultNodeId || !user) return;
    const fault: DSSFaultReport = {
      id: generateId("fault"),
      runId: selectedRun.id,
      nodeId: faultNodeId,
      reportedBy: user.name,
      reportedAt: new Date().toISOString(),
      severity: faultForm.severity,
      category: faultForm.category,
      description: faultForm.description,
      status: "open",
    };
    reportFault(selectedRun.id, fault);
    setFaultModalOpen(false);
    setFaultNodeId(null);
  };

  const openRepairModal = (faultId: string) => {
    setRepairFaultId(faultId);
    setRepairForm({ repairedBy: user?.name || "", repairNotes: "" });
    setRepairModalOpen(true);
  };

  const submitRepair = () => {
    if (!selectedRun || !repairFaultId) return;
    resolveFault(selectedRun.id, repairFaultId, repairForm);
    setRepairModalOpen(false);
    setRepairFaultId(null);
  };

  const skipNode = (nodeId: string) => {
    if (!selectedRun || !canControl) return;
    updateNodeState(selectedRun.id, nodeId, { status: "skipped" });
  };

  const pauseRun = () => {
    if (!selectedRun) return;
    updateRun(selectedRun.id, { status: "paused" });
  };

  const resumeRun = () => {
    if (!selectedRun) return;
    updateRun(selectedRun.id, { status: "running" });
  };

  const abortRun = () => {
    if (!selectedRun) return;
    updateRun(selectedRun.id, { status: "aborted" });
  };

  const runProgress = useMemo(() => {
    if (!selectedRun || !template) return 0;
    const total = template.nodes.filter((n) => n.typeId !== "nt-start" && n.typeId !== "nt-end").length;
    const done = selectedRun.nodeStates.filter((ns) => ns.status === "completed" || ns.status === "skipped").length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [selectedRun, template]);

  const nodeGroups = useMemo(() => {
    if (!template) return [];
    const yMap = new Map<number, typeof template.nodes>();
    for (const node of template.nodes) {
      const list = yMap.get(node.y) || [];
      list.push(node);
      yMap.set(node.y, list);
    }
    return Array.from(yMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([y, nodes]) => ({ y, nodes }));
  }, [template]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      setup: "bg-slate-100 text-slate-600",
      running: "bg-emerald-100 text-emerald-600 animate-pulse",
      paused: "bg-amber-100 text-amber-600",
      completed: "bg-blue-100 text-blue-600",
      aborted: "bg-red-100 text-red-600",
    };
    return <Badge className={`text-[10px] border-0 ${colors[status] || colors.setup}`}>{status}</Badge>;
  };

  const formNode = formNodeId ? template?.nodes.find((n) => n.id === formNodeId) : undefined;
  const faultNode = faultNodeId ? template?.nodes.find((n) => n.id === faultNodeId) : undefined;
  const activeFaults = selectedRun?.faults.filter((f) => f.status !== "resolved") || [];

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-cyan-500" />
            DSS — Decision Support Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Single-window operations console with live QC forms, timestamps & fault tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => navigate("/dss/builder")}>
            <GitBranch className="w-3.5 h-3.5 mr-1" /> Flow Builder
          </Button>
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode("board")} className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${viewMode === "board" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-500"}`}>Board</button>
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white" : "text-slate-500"}`}>List</button>
          </div>
        </div>
      </motion.div>

      {/* Run Selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {dssActiveRuns.map((run) => {
            const tpl = dssTemplates.find((t) => t.id === run.templateId);
            const isSelected = run.id === selectedRunId;
            const openFaultCount = run.faults.filter((f) => f.status !== "resolved").length;
            return (
              <button
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
                className={`flex-shrink-0 text-left rounded-xl border p-3 min-w-[240px] transition-all hover:shadow-md ${
                  isSelected
                    ? "bg-white dark:bg-slate-900 border-cyan-200 dark:border-cyan-800/40 shadow-md ring-1 ring-cyan-200 dark:ring-cyan-800/30"
                    : "bg-white/60 dark:bg-slate-900/30 border-gray-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{run.name}</p>
                  <div className="flex items-center gap-1">
                    {openFaultCount > 0 && (
                      <Badge className="bg-red-50 text-red-600 border-0 text-[9px]">
                        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> {openFaultCount}
                      </Badge>
                    )}
                    {statusBadge(run.status)}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{tpl?.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${runProgress}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-500">{runProgress}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Active Faults Banner */}
      <AnimatePresence>
        {activeFaults.length > 0 && selectedRun && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card className="bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-900/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">Active Faults — {activeFaults.length} open</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {activeFaults.map((fault) => {
                    const node = template?.nodes.find((n) => n.id === fault.nodeId);
                    return (
                      <div key={fault.id} className="rounded-lg bg-white dark:bg-slate-900/50 border border-red-100 dark:border-red-900/20 p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-medium text-slate-800 dark:text-white">{node?.name || fault.nodeId}</p>
                          <Badge className={`text-[9px] border-0 ${fault.severity === "critical" ? "bg-red-100 text-red-600" : fault.severity === "major" ? "bg-orange-100 text-orange-600" : "bg-amber-100 text-amber-600"}`}>
                            {fault.severity}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{fault.description}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] text-slate-400">{fault.reportedBy} • {formatTime(fault.reportedAt)}</span>
                          {canControl && (
                            <Button size="sm" className="h-6 text-[9px] bg-emerald-600 text-white px-2" onClick={() => openRepairModal(fault.id)}>
                              <RotateCcw className="w-2.5 h-2.5 mr-0.5" /> Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Run Detail */}
      <AnimatePresence mode="wait">
        {selectedRun && template && (
          <motion.div
            key={selectedRun.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Run Header */}
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedRun.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{template.name} • {template.productFamily}</p>
                    {selectedRun.startedAt && (
                      <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> Started {new Date(selectedRun.startedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRun.status === "running" ? (
                    <>
                      <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={pauseRun}>
                        <Pause className="w-3 h-3 mr-1" /> Pause
                      </Button>
                      <Button variant="destructive" size="sm" className="h-8 text-[10px]" onClick={abortRun}>
                        <XCircle className="w-3 h-3 mr-1" /> Abort
                      </Button>
                    </>
                  ) : selectedRun.status === "paused" ? (
                    <>
                      <Button size="sm" className="h-8 text-[10px] bg-emerald-600 text-white" onClick={resumeRun}>
                        <Play className="w-3 h-3 mr-1" /> Resume
                      </Button>
                      <Button variant="destructive" size="sm" className="h-8 text-[10px]" onClick={abortRun}>
                        <XCircle className="w-3 h-3 mr-1" /> Abort
                      </Button>
                    </>
                  ) : selectedRun.status === "setup" ? (
                    <Button size="sm" className="h-8 text-[10px] bg-cyan-600 text-white" onClick={resumeRun}>
                      <Play className="w-3 h-3 mr-1" /> Start Run
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {viewMode === "board" ? (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                {/* Main Flow */}
                <div className="xl:col-span-3 space-y-3">
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
                    <CardHeader className="pb-2 border-b border-gray-100 dark:border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-cyan-500" />
                          Process Flow
                        </CardTitle>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Done</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Running</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Ready</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> On Hold</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4 relative">
                        <div className="absolute left-[50%] top-0 bottom-0 w-px bg-gradient-to-b from-cyan-200 via-slate-200 to-cyan-200 dark:from-cyan-800/40 dark:via-slate-700 dark:to-cyan-800/40 -translate-x-1/2" />

                        {nodeGroups.map((group, gi) => {
                          const isParallel = group.nodes.length > 1;
                          return (
                            <div key={gi} className="relative">
                              {isParallel && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                                  <Badge className="text-[9px] border-0 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <ParallelIcon className="w-2.5 h-2.5 mr-1" /> Parallel
                                  </Badge>
                                </div>
                              )}
                              <div className={`grid gap-3 ${group.nodes.length === 1 ? "grid-cols-1 place-items-center" : group.nodes.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                                {group.nodes.map((node) => {
                                  const type = dssNodeTypes.find((t) => t.id === node.typeId);
                                  const Icon = type ? iconMap[type.icon] || Factory : Factory;
                                  const col = type ? colorMap[type.color] : colorMap.blue;
                                  const state = getNodeStatus(selectedRun, node.id);
                                  const status = state?.status || "pending";
                                  const cfg = statusConfig[status] || statusConfig.pending;
                                  const StatusIcon = cfg.icon;
                                  const isReady = readyNodes.has(node.id) && status === "pending";
                                  const displayStatus = isReady ? "ready" : status;
                                  const displayCfg = statusConfig[displayStatus] || cfg;
                                  const hasForm = !!node.form;
                                  const nodeFaults = selectedRun.faults.filter((f) => f.nodeId === node.id && f.status !== "resolved");

                                  return (
                                    <motion.div
                                      key={node.id}
                                      layout
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: gi * 0.05 }}
                                      className={`relative rounded-xl border p-3 transition-all hover:shadow-md ${
                                        displayStatus === "running"
                                          ? "ring-2 ring-amber-400 shadow-lg shadow-amber-500/10"
                                          : displayStatus === "ready"
                                          ? "ring-2 ring-blue-400 shadow-lg shadow-blue-500/10"
                                          : displayStatus === "on_hold"
                                          ? "ring-2 ring-red-400 shadow-lg shadow-red-500/10"
                                          : displayStatus === "completed"
                                          ? "opacity-80"
                                          : ""
                                      } ${col.bg} ${col.border} ${displayStatus === "completed" ? "border-emerald-200 dark:border-emerald-800/40" : ""}`}
                                    >
                                      {/* Fault indicator */}
                                      {nodeFaults.length > 0 && (
                                        <div className="absolute -top-2 -right-2 z-10">
                                          <Badge className="bg-red-500 text-white border-0 text-[9px] animate-pulse">
                                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> {nodeFaults.length}
                                          </Badge>
                                        </div>
                                      )}

                                      <div className="flex items-start justify-between mb-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${col.bg} ${col.text}`}>
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${displayCfg.bg} ${displayCfg.color} ${displayCfg.border}`}>
                                            {displayCfg.pulse && <span className="w-1 h-1 rounded-full bg-current animate-pulse" />}
                                            <StatusIcon className="w-2.5 h-2.5" />
                                            {displayCfg.label}
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-xs font-semibold text-slate-800 dark:text-white">{node.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                                          <User className="w-2.5 h-2.5" /> {node.role}
                                        </span>
                                        <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                                          <Clock className="w-2.5 h-2.5" /> {node.durationMin}m
                                        </span>
                                      </div>

                                      {/* Timestamp strip */}
                                      {(state?.startedAt || state?.completedAt) && (
                                        <div className="mt-1.5 flex items-center gap-2 text-[9px] text-slate-400">
                                          {state.startedAt && <span className="flex items-center gap-0.5"><Play className="w-2 h-2" /> {formatTime(state.startedAt)}</span>}
                                          {state.completedAt && <span className="flex items-center gap-0.5"><CheckCircle className="w-2 h-2" /> {formatTime(state.completedAt)} ({formatDuration(state.startedAt, state.completedAt)})</span>}
                                        </div>
                                      )}

                                      {/* Form data preview */}
                                      {state?.formData && node.form && (
                                        <div className="mt-2 rounded-lg bg-white/60 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 p-2">
                                          <p className="text-[9px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                                            <FileText className="w-2.5 h-2.5" /> {node.form.name}
                                          </p>
                                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                            {node.form.fields.slice(0, 4).map((field) => {
                                              const val = state.formData?.[field.id];
                                              if (val === undefined) return null;
                                              return (
                                                <div key={field.id} className="flex items-center gap-1">
                                                  <span className="text-[8px] text-slate-400">{field.label}:</span>
                                                  <span className={`text-[9px] font-medium ${field.type === "pass_fail" ? (val === true || val === "true" ? "text-emerald-600" : "text-red-600") : "text-slate-700 dark:text-slate-200"}`}>
                                                    {field.type === "pass_fail" ? (val === true || val === "true" ? "PASS" : "FAIL") : String(val)} {field.unit || ""}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                          {node.form.fields.length > 4 && (
                                            <p className="text-[8px] text-slate-400 mt-0.5">+{node.form.fields.length - 4} more fields</p>
                                          )}
                                        </div>
                                      )}

                                      {/* Action buttons */}
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {canControl && displayStatus === "ready" && (
                                          <Button size="sm" className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white" onClick={() => startNode(node.id)}>
                                            <Play className="w-3 h-3 mr-1" /> Start
                                          </Button>
                                        )}
                                        {canControl && displayStatus === "running" && (
                                          <>
                                            <Button size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => completeNode(node.id)}>
                                              <CheckCircle className="w-3 h-3 mr-1" /> {hasForm ? "Form & Done" : "Complete"}
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-red-200 text-red-600 hover:bg-red-50" onClick={() => openFaultModal(node.id)}>
                                              <AlertTriangle className="w-3 h-3 mr-1" /> Fault
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 text-slate-500" onClick={() => skipNode(node.id)}>
                                              <Ban className="w-3 h-3 mr-1" /> Skip
                                            </Button>
                                          </>
                                        )}
                                        {canControl && displayStatus === "on_hold" && (
                                          <Button size="sm" className="h-7 text-[10px] bg-amber-600 text-white" onClick={() => startNode(node.id)}>
                                            <RotateCcw className="w-3 h-3 mr-1" /> Resume
                                          </Button>
                                        )}
                                        {selectedRun?.workOrderId && (
                                          <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-pink-200 text-pink-600 hover:bg-pink-50" onClick={() => navigate(`/workorders/${selectedRun.workOrderId}`)}>
                                            <Pencil className="w-3 h-3 mr-1" /> Edit Flow
                                          </Button>
                                        )}
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Side Panel */}
                <div className="xl:col-span-1 space-y-3">
                  {/* Parallel Console */}
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <ParallelIcon className="w-4 h-4 text-blue-500" />
                        Parallel Console
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      {(() => {
                        const readyByGroup = new Map<string, typeof template.nodes>();
                        const readyList = template.nodes.filter((n) => readyNodes.has(n.id));
                        for (const node of readyList) {
                          const group = node.parallelGroup || "sequential";
                          const list = readyByGroup.get(group) || [];
                          list.push(node);
                          readyByGroup.set(group, list);
                        }
                        if (readyByGroup.size === 0) {
                          return (
                            <div className="text-center py-4 text-slate-400 text-xs">
                              <CheckCircle className="w-5 h-5 mx-auto mb-1 opacity-50" />
                              No ready processes
                            </div>
                          );
                        }
                        return Array.from(readyByGroup.entries()).map(([group, nodes]) => (
                          <div key={group} className="rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-500/5 p-2.5">
                            <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                              <ParallelIcon className="w-3 h-3" />
                              {group === "sequential" ? "Sequential" : group}
                            </p>
                            <div className="space-y-1.5">
                              {nodes.map((node) => (
                                <div key={node.id} className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-700 dark:text-slate-200">{node.name}</span>
                                  <Button size="sm" className="h-6 text-[9px] px-2 bg-blue-600 text-white" onClick={() => startNode(node.id)}>
                                    Start
                                  </Button>
                                </div>
                              ))}
                            </div>
                            {nodes.length > 1 && (
                              <Button size="sm" className="mt-2 h-7 text-[10px] w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white" onClick={() => nodes.forEach((n) => startNode(n.id))}>
                                <Play className="w-3 h-3 mr-1" /> Start All Parallel
                              </Button>
                            )}
                          </div>
                        ));
                      })()}
                    </CardContent>
                  </Card>

                  {/* Running Now */}
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                        Running Now
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      {selectedRun.nodeStates.filter((ns) => ns.status === "running").length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">No active processes</p>
                      ) : (
                        selectedRun.nodeStates
                          .filter((ns) => ns.status === "running")
                          .map((ns) => {
                            const node = template.nodes.find((n) => n.id === ns.nodeId);
                            if (!node) return null;
                            return (
                              <div key={ns.nodeId} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-900/20">
                                <div>
                                  <p className="text-[11px] font-medium text-slate-800 dark:text-white">{node.name}</p>
                                  <p className="text-[9px] text-slate-500">{ns.assignedTo || node.role} • {formatTime(ns.startedAt)}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" className="h-7 text-[10px] bg-emerald-600 text-white" onClick={() => completeNode(ns.nodeId)}>
                                    Done
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-red-200 text-red-600" onClick={() => openFaultModal(ns.nodeId)}>
                                    <AlertTriangle className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </CardContent>
                  </Card>

                  {/* Fault History */}
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-red-500" />
                        Fault History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedRun.faults.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">No faults reported</p>
                      ) : (
                        selectedRun.faults.map((fault) => {
                          const node = template.nodes.find((n) => n.id === fault.nodeId);
                          return (
                            <div key={fault.id} className={`rounded-lg border p-2 ${fault.status === "resolved" ? "bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-900/20" : "bg-red-50/30 dark:bg-red-500/5 border-red-100 dark:border-red-900/20"}`}>
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-medium text-slate-800 dark:text-white">{node?.name || fault.nodeId}</p>
                                <Badge className={`text-[8px] border-0 ${fault.status === "resolved" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                                  {fault.status}
                                </Badge>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5">{fault.description}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[8px] text-slate-400">{fault.reportedBy} • {formatTime(fault.reportedAt)}</span>
                                <span className={`text-[8px] font-medium ${fault.severity === "critical" ? "text-red-600" : fault.severity === "major" ? "text-orange-600" : "text-amber-600"}`}>{fault.severity}</span>
                              </div>
                              {fault.status === "resolved" && (
                                <div className="mt-1 pt-1 border-t border-emerald-100 dark:border-emerald-900/20">
                                  <p className="text-[8px] text-emerald-600 flex items-center gap-1">
                                    <WrenchIcon className="w-2.5 h-2.5" /> {fault.repairedBy} • {formatTime(fault.repairedAt)}
                                  </p>
                                  {fault.repairNotes && <p className="text-[8px] text-slate-400 mt-0.5">{fault.repairNotes}</p>}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>

                  {/* Completed Summary */}
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedRun.nodeStates.filter((ns) => ns.status === "completed").length}
                        <span className="text-xs text-slate-400 font-normal"> / {template.nodes.filter((n) => n.typeId !== "nt-start" && n.typeId !== "nt-end").length}</span>
                      </p>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${runProgress}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* LIST VIEW */
              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {template.nodes.map((node) => {
                      const type = dssNodeTypes.find((t) => t.id === node.typeId);
                      const Icon = type ? iconMap[type.icon] || Factory : Factory;
                      const col = type ? colorMap[type.color] : colorMap.blue;
                      const state = getNodeStatus(selectedRun, node.id);
                      const status = state?.status || "pending";
                      const cfg = statusConfig[status] || statusConfig.pending;
                      const StatusIcon = cfg.icon;
                      const isReady = readyNodes.has(node.id) && status === "pending";
                      const nodeFaults = selectedRun.faults.filter((f) => f.nodeId === node.id && f.status !== "resolved");

                      return (
                        <div key={node.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${col.bg} ${col.border} border`}>
                            <Icon className={`w-4 h-4 ${col.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-slate-800 dark:text-white">{node.name}</p>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                {cfg.pulse && <span className="w-1 h-1 rounded-full bg-current animate-pulse" />}
                                <StatusIcon className="w-2.5 h-2.5" />
                                {isReady ? "Ready" : cfg.label}
                              </span>
                              {nodeFaults.length > 0 && (
                                <Badge className="bg-red-100 text-red-600 border-0 text-[9px]">
                                  <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> {nodeFaults.length}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> {node.role}</span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {node.durationMin}m</span>
                              {state?.startedAt && <span className="text-[10px] text-slate-400">{formatTime(state.startedAt)}</span>}
                              {state?.completedAt && <span className="text-[10px] text-emerald-500">{formatTime(state.completedAt)}</span>}
                              {node.parallelGroup && (
                                <span className="text-[10px] text-blue-500 flex items-center gap-0.5"><ParallelIcon className="w-2.5 h-2.5" /> {node.parallelGroup}</span>
                              )}
                            </div>
                            {state?.formData && node.form && (
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                {node.form.fields.slice(0, 3).map((field) => {
                                  const val = state.formData?.[field.id];
                                  if (val === undefined) return null;
                                  return (
                                    <span key={field.id} className="text-[9px] text-slate-500">
                                      {field.label}: <span className={`font-medium ${field.type === "pass_fail" ? (val === true || val === "true" ? "text-emerald-600" : "text-red-600") : "text-slate-700 dark:text-slate-200"}`}>
                                        {field.type === "pass_fail" ? (val === true || val === "true" ? "PASS" : "FAIL") : String(val)}
                                      </span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {canControl && isReady && (
                              <Button size="sm" className="h-7 text-[10px] bg-blue-600 text-white" onClick={() => startNode(node.id)}>
                                <Play className="w-3 h-3 mr-1" /> Start
                              </Button>
                            )}
                            {canControl && status === "running" && (
                              <>
                                <Button size="sm" className="h-7 text-[10px] bg-emerald-600 text-white" onClick={() => completeNode(node.id)}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Done
                                </Button>
                                <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-red-200 text-red-600" onClick={() => openFaultModal(node.id)}>
                                  <AlertTriangle className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            {canControl && status === "on_hold" && (
                              <Button size="sm" className="h-7 text-[10px] bg-amber-600 text-white" onClick={() => startNode(node.id)}>
                                <RotateCcw className="w-3 h-3 mr-1" /> Resume
                              </Button>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedRun && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No active production runs</p>
          <p className="text-xs text-slate-400 mt-1">Create a flow in the Journey Creator and start a work order to see it here.</p>
          <Button className="mt-4 h-9 text-xs bg-cyan-600 text-white" onClick={() => navigate("/dss/builder")}>
            <GitBranch className="w-3.5 h-3.5 mr-1" /> Open Flow Builder
          </Button>
        </motion.div>
      )}

      {/* Form Submission Modal */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-500" />
              {formNode?.form?.name || "QC Form"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {formNode?.form?.fields.map((field: DSSFormField) => (
              <div key={field.id}>
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    className="mt-1 text-xs min-h-[60px]"
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    value={String(formValues[field.id] || "")}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  />
                ) : field.type === "select" ? (
                  <Select value={String(formValues[field.id] || "")} onValueChange={(v) => setFormValues((prev) => ({ ...prev, [field.id]: v }))}>
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "pass_fail" ? (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setFormValues((prev) => ({ ...prev, [field.id]: true }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${formValues[field.id] === true ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-gray-50 border-gray-200 text-slate-500"}`}
                    >
                      PASS
                    </button>
                    <button
                      onClick={() => setFormValues((prev) => ({ ...prev, [field.id]: false }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${formValues[field.id] === false ? "bg-red-50 border-red-300 text-red-700" : "bg-gray-50 border-gray-200 text-slate-500"}`}
                    >
                      FAIL
                    </button>
                  </div>
                ) : field.type === "checkbox" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={!!formValues[field.id]}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [field.id]: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-xs text-slate-500">Yes / Verified</span>
                  </div>
                ) : field.type === "date" ? (
                  <Input
                    type="date"
                    className="mt-1 h-8 text-xs"
                    value={String(formValues[field.id] || "")}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  />
                ) : (
                  <Input
                    type={field.type}
                    className="mt-1 h-8 text-xs"
                    placeholder={field.unit ? `Enter value in ${field.unit}` : "Enter value..."}
                    min={field.min}
                    max={field.max}
                    value={String(formValues[field.id] || "")}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.id]: field.type === "number" ? Number(e.target.value) : e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setFormModalOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs bg-cyan-600 text-white" onClick={submitForm}>
              <Send className="w-3 h-3 mr-1" /> Submit & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fault Report Modal */}
      <Dialog open={faultModalOpen} onOpenChange={setFaultModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Report Fault — {faultNode?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Severity</label>
              <Select value={faultForm.severity} onValueChange={(v) => setFaultForm((prev) => ({ ...prev, severity: v as any }))}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor" className="text-xs">Minor</SelectItem>
                  <SelectItem value="major" className="text-xs">Major</SelectItem>
                  <SelectItem value="critical" className="text-xs">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Category</label>
              <Select value={faultForm.category} onValueChange={(v) => setFaultForm((prev) => ({ ...prev, category: v as any }))}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanical" className="text-xs">Mechanical</SelectItem>
                  <SelectItem value="electrical" className="text-xs">Electrical</SelectItem>
                  <SelectItem value="quality" className="text-xs">Quality</SelectItem>
                  <SelectItem value="material" className="text-xs">Material</SelectItem>
                  <SelectItem value="other" className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Description</label>
              <Textarea
                className="mt-1 text-xs min-h-[60px]"
                placeholder="Describe the fault..."
                value={faultForm.description}
                onChange={(e) => setFaultForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setFaultModalOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs bg-red-600 text-white" onClick={submitFault}>
              <AlertTriangle className="w-3 h-3 mr-1" /> Report Fault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Repair / Restore Modal */}
      <Dialog open={repairModalOpen} onOpenChange={setRepairModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <WrenchIcon className="w-4 h-4 text-emerald-500" />
              Repair & Restore
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Repaired By</label>
              <Input className="mt-1 h-8 text-xs" value={repairForm.repairedBy} onChange={(e) => setRepairForm((prev) => ({ ...prev, repairedBy: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Repair Notes</label>
              <Textarea
                className="mt-1 text-xs min-h-[60px]"
                placeholder="Describe the repair action..."
                value={repairForm.repairNotes}
                onChange={(e) => setRepairForm((prev) => ({ ...prev, repairNotes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setRepairModalOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 text-white" onClick={submitRepair}>
              <RotateCcw className="w-3 h-3 mr-1" /> Restore Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
