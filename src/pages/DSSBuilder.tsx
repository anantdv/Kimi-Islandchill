import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle, Factory, Beaker, Droplets, ClipboardCheck, FlaskConical,
  Wrench, GitBranch, CheckCircle2, ArrowRight, Trash2, Plus, Save,
  X, MousePointer, ChevronLeft, Layers, Route, Clock,
  Wind, Package, Truck, Boxes,
} from "lucide-react";
import type { DSSFlowNode, DSSFlowEdge, DSSFlowTemplate, DSSFormField } from "@/data/mockData";
import { dssNodeTypes, productFamilies, processRoutes, boms } from "@/data/mockData";
import { generateId } from "@/lib/utils";

const GRID_W = 24;
const GRID_H = 20;
const CELL = 40;

const iconMap: Record<string, React.ElementType> = {
  PlayCircle, Factory, Beaker, Droplets, ClipboardCheck, FlaskConical,
  Wrench, GitBranch, CheckCircle2,
};

const colorMap: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-800/40", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-800/40", text: "text-blue-700 dark:text-blue-400", ring: "ring-blue-400" },
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-200 dark:border-indigo-800/40", text: "text-indigo-700 dark:text-indigo-400", ring: "ring-indigo-400" },
  cyan: { bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-800/40", text: "text-cyan-700 dark:text-cyan-400", ring: "ring-cyan-400" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-800/40", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-800/40", text: "text-purple-700 dark:text-purple-400", ring: "ring-purple-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-800/40", text: "text-orange-700 dark:text-orange-400", ring: "ring-orange-400" },
  pink: { bg: "bg-pink-50 dark:bg-pink-500/10", border: "border-pink-200 dark:border-pink-800/40", text: "text-pink-700 dark:text-pink-400", ring: "ring-pink-400" },
};


// ── Process Routes View (merged from Flow Map) ─────────────────────────────

const stageIcons: Record<string, React.ElementType> = {
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

const familyGradients: Record<string, string> = {
  "Bourbon Bluez": "from-amber-500/10 to-orange-500/5 border-amber-200/50 dark:border-amber-800/30",
  "Crush Cola": "from-red-500/10 to-rose-500/5 border-red-200/50 dark:border-red-800/30",
  "Crush Fruit Cocktail": "from-pink-500/10 to-fuchsia-500/5 border-pink-200/50 dark:border-pink-800/30",
  "Crush Grape": "from-violet-500/10 to-purple-500/5 border-violet-200/50 dark:border-violet-800/30",
  "Crush Lemon Lime": "from-lime-500/10 to-green-500/5 border-lime-200/50 dark:border-lime-800/30",
  "Crush Orange": "from-orange-500/10 to-amber-500/5 border-orange-200/50 dark:border-orange-800/30",
  "Crush Pineapple": "from-yellow-500/10 to-amber-500/5 border-yellow-200/50 dark:border-yellow-800/30",
  "Crush Strawberry": "from-rose-500/10 to-red-500/5 border-rose-200/50 dark:border-rose-800/30",
  "Island Chill Soda": "from-sky-500/10 to-cyan-500/5 border-sky-200/50 dark:border-sky-800/30",
  "Island Chill Water": "from-blue-500/10 to-indigo-500/5 border-blue-200/50 dark:border-blue-800/30",
  "Island Water": "from-cyan-500/10 to-teal-500/5 border-cyan-200/50 dark:border-cyan-800/30",
};

const familyIconColors: Record<string, string> = {
  "Bourbon Bluez": "text-amber-600 dark:text-amber-400",
  "Crush Cola": "text-red-600 dark:text-red-400",
  "Crush Fruit Cocktail": "text-pink-600 dark:text-pink-400",
  "Crush Grape": "text-violet-600 dark:text-violet-400",
  "Crush Lemon Lime": "text-lime-600 dark:text-lime-400",
  "Crush Orange": "text-orange-600 dark:text-orange-400",
  "Crush Pineapple": "text-yellow-600 dark:text-yellow-400",
  "Crush Strawberry": "text-rose-600 dark:text-rose-400",
  "Island Chill Soda": "text-sky-600 dark:text-sky-400",
  "Island Chill Water": "text-blue-600 dark:text-blue-400",
  "Island Water": "text-cyan-600 dark:text-cyan-400",
};

function ProcessRoutesView() {
  const [selectedFamily, setSelectedFamily] = useState<string>(productFamilies[0]?.id || "");
  const family = productFamilies.find((f) => f.id === selectedFamily);
  const route = processRoutes.find((r) =>
    selectedFamily.includes("water") || family?.name?.toLowerCase().includes("water") || family?.name?.toLowerCase().includes("soda")
      ? r.name.includes("Still Water")
      : r.name.includes("RTD")
  )?.stages || [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <p className="text-xs text-slate-500 dark:text-slate-400">Visual reference of manufacturing routes across all product families. Select a family to view its process timeline.</p>

      {/* Product Family Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {productFamilies.map((pf, i) => {
          const isActive = selectedFamily === pf.id;
          const grad = familyGradients[pf.name] || "from-gray-500/10 to-slate-500/5 border-gray-200/50 dark:border-slate-800/30";
          return (
            <motion.button
              key={pf.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedFamily(pf.id)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer bg-gradient-to-br ${grad} ${
                isActive
                  ? "ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/10 dark:shadow-cyan-500/5 scale-[1.02]"
                  : "hover:shadow-md hover:border-gray-300 dark:hover:border-slate-700"
              }`}
            >
              <div className={`w-14 h-14 rounded-xl bg-white/80 dark:bg-slate-900/60 flex items-center justify-center shadow-sm ${isActive ? "ring-2 ring-cyan-500/30" : ""}`}>
                <img src={pf.image} alt={pf.name} className="w-10 h-10 object-contain" />
              </div>
              <div>
                <p className={`text-xs font-semibold leading-tight ${isActive ? "text-cyan-700 dark:text-cyan-400" : "text-slate-700 dark:text-slate-200"}`}>{pf.name}</p>
                <p className={`text-[10px] mt-0.5 ${familyIconColors[pf.name] || "text-slate-600 dark:text-slate-400"}`}>{pf.variants.length} variants</p>
              </div>
              {isActive && <motion.div layoutId="active-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-cyan-500" />}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {family && (
          <motion.div key={family.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-5">
            {/* Family Info Bar */}
            <div className="flex items-center gap-4 px-1">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
                <img src={family.image} alt={family.name} className="w-8 h-8 object-contain" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{family.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{family.category} — {family.variants.length} size variants</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Process Timeline */}
              <div className="lg:col-span-3">
                <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
                  <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800/60">
                    <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      <Factory className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      Process Route
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="relative">
                      <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-cyan-200 via-emerald-200 to-gray-200 dark:from-cyan-900/40 dark:via-emerald-900/30 dark:to-slate-800" />
                      <div className="space-y-5">
                        {route.map((stage: { name: string; equipment: string[]; duration: string }, i: number) => {
                          const Icon = stageIcons[stage.name] || Factory;
                          const isActive = i === 3;
                          const isCompleted = i < 3;
                          return (
                            <motion.div key={stage.name} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start gap-4 relative">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 z-10 shadow-sm ${
                                isActive ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-cyan-500/25" :
                                isCompleted ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/25" :
                                "bg-gray-100 dark:bg-slate-800 text-slate-400"
                              }`}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />}
                              </div>
                              <div className="flex-1 pt-0.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{stage.name}</h3>
                                  {isActive && <Badge className="bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-0 text-[10px]">Current</Badge>}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Equipment: {stage.equipment.join(", ")}
                                </p>
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  {stage.duration}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Variants Panel */}
              <div className="lg:col-span-2">
                <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
                  <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800/60">
                    <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Size Variants
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {family.variants.map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                          <div>
                            <p className="text-xs font-medium text-slate-800 dark:text-white">{v.size}</p>
                            <p className="text-[10px] text-slate-400">{v.name} — {v.sku}</p>
                          </div>
                          <Badge className="text-[9px] border-0 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">{v.uom}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DSSBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlBom = searchParams.get("bom");
  const urlTemplate = searchParams.get("template");
  const { dssTemplates, addTemplate, updateTemplate, hasPermission } = useAppStore();
  const canBuild = hasPermission("ops-dss-builder");

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(urlTemplate || dssTemplates[0]?.id || "");
  const template = dssTemplates.find((t) => t.id === selectedTemplateId);
  const linkedBOM = template?.bomId ? boms.find((b) => b.id === template.bomId) : null;

  const [nodes, setNodes] = useState<DSSFlowNode[]>(template?.nodes || []);
  const [edges, setEdges] = useState<DSSFlowEdge[]>(template?.edges || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<string | null>(null);
  const [paletteCategory, setPaletteCategory] = useState<string>("all");
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBomId, setNewBomId] = useState<string>(urlBom || "");
  const [activeTab, setActiveTab] = useState<"builder" | "routes">("builder");
  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync when template changes
  useEffect(() => {
    if (template) {
      setNodes(template.nodes);
      setEdges(template.edges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  }, [selectedTemplateId]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  const getCellFromEvent = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = Math.round((e.clientX - rect.left) / CELL);
    const y = Math.round((e.clientY - rect.top) / CELL);
    return { x: Math.max(0, Math.min(GRID_W, x)), y: Math.max(0, Math.min(GRID_H, y)) };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (draggingNode) return;
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest("[data-node]")) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    // If we have a pending source, cancel it on blank click
    if (pendingSource) {
      setPendingSource(null);
      return;
    }
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const addNode = (typeId: string) => {
    const type = dssNodeTypes.find((t) => t.id === typeId);
    if (!type) return;
    // Find a free spot near center
    const newNode: DSSFlowNode = {
      id: generateId("n"),
      typeId,
      name: type.name,
      x: 12,
      y: 10,
      role: "Operator",
      durationMin: 30,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (pendingSource && pendingSource !== nodeId) {
      // Create edge
      const exists = edges.some((ed) => ed.fromNodeId === pendingSource && ed.toNodeId === nodeId);
      if (!exists) {
        setEdges((prev) => [...prev, { id: generateId("e"), fromNodeId: pendingSource, toNodeId: nodeId }]);
      }
      setPendingSource(null);
      setSelectedNodeId(nodeId);
    } else {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null);
    }
  };

  const startConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setPendingSource(nodeId);
    setSelectedNodeId(nodeId);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
    setSelectedNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    setNodes((prev) => prev.map((n) => (n.id === draggingNode ? { ...n, x: cell.x, y: cell.y } : n)));
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const deleteSelected = () => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setEdges((prev) => prev.filter((e) => e.fromNodeId !== selectedNodeId && e.toNodeId !== selectedNodeId));
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  };

  const updateSelectedNode = (updates: Partial<DSSFlowNode>) => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.map((n) => (n.id === selectedNodeId ? { ...n, ...updates } : n)));
  };

  const updateSelectedEdge = (updates: Partial<DSSFlowEdge>) => {
    if (!selectedEdgeId) return;
    setEdges((prev) => prev.map((e) => (e.id === selectedEdgeId ? { ...e, ...updates } : e)));
  };

  const saveTemplate = () => {
    if (!template) return;
    updateTemplate(template.id, { nodes, edges, status: "draft" });
  };

  const publishTemplate = () => {
    if (!template) return;
    updateTemplate(template.id, { nodes, edges, status: "published" });
  };

  const createNewTemplate = () => {
    if (!newName.trim()) return;
    const selectedBom = boms.find((b) => b.id === newBomId);
    const tpl: DSSFlowTemplate = {
      id: generateId("tpl"),
      name: newName,
      description: selectedBom ? `Production flow for ${selectedBom.name}` : "",
      productFamily: selectedBom ? productFamilies.find((pf) => pf.id === selectedBom.productFamilyId)?.name : undefined,
      bomId: selectedBom ? selectedBom.id : undefined,
      status: "draft",
      createdAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    };
    addTemplate(tpl);
    setSelectedTemplateId(tpl.id);
    setShowNewForm(false);
    setNewName("");
    setNewBomId("");
  };

  const filteredTypes = paletteCategory === "all"
    ? dssNodeTypes
    : dssNodeTypes.filter((t) => t.category === paletteCategory);

  const categories = [
    { id: "all", label: "All" },
    { id: "main", label: "Main" },
    { id: "qc", label: "QC" },
    { id: "lab", label: "Lab" },
    { id: "support", label: "Support" },
    { id: "decision", label: "Decision" },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-4" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dss")} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-pink-500" />
              Journey Creator
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Design production flows and push to DSS Board</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {linkedBOM && (
            <Badge className="text-[10px] border-0 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Boxes className="w-3 h-3 mr-1" /> {linkedBOM.id}
            </Badge>
          )}
          <select
            className="h-9 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-700 dark:text-slate-200"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            {dssTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.name} {t.bomId ? `(${t.bomId})` : ""} {t.status === "draft" ? "(Draft)" : "(Published)"}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setShowNewForm(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New
          </Button>
          {canBuild && (
            <>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={saveTemplate}>
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
              <Button size="sm" className="h-9 text-xs bg-gradient-to-r from-pink-600 to-rose-500 text-white" onClick={publishTemplate}>
                <ArrowRight className="w-3.5 h-3.5 mr-1" /> Publish
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {[
          { id: "builder" as const, label: "Flow Builder", icon: GitBranch },
          { id: "routes" as const, label: "Process Routes", icon: Route },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-pink-50 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* New Template Form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <Card className="bg-white dark:bg-slate-900/50">
              <CardContent className="p-3 flex items-center gap-2 flex-wrap">
                <Input className="h-9 text-xs max-w-xs" placeholder="Template name..." value={newName} onChange={(e) => setNewName(e.target.value)} />
                <select
                  className="h-9 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-slate-700 dark:text-slate-200"
                  value={newBomId}
                  onChange={(e) => setNewBomId(e.target.value)}
                >
                  <option value="">— Link to BOM (optional) —</option>
                  {boms.map((b) => (
                    <option key={b.id} value={b.id}>{b.id} — {b.name}</option>
                  ))}
                </select>
                <Button size="sm" className="h-9 text-xs" onClick={createNewTemplate}>Create</Button>
                <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setShowNewForm(false); setNewBomId(""); }}><X className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === "builder" && (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Palette */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 flex flex-col gap-3">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-pink-500" />
                Tool Palette
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 p-3">
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPaletteCategory(c.id)}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                      paletteCategory === c.id
                        ? "bg-pink-50 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400"
                        : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {/* Node type buttons */}
              <div className="space-y-1.5">
                {filteredTypes.map((type) => {
                  const Icon = iconMap[type.icon] || Factory;
                  const col = colorMap[type.color];
                  return (
                    <button
                      key={type.id}
                      onClick={() => addNode(type.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-all hover:shadow-sm ${col.bg} ${col.border}`}
                    >
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${col.bg} ${col.text}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className={`text-[11px] font-medium ${col.text}`}>{type.name}</p>
                        <p className="text-[9px] text-slate-400 capitalize">{type.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Properties Panel */}
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {selectedNode ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Name</label>
                    <Input className="h-8 text-xs mt-0.5" value={selectedNode.name} onChange={(e) => updateSelectedNode({ name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Role</label>
                    <Input className="h-8 text-xs mt-0.5" value={selectedNode.role || ""} onChange={(e) => updateSelectedNode({ role: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Duration (min)</label>
                    <Input type="number" className="h-8 text-xs mt-0.5" value={selectedNode.durationMin || 0} onChange={(e) => updateSelectedNode({ durationMin: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Parallel Group</label>
                    <Input className="h-8 text-xs mt-0.5" placeholder="e.g. prep, qc-prep" value={selectedNode.parallelGroup || ""} onChange={(e) => updateSelectedNode({ parallelGroup: e.target.value || undefined })} />
                  </div>

                  {/* Form Editor for QC / Lab / Support nodes */}
                  {(() => {
                    const type = dssNodeTypes.find((t) => t.id === selectedNode.typeId);
                    const canHaveForm = type?.category === "qc" || type?.category === "lab" || type?.category === "support";
                    if (!canHaveForm) return null;

                    const addFormField = () => {
                      const form = selectedNode.form || { id: generateId("f"), name: `${selectedNode.name} Form`, fields: [] };
                      const newField: DSSFormField = {
                        id: generateId("fld"),
                        label: "New Field",
                        type: "text",
                        required: false,
                      };
                      updateSelectedNode({ form: { ...form, fields: [...form.fields, newField] } });
                    };

                    const updateField = (fieldId: string, updates: Partial<DSSFormField>) => {
                      if (!selectedNode.form) return;
                      updateSelectedNode({
                        form: {
                          ...selectedNode.form,
                          fields: selectedNode.form.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
                        },
                      });
                    };

                    const removeField = (fieldId: string) => {
                      if (!selectedNode.form) return;
                      updateSelectedNode({
                        form: {
                          ...selectedNode.form,
                          fields: selectedNode.form.fields.filter((f) => f.id !== fieldId),
                        },
                      });
                    };

                    return (
                      <div className="rounded-lg border border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-500/5 p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                            <ClipboardCheck className="w-3 h-3" /> Attached Form
                          </p>
                          <Button variant="ghost" size="sm" className="h-6 text-[9px] px-1.5 text-purple-600" onClick={addFormField}>
                            <Plus className="w-3 h-3 mr-0.5" /> Add Field
                          </Button>
                        </div>
                        {!selectedNode.form || selectedNode.form.fields.length === 0 ? (
                          <p className="text-[9px] text-slate-400 text-center py-1">No form fields yet</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            {selectedNode.form.fields.map((field) => (
                              <div key={field.id} className="rounded-md bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 p-1.5 space-y-1">
                                <div className="flex items-center gap-1">
                                  <Input className="h-6 text-[10px] flex-1" value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} />
                                  <button onClick={() => removeField(field.id)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <select
                                    className="h-6 text-[9px] rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1 flex-1"
                                    value={field.type}
                                    onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                  >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="select">Select</option>
                                    <option value="checkbox">Checkbox</option>
                                    <option value="date">Date</option>
                                    <option value="textarea">Textarea</option>
                                    <option value="pass_fail">Pass/Fail</option>
                                  </select>
                                  <label className="flex items-center gap-0.5 text-[9px] text-slate-500">
                                    <input type="checkbox" checked={!!field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} className="w-3 h-3" />
                                    Req
                                  </label>
                                </div>
                                {field.type === "number" && (
                                  <div className="flex gap-1">
                                    <Input className="h-6 text-[9px]" placeholder="Min" value={field.min ?? ""} onChange={(e) => updateField(field.id, { min: e.target.value ? Number(e.target.value) : undefined })} />
                                    <Input className="h-6 text-[9px]" placeholder="Max" value={field.max ?? ""} onChange={(e) => updateField(field.id, { max: e.target.value ? Number(e.target.value) : undefined })} />
                                    <Input className="h-6 text-[9px]" placeholder="Unit" value={field.unit || ""} onChange={(e) => updateField(field.id, { unit: e.target.value || undefined })} />
                                  </div>
                                )}
                                {field.type === "select" && (
                                  <Input className="h-6 text-[9px]" placeholder="Option1, Option2, Option3" value={field.options?.join(", ") || ""} onChange={(e) => updateField(field.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1" onClick={() => startConnection({ stopPropagation() {} } as any, selectedNode.id)}>
                      <ArrowRight className="w-3 h-3 mr-1" />
                      {pendingSource === selectedNode.id ? "Click target..." : "Connect"}
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8 text-[10px] px-2" onClick={deleteSelected}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : selectedEdge ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Connection Label</label>
                    <Input className="h-8 text-xs mt-0.5" value={selectedEdge.label || ""} onChange={(e) => updateSelectedEdge({ label: e.target.value || undefined })} placeholder="e.g. pass, parallel" />
                  </div>
                  <Button variant="destructive" size="sm" className="h-8 text-[10px]" onClick={deleteSelected}>
                    <Trash2 className="w-3 h-3 mr-1" /> Delete Connection
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs">
                  <MousePointer className="w-5 h-5 mx-auto mb-1 opacity-50" />
                  Select a node or connection
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Canvas */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-3">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-cyan-500" />
                  Flow Canvas
                  {template && (
                    <Badge className="text-[10px] border-0 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {template.name}
                    </Badge>
                  )}
                  {pendingSource && (
                    <Badge className="text-[10px] border-0 bg-amber-50 text-amber-600 animate-pulse">
                      Select target node...
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{nodes.length} nodes</span>
                  <span>{edges.length} connections</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-auto relative">
              <div
                ref={canvasRef}
                className="relative bg-gray-50/50 dark:bg-slate-950/50"
                style={{ width: GRID_W * CELL + 2, height: GRID_H * CELL + 2 }}
                onClick={handleCanvasClick}
              >
                {/* Grid */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: GRID_W * CELL, height: GRID_H * CELL }}>
                  <defs>
                    <pattern id="grid" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
                      <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: GRID_W * CELL, height: GRID_H * CELL }}>
                  {edges.map((edge) => {
                    const from = nodes.find((n) => n.id === edge.fromNodeId);
                    const to = nodes.find((n) => n.id === edge.toNodeId);
                    if (!from || !to) return null;
                    const x1 = from.x * CELL;
                    const y1 = from.y * CELL;
                    const x2 = to.x * CELL;
                    const y2 = to.y * CELL;
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const isSelected = selectedEdgeId === edge.id;
                    return (
                      <g key={edge.id}>
                        <line
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke={isSelected ? "#ec4899" : "#94a3b8"}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeDasharray={edge.label === "parallel" ? "4 3" : undefined}
                          className="dark:opacity-60"
                        />
                        <circle cx={x2} cy={y2} r="3" fill={isSelected ? "#ec4899" : "#94a3b8"} />
                        {/* Label background */}
                        {edge.label && (
                          <>
                            <rect x={midX - 22} y={midY - 9} width="44" height="16" rx="4" fill="rgba(255,255,255,0.9)" className="dark:fill-slate-900/90" />
                            <text x={midX} y={midY + 3} textAnchor="middle" className="text-[8px] fill-slate-500 dark:fill-slate-400" style={{ fontSize: 8 }}>
                              {edge.label}
                            </text>
                          </>
                        )}
                        {/* Invisible hit area */}
                        <line
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="transparent"
                          strokeWidth="12"
                          className="pointer-events-auto cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Nodes */}
                {nodes.map((node) => {
                  const type = dssNodeTypes.find((t) => t.id === node.typeId);
                  const Icon = type ? iconMap[type.icon] || Factory : Factory;
                  const col = type ? colorMap[type.color] : colorMap.blue;
                  const isSelected = selectedNodeId === node.id;
                  const isPending = pendingSource === node.id;
                  return (
                    <motion.div
                      key={node.id}
                      data-node
                      className={`absolute flex flex-col items-center justify-center cursor-pointer select-none ${isSelected ? `ring-2 ${col.ring} rounded-xl` : ""} ${isPending ? "animate-pulse" : ""}`}
                      style={{ left: node.x * CELL - 36, top: node.y * CELL - 24, width: 72, height: 48 }}
                      onClick={(e) => handleNodeClick(e, node.id)}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${col.bg} ${col.border}`}>
                        <Icon className={`w-4 h-4 ${col.text}`} />
                      </div>
                      <p className="text-[9px] font-medium text-slate-700 dark:text-slate-200 mt-1 text-center leading-tight max-w-[80px] truncate">
                        {node.name}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      )}

      {activeTab === "routes" && <ProcessRoutesView />}
    </div>
  );
}
