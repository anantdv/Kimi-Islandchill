import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { itemMaster, productFamilies } from "@/data/mockData";
import type { BOMHeader, BOMItem, ItemMaster } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, CheckCircle2, AlertTriangle,
  XCircle, Warehouse, Factory, ChevronRight, ChevronDown, Boxes,
  Plus, Trash2, Save, X, Edit2, GitBranch,
} from "lucide-react";
import { generateId } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  raw_material: "Raw Material",
  packaging: "Packaging",
  additive: "Additive",
  co2: "CO2",
};


export default function AdminBOM() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlBom = searchParams.get("bom");
  const urlProductFamily = searchParams.get("productFamily");
  const urlVariant = searchParams.get("variant");
  const urlBomName = searchParams.get("bomName");
  const urlSku = searchParams.get("sku");
  const { boms, addBOM, updateBOM, deleteBOM } = useAppStore();
  const [search, setSearch] = useState("");
  const [selectedBOMId, setSelectedBOMId] = useState<string>(urlBom || boms[0]?.id || "");
  const [rmWarehouse, setRmWarehouse] = useState("Stores - RM");
  const [fgWarehouse, setFgWarehouse] = useState("Finished Goods");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const all = new Set<string>();
    for (const b of boms) all.add(b.recipeClass || "Other");
    return all;
  });

  // Create / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOMHeader | null>(null);
  const [formHeader, setFormHeader] = useState<Partial<BOMHeader>>({
    name: "", variant: "", sku: "", status: "active", revision: "001",
    effectiveDate: new Date().toISOString().slice(0, 10), quantity: 1000, uom: "L", recipeClass: "",
    items: [],
  });
  const [formItems, setFormItems] = useState<BOMItem[]>([]);

  // Auto-open create form if navigated from Products page with pre-fill params
  useEffect(() => {
    if (urlProductFamily && urlBomName) {
      setEditingBOM(null);
      setFormHeader({
        name: decodeURIComponent(urlBomName),
        variant: "",
        sku: urlSku || "",
        status: "active",
        revision: "001",
        effectiveDate: new Date().toISOString().slice(0, 10),
        quantity: 1000,
        uom: "L",
        recipeClass: "",
        productFamilyId: urlProductFamily,
        productVariantId: urlVariant || undefined,
        items: [],
      });
      setFormItems([]);
      setShowForm(true);
    }
  }, [urlProductFamily, urlVariant, urlBomName, urlSku]);

  const toggleGroup = (cls: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(cls)) next.delete(cls);
      else next.add(cls);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    for (const b of boms) all.add(b.recipeClass || "Other");
    setExpandedGroups(all);
  };

  const collapseAll = () => setExpandedGroups(new Set());

  const selectedBOM = boms.find((b) => b.id === selectedBOMId) || boms[0];

  const filteredBOMs = boms.filter((b: BOMHeader) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.sku.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (b.recipeClass || "").toLowerCase().includes(q)
    );
  });

  const getItemStock = (itemCode: string): ItemMaster | undefined => {
    return itemMaster.find((im) => im.itemCode === itemCode);
  };

  const getProductName = (bom: BOMHeader): string | null => {
    if (!bom.productFamilyId) return null;
    const pf = productFamilies.find((p) => p.id === bom.productFamilyId);
    if (!pf) return null;
    const variant = pf.variants.find((v) => v.id === bom.productVariantId);
    return variant ? `${pf.name} — ${variant.name}` : pf.name;
  };

  const getStockStatus = (item: BOMItem) => {
    const im = getItemStock(item.itemCode);
    if (!im) return { label: "Unknown", color: "gray", icon: AlertTriangle };
    if (im.stockQty === 0) return { label: "Out of Stock", color: "red", icon: XCircle };
    if (im.stockQty <= im.reorderLevel) return { label: "Low Stock", color: "amber", icon: AlertTriangle };
    return { label: "In Stock", color: "emerald", icon: CheckCircle2 };
  };

  const getFGStock = (sku: string, bom?: BOMHeader) => {
    if (bom?.fgStockQty !== undefined) return bom.fgStockQty;
    const fg = itemMaster.find((im) => im.itemType === "finished_good" && im.itemCode.includes(sku.replace(/-/g, "")));
    if (!fg) return 0;
    return fg.stockQty;
  };

  const fgStock = getFGStock(selectedBOM?.sku || "", selectedBOM);

  const classGroups = useMemo(() => {
    const groups = new Map<string, BOMHeader[]>();
    for (const bom of filteredBOMs) {
      const cls = bom.recipeClass || "Other";
      if (!groups.has(cls)) groups.set(cls, []);
      groups.get(cls)!.push(bom);
    }
    return Array.from(groups.entries());
  }, [filteredBOMs]);

  const bomItemRows = useMemo(() => {
    if (!selectedBOM) return [];
    return selectedBOM.items.map((it: BOMItem) => {
      const im = getItemStock(it.itemCode);
      const status = getStockStatus(it);
      return { ...it, stockQty: im?.stockQty || 0, warehouse: im?.warehouse || "-", status };
    });
  }, [selectedBOM]);

  // ── Create / Edit handlers ────────────────────────────────────────────────
  const openCreate = () => {
    setEditingBOM(null);
    setFormHeader({
      name: "", variant: "", sku: "", status: "active", revision: "001",
      effectiveDate: new Date().toISOString().slice(0, 10), quantity: 1000, uom: "L", recipeClass: "",
      items: [],
    });
    setFormItems([]);
    setShowForm(true);
  };

  const openEdit = (bom: BOMHeader) => {
    setEditingBOM(bom);
    setFormHeader({ ...bom });
    setFormItems([...bom.items]);
    setShowForm(true);
  };

  const addFormItem = () => {
    const im = itemMaster[0];
    if (!im) return;
    const newItem: BOMItem = {
      id: generateId("bi"),
      itemCode: im.itemCode,
      itemName: im.itemName,
      itemType: im.itemType as BOMItem["itemType"],
      qty: 1,
      uom: im.uom,
      scrapAllowance: 0,
      costPerUnit: im.costPerUnit,
    };
    setFormItems((prev) => [...prev, newItem]);
  };

  const updateFormItem = (index: number, updates: Partial<BOMItem>) => {
    setFormItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...updates } : it)));
  };

  const removeFormItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveBOM = () => {
    if (!formHeader.name || !formHeader.sku || formItems.length === 0) return;
    const bomData: BOMHeader = {
      id: editingBOM ? editingBOM.id : generateId("bom"),
      name: formHeader.name || "",
      variant: formHeader.variant || "",
      sku: formHeader.sku || "",
      status: (formHeader.status as BOMHeader["status"]) || "active",
      revision: formHeader.revision || "001",
      effectiveDate: formHeader.effectiveDate || new Date().toISOString().slice(0, 10),
      quantity: formHeader.quantity || 0,
      uom: formHeader.uom || "L",
      recipeClass: formHeader.recipeClass || "Other",
      items: formItems,
    };
    if (editingBOM) {
      updateBOM(editingBOM.id, bomData);
    } else {
      addBOM(bomData);
      setSelectedBOMId(bomData.id);
    }
    setShowForm(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Factory className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Bill of Materials (BOM) &amp; Production Recipes
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Explore, create, and manage formulations, raw material stock balances, and finished good inventory.
            </p>
          </div>
        </div>
        <Button size="sm" className="h-9 text-xs bg-cyan-600 text-white" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Create BOM
        </Button>
      </div>

      {/* Warehouse selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Warehouse className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Raw Material Source Warehouse
              </span>
            </div>
            <select
              value={rmWarehouse}
              onChange={(e) => setRmWarehouse(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            >
              <option>Stores - RM</option>
              <option>Stores - PKG</option>
              <option>Stores - All</option>
            </select>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Factory className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Finished Goods Warehouse
              </span>
              <span className="text-[10px] text-slate-400">(Leaf only)</span>
            </div>
            <select
              value={fgWarehouse}
              onChange={(e) => setFgWarehouse(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            >
              <option>Finished Goods</option>
              <option>Cold Store A</option>
              <option>Cold Store B</option>
              <option>Ambient Store</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: BOM List */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Active Recipes</h2>
                <div className="flex items-center gap-2">
                  <button onClick={expandAll} className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline">Expand All</button>
                  <button onClick={collapseAll} className="text-[10px] text-slate-500 dark:text-slate-400 hover:underline">Collapse</button>
                  <Badge className="bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-0 text-[10px]">{boms.length} Recipes</Badge>
                </div>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                <Input
                  placeholder="Search recipe or item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {classGroups.map(([cls, groupBoms]) => {
                  const isExpanded = expandedGroups.has(cls);
                  return (
                    <div key={cls}>
                      <button onClick={() => toggleGroup(cls)} className="w-full flex items-center gap-1.5 mb-1.5 px-0.5 text-left group">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                        )}
                        <Boxes className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{cls}</span>
                        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 text-[9px]">{groupBoms.length}</Badge>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden ml-2">
                            <div className="space-y-2">
                              {groupBoms.map((bom: BOMHeader) => {
                                const isActive = selectedBOMId === bom.id;
                                const fgQty = getFGStock(bom.sku, bom);
                                return (
                                  <motion.div
                                    key={bom.id}
                                    whileHover={{ scale: 1.01 }}
                                    className={`cursor-pointer rounded-xl border p-3 transition-all ${
                                      isActive
                                        ? "border-cyan-400 dark:border-cyan-500 bg-cyan-50/50 dark:bg-cyan-500/10"
                                        : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                                    }`}
                                  >
                                    <div onClick={() => setSelectedBOMId(bom.id)} className="flex items-start justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className={`text-sm font-semibold ${isActive ? "text-cyan-700 dark:text-cyan-400" : "text-slate-800 dark:text-white"}`}>{bom.id}</span>
                                          {bom.status === "active" && (
                                            <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0 text-[9px]">DEFAULT</Badge>
                                          )}
                                          {bom.flowTemplateId && (
                                            <Badge className="bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-[9px]"><GitBranch className="w-2.5 h-2.5 mr-0.5" />Flow</Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{bom.name}</p>
                                        {getProductName(bom) && (
                                          <p className="text-[10px] text-violet-500 dark:text-violet-400 mt-0.5">Product: {getProductName(bom)}</p>
                                        )}
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">FG: <span className="font-medium">{fgQty} {bom.uom}</span></p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1 mt-2">
                                      {bom.flowTemplateId ? (
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-600" onClick={(e) => { e.stopPropagation(); navigate(`/dss/builder?template=${bom.flowTemplateId}`); }}>
                                          <GitBranch className="w-3 h-3 mr-1" /> View Flow
                                        </Button>
                                      ) : (
                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-blue-600" onClick={(e) => { e.stopPropagation(); navigate(`/dss/builder?bom=${bom.id}`); }}>
                                          <Plus className="w-3 h-3 mr-1" /> Create Flow
                                        </Button>
                                      )}
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); openEdit(bom); }}>
                                        <Edit2 className="w-3 h-3 text-slate-400" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); deleteBOM(bom.id); if (selectedBOMId === bom.id) setSelectedBOMId(boms.find((b) => b.id !== bom.id)?.id || ""); }}>
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                      </Button>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {filteredBOMs.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No recipes found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Recipe Details */}
        <div className="lg:col-span-8 space-y-4">
          {selectedBOM && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-emerald-50/40 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Factory className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Finished Good Product</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedBOM.name}</h3>
                      <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-0 text-[10px]">{selectedBOM.recipeClass}</Badge>
                    </div>
                    {getProductName(selectedBOM) && (
                      <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5">🔗 {getProductName(selectedBOM)}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Code: {selectedBOM.sku} · Batch: {selectedBOM.quantity} {selectedBOM.uom}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {selectedBOM.flowTemplateId ? (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] border-blue-200 dark:border-blue-800 text-blue-600" onClick={() => navigate(`/dss/builder?template=${selectedBOM.flowTemplateId}`)}>
                          <GitBranch className="w-3 h-3 mr-1" /> View Flow
                        </Button>
                      ) : (
                        <Button size="sm" className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(`/dss/builder?bom=${selectedBOM.id}`)}>
                          <Plus className="w-3 h-3 mr-1" /> Create Flow
                        </Button>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-300">In {fgWarehouse}:</span>
                      <Badge className={`border-0 text-[10px] ${fgStock > 0 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"}`}>
                        {fgStock} {selectedBOM.uom}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50/40 dark:bg-amber-500/5 border-amber-200 dark:border-amber-900/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Warehouse className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Raw Materials Warehouse</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{rmWarehouse}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitoring stock levels for {selectedBOM.items.length} raw ingredients</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-300">Recipe:</span>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{selectedBOM.id}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Recipe Ingredients &amp; Raw Materials</h3>
                  <div className="rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-3 py-2.5 bg-gray-50 dark:bg-slate-800/60 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <div className="col-span-2">Item Code</div>
                      <div className="col-span-3">Item Name</div>
                      <div className="col-span-2 text-right">Recipe Qty</div>
                      <div className="col-span-2 text-right">In RM Warehouse</div>
                      <div className="col-span-2 text-center">Stock Status</div>
                      <div className="col-span-1 text-right">UOM</div>
                    </div>
                    {bomItemRows.map((row, i) => {
                      const StatusIcon = row.status.icon;
                      return (
                        <div key={row.id} className={`grid grid-cols-12 gap-2 px-3 py-2.5 items-center border-t border-gray-200 dark:border-slate-800 hover:bg-gray-50/60 dark:hover:bg-slate-800/30 ${i % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-gray-50/30 dark:bg-slate-800/20"}`}>
                          <div className="col-span-2"><span className="text-xs font-mono text-slate-700 dark:text-slate-300">{row.itemCode}</span></div>
                          <div className="col-span-3">
                            <span className="text-xs text-slate-800 dark:text-white">{row.itemName}</span>
                            <p className="text-[10px] text-slate-400">{typeLabels[row.itemType]}</p>
                          </div>
                          <div className="col-span-2 text-right"><span className="text-xs font-medium text-slate-800 dark:text-white">{row.qty.toFixed(4)}</span></div>
                          <div className="col-span-2 text-right">
                            <span className="text-xs text-slate-700 dark:text-slate-300">{row.stockQty.toLocaleString()} <span className="text-[10px] text-slate-400">{row.uom}</span></span>
                          </div>
                          <div className="col-span-2 text-center">
                            <Badge className={`border-0 text-[10px] inline-flex items-center gap-1 ${
                              row.status.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
                              row.status.color === "amber" ? "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                              "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400"
                            }`}>
                              <StatusIcon className="w-3 h-3" />{row.status.label}
                            </Badge>
                          </div>
                          <div className="col-span-1 text-right"><span className="text-xs text-slate-500 dark:text-slate-400">{row.uom}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ── Create / Edit BOM Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{editingBOM ? "Edit BOM" : "Create New BOM"}</h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Header fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">BOM Name</label>
                  <Input className="h-8 text-xs" value={formHeader.name} onChange={(e) => setFormHeader((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Crush Cola 2.5L" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">SKU</label>
                  <Input className="h-8 text-xs" value={formHeader.sku} onChange={(e) => setFormHeader((f) => ({ ...f, sku: e.target.value }))} placeholder="e.g. SKU-CC-2500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Variant</label>
                  <Input className="h-8 text-xs" value={formHeader.variant} onChange={(e) => setFormHeader((f) => ({ ...f, variant: e.target.value }))} placeholder="e.g. 2.5L PET" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Recipe Class</label>
                  <select className="w-full h-8 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2" value={formHeader.recipeClass} onChange={(e) => setFormHeader((f) => ({ ...f, recipeClass: e.target.value }))}>
                    <option value="">Select class...</option>
                    <option>CSD</option>
                    <option>Water</option>
                    <option>Alcoholic</option>
                    <option>Juice</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Batch Qty</label>
                  <Input className="h-8 text-xs" type="number" value={formHeader.quantity} onChange={(e) => setFormHeader((f) => ({ ...f, quantity: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">UOM</label>
                  <Input className="h-8 text-xs" value={formHeader.uom} onChange={(e) => setFormHeader((f) => ({ ...f, uom: e.target.value }))} placeholder="L / Box / pc" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Revision</label>
                  <Input className="h-8 text-xs" value={formHeader.revision} onChange={(e) => setFormHeader((f) => ({ ...f, revision: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Effective Date</label>
                  <Input className="h-8 text-xs" type="date" value={formHeader.effectiveDate} onChange={(e) => setFormHeader((f) => ({ ...f, effectiveDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Status</label>
                  <select className="w-full h-8 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2" value={formHeader.status} onChange={(e) => setFormHeader((f) => ({ ...f, status: e.target.value as BOMHeader["status"] }))}>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="obsolete">Obsolete</option>
                  </select>
                </div>
              </div>

              {/* Items table */}
              <Card className="bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2"><Boxes className="w-4 h-4 text-cyan-500" /> BOM Items ({formItems.length})</span>
                    <Button size="sm" className="h-7 text-xs bg-cyan-600 text-white" onClick={addFormItem}>
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {formItems.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">No items added yet. Click "Add Item" to start.</p>
                  )}
                  {formItems.map((item, idx) => {
                    const _im = itemMaster.find((m) => m.itemCode === item.itemCode);
                    void _im;
                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
                        <div className="col-span-3">
                          <select
                            className="w-full h-7 text-[10px] rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1"
                            value={item.itemCode}
                            onChange={(e) => {
                              const selected = itemMaster.find((m) => m.itemCode === e.target.value);
                              if (selected) {
                                updateFormItem(idx, {
                                  itemCode: selected.itemCode,
                                  itemName: selected.itemName,
                                  itemType: selected.itemType as BOMItem["itemType"],
                                  uom: selected.uom,
                                  costPerUnit: selected.costPerUnit,
                                });
                              }
                            }}
                          >
                            {itemMaster.filter((m) => m.itemType !== "finished_good").map((m) => (
                              <option key={m.itemCode} value={m.itemCode}>{m.itemName}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <Input className="h-7 text-[10px]" type="number" step="0.0001" value={item.qty} onChange={(e) => updateFormItem(idx, { qty: Number(e.target.value) })} />
                        </div>
                        <div className="col-span-2">
                          <Input className="h-7 text-[10px]" value={item.uom} onChange={(e) => updateFormItem(idx, { uom: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                          <Input className="h-7 text-[10px]" type="number" value={item.scrapAllowance} onChange={(e) => updateFormItem(idx, { scrapAllowance: Number(e.target.value) })} placeholder="Scrap %" />
                        </div>
                        <div className="col-span-2">
                          <Input className="h-7 text-[10px]" type="number" step="0.01" value={item.costPerUnit} onChange={(e) => updateFormItem(idx, { costPerUnit: Number(e.target.value) })} />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFormItem(idx)}>
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {formItems.length > 0 && (
                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span>Total items: {formItems.length}</span>
                      <span>Total cost: ${formItems.reduce((sum, it) => sum + it.qty * it.costPerUnit, 0).toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="h-8 text-xs bg-cyan-600 text-white" onClick={handleSaveBOM}>
                  <Save className="w-3 h-3 mr-1" /> {editingBOM ? "Update BOM" : "Save BOM"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
