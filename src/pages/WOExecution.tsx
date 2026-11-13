import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { erpApi } from "@/lib/erpApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, CheckCircle2, AlertTriangle, Clock, User,
  FlaskConical, Wrench, Minus, Plus, Save, Camera, ShieldCheck,
  FileText, ChevronRight, Lock, GitBranch,
} from "lucide-react";
import FlowEditor from "@/components/FlowEditor";
import { qcForms } from "@/data/mockData";
import type { WorkOrder, JobCard, QCCheck, Incident, QCForm, MaintenanceCheck, MaintenanceCheckItem } from "@/data/mockData";
import { generateId } from "@/lib/utils";

export default function WOExecution() {
  const { woId } = useParams<{ woId: string }>();
  const navigate = useNavigate();
  const { maintenanceChecks, updateMaintenanceCheck, hasPermission } = useAppStore();
  const canReportIncident = hasPermission("ops-incidents-report");
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [processLoss, setProcessLoss] = useState("0");
  const [extraGoods, setExtraGoods] = useState("0");
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentType, setIncidentType] = useState("");
  const [incidentSev, setIncidentSev] = useState("medium");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [woIncidents, setWoIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [incidentSaving, setIncidentSaving] = useState(false);
  const [showQCModal, setShowQCModal] = useState(false);
  const [qcValue, setQcValue] = useState("");
  const [activeQc, setActiveQc] = useState<string | null>(null);
  const [selectedQcForm, setSelectedQcForm] = useState<QCForm | null>(null);
  const [showQcFormModal, setShowQcFormModal] = useState(false);
  const [qcPhotos, setQcPhotos] = useState<Record<string, string>>({});
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintCheckPhotos, setMaintCheckPhotos] = useState<Record<string, string>>({});
  const [maintCheckStates, setMaintCheckStates] = useState<Record<string, "pass" | "fail" | "na">>({});
  const [maintItemNotes, setMaintItemNotes] = useState<Record<string, string>>({});
  const [maintResolution, setMaintResolution] = useState<"resolved" | "pending">("resolved");
  const [maintPendingReason, setMaintPendingReason] = useState("");
  const [maintResolutionNotes, setMaintResolutionNotes] = useState("");
  const [jobCardAction, setJobCardAction] = useState<string | null>(null);
  const [qcFormDoc, setQcFormDoc] = useState<any>(null);
  const [qcFormValues, setQcFormValues] = useState<Record<string, any>>({});
  const [qcFormLoading, setQcFormLoading] = useState(false);
  const [timeLogModal, setTimeLogModal] = useState<{ open: boolean; jobCard?: JobCard; action?: "start" | "submit" }>({ open: false });
  const [timeLogStart, setTimeLogStart] = useState("");
  const [timeLogEnd, setTimeLogEnd] = useState("");
  const [timeLogQty, setTimeLogQty] = useState("");
  const [timeLogRemarks, setTimeLogRemarks] = useState("");
  const [timeLogEmployee, setTimeLogEmployee] = useState("");
  const [employees, setEmployees] = useState<{ name: string; employee_name: string }[]>([]);

  useEffect(() => {
    erpApi.getEmployees().then((data) => setEmployees(data)).catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    if (activeTab === "incidents") {
      fetchWoIncidents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!woId) return;
    setLoading(true);
    erpApi
      .getWorkOrder(woId)
      .then((data) => setWo(data as WorkOrder))
      .catch((e) => setError(e.message || "Failed to load work order"))
      .finally(() => setLoading(false));
  }, [woId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Loading work order…</p>
      </div>
    );
  }

  if (!wo) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 dark:text-slate-400">{error || "Work Order not found"}</p>
    </div>
  );

  // Find related maintenance check
  const maintCheck = maintenanceChecks.find((mc: MaintenanceCheck) => mc.woId === wo.id);
  const maintCleared = !maintCheck || maintCheck.status === "cleared";

  // Available QC forms for this product's stages
  const availableQcForms = qcForms.filter((qf: QCForm) => qf.active);

  const refreshWorkOrder = () => {
    if (!wo) return;
    erpApi.getWorkOrder(wo.id).then((data) => setWo(data as WorkOrder));
  };

  const fetchWoIncidents = async () => {
    if (!wo) return;
    setIncidentsLoading(true);
    try {
      const rows = await erpApi.listIncidents({ work_order: wo.id });
      setWoIncidents(Array.isArray(rows) ? (rows as Incident[]) : []);
    } catch {
      setWoIncidents([]);
    } finally {
      setIncidentsLoading(false);
    }
  };

  const toBackendDt = (val: string) => {
    if (!val) return undefined;
    const d = new Date(val);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 19).replace("T", " ");
  };

  const openTimeLogModal = (jc: JobCard, action: "start" | "submit") => {
    const nowLocal = new Date().toISOString().slice(0, 16);
    setTimeLogRemarks("");
    const matched = jc.operator ? employees.find((e) => e.employee_name === jc.operator || e.name === jc.operator) : null;
    setTimeLogEmployee(matched ? matched.name : "");
    if (action === "start") {
      setTimeLogStart(nowLocal);
      setTimeLogEnd("");
      setTimeLogQty("");
    } else {
      setTimeLogStart("");
      setTimeLogEnd(nowLocal);
      setTimeLogQty(String(jc.forQuantity ?? ""));
    }
    setTimeLogModal({ open: true, jobCard: jc, action });
  };

  const closeTimeLogModal = () => setTimeLogModal({ open: false });

  const confirmTimeLog = async () => {
    const { jobCard: jc, action } = timeLogModal;
    if (!jc || !action) return;
    setJobCardAction(jc.id);
    setError("");
    try {
      if (action === "start") {
        await erpApi.startJobCard({
          job_card: jc.id,
          employee: timeLogEmployee || undefined,
          actual_start_time: toBackendDt(timeLogStart),
          remarks: timeLogRemarks || undefined,
        });
      } else {
        await erpApi.submitJobCard({
          job_card: jc.id,
          actual_end_time: toBackendDt(timeLogEnd),
          qty: parseFloat(timeLogQty) || (jc.forQuantity || 0),
          for_quantity: jc.forQuantity,
          remarks: timeLogRemarks || undefined,
        });
      }
      closeTimeLogModal();
      refreshWorkOrder();
    } catch (e: any) {
      setError(e.message || `${action} failed`);
    } finally {
      setJobCardAction(null);
    }
  };

  const handleJobCardAction = async (jc: JobCard, action: "pause" | "resume") => {
    setJobCardAction(jc.id);
    setError("");
    try {
      if (action === "pause") {
        await erpApi.pauseJobCard({ job_card: jc.id });
      } else {
        await erpApi.resumeJobCard({ job_card: jc.id });
      }
      refreshWorkOrder();
    } catch (e: any) {
      setError(e.message || `${action} failed`);
    } finally {
      setJobCardAction(null);
    }
  };

  const openQcForm = async (jc: JobCard, qf: any) => {
    setSelectedQcForm(qf);
    setShowQcFormModal(true);
    setQcFormLoading(true);
    setQcFormValues({});
    setQcFormDoc(null);
    try {
      const res = await erpApi.getQCForm(jc.id, qf.form_doctype, qf.form_name);
      const doc = res?.doc || {};
      setQcFormDoc(doc);
      // Build a values map for known scalar fields
      const vals: Record<string, any> = {};
      Object.entries(doc).forEach(([k, v]) => {
        if (typeof v !== "object" && !k.startsWith("_")) {
          vals[k] = v ?? "";
        }
      });
      setQcFormValues(vals);
    } catch (e: any) {
      setError(e.message || "Failed to load QC form");
    } finally {
      setQcFormLoading(false);
    }
  };

  const saveQcForm = async () => {
    if (!selectedQcForm || !wo) return;
    setQcFormLoading(true);
    try {
      await erpApi.submitQCForm({
        job_card: selectedQcForm.jobCardId,
        form_doctype: selectedQcForm.form_doctype,
        form_name: selectedQcForm.form_name,
        values: qcFormValues,
      });
      setShowQcFormModal(false);
      setSelectedQcForm(null);
      refreshWorkOrder();
    } catch (e: any) {
      setError(e.message || "Failed to submit QC form");
    } finally {
      setQcFormLoading(false);
    }
  };

  const handleLaunch = async () => {
    if (!maintCleared || !wo) return;
    try {
      await erpApi.launchWorkOrder(wo.id);
      refreshWorkOrder();
    } catch (e: any) {
      setError(e.message || "Launch failed");
    }
  };

  const formatError = (msg: string) =>
    msg ? msg.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "") : msg;

  const handleFinish = async () => {
    if (!wo) return;
    try {
      const loss = parseFloat(processLoss) || 0;
      const extra = parseFloat(extraGoods) || 0;
      const actualQty = wo.qty - loss + extra;
      await erpApi.finishWorkOrder({
        work_order: wo.id,
        actual_qty: actualQty,
        process_loss_qty: loss,
        extra_goods_qty: extra,
      });
      setShowFinishModal(false);
      refreshWorkOrder();
    } catch (e: any) {
      setError(e.message || "Finish failed");
    }
  };

  const handleRaiseIncident = async () => {
    if (!incidentType || !incidentDesc || !wo) return;
    setIncidentSaving(true);
    setError("");
    try {
      await erpApi.createIncident({
        type: incidentType,
        severity: incidentSev,
        description: incidentDesc,
        line: wo.fillingLine.split(" ")[0],
        work_order: wo.id,
      });
      setShowIncidentModal(false);
      setIncidentType("");
      setIncidentDesc("");
      setIncidentSev("medium");
      fetchWoIncidents();
    } catch (e: any) {
      setError(e.message || "Failed to raise incident");
    } finally {
      setIncidentSaving(false);
    }
  };

  const handleQCFulfill = (qcId: string) => {
    if (!qcValue || !wo) return;
    const updated = wo.qcChecks.map((q: QCCheck) =>
      q.id === qcId ? { ...q, status: "passed" as const, value: qcValue } : q
    );
    setWo({ ...wo, qcChecks: updated });
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

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs whitespace-pre-line">
          {formatError(error)}
        </div>
      )}

      {/* Maintenance Clearance Banner */}
      {wo.status === "draft" && maintCheck && (
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
          disabled={!maintCleared}
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
          <Button className={`h-12 bg-emerald-600 hover:bg-emerald-700 ${canReportIncident ? "flex-1" : "w-full"}`} onClick={() => setShowFinishModal(true)}>
            <CheckCircle2 className="w-4 h-4 mr-1" /> Finish WO
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Overview</TabsTrigger>
          <TabsTrigger value="jobcards" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Job Cards</TabsTrigger>
          <TabsTrigger value="qc" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">QC</TabsTrigger>
          <TabsTrigger value="qcforms" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">QC Forms</TabsTrigger>
          <TabsTrigger value="incidents" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Incidents</TabsTrigger>
          <TabsTrigger value="flow" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Flow</TabsTrigger>
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
            const apiQcForms = (jc as any).qcForms || [];
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
                        {jc.forQuantity !== undefined && <p className="text-xs text-slate-600 dark:text-slate-300">Qty: {jc.totalCompletedQty || 0}/{jc.forQuantity}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {jc.status === "pending" && (
                        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openTimeLogModal(jc, "start")} disabled={jobCardAction === jc.id}>
                          {jobCardAction === jc.id ? <Clock className="w-3 h-3 animate-spin" /> : <><Play className="w-3 h-3 mr-1" /> Start</>}
                        </Button>
                      )}
                      {jc.status === "in_progress" && (
                        <>
                          <Button size="sm" variant="outline" className="h-8 border-gray-200 dark:border-slate-800" onClick={() => handleJobCardAction(jc, "pause")} disabled={jobCardAction === jc.id}>
                            Pause
                          </Button>
                          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openTimeLogModal(jc, "submit")} disabled={jobCardAction === jc.id}>
                            {jobCardAction === jc.id ? <Clock className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3 mr-1" /> Complete</>}
                          </Button>
                        </>
                      )}
                      {jc.status === "on_hold" && (
                        <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleJobCardAction(jc, "resume")} disabled={jobCardAction === jc.id}>
                          <Play className="w-3 h-3 mr-1" /> Resume
                        </Button>
                      )}
                      {jcStatus(jc.status)}
                    </div>
                  </div>
                  {/* Related QC Forms from Process Route */}
                  {apiQcForms.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 uppercase mb-1">QC Forms</p>
                      <div className="flex flex-wrap gap-1">
                        {apiQcForms.map((qf: any) => (
                          <button
                            key={`${qf.form_doctype}-${qf.form_name}`}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] transition-colors ${
                              qf.status === "Submitted"
                                ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                : "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                            }`}
                            onClick={() => openQcForm({ ...jc, id: jc.id } as JobCard, { ...qf, jobCardId: jc.id })}
                          >
                            <FileText className="w-3 h-3" />
                            {qf.form_doctype} {qf.status === "Submitted" ? "✓" : qf.required ? "*" : ""}
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
          {incidentsLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-400 text-sm">
              <Clock className="w-4 h-4 animate-spin" /> Loading incidents…
            </div>
          )}
          {!incidentsLoading && woIncidents.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No incidents for this WO.</p>}
          {!incidentsLoading && woIncidents.map((inc: Incident) => (
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

        <TabsContent value="flow" className="mt-4 space-y-3">
          {wo.processFlow ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-pink-500" />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Process Flow</h3>
                  {wo.flowVersions && wo.flowVersions.length > 0 && (
                    <Badge className="text-[10px] border-0 bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{wo.flowVersions.length} versions</Badge>
                  )}
                </div>
                {hasPermission("ops-dss-builder") && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                      onClick={() => {
                        const version = {
                          id: generateId("fv"),
                          savedAt: new Date().toISOString(),
                          savedBy: useAppStore.getState().user?.name,
                          nodes: JSON.parse(JSON.stringify(wo.processFlow!.nodes)),
                          edges: JSON.parse(JSON.stringify(wo.processFlow!.edges)),
                        };
                        setWo({
                          ...wo,
                          flowVersions: [...(wo.flowVersions || []), version],
                        });
                      }}>
                      <Save className="w-3 h-3 mr-1" /> Snapshot
                    </Button>
                  </div>
                )}
              </div>
              <FlowEditor
                initialNodes={wo.processFlow.nodes}
                initialEdges={wo.processFlow.edges}
                readOnly={!hasPermission("ops-dss-builder")}
                onChange={(nodes, edges) => {
                  setWo({
                    ...wo,
                    processFlow: { nodes, edges },
                    flowModifiedAt: new Date().toISOString(),
                    flowModifiedBy: useAppStore.getState().user?.name,
                  });
                }}
              />
              {wo.flowVersions && wo.flowVersions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Version History</h4>
                  <div className="flex flex-wrap gap-2">
                    {wo.flowVersions.map((v, i) => (
                      <Badge key={v.id} variant="outline" className="text-[10px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                        onClick={() => {
                          if (confirm(`Restore version ${i + 1} from ${new Date(v.savedAt).toLocaleString()}?`)) {
                            setWo({
                              ...wo,
                              processFlow: { nodes: JSON.parse(JSON.stringify(v.nodes)), edges: JSON.parse(JSON.stringify(v.edges)) },
                              flowModifiedAt: new Date().toISOString(),
                              flowModifiedBy: useAppStore.getState().user?.name,
                            });
                          }
                        }}>
                        v{i + 1} — {new Date(v.savedAt).toLocaleDateString()} {v.savedBy ? `by ${v.savedBy}` : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <GitBranch className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">No process flow defined for this Work Order.</p>
              {hasPermission("ops-dss-builder") && (
                <Button size="sm" className="bg-pink-600 text-white text-xs" onClick={() => {
                  setWo({
                    ...wo,
                    processFlow: { nodes: [], edges: [] },
                    flowVersions: [],
                    flowModifiedAt: new Date().toISOString(),
                  });
                }}>
                  <Plus className="w-3 h-3 mr-1" /> Create Flow
                </Button>
              )}
            </div>
          )}
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
                    <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleRaiseIncident} disabled={!incidentType || !incidentDesc || incidentSaving}>
                      {incidentSaving ? "Raising…" : "Raise Incident"}
                    </Button>
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
                      <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{selectedQcForm.form_doctype}</p>
                      <CardTitle className="text-slate-800 dark:text-white text-base">{selectedQcForm.form_name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => setShowQcFormModal(false)}>
                      <AlertTriangle className="w-4 h-4 rotate-45" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {qcFormLoading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Loading form…</p>
                  ) : (
                    <>
                      {Object.entries(qcFormValues).filter(([k]) => !["name", "owner", "creation", "modified", "modified_by", "docstatus", "amended_from", "idx"].includes(k)).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs text-slate-500 dark:text-slate-400 capitalize">{key.replace(/_/g, " ")}</label>
                          <Input
                            type="text"
                            value={String(value ?? "")}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQcFormValues({ ...qcFormValues, [key]: e.target.value })}
                            className="bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setShowQcFormModal(false)}>Cancel</Button>
                        <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={saveQcForm} disabled={qcFormLoading}>
                          <Save className="w-4 h-4 mr-1" /> Submit Form
                        </Button>
                      </div>
                    </>
                  )}
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
                        onClick={() => {
                          const now = new Date().toISOString();
                          const updatedItems = maintCheck.items.map((item) => ({
                            ...item,
                            status: maintCheckStates[item.id] || item.status,
                            notes: maintItemNotes[item.id] || item.notes,
                            photo: maintCheckPhotos[item.id] || item.photo,
                          }));
                          updateMaintenanceCheck(maintCheck.id, {
                            items: updatedItems,
                            status: maintResolution === "resolved" ? "cleared" : "pending",
                            clearedAt: maintResolution === "resolved" ? now : undefined,
                            resolutionStatus: maintResolution,
                            pendingReason: maintResolution === "pending" ? maintPendingReason : undefined,
                            resolutionNotes: maintResolution === "resolved" ? maintResolutionNotes : undefined,
                            resolvedAt: now,
                            photos: Object.values(maintCheckPhotos),
                          });
                          setShowMaintModal(false);
                        }}
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

      {/* Job Card Time Log Modal */}
      <AnimatePresence>
        {timeLogModal.open && timeLogModal.jobCard && timeLogModal.action && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <Card className="w-full max-w-md bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-800 dark:text-white">
                    {timeLogModal.action === "start" ? "Start Job Card" : "Complete Job Card"}
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{timeLogModal.jobCard.operation}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {timeLogModal.action === "start" ? (
                    <>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400">Operator / Employee *</label>
                        <Select value={timeLogEmployee} onValueChange={setTimeLogEmployee}>
                          <SelectTrigger className="w-full bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white mt-1">
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent position="popper" side="bottom" align="start" sideOffset={4} className="z-50 max-h-60">
                            {employees.map((emp) => (
                              <SelectItem key={emp.name} value={emp.name}>
                                {emp.employee_name} <span className="text-xs text-slate-400">({emp.name})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400">Actual Start Time</label>
                        <Input
                          type="datetime-local"
                          value={timeLogStart}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeLogStart(e.target.value)}
                          className="bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white mt-1"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400">Actual End Time</label>
                        <Input
                          type="datetime-local"
                          value={timeLogEnd}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeLogEnd(e.target.value)}
                          className="bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400">Completed Quantity ({wo.uom})</label>
                        <Input
                          type="number"
                          min={1}
                          value={timeLogQty}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeLogQty(e.target.value)}
                          className="bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white mt-1"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Remarks</label>
                    <textarea
                      value={timeLogRemarks}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTimeLogRemarks(e.target.value)}
                      placeholder="Add optional remarks..."
                      className="w-full rounded-md border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-white min-h-[60px] mt-1"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={closeTimeLogModal}>Cancel</Button>
                    <Button
                      className={`flex-1 ${timeLogModal.action === "start" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                      onClick={confirmTimeLog}
                      disabled={jobCardAction === timeLogModal.jobCard.id || (timeLogModal.action === "start" && !timeLogEmployee.trim())}
                    >
                      {jobCardAction === timeLogModal.jobCard.id ? <Clock className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> {timeLogModal.action === "start" ? "Start" : "Complete"}</>}
                    </Button>
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
