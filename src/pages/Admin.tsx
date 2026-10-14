import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Shield, Factory, Droplets, Users, BarChart3, Settings, FileText,
  Workflow, ListChecks,
  ChevronRight, Activity, CheckCircle2, AlertTriangle, Clock,
  Download, Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { fillingLines, productFamilies, boms, mesForms } from "@/data/mockData";
import type { WorkOrder, Incident } from "@/data/mockData";
import {
  getDashboardStats,
  getWeeklyThroughput,
  getIncidentBreakdown,
  getSystemSummary,
  type DashboardStats,
  type ThroughputDataPoint,
  type IncidentBreakdownItem,
  type SystemSummary,
} from "@/services/erpnext";

const mockIncidentData = [
  { name: "Equipment", value: 3, color: "#ef4444" },
  { name: "Quality", value: 1, color: "#f97316" },
  { name: "Material", value: 1, color: "#eab308" },
  { name: "Safety", value: 0, color: "#64748b" },
];

const mockThroughputData = [
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
  { icon: BarChart3, label: "Reports", path: "/admin/reports", desc: "Production analytics and KPIs" },
  { icon: Settings, label: "Settings", path: "/admin/settings", desc: "MES configuration and workflows" },
];

export default function Admin() {
  const navigate = useNavigate();
  const { workOrders, incidents, erpConnection } = useAppStore();

  const [liveMode, setLiveMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [throughput, setThroughput] = useState<ThroughputDataPoint[]>(mockThroughputData);
  const [incidentBreakdown, setIncidentBreakdown] = useState<IncidentBreakdownItem[]>(mockIncidentData);
  const [summary, setSummary] = useState<SystemSummary | null>(null);

  const totalWO = workOrders.length;
  const completedWO = workOrders.filter((w: WorkOrder) => w.status === "completed").length;
  const openInc = incidents.filter((i: Incident) => i.status === "open").length;
  const totalLines = fillingLines.length;
  const runningLines = fillingLines.filter((l) => l.status === "running").length;

  const fetchLiveData = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, t, i, sum] = await Promise.all([
        getDashboardStats(),
        getWeeklyThroughput(),
        getIncidentBreakdown(),
        getSystemSummary(),
      ]);
      setStats(s);
      setThroughput(t);
      setIncidentBreakdown(i);
      setSummary(sum);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (liveMode && erpConnection.connected) {
      fetchLiveData();
    }
  }, [liveMode, erpConnection.connected]);

  const displayStats = liveMode && stats
    ? {
        totalWO: stats.total_work_orders,
        completedWO: stats.completed_work_orders,
        openInc: stats.open_incidents,
        linesRunning: stats.lines_running,
      }
    : {
        totalWO,
        completedWO,
        openInc,
        linesRunning: `${runningLines}/${totalLines}`,
      };

  const displayThroughput = liveMode ? throughput : mockThroughputData;
  const displayIncidents = liveMode ? incidentBreakdown : mockIncidentData;
  const displaySummary = liveMode && summary
    ? {
        productFamilies: summary.product_families,
        totalVariants: summary.total_variants,
        fillingLines: summary.filling_lines,
        boms: summary.boms,
        forms: summary.forms,
        warehouseZones: summary.warehouse_zones,
        mesVersion: summary.mes_version,
      }
    : {
        productFamilies: productFamilies.length,
        totalVariants: productFamilies.reduce((acc, pf) => acc + pf.variants.length, 0),
        fillingLines: fillingLines.length,
        boms: boms.length,
        forms: mesForms.length,
        warehouseZones: 5,
        mesVersion: "v1.0.0",
      };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">System configuration and management</p>
        </div>
        {erpConnection.connected && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={liveMode ? "default" : "outline"}
              className={liveMode ? "bg-cyan-600 hover:bg-cyan-700 text-white" : ""}
              onClick={() => setLiveMode(!liveMode)}
            >
              {liveMode ? "Mock Data" : "Live Data"}
            </Button>
            {liveMode && (
              <Button size="sm" variant="outline" onClick={fetchLiveData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            )}
          </div>
        )}
      </div>

      {!erpConnection.connected && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/20 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          Not connected to ERPNext. Connect via Admin → BOM to see live dashboard data.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/20 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {liveMode && erpConnection.connected && (
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                ERPNext: {erpConnection.user}
              </Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {liveMode ? "Showing live dashboard data from ERPNext" : "Showing local mock dashboard data"}
              </span>
            </div>
            <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </CardContent>
        </Card>
      )}

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total WOs", value: displayStats.totalWO, icon: Activity, color: "cyan" },
          { label: "Completed", value: displayStats.completedWO, icon: CheckCircle2, color: "emerald" },
          { label: "Open Incidents", value: displayStats.openInc, icon: AlertTriangle, color: "red" },
          { label: "Lines Running", value: displayStats.linesRunning, icon: Clock, color: "amber" },
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
                <AreaChart data={displayThroughput}>
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
                  <Pie data={displayIncidents} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {displayIncidents.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {displayIncidents.map((item) => (
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
              <p className="text-white font-medium">{displaySummary.productFamilies}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Variants</p>
              <p className="text-white font-medium">{displaySummary.totalVariants}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Filling Lines</p>
              <p className="text-white font-medium">{displaySummary.fillingLines}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">BOMs</p>
              <p className="text-white font-medium">{displaySummary.boms}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Forms</p>
              <p className="text-white font-medium">{displaySummary.forms}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Warehouse Zones</p>
              <p className="text-white font-medium">{displaySummary.warehouseZones}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">MES Version</p>
              <p className="text-white font-medium">{displaySummary.mesVersion}</p>
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
    </div>
  );
}
