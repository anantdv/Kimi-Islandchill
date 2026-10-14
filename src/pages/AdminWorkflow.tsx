import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { workflows } from "@/data/mockData";
import type { WorkflowInstance, WorkflowStep } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowLeft, Factory, FlaskConical, Wrench, ClipboardCheck,
  Shield, Warehouse, Cog, User, Clock, CheckCircle2,
  AlertCircle, Circle,
} from "lucide-react";

const roleIcons: Record<string, typeof Factory> = {
  Planner: ClipboardCheck,
  System: Cog,
  Maintenance: Wrench,
  "QC Inspector": FlaskConical,
  Operator: Factory,
  Supervisor: Shield,
  Warehouse: Warehouse,
};

const roleColors: Record<string, string> = {
  Planner: "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400",
  System: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  Maintenance: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
  "QC Inspector": "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Operator: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  Supervisor: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  Warehouse: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
};

export default function AdminWorkflow() {
  const navigate = useNavigate();
  const [selectedWF, setSelectedWF] = useState<WorkflowInstance>(workflows[0]);

  const stepStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (status === "active") return <Circle className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />;
    if (status === "skipped") return <AlertCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
    return <Circle className="w-5 h-5 text-slate-600 dark:text-slate-300" />;
  };

  const stepStatusLine = (status: string) => {
    if (status === "completed") return "bg-emerald-500";
    if (status === "active") return "bg-cyan-500";
    return "bg-gray-100 dark:bg-slate-800";
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Job Allocation Workflow</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Visualize work order routing and role assignments</p>
          </div>
        </div>
      </div>

      {/* WO Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {workflows.map((wf: WorkflowInstance) => (
          <Button
            key={wf.id}
            size="sm"
            variant={selectedWF.id === wf.id ? "default" : "outline"}
            onClick={() => setSelectedWF(wf)}
            className={selectedWF.id === wf.id ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"}
          >
            {wf.woName}
          </Button>
        ))}
      </div>

      {/* Workflow Timeline */}
      <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedWF.woName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Step {selectedWF.currentStepIndex + 1} of {selectedWF.steps.length}</p>
            </div>
            <Badge className={
              selectedWF.steps[selectedWF.currentStepIndex]?.status === "active"
                ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-0"
                : "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0"
            }>
              {selectedWF.steps[selectedWF.currentStepIndex]?.status === "active" ? "In Progress" : "Complete"}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${((selectedWF.currentStepIndex + 1) / selectedWF.steps.length) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-slate-800" />
            <div className="space-y-0">
              {selectedWF.steps.map((step: WorkflowStep, i: number) => {
                const isCurrent = i === selectedWF.currentStepIndex;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-4 relative py-3"
                  >
                    {/* Connector line segment */}
                    {i < selectedWF.steps.length - 1 && (
                      <div className={`absolute left-5 top-10 w-0.5 h-full ${stepStatusLine(step.status)}`} />
                    )}

                    {/* Status icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      step.status === "completed" ? "bg-emerald-50 dark:bg-emerald-500/15 ring-1 ring-emerald-500/20 dark:ring-emerald-500/30" :
                      step.status === "active" ? "bg-cyan-50 dark:bg-cyan-500/15 ring-1 ring-cyan-500/20 dark:ring-cyan-500/30" :
                      "bg-gray-100 dark:bg-slate-800"
                    }`}>
                      {stepStatusIcon(step.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${
                          step.status === "active" ? "text-cyan-600 dark:text-cyan-400" :
                          step.status === "completed" ? "text-emerald-600 dark:text-emerald-400" :
                          "text-slate-500 dark:text-slate-400"
                        }`}>{step.name}</span>
                        <Badge className={`${roleColors[step.role] || "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"} border-0 text-[10px]`}>
                          {step.role}
                        </Badge>
                        {isCurrent && <Badge className="bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-0 text-[10px]">Current</Badge>}
                      </div>

                      {step.assignedTo && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {step.assignedTo}
                          </span>
                          {step.assignedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {step.assignedAt}
                            </span>
                          )}
                          {step.duration && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {step.duration} min
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Legend */}
      <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Role Legend</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(roleIcons).map(([role, Icon]) => (
              <div key={role} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">{role}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Assignments Summary */}
      <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Active Assignments</h4>
          {workflows.flatMap((wf: WorkflowInstance) =>
            wf.steps
              .filter((s: WorkflowStep) => s.status === "active")
              .map((s: WorkflowStep) => ({ ...s, wo: wf.woName }))
          ).map((s: WorkflowStep & { wo: string }) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 border border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center">
                  {(() => { const Icon = roleIcons[s.role] || User; return <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />; })()}
                </div>
                <div>
                  <p className="text-sm text-slate-800 dark:text-white">{s.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.wo} — {s.assignedTo}</p>
                </div>
              </div>
              <Badge className="bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-0">Active</Badge>
            </div>
          ))}
          {workflows.flatMap((wf: WorkflowInstance) => wf.steps.filter((s: WorkflowStep) => s.status === "active")).length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No active assignments</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
