import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Factory, Plus, Wrench, Activity, Edit2, Trash2,
  Play, Pause, AlertTriangle,
} from "lucide-react";
import { fillingLines } from "@/data/mockData";
import type { FillingLine } from "@/data/mockData";

interface Equipment {
  id: string;
  name: string;
  line: string;
  status: "running" | "idle" | "down" | "maintenance";
  type: string;
}

const equipmentList: Equipment[] = [
  { id: "e1", name: "Filler A", line: "FL1", status: "running", type: "Filler" },
  { id: "e2", name: "Capper A", line: "FL1", status: "running", type: "Capper" },
  { id: "e3", name: "Labeler A", line: "FL1", status: "idle", type: "Labeler" },
  { id: "e4", name: "Filler B", line: "FL2", status: "idle", type: "Filler" },
  { id: "e5", name: "Capper B", line: "FL2", status: "idle", type: "Capper" },
  { id: "e6", name: "Filler C", line: "FL3", status: "down", type: "Filler" },
  { id: "e7", name: "Seamer C", line: "FL3", status: "down", type: "Seamer" },
  { id: "e8", name: "Can Filler D", line: "FL4", status: "running", type: "Filler" },
  { id: "e9", name: "Seamer D", line: "FL4", status: "running", type: "Seamer" },
  { id: "e10", name: "Conveyor 1", line: "FL1", status: "running", type: "Conveyor" },
];

export default function AdminLines() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"lines" | "equipment">("lines");
  const [search, setSearch] = useState("");

  const filteredLines = fillingLines.filter((l: FillingLine) =>
    l.name.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase())
  );
  const filteredEquip = equipmentList.filter((e: Equipment) =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.line.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s: string) => {
    if (s === "running") return <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">Running</Badge>;
    if (s === "idle") return <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0">Idle</Badge>;
    if (s === "down") return <Badge className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-0">Down</Badge>;
    return <Badge className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-0">Maintenance</Badge>;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Lines & Equipment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage filling lines and equipment</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-white dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-800 p-1">
          <button
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === "lines" ? "bg-slate-700 text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"}`}
            onClick={() => setTab("lines")}
          >
            Lines
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === "equipment" ? "bg-slate-700 text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"}`}
            onClick={() => setTab("equipment")}
          >
            Equipment
          </button>
        </div>
        <div className="flex-1" />
        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-1" /> Add {tab === "lines" ? "Line" : "Equipment"}
        </Button>
      </div>

      <Input
        placeholder={`Search ${tab}...`}
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-500"
      />

      {tab === "lines" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLines.map((fl: FillingLine) => (
            <Card key={fl.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-200 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      fl.status === "running" ? "bg-emerald-50 dark:bg-emerald-500/15" :
                      fl.status === "idle" ? "bg-slate-100 dark:bg-slate-800" : "bg-red-50 dark:bg-red-950/20"
                    }`}>
                      <Factory className={`w-5 h-5 ${
                        fl.status === "running" ? "text-emerald-600 dark:text-emerald-400" :
                        fl.status === "idle" ? "text-slate-500 dark:text-slate-400" : "text-red-600 dark:text-red-400"
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{fl.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{fl.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusBadge(fl.status)}
                    <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white h-8 w-8 p-0">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {fl.currentWo && (
                  <div className="mt-3 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400">
                    Active: <span className="text-slate-800 dark:text-white">{fl.currentWo}</span>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800">
                    <Activity className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800">
                    <Wrench className="w-3 h-3 mr-1" /> Maintenance
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEquip.map((eq: Equipment) => (
            <div key={eq.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  eq.status === "running" ? "bg-emerald-50 dark:bg-emerald-500/15" :
                  eq.status === "idle" ? "bg-slate-100 dark:bg-slate-800" :
                  eq.status === "down" ? "bg-red-50 dark:bg-red-950/20" : "bg-amber-50 dark:bg-amber-950/20"
                }`}>
                  {eq.status === "running" ? <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> :
                   eq.status === "down" ? <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" /> :
                   eq.status === "maintenance" ? <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" /> :
                   <Pause className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{eq.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{eq.type} | {eq.line}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(eq.status)}
                <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-red-600 h-8 w-8 p-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
