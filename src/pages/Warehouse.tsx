import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Thermometer, Droplets, Warehouse as WarehouseIcon, Truck, QrCode,
  ClipboardCheck, Package, ChevronDown, ChevronUp,
} from "lucide-react";
import type { WarehouseZone, ZoneItem } from "@/data/mockData";

export default function Warehouse() {
  const navigate = useNavigate();
  const { warehouseZones } = useAppStore();
  const [activeTab, setActiveTab] = useState("zones");
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredZones = warehouseZones.filter((z: WarehouseZone) =>
    z.name.toLowerCase().includes(search.toLowerCase()) ||
    z.items.some((it: ZoneItem) => it.product.toLowerCase().includes(search.toLowerCase()))
  );

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
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Warehouse</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Inventory and stock management</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800">
          <TabsTrigger value="zones" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400">Zones</TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400">Inventory</TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-4 space-y-3">
          {filteredZones.map((zone: WarehouseZone) => (
            <Card key={zone.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors"
                onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    zone.type === "refrigerated" ? "bg-cyan-50 dark:bg-cyan-500/15" :
                    zone.type === "ambient" ? "bg-amber-50 dark:bg-amber-950/20" : "bg-red-50 dark:bg-red-950/20"
                  }`}>
                    {zoneIcon(zone.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{zone.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{zone.type}</span>
                      <span>{zone.temp}°C</span>
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
                      {zone.items.map((item: ZoneItem) => (
                        <div key={item.product} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
                          <div>
                            <p className="text-sm text-slate-800 dark:text-white">{item.product}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Batch: {item.batch} | Exp: {item.expiry}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{item.qty.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.uom}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </TabsContent>

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
    </div>
  );
}
