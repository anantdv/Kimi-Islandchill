import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Factory, Beaker, Droplets, ClipboardCheck, FlaskConical,
  Wrench, GitBranch, CheckCircle2, ArrowRight, Trash2,
  Layers,
} from "lucide-react";
import type { DSSFlowNode, DSSFlowEdge } from "@/data/mockData";
import { dssNodeTypes } from "@/data/mockData";
import { generateId } from "@/lib/utils";

const GRID_W = 24;
const GRID_H = 20;
const CELL = 40;

const iconMap: Record<string, React.ElementType> = {
  PlayCircle: GitBranch, Factory, Beaker, Droplets, ClipboardCheck, FlaskConical,
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

const categories = [
  { id: "all", label: "All" },
  { id: "main", label: "Main" },
  { id: "qc", label: "QC" },
  { id: "lab", label: "Lab" },
  { id: "support", label: "Support" },
  { id: "decision", label: "Decision" },
];

interface FlowEditorProps {
  initialNodes: DSSFlowNode[];
  initialEdges: DSSFlowEdge[];
  onChange?: (nodes: DSSFlowNode[], edges: DSSFlowEdge[]) => void;
  readOnly?: boolean;
  title?: string;
}

export default function FlowEditor({ initialNodes, initialEdges, onChange, readOnly = false, title }: FlowEditorProps) {
  const [nodes, setNodes] = useState<DSSFlowNode[]>(initialNodes);
  const [edges, setEdges] = useState<DSSFlowEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [pendingSource, setPendingSource] = useState<string | null>(null);
  const [paletteCategory, setPaletteCategory] = useState<string>("all");
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

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
    if (readOnly) return;
    if (draggingNode) return;
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest("[data-node]")) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    if (pendingSource) { setPendingSource(null); return; }
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const addNode = (typeId: string) => {
    if (readOnly) return;
    const type = dssNodeTypes.find((t) => t.id === typeId);
    if (!type) return;
    const newNode: DSSFlowNode = {
      id: generateId("n"),
      typeId,
      name: type.name,
      x: 12, y: 10,
      role: "Operator",
      durationMin: 30,
    };
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    setSelectedNodeId(newNode.id);
    onChange?.(nextNodes, edges);
  };

  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!readOnly && pendingSource && pendingSource !== nodeId) {
      const exists = edges.some((ed) => ed.fromNodeId === pendingSource && ed.toNodeId === nodeId);
      let nextEdges = edges;
      if (!exists) {
        nextEdges = [...edges, { id: generateId("e"), fromNodeId: pendingSource, toNodeId: nodeId }];
        setEdges(nextEdges);
      }
      setPendingSource(null);
      setSelectedNodeId(nodeId);
      onChange?.(nodes, nextEdges);
    } else {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null);
    }
  };

  const startConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (readOnly) return;
    setPendingSource(nodeId);
    setSelectedNodeId(nodeId);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    setDraggingNode(nodeId);
    setSelectedNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNode || readOnly) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    const nextNodes = nodes.map((n) => (n.id === draggingNode ? { ...n, x: cell.x, y: cell.y } : n));
    setNodes(nextNodes);
  };

  const handleMouseUp = () => {
    if (draggingNode) {
      onChange?.(nodes, edges);
      setDraggingNode(null);
    }
  };

  const deleteSelected = () => {
    if (readOnly) return;
    let nextNodes = nodes;
    let nextEdges = edges;
    if (selectedNodeId) {
      nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
      nextEdges = edges.filter((e) => e.fromNodeId !== selectedNodeId && e.toNodeId !== selectedNodeId);
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      nextEdges = edges.filter((e) => e.id !== selectedEdgeId);
      setEdges(nextEdges);
      setSelectedEdgeId(null);
    }
    onChange?.(nextNodes, nextEdges);
  };

  const updateSelectedNode = (updates: Partial<DSSFlowNode>) => {
    if (readOnly || !selectedNodeId) return;
    const nextNodes = nodes.map((n) => (n.id === selectedNodeId ? { ...n, ...updates } : n));
    setNodes(nextNodes);
    onChange?.(nextNodes, edges);
  };

  const updateSelectedEdge = (updates: Partial<DSSFlowEdge>) => {
    if (readOnly || !selectedEdgeId) return;
    const nextEdges = edges.map((e) => (e.id === selectedEdgeId ? { ...e, ...updates } : e));
    setEdges(nextEdges);
    onChange?.(nodes, nextEdges);
  };

  const filteredTypes = paletteCategory === "all" ? dssNodeTypes : dssNodeTypes.filter((t) => t.category === paletteCategory);

  return (
    <div className="space-y-3" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">{nodes.length} nodes · {edges.length} edges</span>
              {(selectedNodeId || selectedEdgeId) && (
                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-red-500" onClick={deleteSelected}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3" style={{ minHeight: 500 }}>
        {/* Palette + Properties */}
        {!readOnly && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 flex flex-col gap-3">
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-pink-500" /> Tool Palette
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-3 p-3">
                <div className="flex flex-wrap gap-1">
                  {categories.map((c) => (
                    <button key={c.id} onClick={() => setPaletteCategory(c.id)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${paletteCategory === c.id ? "bg-pink-50 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400" : "text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {filteredTypes.map((type) => {
                    const Icon = iconMap[type.icon] || Factory;
                    const col = colorMap[type.color];
                    return (
                      <button key={type.id} onClick={() => addNode(type.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-all hover:shadow-sm ${col.bg} ${col.border}`}>
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

            {/* Properties */}
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200">Properties</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {selectedNode ? (
                  <div className="space-y-2">
                    <div><label className="text-[10px] text-slate-500">Name</label><Input className="h-8 text-xs mt-0.5" value={selectedNode.name} onChange={(e) => updateSelectedNode({ name: e.target.value })} /></div>
                    <div><label className="text-[10px] text-slate-500">Role</label><Input className="h-8 text-xs mt-0.5" value={selectedNode.role || ""} onChange={(e) => updateSelectedNode({ role: e.target.value })} /></div>
                    <div><label className="text-[10px] text-slate-500">Duration (min)</label><Input type="number" className="h-8 text-xs mt-0.5" value={selectedNode.durationMin || 0} onChange={(e) => updateSelectedNode({ durationMin: Number(e.target.value) })} /></div>
                    <div><label className="text-[10px] text-slate-500">Parallel Group</label><Input className="h-8 text-xs mt-0.5" placeholder="e.g. prep" value={selectedNode.parallelGroup || ""} onChange={(e) => updateSelectedNode({ parallelGroup: e.target.value || undefined })} /></div>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] w-full" onClick={(e) => startConnection(e, selectedNode.id)}>
                      <ArrowRight className="w-3 h-3 mr-1" /> {pendingSource === selectedNode.id ? "Select target…" : "Connect"}
                    </Button>
                  </div>
                ) : selectedEdge ? (
                  <div className="space-y-2">
                    <div><label className="text-[10px] text-slate-500">Label</label><Input className="h-8 text-xs mt-0.5" value={selectedEdge.label || ""} onChange={(e) => updateSelectedEdge({ label: e.target.value || undefined })} /></div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 text-center py-2">Select a node or edge</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Canvas */}
        <div className={readOnly ? "col-span-1" : "lg:col-span-3"}>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-100 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-cyan-500" /> Flow Canvas
                  {pendingSource && (
                    <Badge className="text-[10px] border-0 bg-amber-50 text-amber-600 animate-pulse">Select target node…</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{nodes.length} nodes</span>
                  <span>{edges.length} connections</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-auto relative">
              <div ref={canvasRef} className="relative bg-gray-50/50 dark:bg-slate-950/50"
                style={{ width: GRID_W * CELL + 2, height: GRID_H * CELL + 2 }}
                onClick={handleCanvasClick}>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: GRID_W * CELL, height: GRID_H * CELL }}>
                  <defs>
                    <pattern id={`grid-${title || "flow"}`} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
                      <path d={`M ${CELL} 0 L 0 0 0 ${CELL}`} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#grid-${title || "flow"})`} />
                </svg>

                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: GRID_W * CELL, height: GRID_H * CELL }}>
                  {edges.map((edge) => {
                    const from = nodes.find((n) => n.id === edge.fromNodeId);
                    const to = nodes.find((n) => n.id === edge.toNodeId);
                    if (!from || !to) return null;
                    const x1 = from.x * CELL; const y1 = from.y * CELL;
                    const x2 = to.x * CELL; const y2 = to.y * CELL;
                    const midX = (x1 + x2) / 2; const midY = (y1 + y2) / 2;
                    const isSelected = selectedEdgeId === edge.id;
                    return (
                      <g key={edge.id}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke={isSelected ? "#ec4899" : "#94a3b8"} strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeDasharray={edge.label === "parallel" ? "4 3" : undefined} className="dark:opacity-60" />
                        <circle cx={x2} cy={y2} r="3" fill={isSelected ? "#ec4899" : "#94a3b8"} />
                        {edge.label && (
                          <>
                            <rect x={midX - 22} y={midY - 9} width="44" height="16" rx="4" fill="rgba(255,255,255,0.9)" className="dark:fill-slate-900/90" />
                            <text x={midX} y={midY + 3} textAnchor="middle" className="text-[8px] fill-slate-500 dark:fill-slate-400" style={{ fontSize: 8 }}>{edge.label}</text>
                          </>
                        )}
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="12"
                          className="pointer-events-auto cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedNodeId(null); }} />
                      </g>
                    );
                  })}
                </svg>

                {nodes.map((node) => {
                  const type = dssNodeTypes.find((t) => t.id === node.typeId);
                  const Icon = type ? iconMap[type.icon] || Factory : Factory;
                  const col = type ? colorMap[type.color] : colorMap.blue;
                  const isSelected = selectedNodeId === node.id;
                  const isPending = pendingSource === node.id;
                  return (
                    <motion.div key={node.id} data-node
                      className={`absolute flex flex-col items-center justify-center cursor-pointer select-none ${isSelected ? `ring-2 ${col.ring} rounded-xl` : ""} ${isPending ? "animate-pulse" : ""}`}
                      style={{ left: node.x * CELL - 36, top: node.y * CELL - 24, width: 72, height: 48 }}
                      onClick={(e) => handleNodeClick(e, node.id)}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${col.bg} ${col.border}`}>
                        <Icon className={`w-4 h-4 ${col.text}`} />
                      </div>
                      <p className="text-[9px] font-medium text-slate-700 dark:text-slate-200 mt-1 text-center leading-tight max-w-[80px] truncate">{node.name}</p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
