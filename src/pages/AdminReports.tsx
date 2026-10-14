import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import {
  ArrowLeft, Download, BarChart3, Calendar, TrendingUp,
} from "lucide-react";

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

export default function AdminReports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Production insights and KPIs</p>
        </div>
      </div>

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
        <Button size="sm" variant="outline" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
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
              <Button size="sm" variant="ghost" className="mt-3 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-300 p-0 h-auto">
                <Download className="w-3 h-3 mr-1" /> Download PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
