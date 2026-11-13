import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Thermometer, Droplets, Warehouse as WarehouseIcon, Truck, QrCode,
  ClipboardCheck, Package, ChevronDown, ChevronUp, Layers, Grid3X3, Search,
  CheckCircle2, AlertTriangle, X, Plus, RefreshCw,
} from "lucide-react";
import type { WarehouseZone, ZoneItem, WarehouseBin } from "@/data/mockData";
import { generateId } from "@/lib/utils";


const binStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  empty: { label: "Empty", color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/50" },
  partial: { label: "Partial", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-500/10" },
  full: { label: "Full", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
};

const urlCategoryMap: Record<string, string> = {
  "raw-materials": "raw_material",
  "finished-goods": "finished_good",
};

const categoryTitle: Record<string, string> = {
  raw_material: "Raw Materials",
  finished_good: "Finished Goods",
};

function getUrlCategory(pathname: string): string | undefined {
  const seg = pathname.split("/").pop();
  return seg ? urlCategoryMap[seg] : undefined;
}

export default function Warehouse() {
  const navigate = useNavigate();
  const location = useLocation();
  const urlCat = getUrlCategory(location.pathname);
  const isFiltered = !!urlCat;

  const { warehouseZones, warehouseRacks, warehouseBins } = useAppStore();
  const [activeTab, setActiveTab] = useState("zones");
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(urlCat ?? "all");

  // Sync category filter when URL changes (e.g. navigating between RM / FG)
  useEffect(() => {
    setCategoryFilter(urlCat ?? "all");
  }, [urlCat]);

  /* ── Racks & Bins state ───────────────────────────────────────────────────── */
  const [rackSearch, setRackSearch] = useState("");
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>("all");
  const [selectedRackBin, setSelectedRackBin] = useState<string | null>(null);
  const [rackModal, setRackModal] = useState(false);
  const [binModal, setBinModal] = useState(false);
  const [editingRackId, setEditingRackId] = useState<string | null>(null);

  const racks = useMemo(() => {
    return warehouseRacks.filter((r) => {
      const zone = warehouseZones.find((z) => z.id === r.zoneId);
      const catMatch = !urlCat || zone?.category === urlCat;
      const m = !rackSearch || r.name.toLowerCase().includes(rackSearch.toLowerCase()) || r.code.toLowerCase().includes(rackSearch.toLowerCase());
      const z = selectedZoneFilter === "all" || r.zoneId === selectedZoneFilter;
      return catMatch && m && z;
    });
  }, [warehouseRacks, warehouseZones, rackSearch, selectedZoneFilter, urlCat]);

  const getBinsForRack = (rackId: string) => warehouseBins.filter((b) => b.rackId === rackId);

  // Stats scoped to current category filter
  const categoryRackIds = new Set(racks.map((r) => r.id));
  const categoryBins = warehouseBins.filter((b) => categoryRackIds.has(b.rackId));
  const totalBins = categoryBins.length;
  const occupiedBins = categoryBins.filter((b) => b.status !== "empty").length;
  const totalItems = categoryBins.reduce((acc, b) => acc + b.items.length, 0);

  const filteredZones = warehouseZones.filter((z: WarehouseZone) => {
    const catMatch = categoryFilter === "all" || z.category === categoryFilter;
    const searchMatch = !search || z.name.toLowerCase().includes(search.toLowerCase()) || z.items.some((it: ZoneItem) => it.product.toLowerCase().includes(search.toLowerCase()));
    return catMatch && searchMatch;
  });

  const tempAlert = (zone: WarehouseZone) => {
    const outOfRange = zone.items.some((it) => zone.temp < it.storageTemp.min || zone.temp > it.storageTemp.max);
    return outOfRange ? { color: "text-red-600", bg: "bg-red-50 dark:bg-red-500/10", label: "Temp Alert" } : { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", label: "Temp OK" };
  };

  const categoryLabel: Record<string, string> = {
    raw_material: "Raw Materials",
    finished_good: "Finished Goods",
    dispatch: "Dispatch",
  };

  const zoneIcon = (type: string) => {
    if (type === "refrigerated") return <Thermometer className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    if (type === "ambient") return <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    return <Droplets className="w-4 h-4 text-red-600 dark:text-red-400" />;
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{isFiltered ? categoryTitle[urlCat!] : "Warehouse"}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{isFiltered ? `${categoryTitle[urlCat!]} — zones, racks, bins, and inventory` : "Inventory, racks, bins, and stock management"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="ml-auto border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300" onClick={() => navigate("/stock")}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Stock On Hand
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800">
          <TabsTrigger value="zones" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Zones</TabsTrigger>
          <TabsTrigger value="racks" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Racks & Bins</TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Inventory</TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400 text-xs">Operations</TabsTrigger>
        </TabsList>

        {/* ── Zones Tab ───────────────────────────────────────────────────────── */}
        <TabsContent value="zones" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search zone or product..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700" />
            </div>
            {!isFiltered && (
              <div className="flex gap-1">
                {[
                  { key: "all", label: "All", color: "slate" },
                  { key: "raw_material", label: "Raw Materials", color: "amber" },
                  { key: "finished_good", label: "Finished Goods", color: "emerald" },
                  { key: "dispatch", label: "Dispatch", color: "violet" },
                ].map((c) => (
                  <button key={c.key} onClick={() => setCategoryFilter(c.key)} className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors border ${categoryFilter === c.key ? `bg-${c.color}-50 dark:bg-${c.color}-500/10 text-${c.color}-600 border-${c.color}-200` : "bg-white dark:bg-slate-900 text-slate-500 border-gray-200 dark:border-slate-700"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredZones.map((zone: WarehouseZone) => {
            const tAlert = tempAlert(zone);
            return (
              <Card key={zone.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors" onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      zone.type === "refrigerated" ? "bg-cyan-50 dark:bg-cyan-500/15" :
                      zone.type === "ambient" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-red-50 dark:bg-red-950/20"
                    }`}>
                      {zoneIcon(zone.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{zone.name}</p>
                        <Badge className={`text-[9px] border-0 ${zone.category === "raw_material" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600" : zone.category === "finished_good" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" : "bg-violet-50 dark:bg-violet-500/10 text-violet-600"}`}>
                          {categoryLabel[zone.category]}
                        </Badge>
                        <Badge className={`text-[9px] border-0 ${tAlert.bg} ${tAlert.color}`}>
                          <Thermometer className="w-3 h-3 mr-0.5" /> {tAlert.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{zone.type}</span>
                        <span className="font-mono">{zone.temp}°C</span>
                        <span>{zone.humidity}% RH</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="w-20 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${zone.capacity > 85 ? "bg-red-500" : zone.capacity > 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${zone.capacity}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{zone.capacity}%</p>
                    </div>
                    {expandedZone === zone.id ? <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedZone === zone.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2">
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Stock Items</p>
                        {zone.items.map((item: ZoneItem) => {
                          const tempOk = zone.temp >= item.storageTemp.min && zone.temp <= item.storageTemp.max;
                          const isRM = zone.category === "raw_material";
                          const isFG = zone.category === "finished_good";
                          return (
                            <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-slate-800 dark:text-white truncate">{item.product}</p>
                                  {item.concentration && (
                                    <Badge className="text-[9px] border-0 bg-violet-50 dark:bg-violet-500/10 text-violet-600">{item.concentration}</Badge>
                                  )}
                                  {isFG && item.containerType === "case" && (
                                    <Badge className="text-[9px] border-0 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600">Case</Badge>
                                  )}
                                  {isRM && item.containerType && (
                                    <Badge className="text-[9px] border-0 bg-amber-50 dark:bg-amber-500/10 text-amber-600">
                                      {item.containerType === "drum" ? "🛢️ Drum" : item.containerType === "ibc_tote" ? "🧊 IBC Tote" : item.containerType === "square_box" ? "📦 Box" : item.containerType === "bulk_bag" ? "🎒 Bulk" : item.containerType === "pallet" ? "📦 Pallet" : item.containerType}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Batch: {item.batch} | Exp: {item.expiry}</p>
                                <p className="text-[10px] flex items-center gap-1 mt-0.5">
                                  <Thermometer className={`w-3 h-3 ${tempOk ? "text-emerald-500" : "text-red-500"}`} />
                                  <span className={tempOk ? "text-emerald-600" : "text-red-600"}>Store: {item.storageTemp.min}–{item.storageTemp.max}°C</span>
                                  <span className="text-slate-400">(current {zone.temp}°C)</span>
                                </p>
                                {/* RM-specific: volume bar for liquids */}
                                {isRM && item.volume && (
                                  <div className="mt-1.5">
                                    <div className="flex items-center justify-between text-[9px] text-slate-500">
                                      <span>Volume</span>
                                      <span>{item.volume.current} / {item.volume.capacity} {item.volume.unit}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
                                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min((item.volume.current / item.volume.capacity) * 100, 100)}%` }} />
                                    </div>
                                  </div>
                                )}
                                {/* FG-specific: pallet info */}
                                {isFG && item.palletCount !== undefined && item.casesPerPallet && (
                                  <p className="text-[9px] text-slate-400 mt-1">{item.palletCount} pallets × {item.casesPerPallet} cases/pallet</p>
                                )}
                              </div>
                              <div className="text-right ml-3 shrink-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-white">{item.qty.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.uom}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
          {filteredZones.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <WarehouseIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No zones match your filter.</p>
            </div>
          )}
        </TabsContent>

        {/* ── Racks & Bins Tab ────────────────────────────────────────────────── */}
        <TabsContent value="racks" className="mt-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Racks", value: warehouseRacks.length, color: "amber", icon: Layers },
              { label: "Total Bins", value: totalBins, color: "orange", icon: Grid3X3 },
              { label: "Occupied", value: occupiedBins, color: "blue", icon: Package },
              { label: "Items Stored", value: totalItems, color: "emerald", icon: CheckCircle2 },
            ].map((s) => (
              <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${s.color === "amber" ? "bg-amber-50 dark:bg-amber-500/10" : s.color === "orange" ? "bg-orange-50 dark:bg-orange-500/10" : s.color === "blue" ? "bg-blue-50 dark:bg-blue-500/10" : "bg-emerald-50 dark:bg-emerald-500/10"} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color === "amber" ? "text-amber-600" : s.color === "orange" ? "text-orange-600" : s.color === "blue" ? "text-blue-600" : "text-emerald-600"}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search rack or bin..." value={rackSearch} onChange={(e) => setRackSearch(e.target.value)} className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700" />
            </div>
            <select value={selectedZoneFilter} onChange={(e) => setSelectedZoneFilter(e.target.value)} className="h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-slate-700 dark:text-slate-300">
              <option value="all">All Zones</option>
              {warehouseZones.filter((z) => !urlCat || z.category === urlCat).map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
            </select>
            <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => { setEditingRackId(null); setRackModal(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Rack
            </Button>
            <Button size="sm" className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setBinModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Bin
            </Button>
          </div>

          {/* Rack Grid */}
          <div className="space-y-4">
            {racks.map((rack) => {
              const bins = getBinsForRack(rack.id);
              const zone = warehouseZones.find((z) => z.id === rack.zoneId);
              return (
                <motion.div key={rack.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{rack.name} <span className="text-slate-400 font-normal">({rack.code})</span></p>
                            <p className="text-[10px] text-slate-500">{zone?.name} — {rack.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-slate-700 text-slate-500">
                            {bins.length} / {rack.capacity} bins
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400" onClick={() => { setEditingRackId(rack.id); setRackModal(true); }}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {bins.map((bin) => {
                          const cfg = binStatusConfig[bin.status];
                          return (
                            <button key={bin.id} onClick={() => setSelectedRackBin(selectedRackBin === bin.id ? null : bin.id)} className={`relative p-2.5 rounded-lg border text-left transition-all hover:shadow-md ${cfg.bg} ${bin.status === "empty" ? "border-gray-200 dark:border-slate-800" : "border-amber-200 dark:border-amber-900/20"}`}>
                              <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">{bin.name}</p>
                              <p className={`text-[9px] ${cfg.color}`}>{cfg.label}</p>
                              {bin.items.length > 0 && <p className="text-[9px] text-slate-500 mt-1">{bin.items.length} item{bin.items.length > 1 ? "s" : ""}</p>}
                              {bin.status === "full" && <AlertTriangle className="w-3 h-3 text-amber-500 absolute top-1.5 right-1.5" />}
                            </button>
                          );
                        })}
                        {bins.length === 0 && <p className="text-xs text-slate-400 col-span-full py-2">No bins configured for this rack.</p>}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {racks.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <Grid3X3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No racks found.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Inventory Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="inventory" className="mt-4 space-y-3">
          <Input
            placeholder="Search SKU, batch..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-500"
          />
          <div className="space-y-2">
            {filteredZones.flatMap((z: WarehouseZone) => z.items.map((it: ZoneItem) => ({ ...it, zone: z.name })))
              .filter((it) => !search || it.product.toLowerCase().includes(search.toLowerCase()) || it.batch.toLowerCase().includes(search.toLowerCase()))
              .map((item) => (
                <div key={`${item.zone}-${item.product}`} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800">
                  <div>
                    <p className="text-sm text-slate-800 dark:text-white">{item.product}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Batch: {item.batch} | Zone: {item.zone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{item.qty.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.uom}</p>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        {/* ── Operations Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="operations" className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Truck, label: "Goods Receipt", color: "cyan" },
              { icon: QrCode, label: "Put-away", color: "emerald" },
              { icon: ClipboardCheck, label: "Stock Count", color: "amber" },
              { icon: WarehouseIcon, label: "Dispatch", color: "blue" },
            ].map((op) => (
              <Card key={op.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-200 cursor-pointer transition-colors">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                    op.color === "cyan" ? "bg-cyan-50 dark:bg-cyan-500/15" :
                    op.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-500/15" :
                    op.color === "amber" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-blue-50 dark:bg-blue-500/15"
                  }`}>
                    <op.icon className={`w-5 h-5 ${
                      op.color === "cyan" ? "text-cyan-600 dark:text-cyan-400" :
                      op.color === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
                      op.color === "amber" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                    }`} />
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{op.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-800 dark:text-white">Recent Movements</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { action: "Receipt", sku: "WAT-500-PET", qty: 2400, time: "10:23", cls: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" },
                { action: "Dispatch", sku: "BB-RTD-CAN", qty: 1200, time: "09:45", cls: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400" },
                { action: "Put-away", sku: "WAT-1500-PET", qty: 800, time: "08:12", cls: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Badge className={`${m.cls} border-0 text-[10px]`}>{m.action}</Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{m.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-800 dark:text-white">{m.qty}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 ml-2">{m.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modals / Drawers ──────────────────────────────────────────────────── */}
      {selectedRackBin && (
        <BinDetailDrawer binId={selectedRackBin} onClose={() => setSelectedRackBin(null)} />
      )}
      {rackModal && (
        <RackModal editingId={editingRackId} onClose={() => setRackModal(false)} />
      )}
      {binModal && (
        <BinModal onClose={() => setBinModal(false)} />
      )}
    </div>
  );
}

/* ── Sub-components (moved from WarehouseRacks.tsx) ─────────────────────────── */

function BinDetailDrawer({ binId, onClose }: { binId: string; onClose: () => void }) {
  const { warehouseBins, warehouseRacks, updateWarehouseBin, deleteWarehouseBin } = useAppStore();
  const bin = warehouseBins.find((b) => b.id === binId);
  const rack = warehouseRacks.find((r) => r.id === bin?.rackId);
  if (!bin) return null;

  const removeItem = (labelCode: string) => {
    const items = bin.items.filter((it) => it.labelCode !== labelCode);
    const status = items.length === 0 ? "empty" : bin.status === "full" ? "partial" : bin.status;
    updateWarehouseBin(bin.id, { items, status });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">{bin.name}</h2>
            <p className="text-[10px] text-slate-500">{rack?.name} — Capacity: {bin.capacity} cartons</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Bin Status</p>
            <select value={bin.status} onChange={(e) => updateWarehouseBin(bin.id, { status: e.target.value as WarehouseBin["status"] })} className="h-8 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white">
              <option value="empty">Empty</option>
              <option value="partial">Partial</option>
              <option value="full">Full</option>
            </select>
          </div>
          {bin.items.map((item, i) => (
            <Card key={i} className="bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{item.product}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[9px] border-0 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600">{item.labelCode}</Badge>
                    <button onClick={() => removeItem(item.labelCode)} className="text-slate-400 hover:text-red-500 transition-colors" title="Remove item from bin"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">{item.variant} — Batch: {item.batchNumber}</p>
                <p className="text-[10px] text-slate-500">Qty: {item.quantity} {item.uom}</p>
                <p className="text-[9px] text-slate-400">Stored: {new Date(item.storedAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
          {bin.items.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Bin is empty.</p>}
          <Button size="sm" variant="destructive" className="w-full text-xs h-8" onClick={() => { deleteWarehouseBin(bin.id); onClose(); }}>Delete Bin</Button>
        </div>
      </div>
    </div>
  );
}

function RackModal({ editingId, onClose }: { editingId: string | null; onClose: () => void }) {
  const { warehouseRacks, warehouseZones, addWarehouseRack, updateWarehouseRack, deleteWarehouseRack } = useAppStore();
  const existing = editingId ? warehouseRacks.find((r) => r.id === editingId) : null;
  const [form, setForm] = useState({ name: existing?.name ?? "", code: existing?.code ?? "", zoneId: existing?.zoneId ?? warehouseZones[0]?.id ?? "", location: existing?.location ?? "", capacity: existing?.capacity ?? 10 });

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (existing) updateWarehouseRack(existing.id, { ...form });
    else addWarehouseRack({ id: generateId("wr"), ...form });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">{existing ? "Edit Rack" : "New Rack"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Input placeholder="Rack Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
          <Input placeholder="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
          <select value={form.zoneId} onChange={(e) => setForm((p) => ({ ...p, zoneId: e.target.value }))} className="w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white">
            {warehouseZones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
          </select>
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
          <Input type="number" placeholder="Capacity (bins)" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 0 }))} className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
        <div className="px-5 py-3 border-t border-gray-200 dark:border-slate-800 flex justify-between">
          {existing && <Button size="sm" variant="destructive" className="text-xs h-8" onClick={() => { deleteWarehouseRack(existing.id); onClose(); }}>Delete</Button>}
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BinModal({ onClose }: { onClose: () => void }) {
  const { warehouseRacks, addWarehouseBin } = useAppStore();
  const [form, setForm] = useState({ rackId: warehouseRacks[0]?.id ?? "", name: "", code: "", capacity: 20 });

  const handleSave = () => {
    if (!form.name.trim() || !form.rackId) return;
    addWarehouseBin({ id: generateId("wb"), rackId: form.rackId, name: form.name, code: form.code, capacity: form.capacity, items: [], status: "empty" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">New Bin</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <select value={form.rackId} onChange={(e) => setForm((p) => ({ ...p, rackId: e.target.value }))} className="w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-slate-800 dark:text-white">
            {warehouseRacks.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
          <Input placeholder="Bin Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
          <Input placeholder="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
          <Input type="number" placeholder="Capacity (cartons)" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 0 }))} className="h-9 text-xs bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
        <div className="px-5 py-3 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSave}>Create</Button>
        </div>
      </div>
    </div>
  );
}
