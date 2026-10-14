import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Settings, Save, ClipboardCheck,
  Factory, AlertTriangle,
} from "lucide-react";

interface SettingGroup {
  title: string;
  icon: typeof Settings;
  settings: { key: string; label: string; desc: string; type: "toggle" | "select"; value: boolean | string; options?: string[] }[];
}

const settingGroups: SettingGroup[] = [
  {
    title: "General",
    icon: Settings,
    settings: [
      { key: "auto_assign", label: "Auto-assign WO to line", desc: "Automatically assign new work orders to the least loaded line", type: "toggle", value: true },
      { key: "shift_handover", label: "Shift Handover Reminder", desc: "Prompt operators to complete shift handover checklist", type: "toggle", value: true },
      { key: "batch_size", label: "Default Batch Size", desc: "Default batch size for new work orders", type: "select", value: "1000", options: ["500", "1000", "2000", "5000"] },
    ],
  },
  {
    title: "Quality Control",
    icon: ClipboardCheck,
    settings: [
      { key: "auto_qc", label: "Auto-create QC Checks", desc: "Generate QC checks automatically when WO is launched", type: "toggle", value: true },
      { key: "qc_escalation", label: "QC Failure Escalation", desc: "Escalate QC failures to supervisor automatically", type: "toggle", value: true },
      { key: "hold_on_fail", label: "Hold Stock on QC Fail", desc: "Move stock to quarantine on QC failure", type: "toggle", value: true },
    ],
  },
  {
    title: "Incidents",
    icon: AlertTriangle,
    settings: [
      { key: "auto_notify", label: "Auto-notify Maintenance", desc: "Notify maintenance team on equipment faults", type: "toggle", value: true },
      { key: "downtime_threshold", label: "Downtime Alert Threshold", desc: "Alert when downtime exceeds (minutes)", type: "select", value: "30", options: ["15", "30", "60", "120"] },
      { key: "incident_auto_resolve", label: "Auto-resolve Low Priority", desc: "Auto-resolve low priority incidents after 24h", type: "toggle", value: false },
    ],
  },
  {
    title: "Production",
    icon: Factory,
    settings: [
      { key: "prestart_gate", label: "Pre-Start Gate Check", desc: "Require Pre-Start checklist before WO launch", type: "toggle", value: true },
      { key: "process_loss_warn", label: "Process Loss Warning", desc: "Warn when process loss exceeds 2%", type: "toggle", value: true },
      { key: "oee_target", label: "OEE Target %", desc: "Target OEE for all lines", type: "select", value: "90", options: ["80", "85", "90", "95"] },
    ],
  },
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, boolean | string>>(() => {
    const s: Record<string, boolean | string> = {};
    settingGroups.forEach((g) => g.settings.forEach((st) => { s[st.key] = st.value; }));
    return s;
  });
  const [saved, setSaved] = useState(false);

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">MES Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure system behavior and workflows</p>
          </div>
        </div>
        <Button className={`transition-all ${saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-cyan-600 hover:bg-cyan-700"}`} onClick={handleSave}>
          <Save className="w-4 h-4 mr-1" /> {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-4">
        {settingGroups.map((group) => {
          const Icon = group.icon;
          return (
            <Card key={group.title} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.settings.map((st) => (
                  <div key={st.key} className="flex items-center justify-between py-2 border-b border-gray-200/50 last:border-0">
                    <div>
                      <p className="text-sm text-slate-800 dark:text-white">{st.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{st.desc}</p>
                    </div>
                    {st.type === "toggle" ? (
                      <Switch
                        checked={settings[st.key] as boolean}
                        onCheckedChange={(v: boolean) => updateSetting(st.key, v)}
                      />
                    ) : (
                      <select
                        className="h-9 rounded-md border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800 px-3 text-sm text-slate-800 dark:text-white"
                        value={settings[st.key] as string}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateSetting(st.key, e.target.value)}
                      >
                        {st.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
