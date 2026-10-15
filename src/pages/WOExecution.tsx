import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, CheckCircle2, AlertTriangle, Clock, User,
  FlaskConical, Wrench, Minus, Plus, Save, Camera, ShieldCheck,
  FileText, ChevronRight, Lock,
} from "lucide-react";
import { qcForms } from "@/data/mockData";
import type { WorkOrder, JobCard, QCCheck, Incident, QCForm, MaintenanceCheck, MaintenanceCheckItem } from "@/data/mockData";
import {
  getWorkOrderDetail, startWorkOrder, finishWorkOrder, updateJobCard,
  submitMaintenanceForm,
  type MaintenanceFormResponseInput,
} from "@/services/erpnext";

function mapErpJobCardStatus(status?: string): JobCard["status"] {
  switch (status) {
    case "Work In Progress":
      return "in_progress";
    case "Completed":
      return "completed";
    case "Open":
    default:
      return "pending";
  }
}

function mapProductionLine(line?: string): string {
  if (line === "Filling Line 1") return "FL1 - Water Line A";
  if (line === "Filling Line 2") return "FL2 - Water Line B";
  return line || "";
}

function mapLineToEquipmentArea(line: string): { equipment: string; area: string } {
  if (line.includes("Water")) return { equipment: "Water Line", area: "Bottling Line" };
  if (line.includes("RTD")) return { equipment: "RTD Line", area: "RTD Line" };
  if (line.includes("CSD")) return { equipment: "CSD Line", area: "CSD / RTD Line" };
  return { equipment: "Water Line", area: "Bottling Line" };
}

export default function WOExecution() {
  const { woId } = useParams<{ woId: string }>();
  const navigate = useNavigate();
  const { workOrders, updateWorkOrder, addIncident, maintenanceChecks, updateMaintenanceCheck, hasPermission, erpConnection } = useAppStore();
  const liveMode = erpConnection.connected;
  const canReportIncident = hasPermission("ops-incidents-report");
  const [activeTab, setActiveTab] = useState("overview");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [jcCompletedQty, setJcCompletedQty] = useState<Record<string, string>>({});
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [processLoss, setProcessLoss] = useState("0");
  const [extraGoods, setExtraGoods] = useState("0");
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState("");
  const [incidentSev, setIncidentSev] = useState("medium");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [showQCModal, setShowQCModal] = useState(false);
  const [qcValue, setQcValue] = useState("");
  const [activeQc, setActiveQc] = useState<string | null>(null);
  const [selectedQcForm, setSelectedQcForm] = useState<QCForm | null>(null);
  const [showQcFormModal, setShowQcFormModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintCheckPhotos, setMaintCheckPhotos] = useState<Record<string, string>>({});
  const [maintCheckStates, setMaintCheckStates] = useState<Record<string, "pass" | "fail" | "na">>({});
  const [maintItemNotes, setMaintItemNotes] = useState<Record<string, string>>({});
  const [maintResolution, setMaintResolution] = useState<"resolved" | "pending">("resolved");
  const [maintPendingReason, setMaintPendingReason] = useState("");
  const [maintResolutionNotes, setMaintResolutionNotes] = useState("");

  const wo = workOrders.find((w: WorkOrder) => w.id === woId);
  const maintCheck = wo ? maintenanceChecks.find((mc: MaintenanceCheck) => mc.woId === wo.id) : undefined;
  const maintCleared = maintCheck?.status === "cleared";

  useEffect(() => {
    if (!liveMode || !wo) return;
    setDetailLoading(true);
    setDetailError("");
    getWorkOrderDetail(wo.id)
      .then((detail) => {
        const mappedJobCards: JobCard[] = detail.job_cards.map((jc) => ({
          id: jc.name,
          operation: jc.operation,
          status: mapErpJobCardStatus(jc.status),
          operator: undefined,
          startedAt: undefined,
          completedAt: undefined,
          duration: undefined,
        }));
        updateWorkOrder(wo.id, {
          jobCards: mappedJobCards,
          fillingLine: mapProductionLine(detail.production_line) || wo.fillingLine,
        });
      })
      .catch((err) => setDetailError(err instanceof Error ? err.message : String(err)))
      .finally(() => setDetailLoading(false));
  }, [liveMode, wo?.id]);

  if (!wo) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 dark:text-slate-400">Work Order not found</p>
    </div>
  );

  // Available QC forms for this product's stages
  const availableQcForms = qcForms.filter((qf: QCForm) => qf.active);

  const handleLaunch = async () => {
    if (!maintCleared) return;
    if (liveMode) {
      setDetailLoading(true);
      try {
        await startWorkOrder(wo.id);
        const detail = await getWorkOrderDetail(wo.id);
        const mappedJobCards: JobCard[] = detail.job_cards.map((jc) => ({
          id: jc.name,
          operation: jc.operation,
          status: mapErpJobCardStatus(jc.status),
          operator: undefined,
          startedAt: undefined,
          completedAt: undefined,
          duration: undefined,
        }));
        updateWorkOrder(wo.id, {
          status: "in_process",
          startedAt: new Date().toISOString(),
          progress: 10,
          jobCards: mappedJobCards,
        });
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : String(err));
      } finally {
        setDetailLoading(false);
      }
      return;
    }
    updateWorkOrder(wo.id, { status: "in_process", startedAt: new Date().toISOString(), progress: 5 });
  };

  const handleFinish = async () => {
    if (liveMode) {
      setDetailLoading(true);
      try {
        await finishWorkOrder(wo.id, parseFloat(processLoss) || 0, parseFloat(extraGoods) || 0);
        updateWorkOrder(wo.id, {
          status: "completed",
          completedAt: new Date().toISOString(),
          progress: 100,
          processLoss: parseFloat(processLoss) || 0,
          extraGoods: parseFloat(extraGoods) || 0,
        });
        setShowFinishModal(false);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : String(err));
      } finally {
        setDetailLoading(false);
      }
      return;
    }
    updateWorkOrder(wo.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      progress: 100,
      processLoss: parseFloat(processLoss) || 0,
      extraGoods: parseFloat(extraGoods) || 0,
    });
    setShowFinishModal(false);
  };

  const handleJobCardAction = async (jc: JobCard, action: "start" | "complete") => {
    if (!liveMode) {
      if (action === "start") {
        updateWorkOrder(wo.id, {
          jobCards: wo.jobCards.map((j) =>
            j.id === jc.id ? { ...j, status: "in_progress" as const, startedAt: new Date().toISOString() } : j
          ),
        });
      } else {
        const completedQty = parseFloat(jcCompletedQty[jc.id] || String(jc.duration || wo.qty));
        updateWorkOrder(wo.id, {
          jobCards: wo.jobCards.map((j) =>
            j.id === jc.id
              ? { ...j, status: "completed" as const, completedAt: new Date().toISOString(), duration: completedQty }
              : j
          ),
        });
        setJcCompletedQty((prev) => ({ ...prev, [jc.id]: "" }));
      }
      return;
    }
    setDetailLoading(true);
    try {
      const erpStatus = action === "start" ? "Work In Progress" : "Completed";
      const completedQty = action === "complete" ? parseFloat(jcCompletedQty[jc.id] || String(jc.duration || wo.qty)) : undefined;
      await updateJobCard(jc.id, erpStatus, completedQty);
      const detail = await getWorkOrderDetail(wo.id);
      const mappedJobCards: JobCard[] = detail.job_cards.map((j) => ({
        id: j.name,
        operation: j.operation,
        status: mapErpJobCardStatus(j.status),
        operator: undefined,
        startedAt: undefined,
        completedAt: undefined,
        duration: undefined,
      }));
      updateWorkOrder(wo.id, { jobCards: mappedJobCards });
      if (action === "complete") {
        setJcCompletedQty((prev) => ({ ...prev, [jc.id]: "" }));
      }
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : String(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCertifyMaintenance = async () => {
    if (!maintCheck || !wo) return;
    const now = new Date().toISOString();
    const updatedItems = maintCheck.items.map((item) => ({
      ...item,
      status: maintCheckStates[item.id] || item.status,
      notes: maintItemNotes[item.id] || item.notes,
      photo: maintCheckPhotos[item.id] || item.photo,
    }));
    const localUpdate = {
      items: updatedItems,
      status: maintResolution === "resolved" ? ("cleared" as const) : ("pending" as const),
      clearedAt: maintResolution === "resolved" ? now : undefined,
      resolutionStatus: maintResolution,
      pendingReason: maintResolution === "pending" ? maintPendingReason : undefined,
      resolutionNotes: maintResolution === "resolved" ? maintResolutionNotes : undefined,
      resolvedAt: now,
      photos: Object.values(maintCheckPhotos),
    };

    if (liveMode) {
      setDetailLoading(true);
      try {
        const { equipment, area } = mapLineToEquipmentArea(wo.fillingLine);
        const responses: MaintenanceFormResponseInput[] = updatedItems.map((item) => ({
          item: item.check,
          result: item.status === "pass" ? "Pass" : item.status === "fail" ? "Fail" : "N/A",
          observation: item.notes,
        }));
        await submitMaintenanceForm({
          work_order: wo.id,
          equipment,
          area,
          overall_remarks: maintResolutionNotes || maintPendingReason,
          items: responses,
        });
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : String(err));
      } finally {
        setDetailLoading(false);
      }
    }

    updateMaintenanceCheck(maintCheck.id, localUpdate);
    setShowMaintModal(false);
  };

  const handleRaiseIncident = () => {
    if (!incidentType || !incidentDesc) return;
    const newInc: Incident = {
      id: `inc${Date.now()}`,
      type: incidentType,
      severity: incidentSev as "critical" | "high" | "medium" | "low",
      description: incidentDesc,
      line: wo.fillingLine.split(" ")[0],
      status: "open",
      raisedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    addIncident(newInc);
    setShowIncidentModal(false);
    setIncidentType("");
    setIncidentDesc("");
  };

  const handleQCFulfill = (qcId: string) => {
    if (!qcValue) return;
    const updated = wo.qcChecks.map((q: QCCheck) =>
      q.id === qcId ? { ...q, status: "passed" as const, value: qcValue } : q
    );
    updateWorkOrder(wo.id, { qcChecks: updated });
    setShowQCModal(false);
    setQcValue("");
    setActiveQc(null);
  };

  const handleMaintItemToggle = (itemId: string, status: "pass" | "fail" | "na") => {
    setMaintCheckStates((prev) => ({ ...prev, [itemId]: status }));
  };

  const handleMaintPhoto = (itemId: string) => {
    // Simulate photo capture
    setMaintCheckPhotos((prev) => ({ ...prev, [itemId]: `photo_${itemId}_${Date.now()}` }));
  };

  const statusBadge = (s: string) => {
    if (s === "in_process") return <Badge className="bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0">In Process</Badge>;
    if (s === "completed") return <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">Completed</Badge>;
    if (s === "draft") return <Badge variant="outline" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">Draft</Badge>;
    return <Badge variant="secondary" className="bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{s}</Badge>;
  };

  const jcStatus = (s: string) => {
    if (s === "completed") return <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Done</Badge>;
    if (s === "in_progress") return <Badge className="bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] border-0"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
    return <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">Pending</Badge>;
  };

  // Map job card operations to available QC forms
  const getQcFormsForStage = (operation: string) => {
    const opLower = operation.toLowerCase();
    return availableQcForms.filter((qf: QCForm) =>
      qf.stage.toLowerCase().includes(opLower.split(" ")[0]) ||
      opLower.includes(qf.stage.toLowerCase().split(" ")[0])
    );
  };

  return (
    <div className="p-4 lg:p-6 pb-24 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{wo.name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{wo.product} — {wo.variant}</p>
          </div>
        </div>
        {statusBadge(wo.status)}
      </div>

      {detailError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/20 text-sm text-red-600 dark:text-red-400">
          {detailError}
        </div>
      )}

      {detailLoading && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/20 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin" /> Syncing with ERPNext...
        </div>
      )}

      {/* Maintenance Clearance Banner */}
      {wo.status === "draft" && (
        <Card className={`border ${maintCleared ? "border-emerald-800 bg-emerald-950/20" : "border-amber-800 bg-amber-50 dark:bg-amber-950/20"}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${maintCleared ? "bg-emerald-50 dark:bg-emerald-500/15" : "bg-amber-50 dark:bg-amber-950/20"}`}>
                  {maintCleared ? <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${maintCleared ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {maintCleared ? "Maintenance Clearance Approved" : "Maintenance Clearance Required"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {maintCleared
                      ? `Cleared by ${maintCheck?.supervisor} at ${maintCheck?.clearedAt ? new Date(maintCheck.clearedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}`
                      : "Pre-start checks must be completed by Maintenance Supervisor before launching WO"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={maintCleared ? "outline" : "default"}
                className={maintCleared ? "border-emerald-700 text-emerald-600 dark:text-emerald-400" : "bg-amber-600 hover:bg-amber-700 text-white"}
                onClick={() => setShowMaintModal(true)}
              >
                {maintCleared ? "View Checklist" : "Complete Checks"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Progress</span>
            <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{wo.progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${wo.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Qty: {wo.qty.toLocaleString()} {wo.uom}</span>
            <span>{wo.fillingLine}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {wo.status === "draft" && (
        <Button
          className="w-full h-12 text-base bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLaunch}
          disabled={!maintCleared || detailLoading}
        >
          {maintCleared ? <><Play className="w-4 h-4 mr-2" /> Launch Work Order</> : <><Lock className="w-4 h-4 mr-2" /> Awaiting Maintenance Clearance</>}
        </Button>
      )}
      {wo.status === "in_process" && (
        <div className="flex gap-2">
          {canReportIncident && (
            <Button variant="outline" className="flex-1 h-12 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => setShowIncidentModal(true)}>
              <AlertTriangle className="w-4 h-4 mr-1 text-amber-600 dark:text-amber-400" /> Raise Incident
            </Button>
          )}
          <Button className={`h-12 bg-emerald-600 hover:bg-emerald-700 ${canReportIncident ? "flex-1" : "w-full"}`} onClick={() => setShowFinishModal(true)} disabled={detailLoading}>
            <CheckCircle2 className="w-4 h-4 mr-1" /> Finish WO
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Overview</TabsTrigger>
          <TabsTrigger value="jobcards" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Job Cards</TabsTrigger>
          <TabsTrigger value="qc" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">QC</TabsTrigger>
          <TabsTrigger value="qcforms" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">QC Forms</TabsTrigger>
          <TabsTrigger value="incidents" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-3">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-800 dark:text-white">Work Order Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                { label: "Product", value: wo.product },
                { label: "Variant", value: wo.variant },
                { label: "Quantity", value: `${wo.qty.toLocaleString()} ${wo.uom}` },
                { label: "Line", value: wo.fillingLine },
                { label: "Started", value: wo.startedAt ? new Date(wo.startedAt).toLocaleString() : "—", cond: !!wo.startedAt },
                { label: "Completed", value: wo.completedAt ? new Date(wo.completedAt).toLocaleString() : "—", cond: !!wo.completedAt },
                { label: "Process Loss", value: `${wo.processLoss} ${wo.uom}`, cond: wo.processLoss > 0, cls: "text-red-600 dark:text-red-400" },
                { label: "Extra Goods", value: `+${wo.extraGoods} ${wo.uom}`, cond: wo.extraGoods > 0, cls: "text-emerald-600 dark:text-emerald-400" },
              ].map((item) => (
                (item.cond === undefined || item.cond) && (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                    <span className={`font-medium text-slate-800 dark:text-white ${item.cls || ""}`}>{item.value}</span>
                  </div>
                )
              ))}
            </CardContent>
          </Card>

          {/* Maintenance Summary */}
          {maintCheck && (
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Maintenance Clearance</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                  <Badge className={maintCleared ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0" : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-0"}>
                    {maintCheck.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Supervisor</span>
                  <span className="text-sm text-slate-800 dark:text-white">{maintCheck.supervisor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Checks</span>
                  <span className="text-sm text-slate-800 dark:text-white">{maintCheck.items.length} items</span>
                </div>
                {maintCheck.photos.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Photos</span>
                    <span className="text-sm text-slate-800 dark:text-white flex items-center gap-1"><Camera className="w-3 h-3" />{maintCheck.photos.length}</span>
                  </div>
                )}
                {maintCheck.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 p-2 rounded">{maintCheck.notes}</p>
                )}
              </CardContent>
            </Card>
          )}

          {wo.status === "in_process" && (
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-800 dark:text-white">Active Operations</CardTitle></CardHeader>
              <CardContent>
                {wo.jobCards.filter((j: JobCard) => j.status === "in_progress").map((j: JobCard) => (
                  <div key={j.id} className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                    <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-slate-800 dark:text-white">{j.operation}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Operator: {j.operator}</p>
                    </div>
                    <Badge className="bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0">Active</Badge>
                  </div>
                ))}
                {wo.jobCards.filter((j: JobCard) => j.status === "in_progress").length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No active operations</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobcards" className="mt-4 space-y-2">
          {wo.jobCards.map((jc: JobCard) => {
            const relatedQcForms = getQcFormsForStage(jc.operation);
            return (
              <Card key={jc.id} className={`bg-white border-gray-200 dark:border-slate-800 ${jc.status === "in_progress" ? "border-l-2 border-l-blue-500" : ""}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        jc.status === "completed" ? "bg-emerald-50 dark:bg-emerald-500/15" : jc.status === "in_progress" ? "bg-blue-50 dark:bg-blue-500/15" : "bg-gray-100 dark:bg-slate-800"
                      }`}>
                        {jc.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> :
                         jc.status === "in_progress" ? <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" /> :
                         <Wrench className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{jc.operation}</p>
                        {jc.operator && <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />{jc.operator}</p>}
                        {jc.duration && <p className="text-xs text-slate-600 dark:text-slate-300">{jc.duration} min</p>}
                      </div>
                    </div>
                    {jcStatus(jc.status)}
                  </div>
                  {wo.status === "in_process" && jc.status !== "completed" && (
                    <div className="mt-2 flex items-center gap-2">
                      {jc.status === "pending" ? (
                        <Button size="sm" className="h-8 text-xs bg-cyan-600 hover:bg-cyan-700" onClick={() => handleJobCardAction(jc, "start")} disabled={detailLoading}>
                          <Play className="w-3 h-3 mr-1" /> Start
                        </Button>
                      ) : (
                        <>
                          <Input
                            type="number"
                            placeholder={`Qty (${wo.uom})`}
                            value={jcCompletedQty[jc.id] || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setJcCompletedQty((prev) => ({ ...prev, [jc.id]: e.target.value }))
                            }
                            className="w-28 h-8 text-xs bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800"
                          />
                          <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleJobCardAction(jc, "complete")} disabled={detailLoading}>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                  {/* Related QC Forms */}
                  {relatedQcForms.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 uppercase mb-1">Available QC Forms</p>
                      <div className="flex flex-wrap gap-1">
                        {relatedQcForms.map((qf: QCForm) => (
                          <button
                            key={qf.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 text-[10px] text-cyan-600 dark:text-cyan-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => { setSelectedQcForm(qf); setShowQcFormModal(true); }}
                          >
                            <FileText className="w-3 h-3" />{qf.code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {wo.jobCards.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No job cards yet. Launch the WO to create job cards.</p>}
        </TabsContent>

        <TabsContent value="qc" className="mt-4 space-y-2">
          {wo.qcChecks.map((qc: QCCheck) => (
            <Card key={qc.id} className={`bg-white border-gray-200 dark:border-slate-800 ${
              qc.status === "overdue" ? "border-l-2 border-l-red-500" :
              qc.status === "pending" ? "border-l-2 border-l-amber-500" : "border-l-2 border-l-emerald-500"
            }`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-800 dark:text-white">{qc.parameter}</span>
                  </div>
                  <Badge className={
                    qc.status === "passed" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0" :
                    qc.status === "failed" ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-0" :
                    qc.status === "overdue" ? "bg-red-600 text-white border-0" :
                    "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-0"
                  }>{qc.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{qc.frequency} | Range: {qc.min} — {qc.max}</p>
                {qc.value && <p className="text-sm mt-1 text-slate-800 dark:text-white">Value: <span className="font-semibold">{qc.value}</span></p>}
                {qc.status === "pending" && (
                  <Button size="sm" variant="outline" className="mt-2 text-xs border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => { setActiveQc(qc.id); setShowQCModal(true); }}>
                    Enter Reading
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {wo.qcChecks.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No QC checks scheduled yet.</p>}
        </TabsContent>

        <TabsContent value="qcforms" className="mt-4 space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Fetch and fill QC forms relevant to the current process stage.</p>
          {availableQcForms.map((qf: QCForm) => (
            <Card key={qf.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-200 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{qf.code}</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-white">{qf.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{qf.stage}</span>
                        <span>|</span>
                        <span>{qf.frequency}</span>
                        <span>|</span>
                        <span>{qf.fields.length} fields</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800" onClick={() => { setSelectedQcForm(qf); setShowQcFormModal(true); }}>
                    Open <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="incidents" className="mt-4 space-y-2">
          {wo.incidents.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No incidents for this WO.</p>}
          {wo.incidents.map((inc: Incident) => (
            <Card key={inc.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 border-l-2 border-l-red-500">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-800 dark:text-white">{inc.type}</span>
                  <Badge className={
                    inc.severity === "critical" ? "bg-red-600 text-white text-[10px] border-0" :
                    inc.severity === "high" ? "bg-orange-500 text-slate-800 dark:text-white text-[10px] border-0" :
                    inc.severity === "medium" ? "bg-amber-500 text-black text-[10px] border-0" :
                    "bg-slate-600 text-slate-800 dark:text-white text-[10px] border-0"
                  }>{inc.severity}</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{inc.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AnimatePresence>
        {showFinishModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <Card className="w-full max-w-md bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardHeader><CardTitle className="text-slate-800 dark:text-white">Finish Work Order</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Process Loss ({wo.uom})</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button variant="outline" size="sm" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setProcessLoss(String(Math.max(0, parseInt(processLoss) - 1)))}><Minus className="w-3 h-3" /></Button>
                      <Input className="text-center bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white" value={processLoss} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProcessLoss(e.target.value)} />
                      <Button variant="outline" size="sm" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setProcessLoss(String(parseInt(processLoss) + 1))}><Plus className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Extra Goods ({wo.uom})</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button variant="outline" size="sm" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setExtraGoods(String(Math.max(0, parseInt(extraGoods) - 1)))}><Minus className="w-3 h-3" /></Button>
                      <Input className="text-center bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white" value={extraGoods} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtraGoods(e.target.value)} />
                      <Button variant="outline" size="sm" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setExtraGoods(String(parseInt(extraGoods) + 1))}><Plus className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setShowFinishModal(false)}>Cancel</Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleFinish}>
                      <Save className="w-4 h-4 mr-1" /> Confirm Finish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIncidentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <Card className="w-full max-w-md bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardHeader><CardTitle className="text-slate-800 dark:text-white">Raise Incident</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Incident Type</label>
                    <select className="w-full h-10 rounded-md border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 px-3 text-sm text-slate-800 dark:text-white mt-1" value={incidentType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIncidentType(e.target.value)}>
                      <option value="">Select type...</option>
                      <option>Equipment Fault</option>
                      <option>Quality Alert</option>
                      <option>Material Shortage</option>
                      <option>Cleaning Required</option>
                      <option>Safety</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Severity</label>
                    <div className="flex gap-2 mt-1">
                      {["low", "medium", "high", "critical"].map((s) => (
                        <button key={s} className={`flex-1 py-2 rounded-md text-xs font-medium capitalize transition-colors ${
                          incidentSev === s ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 ring-1 ring-red-500/30" : "bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-700"
                        }`} onClick={() => setIncidentSev(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Description</label>
                    <textarea className="w-full rounded-md border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-white min-h-[80px] mt-1" value={incidentDesc} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIncidentDesc(e.target.value)} placeholder="Describe the incident..." />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setShowIncidentModal(false)}>Cancel</Button>
                    <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleRaiseIncident} disabled={!incidentType || !incidentDesc}>Raise Incident</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQCModal && activeQc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <Card className="w-full max-w-sm bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardHeader><CardTitle className="text-slate-800 dark:text-white">QC Reading</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Parameter: <span className="font-medium text-slate-800 dark:text-white">{wo.qcChecks.find((q: QCCheck) => q.id === activeQc)?.parameter}</span></p>
                  <Input type="text" placeholder="Enter reading value" value={qcValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQcValue(e.target.value)} className="bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white" />
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setShowQCModal(false)}>Cancel</Button>
                    <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={() => handleQCFulfill(activeQc)} disabled={!qcValue}>Submit</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QC Form Modal */}
      <AnimatePresence>
        {showQcFormModal && selectedQcForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-lg max-h-[85vh] overflow-y-auto">
              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{selectedQcForm.code}</p>
                      <CardTitle className="text-slate-800 dark:text-white text-base">{selectedQcForm.title}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => setShowQcFormModal(false)}>
                      <AlertTriangle className="w-4 h-4 rotate-45" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedQcForm.stage} | {selectedQcForm.frequency}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedQcForm.fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-red-600 dark:text-red-400">*</span>}
                        {field.unit && <span className="text-slate-600 dark:text-slate-300">({field.unit})</span>}
                      </label>
                      {field.type === "select" && field.options ? (
                        <select className="w-full h-10 rounded-md border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 px-3 text-sm text-slate-800 dark:text-white">
                          <option value="">Select...</option>
                          {field.options.map((opt) => <option key={opt}>{opt}</option>)}
                        </select>
                      ) : field.type === "checkbox" ? (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 bg-gray-100 dark:bg-slate-800" />
                          <span className="text-sm text-slate-500 dark:text-slate-400">Yes, confirmed</span>
                        </label>
                      ) : field.type === "photo" ? (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            <Camera className="w-4 h-4 mr-1" /> Capture Photo
                          </Button>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Attach visual evidence</span>
                        </div>
                      ) : (
                        <Input
                          type={field.type}
                          placeholder={field.min !== undefined && field.max !== undefined ? `Range: ${field.min} — ${field.max}` : "Enter value..."}
                          className="bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setShowQcFormModal(false)}>Cancel</Button>
                    <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={() => setShowQcFormModal(false)}>
                      <Save className="w-4 h-4 mr-1" /> Save Form
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Maintenance Clearance Modal */}
      <AnimatePresence>
        {showMaintModal && maintCheck && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-lg max-h-[85vh] overflow-y-auto">
              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-800 dark:text-white text-base flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Pre-Start Maintenance Check
                      </CardTitle>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{maintCheck.woName} — {maintCheck.line}</p>
                    </div>
                    <Badge className={maintCleared ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0" : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-0"}>
                      {maintCheck.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/50 p-2 rounded">
                    <span>Supervisor: <span className="text-slate-800 dark:text-white">{maintCheck.supervisor}</span></span>
                    <span>Role: <span className="text-slate-800 dark:text-white">{maintCheck.supervisorRole}</span></span>
                  </div>

                  {/* Checklist Progress */}
                  {(() => {
                    const allItems = maintCheck.items.length;
                    const decidedItems = maintCheck.items.filter((item) => (maintCheckStates[item.id] || item.status) !== "na").length;
                    const pct = allItems > 0 ? Math.round((decidedItems / allItems) * 100) : 0;
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Checklist Progress</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{decidedItems}/{allItems}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  {maintCheck.items.map((item: MaintenanceCheckItem) => {
                    const currentStatus = maintCheckStates[item.id] || item.status;
                    const currentNotes = maintItemNotes[item.id] || item.notes || "";
                    return (
                      <div key={item.id} className={`p-3 rounded-lg border space-y-2 ${
                        currentStatus === "fail"
                          ? "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-900/30"
                          : currentStatus === "pass"
                          ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/30"
                          : "bg-gray-50/80 dark:bg-slate-800/50 border-gray-200 dark:border-slate-800"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 capitalize">{item.category}</Badge>
                            <span className="text-sm text-slate-800 dark:text-white">{item.check}</span>
                          </div>
                          {currentStatus === "fail" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          {currentStatus === "pass" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <div className="flex items-center gap-2">
                          {(["pass", "fail", "na"] as const).map((st) => (
                            <button
                              key={st}
                              className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                                currentStatus === st
                                  ? st === "pass" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 dark:ring-emerald-500/30" :
                                    st === "fail" ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 ring-1 ring-red-500/30" :
                                    "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-slate-500/30"
                                  : "bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                              }`}
                              onClick={() => handleMaintItemToggle(item.id, st)}
                            >
                              {st === "na" ? "N/A" : st}
                            </button>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                            onClick={() => handleMaintPhoto(item.id)}
                          >
                            <Camera className="w-3.5 h-3.5 mr-1" />
                            {maintCheckPhotos[item.id] ? "1 Photo" : "Photo"}
                          </Button>
                        </div>
                        {/* Notes per item */}
                        <input
                          type="text"
                          value={currentNotes}
                          onChange={(e) => setMaintItemNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Add notes for this check..."
                          className="w-full text-[11px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                        {maintCheckPhotos[item.id] && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Photo attached
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Resolution Decision Section (only when not yet cleared) */}
                  {!maintCleared && (
                    <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-slate-800">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" /> Resolution Decision
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMaintResolution("resolved")}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                            maintResolution === "resolved"
                              ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Resolved — Clear for Production
                        </button>
                        <button
                          onClick={() => setMaintResolution("pending")}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                            maintResolution === "pending"
                              ? "bg-purple-50 dark:bg-purple-500/15 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-400"
                              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> Pending — Hold WO
                        </button>
                      </div>

                      {maintResolution === "pending" && (
                        <textarea
                          value={maintPendingReason}
                          onChange={(e) => setMaintPendingReason(e.target.value)}
                          placeholder="Reason for pending status — what is blocking clearance?"
                          rows={2}
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        />
                      )}

                      {maintResolution === "resolved" && (
                        <textarea
                          value={maintResolutionNotes}
                          onChange={(e) => setMaintResolutionNotes(e.target.value)}
                          placeholder="Final clearance notes (optional)..."
                          rows={2}
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        />
                      )}
                    </div>
                  )}

                  {/* Existing notes (read-only) */}
                  {maintCheck.notes && (
                    <div className="p-2 bg-gray-50 dark:bg-slate-800/50 rounded text-xs text-slate-500 dark:text-slate-400">
                      <span className="text-slate-500 dark:text-slate-400">Notes:</span> {maintCheck.notes}
                    </div>
                  )}

                  {/* If already cleared, show resolution details */}
                  {maintCleared && maintCheck.resolutionStatus && (
                    <div className={`p-3 rounded-lg border ${
                      maintCheck.resolutionStatus === "resolved"
                        ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/20"
                        : "bg-purple-50 dark:bg-purple-500/5 border-purple-200 dark:border-purple-900/20"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {maintCheck.resolutionStatus === "resolved" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-purple-500" />
                        )}
                        <p className={`text-xs font-semibold ${
                          maintCheck.resolutionStatus === "resolved" ? "text-emerald-700 dark:text-emerald-400" : "text-purple-700 dark:text-purple-400"
                        }`}>
                          {maintCheck.resolutionStatus === "resolved" ? "Resolved — Cleared for Production" : "Pending — Action Required"}
                        </p>
                      </div>
                      {maintCheck.resolutionNotes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">{maintCheck.resolutionNotes}</p>
                      )}
                      {maintCheck.pendingReason && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">{maintCheck.pendingReason}</p>
                      )}
                      {maintCheck.resolvedAt && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {maintCheck.resolutionStatus === "resolved" ? "Cleared" : "Updated"} at {new Date(maintCheck.resolvedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setShowMaintModal(false)}>Close</Button>
                    {!maintCleared && (
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleCertifyMaintenance}
                        disabled={detailLoading}
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" />
                        {maintResolution === "resolved" ? "Certify Clearance" : "Save Pending Status"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
