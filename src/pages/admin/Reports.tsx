import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";

export default function ReportsAdmin() {
  const navigate = useNavigate();
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">System reports and analytics</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
        <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Reports & Analytics</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Generate comprehensive reports on production efficiency, quality metrics,
          incident trends, and maintenance performance.
        </p>
        <div className="mt-6 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <p>Planned features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Production efficiency reports</li>
            <li>Quality control trend analysis</li>
            <li>Incident frequency and resolution reports</li>
            <li>Maintenance downtime analysis</li>
            <li>Material usage and waste reports</li>
            <li>Custom report builder</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
