import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import type { SpareDiscipline, LineZone } from "@/data/mockData";
import {
  ArrowLeft, Wrench, Zap, Cpu, MapPin, AlertTriangle, Star, ChevronRight, Layers,
} from "lucide-react";

const disciplineMeta: Record<SpareDiscipline, { label: string; icon: typeof Wrench; chip: string }> = {
  mechanical: {
    label: "Mechanical",
    icon: Wrench,
    chip: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  electrical: {
    label: "Electrical",
    icon: Zap,
    chip: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
  },
  electronic: {
    label: "Electronic",
    icon: Cpu,
    chip: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/30",
  },
};

const lineStatusDot: Record<string, string> = {
  running: "bg-emerald-500",
  idle: "bg-slate-400",
  down: "bg-red-500",
  maintenance: "bg-amber-500",
};

export default function LineZones() {
  const navigate = useNavigate();
  const { fillingLines, lineZones, spareParts } = useAppStore();
  const [selectedLineId, setSelectedLineId] = useState(fillingLines[0]?.id ?? "fl1");
  const [disciplineFilter, setDisciplineFilter] = useState<"all" | SpareDiscipline>("all");

  const selectedLine = fillingLines.find((fl) => fl.id === selectedLineId);
  const zones = useMemo(
    () => lineZones.filter((z) => z.lineId === selectedLineId),
    [lineZones, selectedLineId]
  );

  const partById = useMemo(() => new Map(spareParts.map((sp) => [sp.id, sp])), [spareParts]);

  const zoneStats = (zone: LineZone) => {
    const counts: Record<SpareDiscipline, number> = { mechanical: 0, electrical: 0, electronic: 0 };
    zone.parts.forEach((p) => { counts[p.discipline] += 1; });
    return counts;
  };

  const filteredZones = zones.map((z) => ({
    ...z,
    parts: disciplineFilter === "all" ? z.parts : z.parts.filter((p) => p.discipline === disciplineFilter),
  }));

  const totalParts = zones.reduce((s, z) => s + z.parts.length, 0);
  const criticalParts = zones.reduce((s, z) => s + z.parts.filter((p) => p.critical).length, 0);
  const lowStockInstalled = zones.reduce(
    (s, z) => s + z.parts.filter((p) => { const sp = partById.get(p.sparePartId); return sp && sp.qtyOnHand <= sp.minQty; }).length,
    0
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/digital-twin")} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Line Zones & Parts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Every production line mapped to zones — installed parts by discipline</p>
        </div>
      </div>

      {/* Line selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {fillingLines.map((fl) => (
          <button
            key={fl.id}
            onClick={() => setSelectedLineId(fl.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
              fl.id === selectedLineId
                ? "bg-slate-700 dark:bg-slate-600 text-white border-slate-700 dark:border-slate-600"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:border-slate-400"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${lineStatusDot[fl.status]}`} />
            {fl.name}
          </button>
        ))}
      </div>

      {/* Line summary */}
      {selectedLine && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Zones</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-white">{zones.length}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Installed Part Types</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-white">{totalParts}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Critical Parts</p>
              <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{criticalParts}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Installed Parts Low on Stock</p>
              <p className={`text-lg font-semibold ${lowStockInstalled > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{lowStockInstalled}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Discipline filter */}
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-slate-400" />
        {(["all", "mechanical", "electrical", "electronic"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDisciplineFilter(d)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              disciplineFilter === d
                ? "bg-slate-700 dark:bg-slate-600 text-white border-slate-700 dark:border-slate-600"
                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:border-slate-400"
            }`}
          >
            {d === "all" ? "All Disciplines" : disciplineMeta[d].label}
          </button>
        ))}
      </div>

      {/* Zone cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredZones.map((zone, zi) => {
          const stats = zoneStats(zones[zi]);
          return (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: zi * 0.04 }}
            >
              <Card className="border-gray-200 dark:border-slate-800 h-full">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <h3 className="font-semibold text-slate-800 dark:text-white">{zone.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{zone.description}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {(Object.keys(disciplineMeta) as SpareDiscipline[]).map((d) => (
                        <span key={d} className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${disciplineMeta[d].chip}`}>
                          {stats[d]} {disciplineMeta[d].label.slice(0, 5)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {zone.parts.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No {disciplineFilter === "all" ? "" : disciplineMeta[disciplineFilter].label.toLowerCase() + " "}parts in this zone.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(Object.keys(disciplineMeta) as SpareDiscipline[])
                        .filter((d) => disciplineFilter === "all" || disciplineFilter === d)
                        .map((d) => {
                          const parts = zone.parts.filter((p) => p.discipline === d);
                          if (parts.length === 0) return null;
                          const DIcon = disciplineMeta[d].icon;
                          return (
                            <div key={d} className="rounded-lg border border-gray-100 dark:border-slate-800/70 overflow-hidden">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-slate-800/60">
                                <DIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{disciplineMeta[d].label} ({parts.length})</span>
                              </div>
                              <div className="divide-y divide-gray-100 dark:divide-slate-800/70">
                                {parts.map((p, i) => {
                                  const sp = partById.get(p.sparePartId);
                                  if (!sp) return null;
                                  const isLow = sp.qtyOnHand <= sp.minQty;
                                  return (
                                    <div key={`${p.sparePartId}-${i}`} className="flex items-center gap-2 px-3 py-2">
                                      <span className="font-mono text-[10px] text-slate-400 w-14 shrink-0">{sp.code}</span>
                                      <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate">{sp.name}</span>
                                      {p.critical && (
                                        <span title="Critical part">
                                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        </span>
                                      )}
                                      {isLow && (
                                        <span title="Low stock in store">
                                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                        </span>
                                      )}
                                      <Badge variant="outline" className="border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-mono">
                                        ×{p.qty} installed
                                      </Badge>
                                      <span className={`text-[10px] font-medium w-16 text-right ${isLow ? "text-red-600 dark:text-red-400" : "text-slate-400"}`}>
                                        {sp.qtyOnHand} {sp.uom} avail
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  <button
                    onClick={() => navigate("/maintenance/spares")}
                    className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    Open spare parts store <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
