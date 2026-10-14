import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import {
  ArrowLeft, CalendarDays, Wrench, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, Cpu,
} from "lucide-react";

interface MaintTask {
  id: string;
  line: string;
  equipment: string;
  task: string;
  type: "pre-start" | "post-production" | "weekly" | "monthly" | "breakdown";
  frequency: string;
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  scheduledDate: string;
  assignedTo: string;
  durationMin: number;
  checklist: string[];
}

const maintenanceTasks: MaintTask[] = [
  { id: "mt1", line: "FL1", equipment: "Filler Nozzles", task: "Seal inspection & replacement", type: "pre-start", frequency: "Every shift", status: "scheduled", scheduledDate: "2025-01-16T06:00:00Z", assignedTo: "Dave R.", durationMin: 15, checklist: ["Inspect O-rings", "Check nozzle alignment", "Lubricate moving parts", "Test spray pattern"] },
  { id: "mt2", line: "FL2", equipment: "Pasteuriser", task: "Temperature sensor calibration", type: "weekly", frequency: "Weekly", status: "scheduled", scheduledDate: "2025-01-17T06:00:00Z", assignedTo: "Dave R.", durationMin: 30, checklist: ["Check sensor accuracy", "Verify against reference", "Log calibration values", "Replace if deviation > 0.5°C"] },
  { id: "mt3", line: "FL3", equipment: "Conveyor Belt", task: "Tension & alignment check", type: "pre-start", frequency: "Every shift", status: "completed", scheduledDate: "2025-01-15T06:00:00Z", assignedTo: "Dave R.", durationMin: 10, checklist: ["Check belt tension", "Verify guide alignment", "Inspect for wear", "Grease bearings"] },
  { id: "mt4", line: "FL4", equipment: "Can Seamer", task: "Tooling inspection & sharpening", type: "post-production", frequency: "Daily", status: "in_progress", scheduledDate: "2025-01-15T18:00:00Z", assignedTo: "Dave R.", durationMin: 45, checklist: ["Remove tooling set", "Measure blade wear", "Sharpen / replace", "Reassemble & torque bolts"] },
  { id: "mt5", line: "FL1", equipment: "CIP System", task: "Chemical tank level check", type: "pre-start", frequency: "Every shift", status: "completed", scheduledDate: "2025-01-15T06:00:00Z", assignedTo: "Carlos M.", durationMin: 5, checklist: ["Check caustic level", "Check acid level", "Check rinse water", "Verify auto-reorder trigger"] },
  { id: "mt6", line: "FL2", equipment: "Label Applicator", task: "Guide rail & roller inspection", type: "weekly", frequency: "Weekly", status: "scheduled", scheduledDate: "2025-01-18T06:00:00Z", assignedTo: "Dave R.", durationMin: 20, checklist: ["Check guide rail bolts", "Inspect roller wear", "Clean adhesive residue", "Test label alignment"] },
  { id: "mt7", line: "FL3", equipment: "Air Compressor", task: "Filter replacement & pressure test", type: "monthly", frequency: "Monthly", status: "overdue", scheduledDate: "2025-01-10T06:00:00Z", assignedTo: "Dave R.", durationMin: 60, checklist: ["Replace intake filter", "Replace oil filter", "Check oil level", "Test pressure at 6 bar", "Drain condensate"] },
  { id: "mt8", line: "FL4", equipment: "CO2 Regulator", task: "Pressure check & leak test", type: "pre-start", frequency: "Every shift", status: "scheduled", scheduledDate: "2025-01-16T06:00:00Z", assignedTo: "Dave R.", durationMin: 10, checklist: ["Check pressure gauge", "Soap test connections", "Verify regulator setting", "Log pressure reading"] },
];

const typeColors: Record<string, string> = {
  "pre-start": "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/30",
  "post-production": "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30",
  "weekly": "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
  "monthly": "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
  "breakdown": "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-gray-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-gray-200 dark:border-slate-700",
  "in_progress": "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
  completed: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
  overdue: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30",
};

export default function MaintenanceSchedule() {
  const navigate = useNavigate();
  const { hasPermission } = useAppStore();
  const [filter, setFilter] = useState<"all" | "pre-start" | "post-production" | "weekly" | "monthly" | "breakdown">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "in_progress" | "completed" | "overdue">("all");
  const [selectedTask, setSelectedTask] = useState<MaintTask | null>(null);

  const canEdit = hasPermission("ops-incidents-investigate"); // Maintenance supervisors can edit

  const filtered = maintenanceTasks.filter((t) => {
    const typeMatch = filter === "all" || t.type === filter;
    const statusMatch = statusFilter === "all" || t.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const stats = {
    total: maintenanceTasks.length,
    scheduled: maintenanceTasks.filter((t) => t.status === "scheduled").length,
    inProgress: maintenanceTasks.filter((t) => t.status === "in_progress").length,
    completed: maintenanceTasks.filter((t) => t.status === "completed").length,
    overdue: maintenanceTasks.filter((t) => t.status === "overdue").length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Maintenance Schedule</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pre-start, post-production & planned maintenance</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", val: stats.total, color: "text-slate-800 dark:text-white" },
          { label: "Scheduled", val: stats.scheduled, color: "text-slate-600 dark:text-slate-400" },
          { label: "In Progress", val: stats.inProgress, color: "text-amber-600 dark:text-amber-400" },
          { label: "Completed", val: stats.completed, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Overdue", val: stats.overdue, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-1 flex-wrap">
          {(["all", "pre-start", "post-production", "weekly", "monthly", "breakdown"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {f === "all" ? "All" : f.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["all", "scheduled", "in_progress", "completed", "overdue"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map((task) => (
          <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card
              className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
              onClick={() => setSelectedTask(task)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      task.status === "overdue" ? "bg-red-50 dark:bg-red-500/15" :
                      task.status === "completed" ? "bg-emerald-50 dark:bg-emerald-500/15" :
                      task.status === "in_progress" ? "bg-amber-50 dark:bg-amber-500/15" : "bg-gray-50 dark:bg-slate-800"
                    }`}>
                      {task.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                       task.status === "overdue" ? <AlertTriangle className="w-4 h-4 text-red-500" /> :
                       <Wrench className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{task.equipment}</p>
                        <Badge className={`text-[10px] border ${typeColors[task.type]}`}>{task.type.replace("-", " ")}</Badge>
                        <Badge className={`text-[10px] border ${statusColors[task.status]}`}>{task.status.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{task.task}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {task.line}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.durationMin} min</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(task.scheduledDate).toLocaleDateString()}</span>
                        <span>Assigned: {task.assignedTo}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTask(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selectedTask.status === "completed" ? "bg-emerald-50 dark:bg-emerald-500/15" : "bg-gray-50 dark:bg-slate-800"
                  }`}>
                    <Wrench className={`w-4 h-4 ${selectedTask.status === "completed" ? "text-emerald-500" : "text-slate-500 dark:text-slate-400"}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{selectedTask.equipment}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{selectedTask.line} — {selectedTask.assignedTo}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Task</p>
                <p className="text-sm text-slate-800 dark:text-white">{selectedTask.task}</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Type</p>
                  <Badge className={`mt-1 text-[10px] border ${typeColors[selectedTask.type]}`}>{selectedTask.type.replace("-", " ")}</Badge>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Frequency</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{selectedTask.frequency}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Duration</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{selectedTask.durationMin} min</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Checklist</p>
                <div className="space-y-1.5">
                  {selectedTask.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                      <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-slate-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 dark:text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setSelectedTask(null)}>Close</Button>
                  <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Complete
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
