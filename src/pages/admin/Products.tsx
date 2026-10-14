import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Boxes, ArrowLeft, Package, RefreshCw, Wifi, WifiOff, Search } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { productFamilies } from "@/data/mockData";
import {
  getFinishedItems,
  type FinishedItem,
} from "@/services/erpnext";

const mockProducts: FinishedItem[] = productFamilies.flatMap((family) =>
  family.variants.map((v) => ({
    id: v.sku,
    name: v.sku,
    item_name: `${family.name} ${v.name}`,
    item_group: family.category,
    stock_uom: v.uom,
    has_variants: 0,
    variant_of: null,
    image: v.image,
  }))
);

export default function ProductsAdmin() {
  const navigate = useNavigate();
  const { erpConnection } = useAppStore();
  const [liveMode, setLiveMode] = useState(erpConnection.connected);
  const [items, setItems] = useState<FinishedItem[]>(
    erpConnection.connected ? [] : mockProducts
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLiveProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFinishedItems();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (liveMode && erpConnection.connected && items.length === 0) {
      fetchLiveProducts();
    }
    if (!liveMode) {
      setItems(mockProducts);
      setError("");
    }
  }, [liveMode, erpConnection.connected]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (i) =>
        i.item_name.toLowerCase().includes(term) ||
        i.name.toLowerCase().includes(term) ||
        i.item_group.toLowerCase().includes(term)
    );
  }, [items, search]);

  const displayItems = liveMode ? filteredItems : filteredItems;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 dark:text-slate-400"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Products
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Finished-goods catalog from ERPNext Item table
            </p>
          </div>
        </div>

        {erpConnection.connected && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={liveMode ? "default" : "outline"}
              className={liveMode ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
              onClick={() => setLiveMode(!liveMode)}
            >
              {liveMode ? "Mock Data" : "Live Data"}
            </Button>
            {liveMode && (
              <Button size="sm" variant="outline" onClick={fetchLiveProducts} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            )}
          </div>
        )}
      </div>

      {!erpConnection.connected && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/20 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          Not connected to ERPNext. Connect via Admin → BOM to see live product data.
        </div>
      )}

      {liveMode && erpConnection.connected && (
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                ERPNext: {erpConnection.user}
              </Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {liveMode ? "Showing live finished goods from ERPNext" : "Showing local mock products"}
              </span>
            </div>
            <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{displayItems.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Products</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {new Set(displayItems.map((i) => i.item_group)).size}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Item Groups</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search products by name, code, or group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/20 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {displayItems.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayItems.map((item) => (
            <Card
              key={item.id}
              className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-purple-900/50 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.item_name} className="w-6 h-6 object-contain" />
                      ) : (
                        <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm text-slate-800 dark:text-white leading-tight">
                        {item.item_name}
                      </CardTitle>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.name}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px]">
                    {item.item_group}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    UOM: {item.stock_uom}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
