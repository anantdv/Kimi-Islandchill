import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Lightbulb, ArrowLeft, Search, Filter, Plus, ChevronRight,
  CheckCircle2, TrendingUp, Users,
  Shield, Leaf, DollarSign, Package, Smile,
  Eye, Hammer, Award, BarChart3, X,
} from "lucide-react";
import type { KaizenSuggestion, KaizenCategory, KaizenStatus, KaizenType, PDCAStage } from "@/data/mockData";
import { generateId } from "@/lib/utils";

const statusConfig: Record<KaizenStatus, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
  backlog: { label: "Backlog", color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-800/50", icon: Lightbulb, desc: "Ideas waiting for review" },
  in_review: { label: "In Review", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", icon: Eye, desc: "Under evaluation" },
  in_progress: { label: "In Progress", color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-500/10", icon: Hammer, desc: "Being implemented" },
  completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle2, desc: "Implementation done" },
  impact_verified: { label: "Impact Verified", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-500/10", icon: Award, desc: "Results measured" },
};

const categoryConfig: Record<KaizenCategory, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  safety: { label: "Safety", color: "text-red-600", bg: "bg-red-50 dark:bg-red-500/10", icon: Shield },
  quality: { label: "Quality", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: CheckCircle2 },
  cost: { label: "Cost", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10", icon: DollarSign },
  delivery: { label: "Delivery", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10", icon: Package },
  morale: { label: "Morale", color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-500/10", icon: Smile },
  environment: { label: "Environment", color: "text-green-600", bg: "bg-green-50 dark:bg-green-500/10", icon: Leaf },
};

const typeConfig: Record<KaizenType, { label: string; badge: string }> = {
  daily: { label: "Daily Kaizen", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
  event: { label: "Kaizen Event", badge: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300" },
  kaikaku: { label: "Kaikaku", badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" },
};

const pdcaConfig: Record<PDCAStage, { label: string; color: string }> = {
  plan: { label: "Plan", color: "text-amber-600" },
  do: { label: "Do", color: "text-cyan-600" },
  check: { label: "Check", color: "text-blue-600" },
  act: { label: "Act", color: "text-emerald-600" },
};

const statuses: KaizenStatus[] = ["backlog", "in_review", "in_progress", "completed", "impact_verified"];


function CategoryBadge({ category }: { category: KaizenCategory }) {
  const cfg = categoryConfig[category];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function PDCABadge({ stage }: { stage: PDCAStage }) {
  const cfg = pdcaConfig[stage];
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 ${cfg.color}`}>
      PDCA: {cfg.label}
    </span>
  );
}

export default function KaizenBoard() {
  const navigate = useNavigate();
  const { kaizenSuggestions, employees, fillingLines, updateKaizen } = useAppStore();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [lineFilter, setLineFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: kaizenSuggestions.length,
    inProgress: kaizenSuggestions.filter((k) => k.status === "in_progress").length,
    completed: kaizenSuggestions.filter((k) => k.status === "completed").length,
    verified: kaizenSuggestions.filter((k) => k.status === "impact_verified").length,
  }), [kaizenSuggestions]);

  const filtered = useMemo(() => {
    return kaizenSuggestions.filter((k) => {
      const mSearch = !search ||
        k.title.toLowerCase().includes(search.toLowerCase()) ||
        k.description.toLowerCase().includes(search.toLowerCase()) ||
        k.submittedBy.toLowerCase().includes(search.toLowerCase());
      const mCat = catFilter === "all" || k.category === catFilter;
      const mLine = lineFilter === "all" || k.lineId === lineFilter;
      return mSearch && mCat && mLine;
    });
  }, [kaizenSuggestions, search, catFilter, lineFilter]);

  const byStatus = useMemo(() => {
    const map: Record<KaizenStatus, KaizenSuggestion[]> = {
      backlog: [], in_review: [], in_progress: [], completed: [], impact_verified: [],
    };
    filtered.forEach((k) => map[k.status].push(k));
    return map;
  }, [filtered]);

  const openNew = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const moveStatus = (id: string, next: KaizenStatus) => {
    const now = new Date().toISOString();
    const updates: Partial<KaizenSuggestion> = { status: next };
    if (next === "completed") updates.completedAt = now;
    updateKaizen(id, updates);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Kaizen Board</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Continuous improvement ideas — from spark to impact</p>
          </div>
        </div>
        <Button size="sm" className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> New Idea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Ideas", value: stats.total, color: "blue", icon: Lightbulb },
          { label: "In Progress", value: stats.inProgress, color: "cyan", icon: Hammer },
          { label: "Completed", value: stats.completed, color: "emerald", icon: CheckCircle2 },
          { label: "Impact Verified", value: stats.verified, color: "violet", icon: Award },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${s.color === "blue" ? "bg-blue-50 dark:bg-blue-500/10" : s.color === "cyan" ? "bg-cyan-50 dark:bg-cyan-500/10" : s.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-violet-50 dark:bg-violet-500/10"} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color === "blue" ? "text-blue-600" : s.color === "cyan" ? "text-cyan-600" : s.color === "emerald" ? "text-emerald-600" : "text-violet-600"}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search ideas, submitters, descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700"
          />
        </div>
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Categories</option>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={lineFilter}
          onChange={(e) => setLineFilter(e.target.value)}
          className="h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Lines</option>
          {fillingLines.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {statuses.map((status) => {
          const cfg = statusConfig[status];
          const items = byStatus[status];
          const StatusIcon = cfg.icon;
          return (
            <div key={status} className="flex flex-col gap-2 min-w-0">
              {/* Column Header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${cfg.bg} border border-gray-200 dark:border-slate-800`}>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  {items.length}
                </Badge>
              </div>
              {/* Cards */}
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {items.map((k, i) => (
                    <motion.div
                      key={k.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card
                        className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => openEdit(k.id)}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{k.title}</p>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{k.description}</p>
                          <div className="flex flex-wrap gap-1">
                            <CategoryBadge category={k.category} />
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeConfig[k.type].badge}`}>
                              {typeConfig[k.type].label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-500">{k.submittedBy}</span>
                            </div>
                            <PDCABadge stage={k.pdcaStage} />
                          </div>
                          {k.beforeMetric && k.afterMetric && (
                            <div className="flex items-center gap-2 text-[10px] bg-emerald-50 dark:bg-emerald-500/5 rounded px-2 py-1">
                              <BarChart3 className="w-3 h-3 text-emerald-600" />
                              <span className="text-slate-500">{k.beforeMetric}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                              <span className="text-emerald-600 font-medium">{k.afterMetric}</span>
                            </div>
                          )}
                          {/* Quick move buttons */}
                          <div className="flex gap-1 pt-1">
                            {status !== "backlog" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); moveStatus(k.id, statuses[statuses.indexOf(status) - 1]); }}
                                className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                              >
                                ← Move back
                              </button>
                            )}
                            {status !== "impact_verified" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); moveStatus(k.id, statuses[statuses.indexOf(status) + 1]); }}
                                className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:text-emerald-700 transition-colors"
                              >
                                Move forward →
                              </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <div className="text-center py-6 text-slate-400">
                    <StatusIcon className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    <p className="text-[10px]">{cfg.desc}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <KaizenModal
            editingId={editingId}
            onClose={() => setModalOpen(false)}
            employees={employees}
            lines={fillingLines}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Modal Component ────────────────────────────────────────────────────────── */

function KaizenModal({
  editingId,
  onClose,
  employees,
  lines,
}: {
  editingId: string | null;
  onClose: () => void;
  employees: { id: string; name: string }[];
  lines: { id: string; name: string }[];
}) {
  const { kaizenSuggestions, addKaizen, updateKaizen, deleteKaizen } = useAppStore();
  const existing = editingId ? kaizenSuggestions.find((k) => k.id === editingId) : null;

  const [form, setForm] = useState<Partial<KaizenSuggestion>>({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    category: existing?.category ?? "quality",
    type: existing?.type ?? "daily",
    status: existing?.status ?? "backlog",
    pdcaStage: existing?.pdcaStage ?? "plan",
    submittedBy: existing?.submittedBy ?? "",
    submittedById: existing?.submittedById ?? "",
    assignedTo: existing?.assignedTo ?? "",
    assignedToId: existing?.assignedToId ?? "",
    lineId: existing?.lineId ?? "",
    expectedBenefit: existing?.expectedBenefit ?? "",
    actualBenefit: existing?.actualBenefit ?? "",
    beforeMetric: existing?.beforeMetric ?? "",
    afterMetric: existing?.afterMetric ?? "",
    targetDate: existing?.targetDate ?? "",
  });

  const handleSave = () => {
    if (!form.title?.trim()) return;
    const now = new Date().toISOString();
    if (existing) {
      updateKaizen(existing.id, { ...form });
    } else {
      addKaizen({
        id: generateId("kz"),
        title: form.title,
        description: form.description ?? "",
        category: form.category as KaizenCategory,
        type: form.type as KaizenType,
        status: form.status as KaizenStatus,
        pdcaStage: form.pdcaStage as PDCAStage,
        submittedBy: form.submittedBy ?? "Anonymous",
        submittedById: form.submittedById ?? "",
        assignedTo: form.assignedTo || undefined,
        assignedToId: form.assignedToId || undefined,
        lineId: form.lineId || undefined,
        expectedBenefit: form.expectedBenefit ?? "",
        actualBenefit: form.actualBenefit || undefined,
        beforeMetric: form.beforeMetric || undefined,
        afterMetric: form.afterMetric || undefined,
        createdAt: now,
        targetDate: form.targetDate || undefined,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (existing && confirm("Delete this idea?")) {
      deleteKaizen(existing.id);
      onClose();
    }
  };

  const setField = <K extends keyof KaizenSuggestion>(field: K, value: KaizenSuggestion[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            {existing ? "Edit Kaizen Idea" : "New Kaizen Idea"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Title</label>
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Short, actionable improvement idea"
              className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              placeholder="What is the current problem and proposed solution?"
              className="mt-1 w-full rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Category / Type / Status / PDCA */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Category</label>
              <select
                value={form.category}
                onChange={(e) => setField("category", e.target.value as KaizenCategory)}
                className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white"
              >
                {Object.entries(categoryConfig).map(([k, c]) => (
                  <option key={k} value={k}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Type</label>
              <select
                value={form.type}
                onChange={(e) => setField("type", e.target.value as KaizenType)}
                className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white"
              >
                <option value="daily">Daily Kaizen</option>
                <option value="event">Kaizen Event</option>
                <option value="kaikaku">Kaikaku</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value as KaizenStatus)}
                className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{statusConfig[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">PDCA Stage</label>
              <select
                value={form.pdcaStage}
                onChange={(e) => setField("pdcaStage", e.target.value as PDCAStage)}
                className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white"
              >
                <option value="plan">Plan</option>
                <option value="do">Do</option>
                <option value="check">Check</option>
                <option value="act">Act</option>
              </select>
            </div>
          </div>

          {/* People & Line */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Submitted By</label>
              <select
                value={form.submittedById}
                onChange={(e) => {
                  const emp = employees.find((x) => x.id === e.target.value);
                  setForm((p) => ({ ...p, submittedById: e.target.value, submittedBy: emp?.name ?? p.submittedBy }));
                }}
                className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white"
              >
                <option value="">Select…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Assigned To</label>
              <select
                value={form.assignedToId}
                onChange={(e) => {
                  const emp = employees.find((x) => x.id === e.target.value);
                  setForm((p) => ({ ...p, assignedToId: e.target.value || undefined, assignedTo: emp?.name || undefined }));
                }}
                className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white"
              >
                <option value="">Unassigned</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Line</label>
              <select
                value={form.lineId}
                onChange={(e) => setField("lineId", e.target.value || undefined)}
                className="mt-1 w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white"
              >
                <option value="">Any / N/A</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Benefit & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Expected Benefit</label>
              <Input
                value={form.expectedBenefit}
                onChange={(e) => setField("expectedBenefit", e.target.value)}
                placeholder="e.g. Save 2 hrs/shift"
                className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Actual Benefit (if known)</label>
              <Input
                value={form.actualBenefit ?? ""}
                onChange={(e) => setField("actualBenefit", e.target.value || undefined)}
                placeholder="e.g. Measured 1.8 hrs saved"
                className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Before Metric</label>
              <Input
                value={form.beforeMetric ?? ""}
                onChange={(e) => setField("beforeMetric", e.target.value || undefined)}
                placeholder="e.g. 45 min changeover"
                className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">After Metric</label>
              <Input
                value={form.afterMetric ?? ""}
                onChange={(e) => setField("afterMetric", e.target.value || undefined)}
                placeholder="e.g. 25 min changeover"
                className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Target Date</label>
            <Input
              type="date"
              value={form.targetDate ?? ""}
              onChange={(e) => setField("targetDate", e.target.value || undefined)}
              className="mt-1 h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 w-auto"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
          {existing ? (
            <Button size="sm" variant="destructive" className="text-xs h-8" onClick={handleDelete}>
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
              {existing ? "Save Changes" : "Create Idea"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
