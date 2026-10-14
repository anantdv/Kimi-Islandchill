import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { productFamilies, processRoutes } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowLeft, Droplets, Wind, FlaskConical, Package, Truck,
  CheckCircle2, Factory,
} from "lucide-react";

const stageIcons: Record<string, typeof Droplets> = {
  "Water Treatment": Droplets,
  "Mixing": Wind,
  "Carbonation": Wind,
  "Filling": Factory,
  "Capping": Factory,
  "Labeling": Package,
  "Packaging": Package,
  "Palletizing": Truck,
  "QC Release": FlaskConical,
};

export default function FlowMap() {
  const navigate = useNavigate();
  const [selectedFamily, setSelectedFamily] = useState<string>("water");
  const family = productFamilies.find((f) => f.id === selectedFamily);
  const route = processRoutes.find((r) =>
    selectedFamily === "water" ? r.name.includes("Still Water") : r.name.includes("RTD")
  )?.stages || [];

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Process Flow Map</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Visualize manufacturing routes</p>
          </div>
        </div>
      </div>

      {/* Product Selector */}
      <div className="flex gap-3">
        {productFamilies.map((pf) => (
          <button
            key={pf.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
              selectedFamily === pf.id
                ? "border-cyan-500/50 bg-cyan-500/10 text-slate-800 dark:text-white"
                : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 hover:border-gray-200"
            }`}
            onClick={() => setSelectedFamily(pf.id)}
          >
            <img src={pf.image} alt={pf.name} className="w-6 h-6 object-contain" />
            {pf.name}
          </button>
        ))}
      </div>

      {family && (
        <div className="space-y-4">
          {/* Process Timeline */}
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Factory className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> {family.name} — Process Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-slate-800" />
                <div className="space-y-4">
                  {route.map((stage: { name: string; equipment: string[]; duration: string }, i: number) => {
                    const Icon = stageIcons[stage.name] || Factory;
                    const isActive = i === 3;
                    const isCompleted = i < 3;
                    return (
                      <motion.div
                        key={stage.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-4 relative"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 z-10 ${
                          isActive ? "bg-cyan-50 dark:bg-cyan-500/15 ring-1 ring-cyan-500/20 dark:ring-cyan-500/30" :
                          isCompleted ? "bg-emerald-50 dark:bg-emerald-500/15" : "bg-gray-100 dark:bg-slate-800"
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> :
                           <Icon className={`w-5 h-5 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500 dark:text-slate-400"}`} />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isActive ? "text-cyan-600 dark:text-cyan-400" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                              {stage.name}
                            </span>
                            {isActive && <Badge className="bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-0 text-[10px]">Active</Badge>}
                            {isCompleted && <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">Done</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {stage.equipment.map((eq) => (
                              <Badge key={eq} variant="outline" className="text-[10px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">{eq}</Badge>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1">Duration: {stage.duration}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {family.variants.map((v) => (
              <Card key={v.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardContent className="p-4 flex items-center gap-3">
                  <img src={v.image} alt={v.name} className="w-12 h-12 object-contain" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{v.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{v.sku} | {v.uom}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300">BOM: {v.bomId}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
