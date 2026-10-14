import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mesForms, workOrders } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/appStore";
import {
  getMaintenanceForms,
  getMaintenanceForm,
  submitMaintenanceForm,
  type MaintenanceForm,
  type MaintenanceFormItem,
  type MaintenanceFormResponseInput,
} from "@/services/erpnext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, FileText, Plus, Paperclip, Camera,
  ChevronDown, ChevronUp, FolderOpen, WifiOff, RefreshCw,
  Save, XCircle, CheckCircle2,
} from "lucide-react";

const categoryColors: Record<string, string> = {
  Production: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  Quality: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Maintenance: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
  Warehouse: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  Safety: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  HR: "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

const categoryIcons: Record<string, typeof FileText> = {
  Production: FolderOpen,
  Quality: FileText,
  Maintenance: FileText,
  Warehouse: FileText,
  Safety: FileText,
  HR: FileText,
};

interface DisplayForm {
  id: string;
  code: string;
  title: string;
  category: string;
  subcategory: string;
  version: string;
  active: boolean;
  fields: number;
  attachments: number;
  lastUpdated: string;
  template?: MaintenanceForm;
}

interface FormResponse {
  item: string;
  result: "Pass" | "Fail" | "N/A";
  readingValue: string;
  observation: string;
}

export default function AdminForms() {
  const navigate = useNavigate();
  const { erpConnection } = useAppStore();

  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<DisplayForm | null>(null);

  const [liveMode, setLiveMode] = useState(false);
  const [liveForms, setLiveForms] = useState<DisplayForm[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");

  // Fill modal state
  const [fillTemplate, setFillTemplate] = useState<MaintenanceForm | null>(null);
  const [fillLoading, setFillLoading] = useState(false);
  const [fillError, setFillError] = useState("");
  const [fillSuccess, setFillSuccess] = useState("");
  const [selectedWO, setSelectedWO] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [remarks, setRemarks] = useState("");
  const [responses, setResponses] = useState<Record<string, FormResponse>>({});

  const woOptions = workOrders.map((wo) => ({ id: wo.id, name: wo.name }));
  const shiftOptions = ["Morning", "Afternoon", "Night"];

  const fetchLiveForms = async () => {
    setLiveLoading(true);
    setLiveError("");
    try {
      const forms = await getMaintenanceForms(100);
      const mapped: DisplayForm[] = forms.map((f) => ({
        id: f.name,
        code: f.name,
        title: f.equipment,
        category: mapCategory("maintenance", f.equipment),
        subcategory: `${f.area} — ${f.equipment}`,
        version: "v1.0",
        active: true,
        fields: f.items.length,
        attachments: 0,
        lastUpdated: new Date().toISOString().slice(0, 10),
        template: f,
      }));
      setLiveForms(mapped);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : String(err));
    } finally {
      setLiveLoading(false);
    }
  };

  const openFillModal = async (form: DisplayForm) => {
    setSelectedForm(null);
    setFillSuccess("");
    setFillError("");
    setResponses({});
    setRemarks("");
    setSelectedWO(woOptions[0]?.id || "");
    setSelectedShift(shiftOptions[0] || "");

    if (form.template) {
      setFillLoading(true);
      try {
        const full = await getMaintenanceForm(form.template.name);
        setFillTemplate(full);
        const initial: Record<string, FormResponse> = {};
        full.items.forEach((item) => {
          initial[item.name] = {
            item: item.name,
            result: item.pass__fail === "Fail" ? "Fail" : item.pass__fail === "N/A" ? "N/A" : "Pass",
            readingValue: item.standard_time_mins ? String(item.standard_time_mins) : "",
            observation: item.remarks || "",
          };
        });
        setResponses(initial);
      } catch (err) {
        setFillError(err instanceof Error ? err.message : String(err));
      } finally {
        setFillLoading(false);
      }
    }
  };

  const closeFillModal = () => {
    setFillTemplate(null);
    setFillError("");
    setFillSuccess("");
    setResponses({});
  };

  const updateResponse = (itemName: string, updates: Partial<FormResponse>) => {
    setResponses((prev) => ({
      ...prev,
      [itemName]: { ...prev[itemName], ...updates },
    }));
  };

  const handleSubmit = async () => {
    if (!fillTemplate) return;
    setFillLoading(true);
    setFillError("");
    setFillSuccess("");

    try {
      const items: MaintenanceFormResponseInput[] = fillTemplate.items.map((it) => {
        const resp = responses[it.name];
        return {
          item: it.description || it.name,
          result: resp?.result || "Pass",
          reading_value: resp?.readingValue ? Number(resp.readingValue) : undefined,
          observation: resp?.observation,
        };
      });

      const selectedWorkOrder = woOptions.find((wo) => wo.id === selectedWO);

      const result = await submitMaintenanceForm({
        equipment: fillTemplate.equipment,
        area: fillTemplate.area,
        work_order: selectedWorkOrder?.name || selectedWO,
        overall_remarks: [remarks, selectedShift && `Shift: ${selectedShift}`].filter(Boolean).join(" | "),
        items,
      });

      setFillSuccess(`Submitted successfully: ${result.name}`);
      setTimeout(() => closeFillModal(), 1500);
    } catch (err) {
      setFillError(err instanceof Error ? err.message : String(err));
    } finally {
      setFillLoading(false);
    }
  };

  const displayForms: DisplayForm[] = liveMode ? liveForms : mesForms.map((f) => ({ ...f, template: undefined }));

  const categories = useMemo(() => {
    const map = new Map<string, DisplayForm[]>();
    displayForms.forEach((f) => {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [displayForms]);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const term = search.toLowerCase();
    return categories
      .map(([cat, forms]) => [
        cat,
        forms.filter((f) =>
          f.title.toLowerCase().includes(term) ||
          f.code.toLowerCase().includes(term) ||
          f.subcategory.toLowerCase().includes(term)
        ),
      ])
      .filter(([, forms]) => forms.length > 0) as [string, DisplayForm[]][];
  }, [search, categories]);

  const totalForms = displayForms.length;
  const activeForms = displayForms.filter((f) => f.active).length;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Forms Library</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Categorized MES forms and templates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {erpConnection.connected && (
            <>
              <Button
                size="sm"
                variant={liveMode ? "default" : "outline"}
                className={liveMode ? "bg-cyan-600 hover:bg-cyan-700 text-white" : ""}
                onClick={() => {
                  setLiveMode(!liveMode);
                  if (!liveMode && liveForms.length === 0) fetchLiveForms();
                }}
              >
                {liveMode ? "Mock Data" : "Live Data"}
              </Button>
              {liveMode && (
                <Button size="sm" variant="outline" onClick={fetchLiveForms} disabled={liveLoading}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${liveLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              )}
            </>
          )}
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> New Form
          </Button>
        </div>
      </div>

      {liveError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/20 text-sm text-red-600 dark:text-red-400">
          {liveError}
        </div>
      )}

      {!erpConnection.connected && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/20 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          Not connected to ERPNext. Go to Admin → BOM to connect, then you can fetch live checklist forms.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Forms", value: totalForms },
          { label: "Active", value: activeForms },
          { label: "Categories", value: categories.length },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
        <Input
          placeholder="Search forms by code, title, or subcategory..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Category Accordions */}
      <div className="space-y-3">
        {filteredCategories.map(([category, forms], catIdx) => {
          const isExpanded = expandedCategory === category || !!search;
          const Icon = categoryIcons[category] || FileText;
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.05 }}
            >
              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/80 transition-colors"
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryColors[category]?.split(" ")[0] || "bg-gray-100 dark:bg-slate-800"}`}>
                      <Icon className={`w-5 h-5 ${categoryColors[category]?.split(" ")[1]?.replace("text-", "") ? `text-${categoryColors[category]?.split(" ")[1]?.replace("text-", "")}` : "text-slate-500 dark:text-slate-400"}`} style={{ color: "inherit" }} />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-white">{category}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{forms.length} forms</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-t-lg text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                          <div className="col-span-1">Code</div>
                          <div className="col-span-4">Title</div>
                          <div className="col-span-3">Subcategory</div>
                          <div className="col-span-1 text-center">Fields</div>
                          <div className="col-span-1 text-center">Attach</div>
                          <div className="col-span-2 text-right">Actions</div>
                        </div>
                        {forms.map((form: DisplayForm, formIdx: number) => (
                          <motion.div
                            key={form.id}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: formIdx * 0.03 }}
                            className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50/60 rounded items-center hover:bg-gray-100/40 cursor-pointer transition-colors"
                            onClick={() => setSelectedForm(selectedForm?.id === form.id ? null : form)}
                          >
                            <div className="col-span-1">
                              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{form.code}</span>
                            </div>
                            <div className="col-span-4">
                              <span className="text-sm text-slate-800 dark:text-white">{form.title}</span>
                            </div>
                            <div className="col-span-3">
                              <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">{form.subcategory}</Badge>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className="text-xs text-slate-500 dark:text-slate-400">{form.fields}</span>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                                <Paperclip className="w-3 h-3" />{form.attachments}
                              </span>
                            </div>
                            <div className="col-span-2 text-right flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                onClick={(e) => { e.stopPropagation(); setSelectedForm(form); }}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </Button>
                              {liveMode && form.template && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
                                  onClick={(e) => { e.stopPropagation(); openFillModal(form); }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Fill
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
        {filteredCategories.length === 0 && !liveLoading && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-slate-700 dark:text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No forms found</p>
          </div>
        )}
        {liveLoading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading forms from ERPNext...</p>
          </div>
        )}
      </div>

      {/* Form Preview Modal */}
      <AnimatePresence>
        {selectedForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedForm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{selectedForm.code}</p>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedForm.title}</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => setSelectedForm(null)}>
                  <ChevronUp className="w-4 h-4 rotate-180" />
                </Button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">Category</p><p className="text-slate-800 dark:text-white">{selectedForm.category}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">Subcategory</p><p className="text-slate-800 dark:text-white">{selectedForm.subcategory}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">Version</p><p className="text-slate-800 dark:text-white">{selectedForm.version}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p><p className="text-slate-800 dark:text-white">{selectedForm.lastUpdated}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">Fields</p><p className="text-slate-800 dark:text-white">{selectedForm.fields}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">Attachments</p><p className="text-slate-800 dark:text-white">{selectedForm.attachments}</p></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => { setSelectedForm(null); if (selectedForm.template) openFillModal(selectedForm); }}>
                    <FileText className="w-4 h-4 mr-1" /> {liveMode ? "Fill Form" : "Open Form"}
                  </Button>
                  <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800">
                    <Camera className="w-4 h-4 mr-1" /> Attach Photo
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fill Form Modal */}
      <AnimatePresence>
        {fillTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeFillModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{fillTemplate.name}</p>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{fillTemplate.equipment}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{fillTemplate.area}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={closeFillModal}>
                  <XCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </Button>
              </div>

              <div className="p-4 space-y-4">
                {fillError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-sm text-red-600 dark:text-red-400">
                    {fillError}
                  </div>
                )}
                {fillSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {fillSuccess}
                  </div>
                )}

                {/* Context fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Work Order</label>
                    <select
                      className="mt-1 w-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-white"
                      value={selectedWO}
                      onChange={(e) => setSelectedWO(e.target.value)}
                    >
                      {woOptions.map((wo) => <option key={wo.id} value={wo.id}>{wo.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Shift</label>
                    <select
                      className="mt-1 w-full text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-white"
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                    >
                      {shiftOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Remarks</label>
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional remarks..."
                    className="mt-1 text-xs"
                  />
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {fillTemplate.items.map((item: MaintenanceFormItem) => (
                    <div key={item.name} className="p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{item.description}</p>
                          {item.standard_time_mins > 0 && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Std time: {item.standard_time_mins} min</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {(["Pass", "Fail", "N/A"] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => updateResponse(item.name, { result: r })}
                              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                                responses[item.name]?.result === r
                                  ? r === "Pass" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" :
                                    r === "Fail" ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400" :
                                    "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                  : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <Input
                          type="number"
                          step="any"
                          placeholder="Reading / time (min)"
                          value={responses[item.name]?.readingValue || ""}
                          onChange={(e) => updateResponse(item.name, { readingValue: e.target.value })}
                          className="text-xs"
                        />
                        <Input
                          placeholder="Observation / notes"
                          value={responses[item.name]?.observation || ""}
                          onChange={(e) => updateResponse(item.name, { observation: e.target.value })}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex gap-2">
                <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={closeFillModal}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={handleSubmit}
                  disabled={fillLoading || !!fillSuccess}
                >
                  {fillLoading ? "Submitting..." : <><Save className="w-4 h-4 mr-1" /> Submit Form</>}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function mapCategory(_hint: string, equipment: string): string {
  const e = equipment.toLowerCase();
  if (e.includes("air") || e.includes("compressor") || e.includes("pallet") || e.includes("boiler") || e.includes("pump")) return "Maintenance";
  if (e.includes("lab") || e.includes("qc")) return "Quality";
  if (e.includes("line") || e.includes("filler") || e.includes("bottl")) return "Production";
  if (e.includes("safety")) return "Safety";
  if (e.includes("warehouse")) return "Warehouse";
  return "Maintenance";
}
