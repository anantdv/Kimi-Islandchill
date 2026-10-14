import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boms } from "@/data/mockData";
import type { BOMHeader, BOMItem } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/appStore";
import { login, logout, getBOMs, getBOMDetails } from "@/services/erpnext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Search, FileText, ChevronDown, ChevronUp,
  Package, Droplets, FlaskConical, Wind, Wifi, WifiOff, RefreshCw,
} from "lucide-react";

const typeIcons: Record<string, typeof Package> = {
  raw_material: Droplets,
  packaging: Package,
  additive: FlaskConical,
  co2: Wind,
};

const typeColors: Record<string, string> = {
  raw_material: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  packaging: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  additive: "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400",
  co2: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

interface LiveBOMMaterial {
  id: string;
  itemCode: string;
  itemName: string;
  itemType: "raw_material" | "packaging" | "additive" | "co2";
  qty: number;
  uom: string;
  scrapAllowance: number;
  costPerUnit: number;
}

interface LiveBOM {
  id: string;
  name: string;
  sku: string;
  status: "active" | "pending" | "obsolete";
  revision: string;
  effectiveDate: string;
  quantity: number;
  uom: string;
  items: LiveBOMMaterial[];
}

export default function AdminBOM() {
  const navigate = useNavigate();
  const { erpConnection, setErpConnection, clearErpConnection } = useAppStore();

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [liveMode, setLiveMode] = useState(false);
  const [liveBOMs, setLiveBOMs] = useState<LiveBOM[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState("");

  const [showConnect, setShowConnect] = useState(false);
  const [connUrl, setConnUrl] = useState(erpConnection.url);
  const [connUser, setConnUser] = useState(erpConnection.username);
  const [connPass, setConnPass] = useState(erpConnection.password);
  const [connLoading, setConnLoading] = useState(false);
  const [connError, setConnError] = useState("");

  // Refresh connection state when localStorage changes in another tab
  useEffect(() => {
    const onStorage = () => clearErpConnection();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [clearErpConnection]);

  const fetchLiveBOMs = async () => {
    setLiveLoading(true);
    setLiveError("");
    try {
      const summaries = await getBOMs(50, 0);
      const detailed = await Promise.all(
        summaries.map(async (bom) => {
          const materials = await getBOMDetails(bom.id);
          return {
            id: bom.id,
            name: bom.name,
            sku: bom.id,
            status: (bom.active ? "active" : "obsolete") as "active" | "obsolete",
            revision: "ERP",
            effectiveDate: "-",
            quantity: 1,
            uom: "Unit",
            items: materials.map((m, idx) => ({
              id: `${bom.id}-item-${idx}`,
              itemCode: m.code,
              itemName: m.name,
              itemType: classifyItemType(m.code),
              qty: m.qty,
              uom: m.unit,
              scrapAllowance: 0,
              costPerUnit: 0,
            })),
          };
        })
      );
      setLiveBOMs(detailed);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : String(err));
    } finally {
      setLiveLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnLoading(true);
    setConnError("");
    const result = await login(connUrl, connUser, connPass);
    setConnLoading(false);
    if (result.success) {
      setErpConnection({
        ...erpConnection,
        isLive: true,
        connected: true,
        url: connUrl,
        username: connUser,
        password: connPass,
        user: result.user,
        role: result.role,
      });
      setShowConnect(false);
      setLiveMode(true);
      fetchLiveBOMs();
    } else {
      setConnError(result.message || "Login failed");
    }
  };

  const handleDisconnect = () => {
    logout();
    setErpConnection({
      ...erpConnection,
      isLive: false,
      connected: false,
      user: undefined,
      role: undefined,
    });
    setLiveMode(false);
    setLiveBOMs([]);
  };

  const displayedBOMs: BOMHeader[] = liveMode
    ? (liveBOMs as unknown as BOMHeader[])
    : boms;

  const filtered = displayedBOMs.filter((b: BOMHeader) => {
    const matchesSearch = !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.sku.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || b.status === filterType;
    return matchesSearch && matchesType;
  });

  const totalBOMs = displayedBOMs.length;
  const activeBOMs = displayedBOMs.filter((b: BOMHeader) => b.status === "active").length;
  const pendingBOMs = displayedBOMs.filter((b: BOMHeader) => b.status === "pending").length;
  const totalItems = displayedBOMs.reduce((acc: number, b: BOMHeader) => acc + b.items.length, 0);

  const calcBOMCost = (bom: BOMHeader) => {
    return bom.items.reduce((sum: number, it: BOMItem) => {
      const qtyWithScrap = it.qty * (1 + it.scrapAllowance / 100);
      return sum + qtyWithScrap * it.costPerUnit;
    }, 0);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Bill of Materials</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage product BOMs and formulations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {erpConnection.connected ? (
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
              onClick={handleDisconnect}
            >
              <Wifi className="w-4 h-4 mr-1" /> Connected
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
              onClick={() => setShowConnect(true)}
            >
              <WifiOff className="w-4 h-4 mr-1" /> Connect ERPNext
            </Button>
          )}
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> New BOM
          </Button>
        </div>
      </div>

      {/* Live mode toggle */}
      {erpConnection.connected && (
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                ERPNext: {erpConnection.user}
              </Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {liveMode ? "Showing live BOMs from ERPNext" : "Showing local mock BOMs"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={liveMode ? "default" : "outline"}
                className={liveMode ? "bg-cyan-600 hover:bg-cyan-700 text-white" : ""}
                onClick={() => {
                  setLiveMode(!liveMode);
                  if (!liveMode && liveBOMs.length === 0) fetchLiveBOMs();
                }}
              >
                {liveMode ? "Mock Data" : "Live Data"}
              </Button>
              {liveMode && (
                <Button size="sm" variant="outline" onClick={fetchLiveBOMs} disabled={liveLoading}>
                  <RefreshCw className={`w-4 h-4 mr-1 ${liveLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {liveError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/20 text-sm text-red-600 dark:text-red-400">
          {liveError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total BOMs", value: totalBOMs, color: "cyan" },
          { label: "Active", value: activeBOMs, color: "emerald" },
          { label: "Pending", value: pendingBOMs, color: "amber" },
          { label: "Total Items", value: totalItems, color: "blue" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Search BOM by name, SKU, or ID..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-500"
          />
        </div>
        {["all", "active", "pending", "obsolete"].map((t) => (
          <Button
            key={t}
            size="sm"
            variant={filterType === t ? "default" : "outline"}
            onClick={() => setFilterType(t)}
            className={filterType === t ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {/* BOM List */}
      <div className="space-y-3">
        {filtered.map((bom: BOMHeader, i: number) => {
          const isExpanded = expandedId === bom.id;
          const bomCost = calcBOMCost(bom);
          const rawCount = bom.items.filter((it: BOMItem) => it.itemType === "raw_material").length;
          const pkgCount = bom.items.filter((it: BOMItem) => it.itemType === "packaging").length;
          return (
            <motion.div
              key={bom.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`bg-white border-gray-200 dark:border-slate-800 transition-all ${isExpanded ? "ring-1 ring-cyan-500/20 dark:ring-cyan-500/30" : ""}`}>
                <CardContent className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : bom.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-white">{bom.name}</span>
                          <Badge className={
                            bom.status === "active" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]" :
                            bom.status === "pending" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-0 text-[10px]" :
                            "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0 text-[10px]"
                          }>{bom.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{bom.id}</span>
                          <span>{bom.sku}</span>
                          <span>{bom.revision}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">${bomCost.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">per {bom.quantity} {bom.uom}s</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">{bom.items.length} items</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800 space-y-3">
                          {/* Summary row */}
                          <div className="flex gap-4 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Effective: <span className="text-slate-800 dark:text-white">{bom.effectiveDate}</span></span>
                            <span className="text-slate-500 dark:text-slate-400">Base Qty: <span className="text-slate-800 dark:text-white">{bom.quantity} {bom.uom}</span></span>
                            <span className="text-slate-500 dark:text-slate-400">Raw: <span className="text-slate-800 dark:text-white">{rawCount}</span></span>
                            <span className="text-slate-500 dark:text-slate-400">Packaging: <span className="text-slate-800 dark:text-white">{pkgCount}</span></span>
                          </div>

                          {/* Items table */}
                          <div className="rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                              <div className="col-span-3">Item</div>
                              <div className="col-span-2">Type</div>
                              <div className="col-span-2 text-right">Qty</div>
                              <div className="col-span-2 text-right">Scrap %</div>
                              <div className="col-span-2 text-right">Cost</div>
                              <div className="col-span-1 text-right">Total</div>
                            </div>
                            {bom.items.map((it: BOMItem) => {
                              const Icon = typeIcons[it.itemType] || Package;
                              const qtyWithScrap = it.qty * (1 + it.scrapAllowance / 100);
                              const lineCost = qtyWithScrap * it.costPerUnit;
                              return (
                                <div key={it.id} className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-gray-200 dark:border-slate-800 items-center hover:bg-gray-50/80">
                                  <div className="col-span-3">
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                      <div>
                                        <p className="text-xs text-slate-800 dark:text-white">{it.itemName}</p>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-300">{it.itemCode}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-span-2">
                                    <Badge className={`${typeColors[it.itemType]} border-0 text-[10px]`}>
                                      {it.itemType.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  <div className="col-span-2 text-right">
                                    <span className="text-xs text-slate-800 dark:text-white">{it.qty} {it.uom}</span>
                                  </div>
                                  <div className="col-span-2 text-right">
                                    <span className={`text-xs ${it.scrapAllowance > 3 ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>{it.scrapAllowance}%</span>
                                  </div>
                                  <div className="col-span-2 text-right">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">${it.costPerUnit.toFixed(4)}</span>
                                  </div>
                                  <div className="col-span-1 text-right">
                                    <span className="text-xs font-medium text-slate-800 dark:text-white">${lineCost.toFixed(3)}</span>
                                  </div>
                                </div>
                              );
                            })}
                            {/* Total row */}
                            <div className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-gray-200 dark:border-slate-800 bg-gray-50/80">
                              <div className="col-span-9">
                                <span className="text-xs font-semibold text-slate-800 dark:text-white">Total BOM Cost (incl. scrap)</span>
                              </div>
                              <div className="col-span-3 text-right">
                                <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">${bomCost.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {filtered.length === 0 && !liveLoading && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-slate-700 dark:text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No BOMs found</p>
          </div>
        )}
        {liveLoading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading BOMs from ERPNext...</p>
          </div>
        )}
      </div>

      {/* Connect dialog */}
      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Connect to ERPNext</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowConnect(false)}>✕</Button>
              </div>
              {connError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-sm text-red-600 dark:text-red-400">
                  {connError}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">ERPNext URL</label>
                  <Input
                    value={connUrl}
                    onChange={(e) => setConnUrl(e.target.value)}
                    placeholder="https://vms.advtinni.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Username</label>
                  <Input
                    value={connUser}
                    onChange={(e) => setConnUser(e.target.value)}
                    placeholder="administrator"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Password</label>
                  <Input
                    type="password"
                    value={connPass}
                    onChange={(e) => setConnPass(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={handleConnect}
                disabled={connLoading}
              >
                {connLoading ? "Connecting..." : "Connect & Fetch BOMs"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function classifyItemType(code: string): "raw_material" | "packaging" | "additive" | "co2" {
  const upper = code.toUpperCase();
  if (upper.startsWith("RM-")) return "raw_material";
  if (upper.startsWith("PK-")) return "packaging";
  if (upper.includes("CO2")) return "co2";
  return "additive";
}
