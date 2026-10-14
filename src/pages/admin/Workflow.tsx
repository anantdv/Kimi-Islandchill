import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitBranch } from "lucide-react";

export default function WorkflowAdmin() {
  const navigate = useNavigate();
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Workflow
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Production workflow configuration</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
        <GitBranch className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Workflow Configuration</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Design and configure production workflows, approval chains, and process routing rules.
        </p>
        <div className="mt-6 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <p>Planned features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Visual workflow designer</li>
            <li>Approval chains and escalation rules</li>
            <li>Process routing by product type</li>
            <li>Workflow version control</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
