import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Factory, Plus, Wrench, Edit2, Trash2, X, Save,
} from "lucide-react";
import type { FillingLine } from "@/data/mockData";

interface Equipment {
  id: string;
  name: string;
  line: string;
  status: "running" | "idle" | "down" | "maintenance";
  type: string;
}

const initialEquipment: Equipment[] = [
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
  const { fillingLines, addLine, updateLine, deleteLine } = useAppStore();
  const [tab, setTab] = useState<"lines" | "equipment">("lines");
  const [search, setSearch] = useState("");
  const [equipment] = useState<Equipment[]>(initialEquipment);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLine, setEditingLine] = useState<FillingLine | null>(null);
  const [lineName, setLineName] = useState("");
  const [lineId, setLineId] = useState("");
  const [lineStatus, setLineStatus] = useState<FillingLine["status"]>("idle");
  const [lineSpeed, setLineSpeed] = useState(200);

  const filteredLines = fillingLines.filter((l: FillingLine) =>
    l.name.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase())
  );
  const filteredEquip = equipment.filter((e: Equipment) =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.line.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingLine(null);
    setLineName("");
    setLineId("");
    setLineStatus("idle");
    setLineSpeed(200);
    setShowModal(true);
  };

  const openEdit = (line: FillingLine) => {
    setEditingLine(line);
    setLineName(line.name);
    setLineId(line.id);
    setLineStatus(line.status);
    setLineSpeed(line.speed);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!lineName.trim() || !lineId.trim()) return;
    const line: FillingLine = {
      id: lineId,
      name: lineName,
      status: lineStatus,
      speed: lineSpeed,
      efficiency: editingLine?.efficiency || 0,
      currentWo: editingLine?.currentWo,
      cameraId: editingLine?.cameraId,
      analytics: editingLine?.analytics,
    };
    if (editingLine) {
      updateLine(editingLine.id, line);
    } else {
      addLine(line);
    }
    setShowModal(false);
  };

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
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage production lines and equipment</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button onClick={() => setTab("lines")} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === "lines" ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" : "text-slate-500"}`}>
          <Factory className="w-3.5 h-3.5 inline mr-1" /> Lines ({fillingLines.length})
        </button>
        <button onClick={() => setTab("equipment")} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === "equipment" ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" : "text-slate-500"}`}>
          <Wrench className="w-3.5 h-3.5 inline mr-1" /> Equipment ({equipment.length})
        </button>
        <div className="flex-1" />
        <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add {tab === "lines" ? "Line" : "Equipment"}
        </Button>
      </div>

      <div className="relative">
        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800" />
      </div>

      {tab === "lines" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLines.map((line: FillingLine) => (
            <Card key={line.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${line.status === "running" ? "bg-emerald-50" : line.status === "down" ? "bg-red-50" : "bg-slate-100"}`}>
                      <Factory className={`w-5 h-5 ${line.status === "running" ? "text-emerald-600" : line.status === "down" ? "text-red-600" : "text-slate-500"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{line.name}</p>
                      <p className="text-[10px] text-slate-500">{line.id} · {line.speed} bpm</p>
                    </div>
                  </div>
                  {statusBadge(line.status)}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => openEdit(line)}><Edit2 className="w-3 h-3 mr-1" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] text-red-500" onClick={() => deleteLine(line.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquip.map((eq) => (
            <Card key={eq.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{eq.name}</p>
                  {statusBadge(eq.status)}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{eq.line} · {eq.type}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && tab === "lines" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 shadow-xl w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{editingLine ? "Edit Line" : "New Line"}</h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-3">
                <div><label className="text-[10px] font-medium text-slate-500">Line ID</label><Input className="h-8 text-xs mt-1" value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="FL5" /></div>
                <div><label className="text-[10px] font-medium text-slate-500">Name</label><Input className="h-8 text-xs mt-1" value={lineName} onChange={(e) => setLineName(e.target.value)} placeholder="Line 5" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-medium text-slate-500">Status</label>
                    <select className="w-full h-8 text-xs rounded-md border border-gray-200 px-2 mt-1" value={lineStatus} onChange={(e) => setLineStatus(e.target.value as FillingLine["status"])}>
                      <option value="idle">Idle</option><option value="running">Running</option><option value="down">Down</option><option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div><label className="text-[10px] font-medium text-slate-500">Speed (bpm)</label><Input className="h-8 text-xs mt-1" type="number" value={lineSpeed} onChange={(e) => setLineSpeed(Number(e.target.value))} /></div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button size="sm" className="text-xs bg-cyan-600 text-white" onClick={handleSave}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
