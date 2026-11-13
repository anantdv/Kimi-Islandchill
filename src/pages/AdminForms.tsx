import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { MESForm } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, FileText, FolderOpen, ChevronDown, ChevronUp, X, Loader2, AlertCircle, Send, Plus, Trash2, Upload, CheckCircle2, List, Calendar } from "lucide-react";
import { erpApi } from "@/lib/erpApi";
import { useAppStore } from "@/stores/appStore";

const categoryColors: Record<string, string> = {
  Production: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  Quality: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Maintenance: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
  Warehouse: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  Safety: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  "Health & Safety": "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  HR: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400",
  Laboratory: "bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400",
  "Cleaning & Sanitation": "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
};

const categoryIcons: Record<string, typeof FileText> = {
  Production: FolderOpen,
  Quality: FileText,
  Maintenance: FileText,
  Warehouse: FileText,
  Safety: FileText,
  "Health & Safety": FileText,
  HR: FileText,
  Laboratory: FileText,
  "Cleaning & Sanitation": FileText,
};

interface FormField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options: string;
  reqd: boolean;
  default?: string;
  readOnly?: boolean;
  description?: string;
  dependsOn?: string;
  mandatoryDependsOn?: string;
  childFields?: FormField[];
}

interface FormSchema {
  name: string;
  formName: string;
  formNumber?: string;
  documentType: string;
  category: string;
  subcategory: string;
  description: string;
  schema: {
    name: string;
    fields: FormField[];
  };
}

interface FormSubmission {
  id: string;
  title: string;
  createdAt: string;
  modifiedAt: string;
  owner: string;
}

interface SubmissionDetailField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options: string;
  value: any;
  childFields?: { fieldname: string; label: string }[];
}

interface FormSubmissionDetail {
  name: string;
  documentType: string;
  owner: string;
  createdAt: string;
  modifiedAt: string;
  fields: SubmissionDetailField[];
}

export default function AdminForms() {
  const navigate = useNavigate();
  const { mesForms: fallbackForms } = useAppStore();
  const [forms, setForms] = useState<MESForm[]>(fallbackForms);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [selectedForm, setSelectedForm] = useState<MESForm | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "submit" | "submissions">("info");

  useEffect(() => {
    let cancelled = false;
    erpApi
      .getFormsLibrary()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? (data as MESForm[]) : [];
        setForms(list.length ? list : fallbackForms);
        setError("");
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e.message || "Failed to load forms from ERPNext");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fallbackForms]);

  const categories = useMemo(() => {
    const map = new Map<string, MESForm[]>();
    forms.forEach((f: MESForm) => {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [forms]);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const term = search.toLowerCase();
    return categories
      .map(([cat, list]) => [
        cat,
        list.filter(
          (f: MESForm) =>
            f.title.toLowerCase().includes(term) ||
            f.code.toLowerCase().includes(term) ||
            f.subcategory.toLowerCase().includes(term)
        ),
      ] as [string, MESForm[]])
      .filter(([, list]) => list.length > 0);
  }, [search, categories]);

  const totalForms = forms.length;
  const activeForms = forms.filter((f: MESForm) => f.active).length;

  const openForm = (form: MESForm, tab: "info" | "submit" | "submissions" = "info") => {
    setSelectedForm(form);
    setActiveTab(tab);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Forms Library</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Categorized MES forms and templates from ERPNext</p>
          </div>
        </div>
      </div>

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
        <Input
          placeholder="Search forms by code, title, or document type..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-500"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading forms from ERPNext...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {filteredCategories.map(([category, list], catIdx) => {
            const isExpanded = !collapsedCategories.has(category) || !!search;
            const Icon = categoryIcons[category] || FileText;
            return (
              <motion.div key={category} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: catIdx * 0.05 }}>
                <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() =>
                      setCollapsedCategories((prev) => {
                        const next = new Set(prev);
                        if (next.has(category)) next.delete(category);
                        else next.add(category);
                        return next;
                      })
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryColors[category]?.split(" ")[0] || "bg-gray-100 dark:bg-slate-800"}`}>
                        <Icon className="w-5 h-5" style={{ color: "inherit" }} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-white">{category}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{list.length} forms</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    )}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-2">
                          {list.map((form: MESForm, formIdx: number) => (
                            <motion.div
                              key={form.id}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: formIdx * 0.03 }}
                              className="p-3 bg-gray-50/60 dark:bg-slate-800/40 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-100/40 dark:hover:bg-slate-800/60 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openForm(form, "info")}>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{form.code}</span>
                                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{form.title}</h4>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{form.description || form.subcategory}</p>
                                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                      {form.subcategory}
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{form.fields} fields</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{form.version}</span>
                                  </div>
                                </div>
                                <div className="shrink-0 flex flex-col items-end gap-2">
                                  {form.active ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">Active</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">Draft</Badge>
                                  )}
                                  <Button size="sm" className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => openForm(form, "submit")}>
                                    <Send className="w-3 h-3 mr-1" /> Fill
                                  </Button>
                                </div>
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
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-700 dark:text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No forms found</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedForm && (
          <FormDetailModal
            form={selectedForm}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={() => setSelectedForm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FormDetailModal({
  form,
  activeTab,
  setActiveTab,
  onClose,
}: {
  form: MESForm;
  activeTab: "info" | "submit" | "submissions";
  setActiveTab: (t: "info" | "submit" | "submissions") => void;
  onClose: () => void;
}) {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState("");

  useEffect(() => {
    setLoadingSchema(true);
    setSchemaError("");
    erpApi
      .getFormSchema(form.id)
      .then((data) => setSchema(data as FormSchema))
      .catch((e: any) => setSchemaError(e.message || "Failed to load form schema"))
      .finally(() => setLoadingSchema(false));
  }, [form.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{form.code}</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{form.title}</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-slate-800 shrink-0">
          {[
            { id: "info", label: "Info", icon: FileText },
            { id: "submit", label: "Fill & Submit", icon: Send },
            { id: "submissions", label: "Submissions", icon: List },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {schemaError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm mb-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{schemaError}</span>
            </div>
          )}

          {loadingSchema ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading form schema...</span>
            </div>
          ) : (
            <>
              {activeTab === "info" && <FormInfoTab form={form} schema={schema} />}
              {activeTab === "submit" && schema && <FormSubmitTab schema={schema} onSubmitted={onClose} />}
              {activeTab === "submissions" && <FormSubmissionsTab documentType={form.document_type || form.subcategory} />}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function FormInfoTab({ form, schema }: { form: MESForm; schema: FormSchema | null }) {
  return (
    <div className="space-y-3 text-sm">
      {form.description && (
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Description</p>
          <p className="text-slate-800 dark:text-white">{form.description}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Category</p>
          <p className="text-slate-800 dark:text-white">{form.category}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Document Type</p>
          <p className="text-slate-800 dark:text-white">{form.document_type || form.subcategory}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Version</p>
          <p className="text-slate-800 dark:text-white">{form.version}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Last Updated</p>
          <p className="text-slate-800 dark:text-white">{form.lastUpdated}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Fields</p>
          <p className="text-slate-800 dark:text-white">{schema?.schema.fields.length ?? form.fields}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
          <p className="text-slate-800 dark:text-white">{form.active ? "Active" : "Draft"}</p>
        </div>
      </div>
    </div>
  );
}

function FormSubmitTab({ schema, onSubmitted }: { schema: FormSchema; onSubmitted: () => void }) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    const missing = schema.schema.fields.filter((f) => f.reqd && !values[f.fieldname] && values[f.fieldname] !== false && values[f.fieldname] !== 0);
    if (missing.length > 0) {
      setError(`Required fields missing: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const res = await erpApi.submitForm(schema.documentType, values);
      setSuccess((res as any).message || "Form submitted successfully");
      setValues({});
      setTimeout(onSubmitted, 1500);
    } catch (e: any) {
      setError(e.message || "Failed to submit form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-3">
        {schema.schema.fields.map((field) => (
          <DynamicField
            key={field.fieldname}
            field={field}
            value={values[field.fieldname]}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.fieldname]: v }))}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => onSubmitted()}>
          Cancel
        </Button>
        <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white" onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
          {saving ? "Submitting..." : "Submit Form"}
        </Button>
      </div>
    </div>
  );
}

function DynamicField({ field, value, onChange }: { field: FormField; value: any; onChange: (val: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseOptions = (opts: string) => {
    return opts
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await erpApi.uploadFile(file, { folder: "Forms", isPrivate: false });
      onChange(res.file_url || res.fileUrl || "");
    } catch (err: any) {
      alert(err.message || "Upload failed");
    }
  };

  const commonClass = "mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700";
  const labelClass = "text-[11px] font-medium text-slate-600 dark:text-slate-400";

  switch (field.fieldtype) {
    case "Data":
    case "Barcode":
    case "Phone":
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClass} />
          {field.description && <p className="text-[10px] text-slate-400 mt-1">{field.description}</p>}
        </div>
      );
    case "Small Text":
    case "Text":
    case "Long Text":
    case "Signature":
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={field.fieldtype === "Small Text" ? 2 : 4}
            className={`${commonClass} w-full rounded-md border px-3 py-2 resize-y`}
          />
          {field.description && <p className="text-[10px] text-slate-400 mt-1">{field.description}</p>}
        </div>
      );
    case "Date":
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <Input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClass} />
        </div>
      );
    case "Time":
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <Input type="time" value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClass} />
        </div>
      );
    case "Datetime":
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <Input type="datetime-local" value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClass} />
        </div>
      );
    case "Float":
    case "Int":
    case "Currency":
    case "Percent":
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <Input
            type="number"
            value={value === undefined || value === null ? "" : value}
            onChange={(e) => onChange(field.fieldtype === "Int" ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0)}
            className={commonClass}
          />
        </div>
      );
    case "Check":
      return (
        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked ? 1 : 0)}
            className="accent-cyan-600 w-4 h-4"
          />
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
        </div>
      );
    case "Select":
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={`${commonClass} w-full rounded-md px-2`}>
            <option value="">—</option>
            {parseOptions(field.options).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    case "Link":
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={`${field.options} ID`} className={commonClass} />
          <p className="text-[10px] text-slate-400 mt-1">Link to {field.options}</p>
        </div>
      );
    case "Attach":
    case "Attach Image":
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <div className="mt-1 flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-3 h-3 mr-1" /> Upload
            </Button>
            {value && <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{value}</span>}
          </div>
        </div>
      );
    case "Table":
      return (
        <div>
          <label className={labelClass}>{field.label}</label>
          <ChildTableField field={field} value={value || []} onChange={onChange} />
        </div>
      );
    default:
      return (
        <div>
          <label className={labelClass}>{field.label}{field.reqd && <span className="text-red-500">*</span>}</label>
          <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClass} />
          <p className="text-[10px] text-amber-500 mt-1">Field type "{field.fieldtype}" rendered as text.</p>
        </div>
      );
  }
}

function ChildTableField({ field, value, onChange }: { field: FormField; value: any[]; onChange: (val: any[]) => void }) {
  const rows = Array.isArray(value) ? value : [];
  const childFields = field.childFields || [];

  const addRow = () => onChange([...rows, {}]);
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  const updateRow = (idx: number, fieldname: string, val: any) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [fieldname]: val } : r));
    onChange(next);
  };

  return (
    <div className="mt-1 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className="max-h-48 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
            <tr>
              {childFields.map((cf) => (
                <th key={cf.fieldname} className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">{cf.label}</th>
              ))}
              <th className="p-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-gray-100 dark:border-slate-800">
                {childFields.map((cf) => (
                  <td key={cf.fieldname} className="p-1">
                    <ChildTableCell field={cf} value={row[cf.fieldname]} onChange={(v) => updateRow(idx, cf.fieldname, v)} />
                  </td>
                ))}
                <td className="p-1">
                  <button onClick={() => removeRow(idx)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-[10px] text-slate-400 p-2 text-center">No rows added</p>}
      </div>
      <div className="p-2 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30">
        <Button type="button" size="sm" variant="outline" className="h-7 text-[10px]" onClick={addRow}>
          <Plus className="w-3 h-3 mr-1" /> Add Row
        </Button>
      </div>
    </div>
  );
}

function ChildTableCell({ field, value, onChange }: { field: FormField; value: any; onChange: (val: any) => void }) {
  const className = "w-full h-7 text-[10px] px-1.5 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800";
  switch (field.fieldtype) {
    case "Check":
      return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked ? 1 : 0)} className="accent-cyan-600 w-4 h-4" />;
    case "Select":
      return (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={className}>
          <option value="">—</option>
          {field.options.split("\n").map((o) => o.trim()).filter(Boolean).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case "Int":
      return <input type="number" value={value === undefined ? "" : value} onChange={(e) => onChange(parseInt(e.target.value) || 0)} className={className} />;
    case "Float":
    case "Percent":
    case "Currency":
      return <input type="number" value={value === undefined ? "" : value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className={className} />;
    default:
      return <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} className={className} />;
  }
}

function FormSubmissionsTab({ documentType }: { documentType: string }) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<FormSubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    erpApi
      .listFormSubmissions(documentType)
      .then((data) => setSubmissions(Array.isArray(data) ? (data as FormSubmission[]) : []))
      .catch((e: any) => setError(e.message || "Failed to load submissions"))
      .finally(() => setLoading(false));
  }, [documentType]);

  const openDetail = (s: FormSubmission) => {
    setDetailLoading(true);
    setDetailError("");
    erpApi
      .getFormSubmission(documentType, s.id)
      .then((data) => setDetail(data as FormSubmissionDetail))
      .catch((e: any) => setDetailError(e.message || "Failed to load submission details"))
      .finally(() => setDetailLoading(false));
  };

  if (loading) return <div className="flex items-center justify-center gap-2 py-12 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;
  if (error) return <div className="text-sm text-red-500">{error}</div>;

  if (detail) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500 dark:text-slate-400" onClick={() => setDetail(null)}>
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to submissions
        </Button>
        {detailError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{detailError}</span>
          </div>
        )}
        {detailLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading details...
          </div>
        ) : (
          <>
            <div className="p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{detail.name}</p>
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(detail.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">By {detail.owner}</p>
            </div>
            <div className="space-y-3">
              {detail.fields.map((field) => (
                <SubmissionFieldDetail key={field.fieldname} field={field} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {submissions.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No submissions yet.</p>}
      {submissions.map((s) => (
        <button
          key={s.id}
          onClick={() => openDetail(s)}
          className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-gray-100/70 dark:hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800 dark:text-white">{s.title}</p>
            <span className="text-[10px] text-slate-400">{new Date(s.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">By {s.owner}</p>
        </button>
      ))}
    </div>
  );
}

function SubmissionFieldDetail({ field }: { field: SubmissionDetailField }) {
  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === "") return <span className="italic text-slate-400">—</span>;
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="italic text-slate-400">—</span>;
      const columns = field.childFields && field.childFields.length > 0
        ? field.childFields.filter((c) => Object.prototype.hasOwnProperty.call(value[0], c.fieldname))
        : Object.keys(value[0]).map((k) => ({ fieldname: k, label: k }));
      return (
        <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                {columns.map((c) => (
                  <th key={c.fieldname} className="text-left p-1.5 font-medium text-slate-600 dark:text-slate-400">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((row, idx) => (
                <tr key={idx} className="border-t border-gray-100 dark:border-slate-800">
                  {columns.map((c) => (
                    <td key={c.fieldname} className="p-1.5 text-slate-700 dark:text-slate-300">{String(row[c.fieldname] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return String(value);
  };

  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{field.label}</p>
      <div className="mt-1 text-sm text-slate-800 dark:text-slate-200">{formatValue(field.value)}</div>
    </div>
  );
}
