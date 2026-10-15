import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/appStore";
import {
  ArrowLeft, FlaskConical, CheckCircle2, XCircle, FileText,
  ChevronRight, Save, Clock,
} from "lucide-react";
import type { QCForm, QCCheck } from "@/data/mockData";
import { qcForms } from "@/data/mockData";
import {
  getMaintenanceForms,
  getMaintenanceForm,
  submitMaintenanceForm,
  type MaintenanceForm,
  type MaintenanceFormItem,
  type MaintenanceFormResponseInput,
} from "@/services/erpnext";

interface CheckWithWO extends QCCheck {
  woName: string;
  product: string;
  variant: string;
}

export default function QC() {
  const navigate = useNavigate();
  const { workOrders, hasPermission, erpConnection } = useAppStore();
  const liveMode = erpConnection.connected;
  const [activeTab, setActiveTab] = useState<"checks" | "forms" | "history">("checks");
  const [selectedForm, setSelectedForm] = useState<QCForm | null>(null);
  const [selectedMaintForm, setSelectedMaintForm] = useState<MaintenanceForm | null>(null);
  const [maintFormItems, setMaintFormItems] = useState<MaintenanceFormItem[]>([]);
  const [maintFormResponses, setMaintFormResponses] = useState<Record<string, "Pass" | "Fail" | "N/A">>({});
  const [maintFormReadings, setMaintFormReadings] = useState<Record<string, string>>({});
  const [maintForms, setMaintForms] = useState<MaintenanceForm[]>([]);
  const [maintFormError, setMaintFormError] = useState("");
  const [maintFormLoading, setMaintFormLoading] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<CheckWithWO | null>(null);
  const [qcValue, setQcValue] = useState("");
  const [qcDecision, setQcDecision] = useState<"passed" | "failed" | null>(null);
  const [qcNotes, setQcNotes] = useState("");

  const canSubmit = hasPermission("ops-qc");

  useEffect(() => {
    if (!liveMode || activeTab !== "forms") return;
    setMaintFormLoading(true);
    setMaintFormError("");
    getMaintenanceForms()
      .then(setMaintForms)
      .catch((err) => setMaintFormError(err instanceof Error ? err.message : String(err)))
      .finally(() => setMaintFormLoading(false));
  }, [liveMode, activeTab]);

  // Flatten all QC checks from work orders
  const allChecks: CheckWithWO[] = workOrders.flatMap((wo) =>
    wo.qcChecks.map((qc) => ({
      ...qc,
      woName: wo.name,
      product: wo.product,
      variant: wo.variant,
    }))
  );

  const pendingChecks = allChecks.filter((c) => c.status === "pending");
  const passedChecks = allChecks.filter((c) => c.status === "passed");
  const failedChecks = allChecks.filter((c) => c.status === "failed");
  const overdueChecks = allChecks.filter((c) => c.status === "overdue");

  const historyChecks = allChecks.filter((c) => c.status === "passed" || c.status === "failed");

  const submitCheck = () => {
    setSelectedCheck(null);
    setQcValue("");
    setQcDecision(null);
    setQcNotes("");
  };

  const submitQcForm = () => {
    setSelectedForm(null);
  };

  const openMaintForm = async (f: MaintenanceForm) => {
    setSelectedMaintForm(f);
    setMaintFormLoading(true);
    try {
      const full = await getMaintenanceForm(f.name);
      setMaintFormItems(full.items || []);
      setMaintFormResponses({});
      setMaintFormReadings({});
    } catch (err) {
      setMaintFormError(err instanceof Error ? err.message : String(err));
      setSelectedMaintForm(null);
    } finally {
      setMaintFormLoading(false);
    }
  };

  const closeMaintForm = () => {
    setSelectedMaintForm(null);
    setMaintFormItems([]);
    setMaintFormResponses({});
    setMaintFormReadings({});
  };

  const submitMaintForm = async () => {
    if (!selectedMaintForm) return;
    const items: MaintenanceFormResponseInput[] = maintFormItems.map((it) => ({
      item: it.description,
      result: maintFormResponses[it.name] || "N/A",
      reading_value: parseFloat(maintFormReadings[it.name] || "0") || 0,
      observation: "",
    }));
    try {
      await submitMaintenanceForm({
        work_order: selectedMaintForm.work_order,
        equipment: selectedMaintForm.equipment,
        area: selectedMaintForm.area,
        overall_remarks: "Submitted from MES QC Forms Library",
        items,
      });
      closeMaintForm();
    } catch (err) {
      setMaintFormError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Quality Control</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">QC checks, forms & history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending", val: pendingChecks.length, color: "text-amber-600 dark:text-amber-400" },
          { label: "Passed", val: passedChecks.length, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Failed", val: failedChecks.length, color: "text-red-600 dark:text-red-400" },
          { label: "Overdue", val: overdueChecks.length, color: "text-purple-600 dark:text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-800">
        {(["checks", "forms", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium transition-all border-b-2 ${
              activeTab === tab
                ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab === "checks" ? "Pending Checks" : tab === "forms" ? "Forms Library" : "Completed History"}
          </button>
        ))}
      </div>

      {/* Pending Checks Tab */}
      {activeTab === "checks" && (
        <div className="space-y-2">
          {pendingChecks.length > 0 ? pendingChecks.map((check) => (
            <Card key={check.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
                      <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{check.parameter}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {check.woName} — {check.product} ({check.variant})
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {check.dueAt}</span>
                        <span>Range: {check.min}–{check.max}</span>
                        <span>{check.frequency}</span>
                      </div>
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
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">All checks are up to date!</p>
            </div>
          )}
        </div>
      )}

      {/* Forms Library Tab */}
      {activeTab === "forms" && (
        <div className="space-y-2">
          {maintFormError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/20 text-sm text-red-600 dark:text-red-400">
              {maintFormError}
            </div>
          )}
          {maintFormLoading && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Loading forms from ERPNext...</p>
          )}
          {liveMode && !maintFormLoading && maintForms.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No maintenance forms found in ERPNext.</p>
          )}
          {liveMode
            ? maintForms.map((f) => (
                <motion.div key={f.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-colors cursor-pointer" onClick={() => openMaintForm(f)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{f.equipment}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{f.name} — {f.area} — {f.items.length} items</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            : qcForms.filter((f) => f.active).map((form) => (
                <motion.div key={form.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-colors cursor-pointer" onClick={() => setSelectedForm(form)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{form.title}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{form.code} — {form.category} — {form.frequency}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {historyChecks.length > 0 ? historyChecks.map((check) => (
            <Card key={`${check.woName}-${check.id}`} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-slate-800 dark:text-white">{check.parameter}</p>
                      <Badge className={`text-[10px] border-0 ${
                        check.status === "passed" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                        "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
                      }`}>{check.status}</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{check.woName} — {check.product}</p>
                    {check.value && (
                      <p className="text-[10px] text-slate-600 dark:text-slate-300">
                        Value: <span className="font-medium">{check.value}</span>
                        {check.min !== 0 && check.max !== 0 && ` (range: ${check.min}–${check.max})`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No completed checks yet</p>
          )}
        </div>
      )}

      {/* QC Check Modal */}
      <AnimatePresence>
        {selectedCheck && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCheck(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{selectedCheck.parameter}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedCheck.woName} — Due {selectedCheck.dueAt}</p>
                </div>
                <button onClick={() => setSelectedCheck(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acceptance Range</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{selectedCheck.min} – {selectedCheck.max}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedCheck.frequency}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Measured Value</label>
                  <Input
                    type="text"
                    placeholder="Enter measured value..."
                    value={qcValue}
                    onChange={(e) => setQcValue(e.target.value)}
                    className="text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Decision</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setQcDecision("passed")}
                      className={`flex-1 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                        qcDecision === "passed" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20" : "bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </button>
                    <button
                      onClick={() => setQcDecision("failed")}
                      className={`flex-1 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                        qcDecision === "failed" ? "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/20" : "bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Fail
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Notes (optional)</label>
                  <Input
                    type="text"
                    placeholder="Add notes..."
                    value={qcNotes}
                    onChange={(e) => setQcNotes(e.target.value)}
                    className="text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex gap-2">
                <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setSelectedCheck(null)}>Cancel</Button>
                <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={submitCheck}>
                  <Save className="w-3.5 h-3.5 mr-1" /> Submit Result
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QC Form Modal */}
      <AnimatePresence>
        {selectedForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedForm(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{selectedForm.title}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedForm.code} — {selectedForm.category} — {selectedForm.frequency}</p>
                </div>
                <button onClick={() => setSelectedForm(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"><XCircle className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-3">
                {selectedForm.fields.map((field) => (
                  <div key={field.id} className="p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-xs font-medium text-slate-800 dark:text-white">{field.label} {field.required && <span className="text-red-500">*</span>}</p>
                    {field.type === "number" && (
                      <Input type="number" placeholder="Enter value..." className="mt-1.5 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
                    )}
                    {field.type === "text" && (
                      <Input type="text" placeholder="Enter text..." className="mt-1.5 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
                    )}
                    {field.type === "select" && (
                      <select className="mt-1.5 w-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-white">
                        <option value="">Select...</option>
                        {field.options?.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                      </select>
                    )}
                    {field.type === "checkbox" && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-slate-600" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">Confirm</span>
                      </div>
                    )}
                    {field.type === "photo" && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Button size="sm" variant="outline" className="text-xs border-gray-200 dark:border-slate-800">
                          <FileText className="w-3 h-3 mr-1" /> Attach Photo
                        </Button>
                      </div>
                    )}
                    {field.unit && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Unit: {field.unit}</p>}
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex gap-2">
                <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setSelectedForm(null)}>Cancel</Button>
                <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={submitQcForm}>
                  <Save className="w-3.5 h-3.5 mr-1" /> Submit Form
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERPNext Maintenance Form Modal */}
      <AnimatePresence>
        {selectedMaintForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4" onClick={closeMaintForm}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{selectedMaintForm.equipment}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedMaintForm.name} — {selectedMaintForm.area}</p>
                </div>
                <button onClick={closeMaintForm} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"><XCircle className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-3">
                {maintFormItems.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No items in this form.</p>
                )}
                {maintFormItems.map((it) => (
                  <div key={it.name} className="p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-xs font-medium text-slate-800 dark:text-white">{it.description}</p>
                    <div className="flex gap-2 mt-2">
                      {(["Pass", "Fail", "N/A"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setMaintFormResponses((prev) => ({ ...prev, [it.name]: r }))}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                            maintFormResponses[it.name] === r
                              ? r === "Pass" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20" :
                                r === "Fail" ? "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/20" :
                                "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/30"
                              : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      placeholder="Reading / time (mins)"
                      value={maintFormReadings[it.name] || ""}
                      onChange={(e) => setMaintFormReadings((prev) => ({ ...prev, [it.name]: e.target.value }))}
                      className="mt-2 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    />
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex gap-2">
                <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={closeMaintForm}>Cancel</Button>
                <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={submitMaintForm} disabled={maintFormLoading}>
                  <Save className="w-3.5 h-3.5 mr-1" /> Submit Form
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
