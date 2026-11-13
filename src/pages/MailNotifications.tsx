import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Mail, Server, Send, CheckCircle2, XCircle, Clock, RefreshCw,
  FileText, Plus, Trash2, Edit2, Settings,
} from "lucide-react";
import type { NotificationTemplate } from "@/data/mockData";
import { generateId } from "@/lib/utils";


export default function MailNotifications() {
  const {
    smtpConfig, setSMTPConfig, notificationTemplates, notificationLogs,
    addNotificationTemplate, updateNotificationTemplate, deleteNotificationTemplate,
  } = useAppStore();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showTplForm, setShowTplForm] = useState(false);
  const [editingTpl, setEditingTpl] = useState<NotificationTemplate | null>(null);
  const [tplForm, setTplForm] = useState<Partial<NotificationTemplate>>({
    name: "", subject: "", body: "", trigger: "manual", enabled: true, variables: [],
  });

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      const success = smtpConfig.host.includes("islandchill") && smtpConfig.enabled;
      setTestResult({
        success,
        message: success
          ? "Connection successful! SMTP server is reachable."
          : "Connection failed. Check host, port, and credentials.",
      });
      setSMTPConfig({ status: success ? "connected" : "error" });
    }, 1500);
  };

  const handleSaveTemplate = () => {
    if (!tplForm.name || !tplForm.subject || !tplForm.body) return;
    if (editingTpl) {
      updateNotificationTemplate(editingTpl.id, tplForm);
    } else {
      const newTpl: NotificationTemplate = {
        id: generateId("ntpl"),
        name: tplForm.name || "",
        subject: tplForm.subject || "",
        body: tplForm.body || "",
        trigger: tplForm.trigger || "manual",
        enabled: tplForm.enabled ?? true,
        variables: tplForm.body ? Array.from(new Set((tplForm.body.match(/\{\{(\w+)\}\}/g) || []))).map((v) => v.replace(/[{}]/g, "")) : [],
      };
      addNotificationTemplate(newTpl);
    }
    setShowTplForm(false);
    setEditingTpl(null);
    setTplForm({ name: "", subject: "", body: "", trigger: "manual", enabled: true, variables: [] });
  };

  const triggerLabels: Record<string, string> = {
    manual: "Manual", wo_created: "WO Created", qc_failed: "QC Failed",
    incident_reported: "Incident", dss_fault: "DSS Fault", shift_change: "Shift Change", daily_summary: "Daily Summary",
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Mail & Notifications</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">SMTP configuration, notification templates, and delivery logs</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SMTP Configuration */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-500" />
                SMTP Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${smtpConfig.status === "connected" ? "bg-emerald-400 animate-pulse" : smtpConfig.status === "error" ? "bg-red-400" : "bg-slate-300"}`} />
                  <span className="text-xs text-slate-700 dark:text-slate-200">
                    {smtpConfig.status === "connected" ? "Connected" : smtpConfig.status === "error" ? "Error" : "Disconnected"}
                  </span>
                </div>
                <Switch checked={smtpConfig.enabled} onCheckedChange={(v) => setSMTPConfig({ enabled: v })} />
              </div>

              {smtpConfig.enabled && (
                <>
                  <div className="space-y-2">
                    <Input className="h-8 text-xs" placeholder="SMTP Host" value={smtpConfig.host} onChange={(e) => setSMTPConfig({ host: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="h-8 text-xs" type="number" placeholder="Port" value={smtpConfig.port} onChange={(e) => setSMTPConfig({ port: Number(e.target.value) })} />
                      <div className="flex items-center gap-2">
                        <Switch checked={smtpConfig.secure} onCheckedChange={(v) => setSMTPConfig({ secure: v })} />
                        <span className="text-[10px] text-slate-500">TLS/SSL</span>
                      </div>
                    </div>
                    <Input className="h-8 text-xs" placeholder="Username" value={smtpConfig.username} onChange={(e) => setSMTPConfig({ username: e.target.value })} />
                    <Input className="h-8 text-xs" type="password" placeholder="Password" value={smtpConfig.password} onChange={(e) => setSMTPConfig({ password: e.target.value })} />
                    <Input className="h-8 text-xs" placeholder="From Name" value={smtpConfig.fromName} onChange={(e) => setSMTPConfig({ fromName: e.target.value })} />
                    <Input className="h-8 text-xs" placeholder="From Address" value={smtpConfig.fromAddress} onChange={(e) => setSMTPConfig({ fromAddress: e.target.value })} />
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs bg-amber-600 text-white"
                    onClick={handleTestConnection}
                    disabled={testing}
                  >
                    {testing ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                    Test Connection
                  </Button>
                  {testResult && (
                    <p className={`text-[10px] ${testResult.success ? "text-emerald-600" : "text-red-600"}`}>
                      {testResult.message}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-500" />
                Delivery Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Sent</span>
                <span className="font-medium text-emerald-600">{notificationLogs.filter((l) => l.status === "sent").length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Failed</span>
                <span className="font-medium text-red-600">{notificationLogs.filter((l) => l.status === "failed").length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Pending</span>
                <span className="font-medium text-amber-600">{notificationLogs.filter((l) => l.status === "pending").length}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Templates */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Notification Templates</h2>
            <Button size="sm" className="h-8 text-xs bg-amber-600 text-white" onClick={() => { setEditingTpl(null); setShowTplForm(true); }}>
              <Plus className="w-3 h-3 mr-1" /> New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notificationTemplates.map((tpl) => (
              <Card key={tpl.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{tpl.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingTpl(tpl); setTplForm(tpl); setShowTplForm(true); }}>
                        <Edit2 className="w-3 h-3 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteNotificationTemplate(tpl.id)}>
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">Subject: {tpl.subject}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-2">{tpl.body}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="text-[8px] border-0 bg-blue-50 text-blue-600">{triggerLabels[tpl.trigger] || tpl.trigger}</Badge>
                    {tpl.variables.map((v) => (
                      <Badge key={v} className="text-[8px] border-0 bg-gray-100 text-gray-500">{"{{"}{v}{"}}"}</Badge>
                    ))}
                    <div className="ml-auto">
                      <Switch checked={tpl.enabled} onCheckedChange={(v) => updateNotificationTemplate(tpl.id, { enabled: v })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Delivery Log */}
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Delivery Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
                {notificationLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      log.status === "sent" ? "bg-emerald-50 dark:bg-emerald-500/10" : log.status === "failed" ? "bg-red-50 dark:bg-red-500/10" : "bg-amber-50 dark:bg-amber-500/10"
                    }`}>
                      {log.status === "sent" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> :
                       log.status === "failed" ? <XCircle className="w-3.5 h-3.5 text-red-500" /> :
                       <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-white truncate">{log.subject}</p>
                      <p className="text-[10px] text-slate-500">{log.recipient} • {log.channel}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className={`text-[8px] border-0 ${
                        log.status === "sent" ? "bg-emerald-50 text-emerald-600" : log.status === "failed" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {log.status}
                      </Badge>
                      {log.sentAt && (
                        <p className="text-[9px] text-slate-400">{new Date(log.sentAt).toLocaleTimeString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Template Form Modal */}
      {showTplForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{editingTpl ? "Edit Template" : "New Template"}</h3>
            <Input className="h-8 text-xs" placeholder="Template name" value={tplForm.name} onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))} />
            <Input className="h-8 text-xs" placeholder="Subject line" value={tplForm.subject} onChange={(e) => setTplForm((f) => ({ ...f, subject: e.target.value }))} />
            <textarea
              className="w-full h-24 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 resize-none"
              placeholder="Body (use {{variable}} for dynamic content)"
              value={tplForm.body}
              onChange={(e) => setTplForm((f) => ({ ...f, body: e.target.value }))}
            />
            <select
              className="w-full h-8 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2"
              value={tplForm.trigger}
              onChange={(e) => setTplForm((f) => ({ ...f, trigger: e.target.value as NotificationTemplate["trigger"] }))}
            >
              {Object.entries(triggerLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowTplForm(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-xs bg-amber-600 text-white" onClick={handleSaveTemplate}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Save
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
