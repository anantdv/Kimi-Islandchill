import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";

export default function SettingsAdmin() {
  const navigate = useNavigate();
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">System configuration and preferences</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
        <Settings className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">System Settings</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Configure system preferences, notification rules, integration settings,
          and global MES parameters.
        </p>
        <div className="mt-6 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <p>Planned features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Company profile and plant settings</li>
            <li>Shift schedule configuration</li>
            <li>Notification rules and alerts</li>
            <li>ERP/SCADA integration settings</li>
            <li>Data retention policies</li>
            <li>Backup and export settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
