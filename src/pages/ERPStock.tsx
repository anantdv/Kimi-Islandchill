import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/stores/appStore";
import { erpApi } from "@/lib/erpApi";
import type { ERPStockCategory, ERPStockItem } from "@/data/mockData";
import {
  ArrowLeft, RefreshCw, Search, Boxes, Package, AlertTriangle, Database,
  ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, Warehouse, History,
} from "lucide-react";

interface StockMovement {
  id: string;
  itemCode: string;
  itemName: string;
  warehouse: string;
  movementType: "receipt" | "issue" | "adjustment";
  qty: number;
  balanceQty: number;
  uom: string;
  voucherType: string;
  voucherNo: string;
  postedAt: string;
}

const categoryMeta: Record<ERPStockCategory, { label: string; cls: string }> = {
  raw_material: { label: "Raw Material", cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
  packaging: { label: "Packaging", cls: "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/30" },
  consumable: { label: "Consumable", cls: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/30" },
  spare_part: { label: "Spare Part", cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" },
  finished_good: { label: "Finished Good", cls: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/30" },
};

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ERPStock() {
  const navigate = useNavigate();
  const { warehouseZones } = useAppStore();

  const [stockItems, setStockItems] = useState<ERPStockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(new Date().toISOString());
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<"all" | ERPStockCategory>("all");
  const [whFilter, setWhFilter] = useState("all");
  const [, setNow] = useState(Date.now());

  const fetchStock = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const warehouseParam = whFilter === "all" ? undefined : whFilter;
      const [items, whList, moves] = await Promise.all([
        erpApi.getStockOnHand({ warehouse: warehouseParam, search: search || undefined }),
        erpApi.getWarehouses(),
        erpApi.getStockMovements({ warehouse: warehouseParam, limit: 25 }),
      ]);
      const list = Array.isArray(items) ? items : [];
      setStockItems(list as ERPStockItem[]);
      setMovements(Array.isArray(moves) ? (moves as StockMovement[]) : []);
      setWarehouses((whList as any[]).map((w) => w.name).sort());
      setLastSyncAt(new Date().toISOString());
    } catch (e: any) {
      setError(e.message || "Failed to load stock from ERPNext");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchStock(true), 300);
    return () => clearTimeout(timer);
  }, [search, whFilter]);

  useEffect(() => {
    const sync = setInterval(() => fetchStock(true), 30000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(sync); clearInterval(clock); };
  }, [search, whFilter]);

  const filtered = useMemo(() => {
    return stockItems.filter((it) => {
      const matchCat = catFilter === "all" || it.category === catFilter;
      return matchCat;
    });
  }, [stockItems, catFilter]);

  const totalValue = stockItems.reduce((s, it) => s + it.qtyOnHand * it.unitCost, 0);
  const totalReserved = stockItems.reduce((s, it) => s + it.qtyReserved, 0);
  const reservedValue = stockItems.reduce((s, it) => s + it.qtyReserved * it.unitCost, 0);

  const whFromZone = (name: string) => warehouseZones.find((z) => z.name === name);

  const recentCutoff = new Date(lastSyncAt).getTime() - 9000;
  const isRecent = (it: ERPStockItem) => new Date(it.lastMovementAt).getTime() >= recentCutoff;

  const statCards = [
    { label: "SKUs Mirrored", value: String(stockItems.length), icon: Boxes },
    { label: "Stock Value", value: `FJD ${totalValue.toLocaleString("en-FJ", { maximumFractionDigits: 0 })}`, icon: Package },
    { label: "Reserved", value: `${totalReserved.toLocaleString()} units`, sub: `FJD ${reservedValue.toLocaleString("en-FJ", { maximumFractionDigits: 0 })}`, icon: AlertTriangle },
    { label: "Warehouses", value: String(warehouses.length), icon: Warehouse },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/warehouse")} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Stock On Hand</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Live stock positions synced from ERPNext across all warehouses and bins</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Live · synced {timeAgo(lastSyncAt)}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchStock()}
            disabled={loading}
            className="border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Sync Now
          </Button>
        </div>
      </div>

      {/* Live ERPNext feed notice */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/30">
        <Database className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          Live ERPNext connection — balances and last movements are pulled from ERPNext stock ledger in real time.
        </p>
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading stock from ERPNext…
        </div>
      )}

      {!loading && (
      <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border-gray-200 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="text-lg font-semibold text-slate-800 dark:text-white">{s.value}</p>
                {s.sub && <p className="text-[10px] text-slate-400">{s.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item code, name, bin..." className="pl-8 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
        <Select value={catFilter} onValueChange={(v) => setCatFilter(v as "all" | ERPStockCategory)}>
          <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.keys(categoryMeta) as ERPStockCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{categoryMeta[c].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={whFilter} onValueChange={setWhFilter}>
          <SelectTrigger className="w-44 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-gray-200 dark:border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                  <th className="px-4 py-3 font-medium">Item Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">On Hand</th>
                  <th className="px-4 py-3 font-medium text-right">Reserved</th>
                  <th className="px-4 py-3 font-medium text-right">Available</th>
                  <th className="px-4 py-3 font-medium">Warehouse</th>
                  <th className="px-4 py-3 font-medium">Bin</th>
                  <th className="px-4 py-3 font-medium text-right">Value</th>
                  <th className="px-4 py-3 font-medium">Last Movement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const meta = categoryMeta[it.category];
                  const available = it.qtyOnHand - it.qtyReserved;
                  const recent = isRecent(it);
                  const zone = whFromZone(it.warehouse);
                  return (
                    <tr
                      key={it.id}
                      className={`border-b border-gray-100 dark:border-slate-800/60 last:border-0 transition-colors ${
                        recent ? "bg-emerald-50/60 dark:bg-emerald-500/5" : "hover:bg-gray-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                        {recent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />}
                        {it.itemCode}
                      </td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{it.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">{it.qtyOnHand.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{it.qtyReserved > 0 ? it.qtyReserved.toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{available.toLocaleString()} {it.uom}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {it.warehouse}
                        {zone && (
                          <Badge variant="outline" className="ml-1.5 border-gray-200 dark:border-slate-700 text-slate-400 text-[9px] font-normal">
                            {zone.type}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono text-[10px]">{it.bin}</Badge></td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">FJD {(it.qtyOnHand * it.unitCost).toLocaleString("en-FJ", { maximumFractionDigits: 0 })}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs ${it.lastMovementType === "issue" ? "text-rose-500" : it.lastMovementType === "receipt" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                          {it.lastMovementType === "issue" ? <ArrowUpFromLine className="w-3.5 h-3.5" /> : it.lastMovementType === "receipt" ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <SlidersHorizontal className="w-3.5 h-3.5" />}
                          {it.lastMovementType} · {timeAgo(it.lastMovementAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">No stock items match your filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Warehouse link cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Warehouse Map</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {warehouses.map((w) => {
            const items = stockItems.filter((it) => it.warehouse === w);
            const value = items.reduce((s, it) => s + it.qtyOnHand * it.unitCost, 0);
            const zone = whFromZone(w);
            return (
              <button key={w} onClick={() => setWhFilter(w === whFilter ? "all" : w)} className="text-left">
                <Card className={`border transition-colors ${whFilter === w ? "border-slate-500 dark:border-slate-400" : "border-gray-200 dark:border-slate-800 hover:border-slate-400"}`}>
                  <CardContent className="p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Warehouse className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{w}</p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{items.length} SKUs · FJD {value.toLocaleString("en-FJ", { maximumFractionDigits: 0 })}</p>
                    {zone && (
                      <p className="text-[10px] text-slate-400 mt-1 capitalize">{zone.type.replace("_", " ")} · {zone.used}/{zone.capacity} {zone.category === "finished_good" ? "cases" : "units"}</p>
                    )}
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent stock movements */}
      <Card className="border-gray-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Stock Movements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                  <th className="px-3 py-2 font-medium">Posted</th>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium">Warehouse</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium text-right">Qty</th>
                  <th className="px-3 py-2 font-medium text-right">Balance</th>
                  <th className="px-3 py-2 font-medium">Voucher</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 dark:border-slate-800/60 last:border-0">
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{timeAgo(m.postedAt)}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">{m.itemCode}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{m.itemName}</p>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{m.warehouse}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 text-xs ${m.movementType === "issue" ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {m.movementType === "issue" ? <ArrowUpFromLine className="w-3 h-3" /> : <ArrowDownToLine className="w-3 h-3" />}
                        {m.movementType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium text-slate-700 dark:text-slate-300">{m.qty.toLocaleString()} {m.uom}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">{m.balanceQty.toLocaleString()} {m.uom}</td>
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium">{m.voucherType}</span>
                      <span className="block text-[10px] font-mono">{m.voucherNo}</span>
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">No recent movements.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
      )}
    </motion.div>
  );
}
