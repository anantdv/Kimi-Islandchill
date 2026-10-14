import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, AlertTriangle, RotateCcw, Wrench,
  Thermometer, Activity, Gauge, Zap, TrendingUp, TrendingDown,
  Factory,
} from "lucide-react";
import { fillingLines } from "@/data/mockData";
import type { FillingLine } from "@/data/mockData";

interface Machine {
  id: string; name: string; line: string;
  status: "running" | "idle" | "down" | "maintenance";
  temp: number; vibration: number; pressure: number; rpm: number;
  efficiency: number; lastMaintenance: string; nextMaintenance: string;
}

const machines: Machine[] = [
  { id: "m1", name: "Filler FL1", line: "FL1", status: "running", temp: 42, vibration: 2.1, pressure: 4.2, rpm: 280, efficiency: 94.5, lastMaintenance: "2025-01-01", nextMaintenance: "2025-02-01" },
  { id: "m2", name: "Capper FL1", line: "FL1", status: "running", temp: 38, vibration: 1.8, pressure: 3.8, rpm: 280, efficiency: 96.2, lastMaintenance: "2025-01-05", nextMaintenance: "2025-02-05" },
  { id: "m3", name: "Labeler FL1", line: "FL1", status: "idle", temp: 28, vibration: 0.5, pressure: 2.1, rpm: 0, efficiency: 0, lastMaintenance: "2025-01-03", nextMaintenance: "2025-02-03" },
  { id: "m4", name: "Filler FL4", line: "FL4", status: "running", temp: 45, vibration: 3.2, pressure: 5.1, rpm: 180, efficiency: 91.2, lastMaintenance: "2025-01-02", nextMaintenance: "2025-02-02" },
  { id: "m5", name: "Seamer FL4", line: "FL4", status: "down", temp: 52, vibration: 8.5, pressure: 2.3, rpm: 0, efficiency: 0, lastMaintenance: "2024-12-20", nextMaintenance: "2025-01-20" },
  { id: "m6", name: "Conveyor FL3", line: "FL3", status: "down", temp: 35, vibration: 12.0, pressure: 1.8, rpm: 0, efficiency: 0, lastMaintenance: "2024-12-15", nextMaintenance: "2025-01-15" },
  { id: "m7", name: "Mix Tank 1", line: "FL1", status: "running", temp: 18, vibration: 0.8, pressure: 2.5, rpm: 60, efficiency: 98.0, lastMaintenance: "2025-01-08", nextMaintenance: "2025-02-08" },
  { id: "m8", name: "Carbonator", line: "FL1", status: "running", temp: 12, vibration: 1.2, pressure: 6.0, rpm: 120, efficiency: 95.5, lastMaintenance: "2025-01-06", nextMaintenance: "2025-02-06" },
];

export default function DigitalTwin() {
  const navigate = useNavigate();
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = selectedLine === "all" ? machines : machines.filter((m: Machine) => m.line === selectedLine);

  const handleRefresh = () => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); };

  const statusColor = (s: string) => {
    if (s === "running") return "bg-emerald-500";
    if (s === "idle") return "bg-slate-500";
    if (s === "down") return "bg-red-500";
    return "bg-amber-500";
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Digital Twin</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Real-time equipment telemetry</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={handleRefresh} disabled={refreshing}>
          <RotateCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Line Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button size="sm" variant={selectedLine === "all" ? "default" : "outline"} onClick={() => setSelectedLine("all")} className={selectedLine === "all" ? "bg-cyan-600 hover:bg-cyan-700" : "border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"}>
          All Lines
        </Button>
        {fillingLines.map((fl: FillingLine) => (
          <Button key={fl.id} size="sm" variant={selectedLine === fl.id ? "default" : "outline"} onClick={() => setSelectedLine(fl.id)} className={selectedLine === fl.id ? "bg-cyan-600 hover:bg-cyan-700" : "border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"}>
            {fl.id}
          </Button>
        ))}
      </div>

      {/* Machine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((m: Machine) => (
          <motion.div key={m.id} layout>
            <Card
              className={`bg-white border-gray-200 dark:border-slate-800 hover:border-gray-200 cursor-pointer transition-all ${selectedMachine?.id === m.id ? "ring-1 ring-cyan-500/20 dark:ring-cyan-500/30" : ""}`}
              onClick={() => setSelectedMachine(selectedMachine?.id === m.id ? null : m)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColor(m.status)} ${m.status === "running" ? "animate-pulse" : ""}`} />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{m.name}</span>
                  </div>
                  <Badge className={
                    m.status === "running" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0" :
                    m.status === "down" ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-0" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0"
                  }>{m.status}</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { icon: Thermometer, label: "Temp", val: `${m.temp}°C`, warn: m.temp > 50 },
                    { icon: Activity, label: "Vib", val: m.vibration.toString(), warn: m.vibration > 5 },
                    { icon: Gauge, label: "Bar", val: m.pressure.toString(), warn: false },
                    { icon: Zap, label: "RPM", val: m.rpm.toString(), warn: false },
                  ].map((t) => (
                    <div key={t.label} className="bg-gray-50 dark:bg-slate-800/50 rounded-md p-2">
                      <t.icon className={`w-3 h-3 mx-auto mb-1 ${t.warn ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`} />
                      <p className={`text-xs font-medium ${t.warn ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-white"}`}>{t.val}</p>
                    </div>
                  ))}
                </div>
                {m.efficiency > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.efficiency}%` }} />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{m.efficiency}%</span>
                  </div>
                )}

                <AnimatePresence>
                  {selectedMachine?.id === m.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><p className="text-slate-500 dark:text-slate-400">Last Maintenance</p><p className="text-white font-medium">{m.lastMaintenance}</p></div>
                          <div><p className="text-slate-500 dark:text-slate-400">Next Maintenance</p><p className="text-white font-medium">{m.nextMaintenance}</p></div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-xs border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800">
                            <Wrench className="w-3 h-3 mr-1" /> Log
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800">
                            <TrendingUp className="w-3 h-3 mr-1" /> Trends
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* OEE Summary */}
      <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-800 dark:text-white">Line OEE Overview</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {fillingLines.map((fl: FillingLine) => {
            const lineMachines = machines.filter((m: Machine) => m.line === fl.id);
            const running = lineMachines.filter((m: Machine) => m.efficiency > 0);
            const avgEff = running.length > 0 ? running.reduce((a: number, m: Machine) => a + m.efficiency, 0) / running.length : 0;
            return (
              <div key={fl.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Factory className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{fl.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{lineMachines.length} machines</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{fl.status === "running" ? avgEff.toFixed(1) : "0"}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">OEE</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {machines.filter((m: Machine) => m.status === "down" || m.vibration > 5 || m.temp > 50).map((m: Machine) => (
            <div key={m.id} className="flex items-center justify-between p-2 bg-red-500/5 rounded-lg border border-red-500/10">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-slate-800 dark:text-white">{m.name}</span>
              </div>
              <div className="flex gap-1">
                {m.status === "down" && <Badge className="bg-red-600 text-white text-[10px] border-0">DOWN</Badge>}
                {m.vibration > 5 && <Badge className="bg-orange-500 text-slate-800 dark:text-white text-[10px] border-0">Vibration</Badge>}
                {m.temp > 50 && <Badge className="bg-red-500 text-white text-[10px] border-0">Overheat</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
