import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAIAgentStore } from "@/stores/aiAgentStore";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Bot, Sparkles, History, Zap, Lightbulb, Trash2,
  CheckCircle2, XCircle, BarChart3, Activity,
  CalendarDays, FileText, PlayCircle, ChevronRight,
  TrendingUp, Brain, Target, Server, Database, RefreshCw, Link2,
} from "lucide-react";
import type { AgentScheduledTask } from "@/data/mockData";
import { generateId, formatDate } from "@/lib/utils";



export default function AIAgentPage() {
  const navigate = useNavigate();
  const {
    commands, clearCommands, tasks, addTask, updateTask, deleteTask,
    behavior, getSuggestions, setOpen,
    erpnextConfig, setERPNextConfig, testERPNextConnection,
    runERPNextReport, erpnextReports, erpnextLoading, erpnextLastResult,
  } = useAIAgentStore();
  const { user, workOrders, fillingLines, incidents, dssActiveRuns } = useAppStore();

  const [activeTab, setActiveTab] = useState<"chat" | "tasks" | "learned" | "analytics" | "erpnext">("chat");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCmd, setNewTaskCmd] = useState("");
  const [newTaskSchedule, setNewTaskSchedule] = useState("daily-8am");
  const [reportFilters, setReportFilters] = useState<Record<string, string>>({});
  const [selectedReportId, setSelectedReportId] = useState("");

  const hour = new Date().getHours();
  const suggestions = getSuggestions(user?.role || "", hour);

  const stats = useMemo(() => {
    const total = commands.length;
    const successful = commands.filter((c) => c.success).length;
    const topIntents = Object.entries(
      commands.reduce((acc, c) => {
        acc[c.intent] = (acc[c.intent] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const recent7 = commands.filter((c) => {
      const d = new Date(c.executedAt);
      const now = new Date();
      return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    });

    return { total, successful, topIntents, recent7 };
  }, [commands]);

  const createTask = () => {
    if (!newTaskName.trim() || !newTaskCmd.trim()) return;
    const task: AgentScheduledTask = {
      id: generateId("task"),
      name: newTaskName,
      description: newTaskCmd,
      cronExpr: newTaskSchedule,
      command: newTaskCmd,
      active: true,
    };
    addTask(task);
    setNewTaskName("");
    setNewTaskCmd("");
  };

  const scheduleLabels: Record<string, string> = {
    "daily-8am": "Daily at 8:00 AM",
    "daily-10am": "Daily at 10:00 AM",
    "daily-5pm": "Daily at 5:00 PM",
    "weekly-mon-8am": "Weekly Monday 8:00 AM",
    "weekly-fri-5pm": "Weekly Friday 5:00 PM",
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-violet-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Tinni
              <Badge className="bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0 text-[10px]">
                <Sparkles className="w-2.5 h-2.5 mr-1" /> Local AI
              </Badge>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Learns your behavior • Plain English commands • ERPNext connected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            { id: "chat" as const, label: "Chat", icon: Bot },
            { id: "tasks" as const, label: "Tasks", icon: CalendarDays },
            { id: "learned" as const, label: "Learned", icon: Brain },
            { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
            { id: "erpnext" as const, label: "ERPNext", icon: Server },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Commands Run", value: stats.total, icon: Activity, color: "violet" },
          { label: "Success Rate", value: `${stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%`, icon: CheckCircle2, color: "emerald" },
          { label: "Active Tasks", value: tasks.filter((t) => t.active).length, icon: CalendarDays, color: "amber" },
          { label: "Pages Learned", value: Object.keys(behavior.pageVisits).length, icon: Brain, color: "pink" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.value}</p>
                <p className="text-[10px] text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <History className="w-4 h-4 text-violet-500" />
                    Command History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {commands.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No commands yet. Open the chat widget and start talking!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                      {commands.slice(0, 50).map((cmd) => (
                        <div key={cmd.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cmd.success ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-red-50 dark:bg-red-500/10"}`}>
                            {cmd.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 dark:text-white truncate">{cmd.rawText}</p>
                            <p className="text-[10px] text-slate-500 truncate">{cmd.response.slice(0, 80)}...</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className="text-[8px] border-0 bg-gray-100 dark:bg-slate-800 text-slate-500">{cmd.intent}</Badge>
                            <span className="text-[9px] text-slate-400">{formatDate(cmd.executedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Smart Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/30 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-900/20">
                      <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <p className="text-[11px] text-slate-700 dark:text-slate-200">{s}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-1.5">
                  {[
                    { label: "Production Status", cmd: "what is the production status", icon: Activity },
                    { label: "Create Work Order", cmd: "create work order for Crush Cola 2.5L", icon: PlayCircle },
                    { label: "QC Report", cmd: "generate qc report", icon: FileText },
                    { label: "Open DSS Board", cmd: "open dss board", icon: TrendingUp },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => navigate("/")} // triggers the chat widget on dashboard
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 text-left transition-colors"
                    >
                      <action.icon className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-[11px] text-slate-700 dark:text-slate-200">{action.label}</span>
                      <ChevronRight className="w-3 h-3 text-slate-300 ml-auto" />
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Button variant="outline" size="sm" className="w-full h-8 text-xs text-red-600 border-red-200" onClick={clearCommands}>
                <Trash2 className="w-3 h-3 mr-1" /> Clear History
              </Button>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-4">
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-500" />
                  Scheduled Automation Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                {/* New Task Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                  <Input className="h-8 text-xs" placeholder="Task name..." value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} />
                  <Input className="h-8 text-xs" placeholder="Command e.g. generate report" value={newTaskCmd} onChange={(e) => setNewTaskCmd(e.target.value)} />
                  <select
                    className="h-8 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2"
                    value={newTaskSchedule}
                    onChange={(e) => setNewTaskSchedule(e.target.value)}
                  >
                    {Object.entries(scheduleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <Button size="sm" className="h-8 text-xs bg-amber-600 text-white" onClick={createTask}>
                    <CalendarDays className="w-3 h-3 mr-1" /> Schedule
                  </Button>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${task.active ? "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800" : "bg-gray-50 dark:bg-slate-800/30 border-gray-100 dark:border-slate-800/50 opacity-60"}`}>
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-slate-800 dark:text-white">{task.name}</p>
                          {task.active ? (
                            <Badge className="text-[8px] border-0 bg-emerald-50 text-emerald-600">Active</Badge>
                          ) : (
                            <Badge className="text-[8px] border-0 bg-gray-100 text-gray-500">Paused</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">{task.description}</p>
                        <p className="text-[9px] text-slate-400">{scheduleLabels[task.cronExpr] || task.cronExpr}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={task.active}
                          onCheckedChange={(checked) => updateTask(task.id, { active: checked })}
                        />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "learned" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  Page Visit Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {Object.keys(behavior.pageVisits).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No page visits recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(behavior.pageVisits)
                      .sort((a, b) => b[1] - a[1])
                      .map(([page, count]) => (
                        <div key={page} className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${Math.min(100, (count / Math.max(...Object.values(behavior.pageVisits))) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 w-20 truncate">{page}</span>
                          <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200 w-6 text-right">{count}</span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-pink-500" />
                  Command Patterns Learned
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {Object.keys(behavior.commandPatterns).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No command patterns learned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(behavior.commandPatterns)
                      .sort((a, b) => b[1] - a[1])
                      .map(([intent, count]) => (
                        <div key={intent} className="flex items-center justify-between p-2 rounded-lg bg-pink-50/30 dark:bg-pink-500/5 border border-pink-100 dark:border-pink-900/20">
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 capitalize">{intent.replace(/_/g, " ")}</span>
                          <Badge className="text-[9px] border-0 bg-pink-100 text-pink-600">{count} uses</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4">
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  Command Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-900/20">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.total}</p>
                    <p className="text-[10px] text-slate-500">Total Commands</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-100 dark:border-cyan-900/20">
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.successful}</p>
                    <p className="text-[10px] text-slate-500">Successful</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-900/20">
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.total - stats.successful}</p>
                    <p className="text-[10px] text-slate-500">Failed / Unknown</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-900/20">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.recent7.length}</p>
                    <p className="text-[10px] text-slate-500">Last 7 Days</p>
                  </div>
                </div>

                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 mb-2">Top Intents</p>
                <div className="flex flex-wrap gap-2">
                  {stats.topIntents.map(([intent, count]) => (
                    <Badge key={intent} className="text-[10px] border-0 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {intent.replace(/_/g, " ")}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live System Snapshot */}
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  Live System Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-500">Active WOs</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{workOrders.filter((w) => w.status === "in_process").length}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-500">Running Lines</p>
                    <p className="text-lg font-bold text-emerald-600">{fillingLines.filter((l) => l.status === "running").length}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-500">Open Incidents</p>
                    <p className="text-lg font-bold text-red-600">{incidents.filter((i) => i.status === "open").length}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-500">DSS Runs</p>
                    <p className="text-lg font-bold text-violet-600">{dssActiveRuns.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "erpnext" && (
          <div className="space-y-4">
            {/* Connection Config */}
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-500" />
                  ERPNext Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${erpnextConfig.status === "connected" ? "bg-emerald-400 animate-pulse" : erpnextConfig.status === "error" ? "bg-red-400" : "bg-slate-300"}`} />
                    <span className="text-xs text-slate-700 dark:text-slate-200">
                      {erpnextConfig.status === "connected" ? "Connected" : erpnextConfig.status === "error" ? "Connection Error" : "Disconnected"}
                    </span>
                  </div>
                  <Switch
                    checked={erpnextConfig.enabled}
                    onCheckedChange={(checked) => setERPNextConfig({ enabled: checked })}
                  />
                </div>
                {erpnextConfig.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input className="h-8 text-xs" placeholder="ERPNext URL" value={erpnextConfig.baseUrl} onChange={(e) => setERPNextConfig({ baseUrl: e.target.value })} />
                    <Input className="h-8 text-xs" placeholder="API Key" value={erpnextConfig.apiKey || ""} onChange={(e) => setERPNextConfig({ apiKey: e.target.value })} />
                    <Input className="h-8 text-xs" placeholder="Company" value={erpnextConfig.company} onChange={(e) => setERPNextConfig({ company: e.target.value })} />
                    <Input className="h-8 text-xs" placeholder="Default Warehouse" value={erpnextConfig.defaultWarehouse} onChange={(e) => setERPNextConfig({ defaultWarehouse: e.target.value })} />
                  </div>
                )}
                {erpnextConfig.enabled && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 text-xs bg-blue-600 text-white" onClick={testERPNextConnection} disabled={erpnextLoading}>
                      {erpnextLoading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Link2 className="w-3 h-3 mr-1" />}
                      Test Connection
                    </Button>
                    {erpnextLastResult && (
                      <span className={`text-[10px] ${erpnextLastResult.success ? "text-emerald-600" : "text-red-600"}`}>
                        {erpnextLastResult.success ? (erpnextLastResult.data as any)?.message || "Connected" : erpnextLastResult.error}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Runner */}
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-violet-500" />
                  ERPNext Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select
                    className="h-8 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2"
                    value={selectedReportId}
                    onChange={(e) => { setSelectedReportId(e.target.value); setReportFilters({}); }}
                  >
                    <option value="">Select a report...</option>
                    {erpnextReports.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {selectedReportId && erpnextReports.find((r) => r.id === selectedReportId)?.filters.map((f) => (
                    <Input
                      key={f.field}
                      className="h-8 text-xs"
                      placeholder={f.label}
                      value={reportFilters[f.field] || ""}
                      onChange={(e) => setReportFilters((prev) => ({ ...prev, [f.field]: e.target.value }))}
                    />
                  ))}
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-violet-600 text-white"
                    disabled={!selectedReportId || !erpnextConfig.enabled || erpnextLoading}
                    onClick={() => selectedReportId && runERPNextReport(selectedReportId, reportFilters)}
                  >
                    {erpnextLoading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />}
                    Run Report
                  </Button>
                </div>

                {/* Report Result */}
                {erpnextLastResult?.success && typeof erpnextLastResult.data === "object" && erpnextLastResult.data !== null && (
                  <div className="rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 p-3 max-h-[300px] overflow-y-auto">
                    <pre className="text-[10px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                      {JSON.stringify(erpnextLastResult.data, null, 2)}
                    </pre>
                  </div>
                )}
                {erpnextLastResult && !erpnextLastResult.success && (
                  <p className="text-xs text-red-600">{erpnextLastResult.error}</p>
                )}
              </CardContent>
            </Card>

            {/* Quick ERPNext Commands */}
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick ERPNext Commands
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { label: "Stock Balance", cmd: "Get stock report from ERPNext" },
                    { label: "BOM Explorer", cmd: "ERPNext BOM report" },
                    { label: "WO Status", cmd: "Query Work Order in ERPNext" },
                    { label: "Sales Analytics", cmd: "ERPNext sales report" },
                    { label: "PO Tracker", cmd: "ERPNext purchase order tracker" },
                    { label: "Sync All", cmd: "Sync with ERPNext" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        setOpen(true);
                        // trigger via store action would need refactoring; just open chat
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-gray-100 dark:border-slate-700/50 text-left transition-colors"
                    >
                      <Database className="w-3.5 h-3.5 text-violet-500" />
                      <span className="text-[11px] text-slate-700 dark:text-slate-200">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
