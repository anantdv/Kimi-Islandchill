import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { productFamilies, fillingLines } from "@/data/mockData";
import type { WorkOrder, ProductFamily, ProductVariant } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Check, Package, ArrowLeft, WifiOff,
} from "lucide-react";
import {
  createWorkOrder,
  fetchWorkOrders,
  getFinishedItems,
  getItemBOMs,
  type FinishedItem,
  type ItemBOM,
} from "@/services/erpnext";

const mockFamilies = productFamilies;

export default function WOWizard() {
  const navigate = useNavigate();
  const addWorkOrder = useAppStore((s: { addWorkOrder: (wo: WorkOrder) => void }) => s.addWorkOrder);
  const loadWorkOrders = useAppStore((s: { loadWorkOrders: (wos: WorkOrder[]) => void }) => s.loadWorkOrders);
  const workOrderCount = useAppStore((s: { workOrders: WorkOrder[] }) => s.workOrders.length);
  const { erpConnection } = useAppStore();
  const liveMode = erpConnection.connected;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Local / mock selection
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Live ERPNext selection
  const [finishedItems, setFinishedItems] = useState<FinishedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FinishedItem | null>(null);
  const [itemBOMs, setItemBOMs] = useState<ItemBOM[]>([]);
  const [selectedBom, setSelectedBom] = useState<ItemBOM | null>(null);

  const [qty, setQty] = useState("");
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  const family = mockFamilies.find((f) => f.id === selectedFamily);
  const variant = family?.variants.find((v) => v.id === selectedVariant);
  const line = fillingLines.find((l) => l.id === selectedLine);

  useEffect(() => {
    if (liveMode) {
      setLoading(true);
      getFinishedItems()
        .then(setFinishedItems)
        .catch((err) => setError(err instanceof Error ? err.message : String(err)))
        .finally(() => setLoading(false));
    }
  }, [liveMode]);

  useEffect(() => {
    if (liveMode && selectedItem) {
      setLoading(true);
      setSelectedBom(null);
      getItemBOMs(selectedItem.name)
        .then((boms) => {
          setItemBOMs(boms);
          if (boms.length === 1) setSelectedBom(boms[0]);
        })
        .catch((err) => setError(err instanceof Error ? err.message : String(err)))
        .finally(() => setLoading(false));
    }
  }, [liveMode, selectedItem]);

  const handleCreate = async () => {
    setError("");

    if (liveMode) {
      if (!selectedItem || !qty || !selectedLine) return;
      setLoading(true);
      try {
        const result = await createWorkOrder({
          production_item: selectedItem.name,
          qty: parseFloat(qty),
          bom_no: selectedBom?.name,
          planned_start_date: new Date().toISOString(),
        });

        const newWO: WorkOrder = {
          id: result.name,
          name: result.name,
          product: selectedItem.item_name,
          variant: selectedItem.name,
          qty: result.qty,
          uom: result.stock_uom || selectedItem.stock_uom,
          fillingLine: line?.name || "",
          status: "draft",
          progress: 0,
          createdAt: new Date().toISOString(),
          jobCards: [],
          qcChecks: [],
          incidents: [],
          processLoss: 0,
          extraGoods: 0,
        };
        addWorkOrder(newWO);
        fetchWorkOrders().then(loadWorkOrders).catch(() => {});
        navigate(`/workorders/${newWO.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
      return;
    }

    // Mock/offline creation
    if (!variant || !line || !qty) return;
    setLoading(true);
    const newWO: WorkOrder = {
      id: `wo${Date.now()}`,
      name: `WO-2025-${String(workOrderCount + 1).padStart(3, "0")}`,
      product: family!.name,
      variant: variant.name,
      qty: parseInt(qty),
      uom: variant.uom,
      fillingLine: line.name,
      status: "draft",
      progress: 0,
      createdAt: new Date().toISOString(),
      jobCards: [],
      qcChecks: [],
      incidents: [],
      processLoss: 0,
      extraGoods: 0,
    };
    setTimeout(() => {
      addWorkOrder(newWO);
      setLoading(false);
      navigate(`/workorders/${newWO.id}`);
    }, 800);
  };

  const stepLabels = liveMode ? ["Product", "BOM", "Line", "Review"] : ["Product", "Variant", "Line", "Review"];

  const renderStep1 = () => {
    if (liveMode) {
      return (
        <>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Select Finished Product</h2>
          {finishedItems.length === 0 && !loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No finished products found in ERPNext.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {finishedItems.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 ${selectedItem?.id === item.id ? "ring-2 ring-cyan-500 border-cyan-500" : ""}`}
                  onClick={() => { setSelectedItem(item); setSelectedBom(null); }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-white">{item.item_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.name} · {item.stock_uom}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button disabled={!selectedItem || loading} onClick={() => setStep(2)} className="bg-cyan-600 hover:bg-cyan-700">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </>
      );
    }

    return (
      <>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Select Product Family</h2>
        <div className="grid grid-cols-2 gap-3">
          {mockFamilies.map((pf: ProductFamily) => (
            <Card
              key={pf.id}
              className={`cursor-pointer transition-all bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-200 ${selectedFamily === pf.id ? "ring-2 ring-cyan-500 border-cyan-500" : ""}`}
              onClick={() => { setSelectedFamily(pf.id); setSelectedVariant(null); }}
            >
              <CardContent className="p-4 flex flex-col items-center">
                <img src={pf.image} alt={pf.name} className="w-20 h-20 object-contain mb-2" />
                <p className="font-semibold text-sm text-slate-800 dark:text-white text-center">{pf.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{pf.category}</p>
                <Badge variant="secondary" className="mt-2 text-[10px] bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0">{pf.variants.length} variants</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button disabled={!selectedFamily} onClick={() => setStep(2)} className="bg-cyan-600 hover:bg-cyan-700">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </>
    );
  };

  const renderStep2 = () => {
    if (liveMode && selectedItem) {
      return (
        <>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Select BOM — {selectedItem.item_name}</h2>
          {itemBOMs.length === 0 && !loading ? (
            <p className="text-sm text-red-500">No active BOM found for this item.</p>
          ) : (
            <div className="space-y-3">
              {itemBOMs.map((bom: ItemBOM) => (
                <div
                  key={bom.id}
                  className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                    selectedBom?.id === bom.id ? "ring-2 ring-cyan-500 border-cyan-500 bg-cyan-500/5" : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                  onClick={() => setSelectedBom(bom)}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{bom.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{bom.quantity} {bom.uom}</p>
                  </div>
                  {bom.is_default ? <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">Default</Badge> : null}
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setStep(1)}>Back</Button>
            <Button disabled={!selectedBom || loading} onClick={() => setStep(3)} className="bg-cyan-600 hover:bg-cyan-700">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </>
      );
    }

    return (
      <>
        {family && (
          <>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Select Variant — {family.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {family.variants.map((v: ProductVariant) => (
                <Card
                  key={v.id}
                  className={`cursor-pointer transition-all bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-200 ${selectedVariant === v.id ? "ring-2 ring-cyan-500 border-cyan-500" : ""}`}
                  onClick={() => setSelectedVariant(v.id)}
                >
                  <CardContent className="p-4 flex flex-col items-center">
                    <img src={v.image} alt={v.name} className="w-16 h-16 object-contain mb-2" />
                    <p className="font-semibold text-sm text-slate-800 dark:text-white text-center">{v.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{v.sku}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">BOM: {v.bomId}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={!selectedVariant} onClick={() => setStep(3)} className="bg-cyan-600 hover:bg-cyan-700">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </>
    );
  };

  const renderStep3 = () => {
    const itemName = liveMode ? selectedItem?.item_name : `${family?.name} — ${variant?.name}`;
    const itemCode = liveMode ? selectedItem?.name : variant?.sku;
    const uom = liveMode ? selectedItem?.stock_uom : variant?.uom;
    const bomName = liveMode ? selectedBom?.name : variant?.bomId;

    return (
      <>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Quantity & Filling Line</h2>
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              {liveMode ? (
                <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              ) : (
                <img src={variant?.image} alt={variant?.name} className="w-12 h-12 object-contain" />
              )}
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-white">{itemName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{itemCode} | BOM: {bomName}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Quantity ({uom})</label>
              <Input
                type="number"
                placeholder={`Enter quantity in ${uom}`}
                value={qty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(e.target.value)}
                className="bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white"
              />
            </div>
          </CardContent>
        </Card>

        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Select Filling Line</h3>
        <div className="space-y-2">
          {fillingLines.map((fl) => (
            <div
              key={fl.id}
              className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                selectedLine === fl.id ? "ring-2 ring-cyan-500 border-cyan-500 bg-cyan-500/5" : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800/50"
              }`}
              onClick={() => setSelectedLine(fl.id)}
            >
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{fl.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{fl.currentWo ? `Running: ${fl.currentWo}` : "Available"}</p>
              </div>
              <Badge className={
                fl.status === "running" ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0" :
                fl.status === "idle" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0" :
                "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-0"
              }>{fl.status}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-between">
          <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setStep(2)}>Back</Button>
          <Button disabled={!qty || !selectedLine} onClick={() => setStep(4)} className="bg-cyan-600 hover:bg-cyan-700">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </>
    );
  };

  const renderStep4 = () => {
    const itemName = liveMode ? selectedItem?.item_name : `${family?.name} — ${variant?.name}`;
    const itemCode = liveMode ? selectedItem?.name : variant?.sku;
    const uom = liveMode ? selectedItem?.stock_uom : variant?.uom;
    const bomName = liveMode ? selectedBom?.name : variant?.bomId;

    return (
      <>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Review Work Order</h2>
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-slate-800">
              {liveMode ? (
                <div className="w-14 h-14 rounded-lg bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center">
                  <Package className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
              ) : (
                <img src={variant?.image} alt={variant?.name} className="w-14 h-14 object-contain rounded-lg bg-gray-50 dark:bg-slate-800/50 p-1" />
              )}
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{itemName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{itemCode}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-500 dark:text-slate-400">Quantity</p><p className="font-medium text-slate-800 dark:text-white">{parseFloat(qty).toLocaleString()} {uom}</p></div>
              <div><p className="text-xs text-slate-500 dark:text-slate-400">Filling Line</p><p className="font-medium text-slate-800 dark:text-white">{line?.name}</p></div>
              <div><p className="text-xs text-slate-500 dark:text-slate-400">BOM</p><p className="font-medium text-slate-800 dark:text-white">{bomName}</p></div>
              <div><p className="text-xs text-slate-500 dark:text-slate-400">UOM</p><p className="font-medium text-slate-800 dark:text-white">{uom}</p></div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
              <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-xs text-amber-300">
                {liveMode
                  ? "This will create a Work Order in ERPNext."
                  : "This will create a draft Work Order locally."}
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-between">
          <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setStep(3)}>Back</Button>
          <Button onClick={handleCreate} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700">
            {loading ? "Creating..." : liveMode ? "Create ERPNext Work Order" : "Create Work Order"}
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">New Work Order</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {liveMode ? "Create a Work Order in ERPNext" : "Create a local production work order"}
          </p>
        </div>
      </div>

      {!liveMode && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-900/20 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          Not connected to ERPNext. Connect via Admin → BOM to create Work Orders in ERPNext.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/20 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-between px-2">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === i + 1 ? "bg-cyan-500 text-white" :
                step > i + 1 ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-gray-200 dark:border-slate-800"
              }`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            {i < 3 && (
              <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? "bg-emerald-500" : "bg-gray-100 dark:bg-slate-800"}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {renderStep1()}
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {renderStep2()}
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {renderStep3()}
          </motion.div>
        )}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {renderStep4()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
