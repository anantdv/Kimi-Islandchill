import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Factory } from "lucide-react";

export default function LinesAdmin() {
  const navigate = useNavigate();
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Factory className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Lines & Equipment
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage production lines and equipment registry</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
        <Factory className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Lines & Equipment Management</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          This module allows administrators to register production lines, assign equipment,
          configure line capacities, and manage equipment maintenance schedules.
        </p>
        <div className="mt-6 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <p>Planned features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Add/edit production lines (FL1, FL2, FL3)</li>
            <li>Equipment registry with serial numbers</li>
            <li>Line capacity and throughput settings</li>
            <li>Equipment maintenance intervals</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
