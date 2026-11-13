import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Edit2, Trash2, ChevronDown, ChevronUp,
  Package, FileText, GitBranch, Boxes, Search, CheckCircle2,
  AlertTriangle, XCircle, Save, X,
} from "lucide-react";
import { itemMaster } from "@/data/mockData";
import type { ProductFamily, ProductVariant, BOMHeader, BOMItem, ItemMaster } from "@/data/mockData";
import { generateId } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  raw_material: "Raw Material",
  packaging: "Packaging",
  additive: "Additive",
  co2: "CO2",
};

export default function AdminProductMaster() {
  const navigate = useNavigate();
  const { boms, addBOM, updateBOM, productFamilies, addProductFamily, updateProductFamily, deleteProductFamily } = useAppStore();

  const [search, setSearch] = useState("");
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{ family: ProductFamily; variant: ProductVariant } | null>(null);

  // New Family modal
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [editingFamily, setEditingFamily] = useState<ProductFamily | null>(null);
  const [familyName, setFamilyName] = useState("");
  const [familyCategory, setFamilyCategory] = useState("Carbonated Soft Drink");
  const [familyVariants, setFamilyVariants] = useState<{ name: string; sku: string; size: string; uom: string }[]>([{ name: "", sku: "", size: "", uom: "Bottle" }]);

  // BOM form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOMHeader | null>(null);
  const [formHeader, setFormHeader] = useState<Partial<BOMHeader>>({
    name: "", variant: "", sku: "", status: "active", revision: "001",
    effectiveDate: new Date().toISOString().slice(0, 10), quantity: 1000, uom: "L", recipeClass: "",
    items: [],
  });
  const [formItems, setFormItems] = useState<BOMItem[]>([]);

  // Pre-fill when selecting a variant without BOM
  const openCreateBOM = (family: ProductFamily, variant: ProductVariant) => {
    setEditingBOM(null);
    setFormHeader({
      name: `${family.name} ${variant.name}`,
      variant: variant.name,
      sku: variant.sku,
      status: "active",
      revision: "001",
      effectiveDate: new Date().toISOString().slice(0, 10),
      quantity: 1000,
      uom: "L",
      recipeClass: family.category.includes("Water") ? "Water" : "CSD",
      productFamilyId: family.id,
      productVariantId: variant.id,
      items: [],
    });
    setFormItems([]);
    setShowForm(true);
  };

  const openCreateFamily = () => {
    setEditingFamily(null);
    setFamilyName("");
    setFamilyCategory("Carbonated Soft Drink");
    setFamilyVariants([{ name: "", sku: "", size: "", uom: "Bottle" }]);
    setShowFamilyForm(true);
  };

  const openEditFamily = (pf: ProductFamily) => {
    setEditingFamily(pf);
    setFamilyName(pf.name);
    setFamilyCategory(pf.category);
    setFamilyVariants(pf.variants.map((v) => ({ name: v.name, sku: v.sku, size: v.size, uom: v.uom })));
    setShowFamilyForm(true);
  };

  const handleSaveFamily = () => {
    if (!familyName.trim() || familyVariants.length === 0 || !familyVariants[0].name.trim()) return;
    const variants: ProductVariant[] = familyVariants.map((v, i) => ({
      id: editingFamily ? (editingFamily.variants[i]?.id || generateId("v")) : generateId("v"),
      name: v.name,
      sku: v.sku || `${familyName.slice(0, 2).toUpperCase()}-${v.size}`,
      size: v.size || v.name,
      uom: v.uom || "Bottle",
      image: "/water-500ml.png",
      bomId: editingFamily ? (editingFamily.variants[i]?.bomId || "") : "",
    }));
    const pf: ProductFamily = {
      id: editingFamily ? editingFamily.id : generateId("pf"),
      name: familyName,
      category: familyCategory,
      image: "/water-500ml.png",
      variants,
    };
    if (editingFamily) {
      updateProductFamily(editingFamily.id, pf);
    } else {
      addProductFamily(pf);
    }
    setShowFamilyForm(false);
  };

  const openEditBOM = (bom: BOMHeader) => {
    setEditingBOM(bom);
    setFormHeader({ ...bom });
    setFormItems([...bom.items]);
    setShowForm(true);
  };

  const getBomForVariant = (variant: ProductVariant) => boms.find((b) => b.id === variant.bomId);

  const filteredFamilies = productFamilies.filter((pf) =>
    pf.name.toLowerCase().includes(search.toLowerCase()) ||
    pf.variants.some((v) => v.name.toLowerCase().includes(search.toLowerCase()) || v.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // Selected BOM detail
  const selectedBOM = selectedVariant ? getBomForVariant(selectedVariant.variant) : null;

  const getItemStock = (itemCode: string): ItemMaster | undefined =>
    itemMaster.find((im) => im.itemCode === itemCode);

  const getStockStatus = (item: BOMItem) => {
    const im = getItemStock(item.itemCode);
    if (!im) return { label: "Unknown", color: "gray", icon: AlertTriangle };
    if (im.stockQty === 0) return { label: "Out of Stock", color: "red", icon: XCircle };
    if (im.stockQty <= im.reorderLevel) return { label: "Low Stock", color: "amber", icon: AlertTriangle };
    return { label: "In Stock", color: "emerald", icon: CheckCircle2 };
  };

  const bomItemRows = useMemo(() => {
    if (!selectedBOM) return [];
    return selectedBOM.items.map((it) => {
      const im = getItemStock(it.itemCode);
      const status = getStockStatus(it);
      return { ...it, stockQty: im?.stockQty || 0, warehouse: im?.warehouse || "-", status };
    });
  }, [selectedBOM]);

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
      productFamilyId: formHeader.productFamilyId,
      productVariantId: formHeader.productVariantId,
      items: formItems,
    };
    if (editingBOM) {
      updateBOM(editingBOM.id, bomData);
    } else {
      addBOM(bomData);
    }
    setShowForm(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Product Master</h1>
            <p className="text-xs text-slate-500">Products, variants and their manufacturing recipes (BOMs)</p>
          </div>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={openCreateFamily}>
          <Plus className="w-4 h-4 mr-1" /> New Family
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search product family, variant or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-slate-900 border-gray-200"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Product Families */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Product Families</h2>
                <Badge className="text-[10px] border-0 bg-violet-50 text-violet-600">{filteredFamilies.length} families</Badge>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredFamilies.map((pf) => {
                  const expanded = expandedFamily === pf.id;
                  const hasBOMs = pf.variants.some((v) => getBomForVariant(v));
                  return (
                    <div key={pf.id} className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                      <div
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors"
                        onClick={() => setExpandedFamily(expanded ? null : pf.id)}
                      >
                        <div className="flex items-center gap-3">
                          <img src={pf.image} alt={pf.name} className="w-10 h-10 object-contain rounded-lg bg-gray-50 p-1" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{pf.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[9px] border-0 bg-gray-100 text-slate-500">{pf.category}</Badge>
                              <span className="text-[10px] text-slate-500">{pf.variants.length} variants</span>
                              {hasBOMs && <Badge className="text-[9px] border-0 bg-emerald-50 text-emerald-600"><Boxes className="w-2.5 h-2.5 mr-0.5" />BOMs</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700" onClick={(e) => { e.stopPropagation(); openEditFamily(pf); }}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); deleteProductFamily(pf.id); if (selectedVariant?.family.id === pf.id) setSelectedVariant(null); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-3 pb-3 space-y-2">
                              {pf.variants.map((v) => {
                                const bom = getBomForVariant(v);
                                const isSelected = selectedVariant?.variant.id === v.id;
                                return (
                                  <div
                                    key={v.id}
                                    onClick={() => setSelectedVariant({ family: pf, variant: v })}
                                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                                      isSelected
                                        ? "border-violet-300 bg-violet-50/50"
                                        : "border-gray-100 bg-gray-50/50 hover:bg-gray-100"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <img src={v.image} alt={v.name} className="w-8 h-8 object-contain rounded bg-white p-0.5 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-800 dark:text-white">{v.name}</p>
                                        <p className="text-[9px] text-slate-500 flex items-center gap-1">
                                          <FileText className="w-2.5 h-2.5" />{v.sku}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {bom ? (
                                        <>
                                          <Badge className="text-[9px] border-0 bg-emerald-50 text-emerald-600"><Boxes className="w-2.5 h-2.5 mr-0.5" />{bom.id}</Badge>
                                          {bom.flowTemplateId && <Badge className="text-[9px] border-0 bg-blue-50 text-blue-600"><GitBranch className="w-2.5 h-2.5 mr-0.5" />Flow</Badge>}
                                        </>
                                      ) : (
                                        <Badge className="text-[9px] border-0 bg-amber-50 text-amber-600">No BOM</Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: BOM Detail or Create */}
        <div className="lg:col-span-7 space-y-4">
          {selectedVariant ? (
            selectedBOM ? (
              <>
                {/* BOM Header */}
                <Card className="bg-emerald-50/40 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedBOM.name}</h3>
                          <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">{selectedBOM.recipeClass}</Badge>
                          <Badge className="bg-emerald-50 text-emerald-600 border-0 text-[10px]">{selectedBOM.id}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">SKU: {selectedBOM.sku} · Batch: {selectedBOM.quantity} {selectedBOM.uom} · Rev {selectedBOM.revision}</p>
                        <p className="text-[11px] text-violet-600 mt-0.5">🔗 {selectedVariant.family.name} — {selectedVariant.variant.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedBOM.flowTemplateId ? (
                          <Button size="sm" variant="outline" className="h-8 text-[10px] border-blue-200 text-blue-600" onClick={() => navigate(`/dss/builder?template=${selectedBOM.flowTemplateId}`)}>
                            <GitBranch className="w-3 h-3 mr-1" /> View Flow
                          </Button>
                        ) : (
                          <Button size="sm" className="h-8 text-[10px] bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(`/dss/builder?bom=${selectedBOM.id}`)}>
                            <Plus className="w-3 h-3 mr-1" /> Create Flow
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => openEditBOM(selectedBOM)}>
                          <Edit2 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ingredients */}
                <Card className="bg-white dark:bg-slate-900/50 border-gray-200">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Recipe Ingredients</h3>
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="grid grid-cols-12 gap-2 px-3 py-2.5 bg-gray-50 text-[10px] font-semibold text-slate-500 uppercase">
                        <div className="col-span-2">Item Code</div>
                        <div className="col-span-3">Item Name</div>
                        <div className="col-span-2 text-right">Recipe Qty</div>
                        <div className="col-span-2 text-right">In Stock</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-1 text-right">UOM</div>
                      </div>
                      {bomItemRows.map((row, i) => {
                        const StatusIcon = row.status.icon;
                        return (
                          <div key={row.id} className={`grid grid-cols-12 gap-2 px-3 py-2.5 items-center border-t border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                            <div className="col-span-2"><span className="text-xs font-mono text-slate-700">{row.itemCode}</span></div>
                            <div className="col-span-3">
                              <span className="text-xs text-slate-800">{row.itemName}</span>
                              <p className="text-[10px] text-slate-400">{typeLabels[row.itemType]}</p>
                            </div>
                            <div className="col-span-2 text-right"><span className="text-xs font-medium">{row.qty.toFixed(4)}</span></div>
                            <div className="col-span-2 text-right"><span className="text-xs">{row.stockQty.toLocaleString()}</span></div>
                            <div className="col-span-2 text-center">
                              <Badge className={`border-0 text-[10px] ${row.status.color === "emerald" ? "bg-emerald-50 text-emerald-600" : row.status.color === "amber" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                                <StatusIcon className="w-3 h-3" />{row.status.label}
                              </Badge>
                            </div>
                            <div className="col-span-1 text-right"><span className="text-xs text-slate-500">{row.uom}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* No BOM — show create prompt */
              <Card className="bg-amber-50/40 border-amber-200">
                <CardContent className="p-8 text-center">
                  <Boxes className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 mb-1">No BOM for {selectedVariant.variant.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">Create a manufacturing recipe (BOM) to define ingredients and quantities.</p>
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => openCreateBOM(selectedVariant.family, selectedVariant.variant)}>
                    <Plus className="w-4 h-4 mr-1" /> Create BOM
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="bg-gray-50/50 border-gray-200">
              <CardContent className="p-8 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-600 mb-1">Select a Variant</h3>
                <p className="text-xs text-slate-400">Click a product variant from the left panel to view or create its BOM.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── BOM Form Modal ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-gray-200 shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{editingBOM ? "Edit BOM" : "Create BOM"}</h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">BOM Name</label>
                  <Input className="h-8 text-xs" value={formHeader.name} onChange={(e) => setFormHeader((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">SKU</label>
                  <Input className="h-8 text-xs" value={formHeader.sku} onChange={(e) => setFormHeader((f) => ({ ...f, sku: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Variant</label>
                  <Input className="h-8 text-xs" value={formHeader.variant} onChange={(e) => setFormHeader((f) => ({ ...f, variant: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Recipe Class</label>
                  <select className="w-full h-8 text-xs rounded-md border border-gray-200 px-2" value={formHeader.recipeClass} onChange={(e) => setFormHeader((f) => ({ ...f, recipeClass: e.target.value }))}>
                    <option value="">Select...</option><option>CSD</option><option>Water</option><option>Alcoholic</option><option>Juice</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Batch Qty</label>
                  <Input className="h-8 text-xs" type="number" value={formHeader.quantity} onChange={(e) => setFormHeader((f) => ({ ...f, quantity: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">UOM</label>
                  <Input className="h-8 text-xs" value={formHeader.uom} onChange={(e) => setFormHeader((f) => ({ ...f, uom: e.target.value }))} />
                </div>
              </div>

              <Card className="bg-gray-50 border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2"><Boxes className="w-4 h-4 text-violet-500" /> Items ({formItems.length})</span>
                    <Button size="sm" className="h-7 text-xs bg-violet-600 text-white" onClick={addFormItem}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  {formItems.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No items yet.</p>}
                  {formItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-white border border-gray-200">
                      <div className="col-span-3">
                        <select className="w-full h-7 text-[11px] rounded border border-gray-200 px-1" value={item.itemCode} onChange={(e) => {
                          const im = itemMaster.find((i) => i.itemCode === e.target.value);
                          if (im) updateFormItem(idx, { itemCode: im.itemCode, itemName: im.itemName, itemType: im.itemType as BOMItem["itemType"], uom: im.uom, costPerUnit: im.costPerUnit });
                        }}>
                          {itemMaster.map((im) => <option key={im.itemCode} value={im.itemCode}>{im.itemCode} — {im.itemName}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2"><Input className="h-7 text-[11px]" type="number" step="0.01" value={item.qty} onChange={(e) => updateFormItem(idx, { qty: Number(e.target.value) })} /></div>
                      <div className="col-span-1 text-[10px] text-slate-500">{item.uom}</div>
                      <div className="col-span-2"><Input className="h-7 text-[11px]" type="number" value={item.scrapAllowance} onChange={(e) => updateFormItem(idx, { scrapAllowance: Number(e.target.value) })} placeholder="Scrap %" /></div>
                      <div className="col-span-3 text-[10px] text-slate-500">{typeLabels[item.itemType]}</div>
                      <div className="col-span-1 text-right">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => removeFormItem(idx)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" className="text-xs bg-violet-600 text-white" onClick={handleSaveBOM}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Family Form Modal ── */}
      <AnimatePresence>
        {showFamilyForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-gray-200 shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{editingFamily ? "Edit Family" : "New Product Family"}</h3>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowFamilyForm(false)}><X className="w-4 h-4" /></Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Family Name</label>
                  <Input className="h-9 text-sm" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="e.g. Crush Cola" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500">Category</label>
                  <select className="w-full h-9 text-sm rounded-md border border-gray-200 px-2" value={familyCategory} onChange={(e) => setFamilyCategory(e.target.value)}>
                    <option>Carbonated Soft Drink</option>
                    <option>Still Water</option>
                    <option>Sparkling Water</option>
                    <option>RTD Cocktail</option>
                    <option>Juice</option>
                    <option>Alcoholic</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-slate-500">Variants</label>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setFamilyVariants((prev) => [...prev, { name: "", sku: "", size: "", uom: "Bottle" }])}>
                      <Plus className="w-3 h-3 mr-1" /> Add Variant
                    </Button>
                  </div>
                  {familyVariants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="col-span-4"><Input className="h-8 text-xs" placeholder="Variant name" value={v.name} onChange={(e) => setFamilyVariants((prev) => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} /></div>
                      <div className="col-span-3"><Input className="h-8 text-xs" placeholder="SKU" value={v.sku} onChange={(e) => setFamilyVariants((prev) => prev.map((x, i) => i === idx ? { ...x, sku: e.target.value } : x))} /></div>
                      <div className="col-span-2"><Input className="h-8 text-xs" placeholder="Size" value={v.size} onChange={(e) => setFamilyVariants((prev) => prev.map((x, i) => i === idx ? { ...x, size: e.target.value } : x))} /></div>
                      <div className="col-span-2">
                        <select className="w-full h-8 text-xs rounded border border-gray-200 px-1" value={v.uom} onChange={(e) => setFamilyVariants((prev) => prev.map((x, i) => i === idx ? { ...x, uom: e.target.value } : x))}>
                          <option>Bottle</option><option>Can</option><option>Box</option><option>Carton</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-right">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => setFamilyVariants((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowFamilyForm(false)}>Cancel</Button>
                <Button size="sm" className="text-xs bg-violet-600 text-white" onClick={handleSaveFamily}><Save className="w-3.5 h-3.5 mr-1" /> Save Family</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
