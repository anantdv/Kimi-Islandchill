import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  Shield, Factory, Droplets, Users, BarChart3, Settings, FileText,
  Workflow, ListChecks,
  ChevronRight, Activity, CheckCircle2, AlertTriangle, Clock,
  Download, Calendar, TrendingUp, LayoutDashboard,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { fillingLines, productFamilies, boms, mesForms } from "@/data/mockData";
import type { WorkOrder, Incident } from "@/data/mockData";

const incidentData = [
  { name: "Equipment", value: 3, color: "#ef4444" },
  { name: "Quality", value: 1, color: "#f97316" },
  { name: "Material", value: 1, color: "#eab308" },
  { name: "Safety", value: 0, color: "#64748b" },
];

const throughputData = [
  { day: "Mon", planned: 5000, actual: 4800 },
  { day: "Tue", planned: 5200, actual: 5100 },
  { day: "Wed", planned: 5000, actual: 4500 },
  { day: "Thu", planned: 5500, actual: 5300 },
  { day: "Fri", planned: 5800, actual: 5600 },
  { day: "Sat", planned: 3000, actual: 2900 },
  { day: "Sun", planned: 2000, actual: 1900 },
];

const quickLinks = [
  { icon: Factory, label: "Lines & Equipment", path: "/admin/lines", desc: "Manage filling lines and equipment" },
  { icon: Droplets, label: "Products", path: "/admin/products", desc: "Configure product families and variants" },
  { icon: FileText, label: "BOMs", path: "/admin/boms", desc: "Manage bills of materials" },
  { icon: ListChecks, label: "Forms", path: "/admin/forms", desc: "Categorized MES forms library" },
  { icon: Workflow, label: "Workflow", path: "/admin/workflow", desc: "Job allocation and routing" },
  { icon: Users, label: "Users", path: "/admin/users", desc: "Manage operators and supervisors" },
  { icon: Settings, label: "Settings", path: "/admin/settings", desc: "MES configuration and workflows" },
];

/* ── Reports tab data ── */
const monthlyOutput = [
  { month: "Jan", water: 45000, csd: 12000, rtd: 8000 },
  { month: "Feb", water: 48000, csd: 13500, rtd: 9200 },
  { month: "Mar", water: 52000, csd: 14800, rtd: 10500 },
  { month: "Apr", water: 51000, csd: 14200, rtd: 9800 },
  { month: "May", water: 56000, csd: 15500, rtd: 11200 },
  { month: "Jun", water: 58000, csd: 16200, rtd: 12000 },
];

const downtimeData = [
  { reason: "Equipment Fault", hours: 24, color: "#ef4444" },
  { reason: "Planned Maint.", hours: 18, color: "#3b82f6" },
  { reason: "Material Delay", hours: 8, color: "#f59e0b" },
  { reason: "Quality Hold", hours: 5, color: "#8b5cf6" },
  { reason: "Changeover", hours: 12, color: "#10b981" },
];

const oeeTrend = [
  { week: "W1", oee: 89, availability: 92, performance: 96, quality: 99 },
  { week: "W2", oee: 91, availability: 94, performance: 97, quality: 99 },
  { week: "W3", oee: 88, availability: 91, performance: 95, quality: 98 },
  { week: "W4", oee: 93, availability: 95, performance: 98, quality: 99 },
];

const reportTypes = [
  { name: "Production Output", desc: "Daily/weekly output by line and product", updated: "Today" },
  { name: "OEE Analysis", desc: "Overall Equipment Effectiveness breakdown", updated: "Today" },
  { name: "Downtime Report", desc: "Unplanned stops and root causes", updated: "Yesterday" },
  { name: "Quality Summary", desc: "QC pass/fail rates and trends", updated: "2 days ago" },
  { name: "Inventory Report", desc: "Stock levels, movements, expiry alerts", updated: "Today" },
  { name: "Incident Log", desc: "All incidents with resolution times", updated: "Yesterday" },
];

function ReportsTab() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <div className="flex bg-white dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-800 p-1">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              className={`px-4 py-1.5 rounded-md text-sm capitalize transition-colors ${period === p ? "bg-slate-700 text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="outline" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => window.print()}>
          <Download className="w-4 h-4 mr-1" /> Export
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Production Output by Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyOutput}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                  <Bar dataKey="water" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="csd" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="rtd" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> OEE Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={oeeTrend}>
                  <defs>
                    <linearGradient id="oeeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={[80, 100]} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="oee" stroke="#06b6d4" strokeWidth={2} fill="url(#oeeGrad)" />
                  <Area type="monotone" dataKey="availability" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 4" fill="none" />
                  <Area type="monotone" dataKey="performance" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 4" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downtime */}
      <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-800 dark:text-white">Downtime Breakdown (hrs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downtimeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis dataKey="reason" type="category" stroke="#475569" fontSize={11} tickLine={false} width={110} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                  {downtimeData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((r) => (
          <Card key={r.name} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-200 cursor-pointer transition-colors group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3 h-3 mr-1" />{r.updated}
                </Badge>
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">{r.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{r.desc}</p>
              <Button size="sm" variant="ghost" className="mt-3 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-300 p-0 h-auto" onClick={() => window.print()}>
                <Download className="w-3 h-3 mr-1" /> Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { workOrders, incidents } = useAppStore();
  const [activeTab, setActiveTab] = useState<"overview" | "reports">("overview");
  const totalWO = workOrders.length;
  const completedWO = workOrders.filter((w: WorkOrder) => w.status === "completed").length;
  const openInc = incidents.filter((i: Incident) => i.status === "open").length;
  const totalLines = fillingLines.length;
  const runningLines = fillingLines.filter((l) => l.status === "running").length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">System configuration, management and analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-800">
        {([
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "reports" && <ReportsTab />}

      {activeTab === "overview" && (
      <>
      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total WOs", value: totalWO, icon: Activity, color: "cyan" },
          { label: "Completed", value: completedWO, icon: CheckCircle2, color: "emerald" },
          { label: "Open Incidents", value: openInc, icon: AlertTriangle, color: "red" },
          { label: "Lines Running", value: `${runningLines}/${totalLines}`, icon: Clock, color: "amber" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  stat.color === "cyan" ? "bg-cyan-50 dark:bg-cyan-500/15" :
                  stat.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-500/15" :
                  stat.color === "red" ? "bg-red-50 dark:bg-red-950/20" : "bg-amber-50 dark:bg-amber-950/20"
                }`}>
                  <stat.icon className={`w-5 h-5 ${
                    stat.color === "cyan" ? "text-cyan-600 dark:text-cyan-400" :
                    stat.color === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
                    stat.color === "red" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                  }`} />
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Throughput */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-800 dark:text-white">Weekly Throughput (units)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputData}>
                  <defs>
                    <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="planned" stroke="#64748b" strokeDasharray="5 5" fill="url(#plannedGrad)" />
                  <Area type="monotone" dataKey="actual" stroke="#06b6d4" strokeWidth={2} fill="url(#actualGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Incident Breakdown */}
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-800 dark:text-white">Incident Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incidentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {incidentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {incidentData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {quickLinks.map((link, i) => (
          <motion.div key={link.path} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
            <Card
              className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-cyan-900/50 cursor-pointer transition-colors group"
              onClick={() => navigate(link.path)}
            >
              <CardContent className="p-4">
                <link.icon className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium text-slate-800 dark:text-white">{link.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{link.desc}</p>
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300 mt-2 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* System Summary */}
      <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-800 dark:text-white">System Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Product Families</p>
              <p className="text-white font-medium">{productFamilies.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Variants</p>
              <p className="text-white font-medium">{productFamilies.reduce((acc, pf) => acc + pf.variants.length, 0)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Filling Lines</p>
              <p className="text-white font-medium">{fillingLines.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">BOMs</p>
              <p className="text-white font-medium">{boms.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Forms</p>
              <p className="text-white font-medium">{mesForms.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Warehouse Zones</p>
              <p className="text-white font-medium">5</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">MES Version</p>
              <p className="text-white font-medium">v1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Documentation */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">Functions &amp; Processes</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">System modules, workflows, and role definitions</p>
                  </div>
                </div>
                <a href="/IslandChill_MES_Functions_and_Processes.pdf" download>
                  <button className="h-7 px-2 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white rounded-md flex items-center">
                    <Download className="w-3 h-3 mr-1" /> PDF
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center">
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">Installation Guide</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Deployment steps for production environment</p>
                  </div>
                </div>
                <a href="/IslandChill_MES_Installation_Guide.pdf" download>
                  <button className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center">
                    <Download className="w-3 h-3 mr-1" /> PDF
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-500/15 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">ERPNext Integration Guide</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">ERPNext setup, API connection, Stock/Users/Warehouse sync</p>
                  </div>
                </div>
                <a href="/IslandChill_MES_ERPNext_Integration_Guide.pdf" download>
                  <button className="h-7 px-2 text-[10px] bg-violet-600 hover:bg-violet-700 text-white rounded-md flex items-center">
                    <Download className="w-3 h-3 mr-1" /> PDF
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
