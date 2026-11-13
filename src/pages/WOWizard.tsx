import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { erpApi } from "@/lib/erpApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, Package, ArrowLeft, AlertCircle } from "lucide-react";
import type { ProductFamily, ProductVariant, FillingLine } from "@/data/mockData";

export default function WOWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [families, setFamilies] = useState<ProductFamily[]>([]);
  const [lines, setLines] = useState<FillingLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([erpApi.getProductFamilies(), erpApi.getFillingLines()])
      .then(([f, l]) => {
        setFamilies(f as ProductFamily[]);
        setLines(l as FillingLine[]);
      })
      .catch((e) => setError(e.message || "Failed to load master data"))
      .finally(() => setLoading(false));
  }, []);

  const family = families.find((f) => f.id === selectedFamily);
  const variant = family?.variants.find((v) => v.id === selectedVariant);
  const line = lines.find((l) => l.id === selectedLine);

  const handleCreate = async () => {
    if (!variant || !line || !qty) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await erpApi.createWorkOrder({
        item: (variant as ProductVariant & { item: string }).item,
        qty: parseFloat(qty),
        uom: variant.uom,
        filling_line: line.id,
        product_family: family?.name,
        family_variant: variant.name,
      });
      navigate(`/workorders/${created.id || created.name}`);
    } catch (e: any) {
      setError(e.message || "Failed to create work order");
      setSubmitting(false);
    }
  };

  const stepLabels = ["Product", "Variant", "Line", "Review"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading products and lines…</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">New Work Order</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create a production work order</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
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
        {/* Step 1 */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Select Product Family</h2>
            <div className="grid grid-cols-2 gap-3">
              {families.map((pf) => (
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
          </motion.div>
        )}

        {/* Step 2 */}
        {step === 2 && family && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Select Variant — {family.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {family.variants.map((v) => (
                <Card
                  key={v.id}
                  className={`cursor-pointer transition-all bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-200 ${selectedVariant === v.id ? "ring-2 ring-cyan-500 border-cyan-500" : ""}`}
                  onClick={() => setSelectedVariant(v.id)}
                >
                  <CardContent className="p-4 flex flex-col items-center">
                    <img src={v.image} alt={v.name} className="w-16 h-16 object-contain mb-2" />
                    <p className="font-semibold text-sm text-slate-800 dark:text-white text-center">{v.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{v.sku}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">{v.uom}</p>
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
          </motion.div>
        )}

        {/* Step 3 */}
        {step === 3 && variant && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Quantity & Filling Line</h2>
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img src={variant.image} alt={variant.name} className="w-12 h-12 object-contain" />
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-white">{family?.name} — {variant.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{variant.sku} | {variant.uom}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Quantity ({variant.uom})</label>
                  <Input
                    type="number"
                    placeholder={`Enter quantity in ${variant.uom}`}
                    value={qty}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(e.target.value)}
                    className="bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Select Filling Line</h3>
            <div className="space-y-2">
              {lines.map((fl) => (
                <div
                  key={fl.id}
                  className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                    selectedLine === fl.id ? "ring-2 ring-cyan-500 border-cyan-500 bg-cyan-500/5" : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  }`}
                  onClick={() => setSelectedLine(fl.id)}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{fl.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{fl.lineType}</p>
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
          </motion.div>
        )}

        {/* Step 4 */}
        {step === 4 && variant && line && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Review Work Order</h2>
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-slate-800">
                  <img src={variant.image} alt={variant.name} className="w-14 h-14 object-contain rounded-lg bg-gray-50 dark:bg-slate-800/50 p-1" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{family?.name} — {variant.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{variant.sku}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">Quantity</p><p className="font-medium text-slate-800 dark:text-white">{parseFloat(qty).toLocaleString()} {variant.uom}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">Filling Line</p><p className="font-medium text-slate-800 dark:text-white">{line.name}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">Product Family</p><p className="font-medium text-slate-800 dark:text-white">{family?.name}</p></div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">UOM</p><p className="font-medium text-slate-800 dark:text-white">{variant.uom}</p></div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                  <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-300">This will create a draft Work Order in ERPNext. Launch will create job cards and submit the WO.</p>
                </div>
              </CardContent>
            </Card>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" className="border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleCreate} disabled={submitting} className="bg-cyan-600 hover:bg-cyan-700">
                {submitting ? "Creating..." : "Create Work Order"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
