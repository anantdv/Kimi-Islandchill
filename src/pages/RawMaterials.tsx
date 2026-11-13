import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { erpApi } from "@/lib/erpApi";
import type { ERPStockItem, ERPStockCategory } from "@/data/mockData";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Package,
  AlertTriangle,
  Boxes,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  History,
  X,
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
  spare_part: { label: "Spare Part", cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-teal-900/30" },
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

function stockStatus(it: ERPStockItem): { label: string; cls: string } {
  const available = it.qtyOnHand - it.qtyReserved;
  if (it.qtyOnHand <= 0) return { label: "Out of Stock", cls: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30" };
  if ((it.safetyStock || 0) > 0 && available <= (it.safetyStock || 0)) {
    return { label: "Low Stock", cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" };
  }
  return { label: "In Stock", cls: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30" };
}

export default function RawMaterials() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ERPStockItem[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(new Date().toISOString());
  const [search, setSearch] = useState("");
  const [whFilter, setWhFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low" | "out">("all");
  const [selected, setSelected] = useState<ERPStockItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [, setNow] = useState(Date.now());

  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const warehouseParam = whFilter === "all" ? undefined : whFilter;
      const [data, whList] = await Promise.all([
        erpApi.getStockOnHand({ warehouse: warehouseParam, category: "raw_material", search: search || undefined }),
        erpApi.getWarehouses(),
      ]);
      setItems(Array.isArray(data) ? (data as ERPStockItem[]) : []);
      setWarehouses((whList as any[]).map((w) => w.name).sort());
      setLastSyncAt(new Date().toISOString());
    } catch (e: any) {
      setError(e.message || "Failed to load raw materials from ERPNext");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(true), 300);
    return () => clearTimeout(timer);
  }, [search, whFilter]);

  useEffect(() => {
    const sync = setInterval(() => fetchItems(true), 30000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(sync); clearInterval(clock); };
  }, [search, whFilter]);

  useEffect(() => {
    if (!selected) {
      setMovements([]);
      return;
    }
    let active = true;
    setMovementsLoading(true);
    erpApi
      .getStockMovements({ item_code: selected.itemCode, warehouse: whFilter === "all" ? undefined : whFilter, limit: 20 })
      .then((data) => {
        if (active) setMovements(Array.isArray(data) ? (data as StockMovement[]) : []);
      })
      .catch(() => setMovements([]))
      .finally(() => { if (active) setMovementsLoading(false); });
    return () => { active = false; };
  }, [selected, whFilter]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (statusFilter === "all") return true;
      const status = stockStatus(it).label;
      if (statusFilter === "in_stock" && status === "In Stock") return true;
      if (statusFilter === "low" && status === "Low Stock") return true;
      if (statusFilter === "out" && status === "Out of Stock") return true;
      return false;
    });
  }, [items, statusFilter]);

  const totalValue = items.reduce((s, it) => s + it.qtyOnHand * it.unitCost, 0);
  const lowCount = items.filter((it) => stockStatus(it).label === "Low Stock").length;
  const outCount = items.filter((it) => stockStatus(it).label === "Out of Stock").length;

  const statCards = [
    { label: "Raw Material SKUs", value: String(items.length), icon: Boxes },
    { label: "Stock Value", value: `FJD ${totalValue.toLocaleString("en-FJ", { maximumFractionDigits: 0 })}`, icon: Package },
    { label: "Low Stock", value: String(lowCount), sub: outCount > 0 ? `${outCount} out of stock` : undefined, icon: AlertTriangle },
    { label: "Warehouses", value: String(warehouses.length), icon: Warehouse },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/warehouse")} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Raw Materials</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Live raw material and packaging stock synced from ERPNext</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/30">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Live · synced {timeAgo(lastSyncAt)}</span>
          </div>
          <Button variant="outline" onClick={() => fetchItems()} disabled={loading} className="border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Sync Now
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading raw materials from ERPNext…
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
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item code, name or supplier..."
                className="pl-8 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
              />
            </div>
            <Select value={whFilter} onValueChange={setWhFilter}>
              <SelectTrigger className="w-44 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
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
                      <th className="px-4 py-3 font-medium text-right">Available</th>
                      <th className="px-4 py-3 font-medium">UOM</th>
                      <th className="px-4 py-3 font-medium">Warehouse</th>
                      <th className="px-4 py-3 font-medium">Supplier</th>
                      <th className="px-4 py-3 font-medium text-right">Safety Stock</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Last Movement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((it) => {
                      const meta = categoryMeta[it.category] || categoryMeta.raw_material;
                      const available = it.qtyOnHand - it.qtyReserved;
                      const status = stockStatus(it);
                      return (
                        <tr
                          key={it.id}
                          onClick={() => setSelected(it)}
                          className="border-b border-gray-100 dark:border-slate-800/60 last:border-0 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/40 cursor-pointer"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{it.itemCode}</td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{it.name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${meta.cls}`}>{meta.label}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-slate-200">{it.qtyOnHand.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{available.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{it.uom}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{it.warehouse}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{it.supplier || "—"}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-500 dark:text-slate-400">{(it.safetyStock || 0) > 0 ? (it.safetyStock || 0).toLocaleString() : "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${status.cls}`}>{status.label}</span>
                          </td>
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
                      <tr>
                        <td colSpan={11} className="px-4 py-10 text-center text-sm text-slate-400">
                          No raw materials match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex justify-end"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 h-full overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{selected.name}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{selected.itemCode}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-gray-200 dark:border-slate-800">
                    <CardContent className="p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">On Hand</p>
                      <p className="text-lg font-semibold text-slate-800 dark:text-white">{selected.qtyOnHand.toLocaleString()} <span className="text-xs font-normal text-slate-500">{selected.uom}</span></p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200 dark:border-slate-800">
                    <CardContent className="p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Available</p>
                      <p className="text-lg font-semibold text-slate-800 dark:text-white">{(selected.qtyOnHand - selected.qtyReserved).toLocaleString()} <span className="text-xs font-normal text-slate-500">{selected.uom}</span></p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Warehouse</span><span className="text-slate-800 dark:text-slate-200">{selected.warehouse}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Supplier</span><span className="text-slate-800 dark:text-slate-200">{selected.supplier || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Safety Stock</span><span className="text-slate-800 dark:text-slate-200">{(selected.safetyStock || 0) > 0 ? (selected.safetyStock || 0).toLocaleString() : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Unit Cost</span><span className="text-slate-800 dark:text-slate-200">FJD {selected.unitCost.toLocaleString("en-FJ", { maximumFractionDigits: 4 })}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Stock Value</span><span className="text-slate-800 dark:text-slate-200">FJD {(selected.qtyOnHand * selected.unitCost).toLocaleString("en-FJ", { maximumFractionDigits: 2 })}</span></div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recent Movements</h4>
                  </div>
                  {movementsLoading && <p className="text-sm text-slate-500">Loading…</p>}
                  {!movementsLoading && movements.length === 0 && <p className="text-sm text-slate-500">No recent movements.</p>}
                  {!movementsLoading && movements.length > 0 && (
                    <div className="space-y-2">
                      {movements.map((m) => (
                        <div key={m.id} className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30 text-xs">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 font-medium ${m.movementType === "issue" ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {m.movementType === "issue" ? <ArrowUpFromLine className="w-3 h-3" /> : <ArrowDownToLine className="w-3 h-3" />}
                              {m.movementType}
                            </span>
                            <span className="text-slate-500">{timeAgo(m.postedAt)}</span>
                          </div>
                          <div className="mt-1 flex justify-between text-slate-600 dark:text-slate-400">
                            <span>{m.warehouse}</span>
                            <span>{m.qty.toLocaleString()} {m.uom}</span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400">{m.voucherType} · {m.voucherNo}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
