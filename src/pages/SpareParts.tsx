import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/stores/appStore";
import { generateId, formatDate } from "@/lib/utils";
import type { SparePart, SpareCategory } from "@/data/mockData";
import {
  ArrowLeft, Package, Search, Plus, Wrench, Zap, Cpu, Wind,
  AlertTriangle, Pencil, Trash2, ArrowDownToLine, ArrowUpFromLine, History, Boxes,
} from "lucide-react";

const categoryMeta: Record<SpareCategory, { label: string; icon: typeof Wrench; cls: string }> = {
  mechanical: { label: "Mechanical", icon: Wrench, cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
  electrical: { label: "Electrical", icon: Zap, cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" },
  electronic: { label: "Electronic", icon: Cpu, cls: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/30" },
  pneumatic: { label: "Pneumatic", icon: Wind, cls: "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/30" },
  consumable: { label: "Consumable", icon: Package, cls: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/30" },
};

const emptyPart: Omit<SparePart, "id"> = {
  code: "", name: "", category: "mechanical", qtyOnHand: 0, minQty: 0,
  unitCost: 0, uom: "pc", supplier: "", binLocation: "", compatibleLines: [], leadTimeDays: 14,
};

export default function SpareParts() {
  const navigate = useNavigate();
  const {
    spareParts, fillingLines, lineZones, workOrders, stockIssues,
    addSparePart, updateSparePart, deleteSparePart, issueStock, receiveStock,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<"all" | SpareCategory>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editPart, setEditPart] = useState<SparePart | null>(null);
  const [issuePart, setIssuePart] = useState<SparePart | null>(null);
  const [receivePart, setReceivePart] = useState<SparePart | null>(null);
  const [form, setForm] = useState<Omit<SparePart, "id">>({ ...emptyPart });
  const [issueQty, setIssueQty] = useState(1);
  const [issueLine, setIssueLine] = useState("");
  const [issueZone, setIssueZone] = useState("");
  const [issueWo, setIssueWo] = useState("");
  const [issuePurpose, setIssuePurpose] = useState("");
  const [receiveQty, setReceiveQty] = useState(1);

  const filtered = spareParts.filter((sp) => {
    const q = search.toLowerCase();
    const matchSearch = !q || sp.code.toLowerCase().includes(q) || sp.name.toLowerCase().includes(q) || sp.supplier.toLowerCase().includes(q) || sp.binLocation.toLowerCase().includes(q);
    const matchCat = catFilter === "all" || sp.category === catFilter;
    return matchSearch && matchCat;
  });

  const lowStock = spareParts.filter((sp) => sp.qtyOnHand <= sp.minQty);
  const invValue = spareParts.reduce((s, sp) => s + sp.qtyOnHand * sp.unitCost, 0);

  const openCreate = () => { setForm({ ...emptyPart }); setShowCreate(true); };
  const openEdit = (sp: SparePart) => { setForm({ ...sp }); setEditPart(sp); };
  const openIssue = (sp: SparePart) => {
    setIssuePart(sp); setIssueQty(1); setIssueLine(""); setIssueZone(""); setIssueWo(""); setIssuePurpose("");
  };

  const savePart = (existing?: SparePart) => {
    if (!form.code.trim() || !form.name.trim()) return;
    if (existing) updateSparePart(existing.id, form);
    else addSparePart({ ...form, id: generateId("sp") });
    setShowCreate(false); setEditPart(null);
  };

  const confirmIssue = () => {
    if (!issuePart || issueQty <= 0) return;
    issueStock(issuePart.id, issueQty, {
      lineId: issueLine || undefined,
      zoneId: issueZone || undefined,
      workOrderId: issueWo && issueWo !== "none" ? issueWo : undefined,
      purpose: issuePurpose.trim() || "Maintenance issue",
    });
    setIssuePart(null);
  };

  const zonesForLine = lineZones.filter((z) => z.lineId === issueLine);

  const statCards = [
    { label: "Total SKUs", value: String(spareParts.length), icon: Boxes },
    { label: "Low Stock", value: String(lowStock.length), icon: AlertTriangle, warn: lowStock.length > 0 },
    { label: "Inventory Value", value: `FJD ${invValue.toLocaleString("en-FJ", { maximumFractionDigits: 0 })}`, icon: Package },
    { label: "Issues Logged", value: String(stockIssues.length), icon: History },
  ];

  const formFields = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Part Code</Label>
          <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="M-1001" className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as SpareCategory })}>
            <SelectTrigger className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(categoryMeta) as SpareCategory[]).map((c) => (
                <SelectItem key={c} value={c}>{categoryMeta[c].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Part Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Filler Valve Assembly" className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Qty On Hand</Label>
          <Input type="number" min={0} value={form.qtyOnHand} onChange={(e) => setForm({ ...form, qtyOnHand: Number(e.target.value) })} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Min (reorder)</Label>
          <Input type="number" min={0} value={form.minQty} onChange={(e) => setForm({ ...form, minQty: Number(e.target.value) })} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Lead Time (days)</Label>
          <Input type="number" min={0} value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: Number(e.target.value) })} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Unit Cost (FJD)</Label>
          <Input type="number" min={0} step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">UOM</Label>
          <Input value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} placeholder="pc" className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bin Location</Label>
          <Input value={form.binLocation} onChange={(e) => setForm({ ...form, binLocation: e.target.value })} placeholder="Store-A-R01" className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Supplier</Label>
        <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Krones Pacific" className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Compatible Lines</Label>
        <div className="flex flex-wrap gap-2">
          {fillingLines.map((fl) => {
            const on = form.compatibleLines.includes(fl.id);
            return (
              <button
                key={fl.id}
                type="button"
                onClick={() => setForm({ ...form, compatibleLines: on ? form.compatibleLines.filter((l) => l !== fl.id) : [...form.compatibleLines, fl.id] })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${on ? "bg-slate-700 dark:bg-slate-600 text-white border-slate-700 dark:border-slate-600" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-slate-400"}`}
              >
                {fl.name.split(" - ")[0]}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/maint-schedule")} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">Spare Parts & Inventory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Maintenance spares store — stock levels, issue & receive, reorder points</p>
        </div>
        <Button onClick={openCreate} className="bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 text-white">
          <Plus className="w-4 h-4 mr-1.5" /> Add Part
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border-gray-200 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${s.warn ? "bg-red-50 dark:bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className={`text-lg font-semibold ${s.warn ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-white"}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="parts" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <TabsList className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <TabsTrigger value="parts" className="text-xs data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400">Parts</TabsTrigger>
            <TabsTrigger value="issues" className="text-xs data-[state=active]:bg-slate-700 dark:data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-500 dark:text-slate-400">Issue Log ({stockIssues.length})</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code, name, supplier, bin..." className="pl-8 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
            <Select value={catFilter} onValueChange={(v) => setCatFilter(v as "all" | SpareCategory)}>
              <SelectTrigger className="w-36 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(Object.keys(categoryMeta) as SpareCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>{categoryMeta[c].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="parts">
          <Card className="border-gray-200 dark:border-slate-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">On Hand</th>
                      <th className="px-4 py-3 font-medium text-right">Min</th>
                      <th className="px-4 py-3 font-medium text-right">Unit Cost</th>
                      <th className="px-4 py-3 font-medium">Supplier</th>
                      <th className="px-4 py-3 font-medium">Bin</th>
                      <th className="px-4 py-3 font-medium">Last Issued</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sp) => {
                      const meta = categoryMeta[sp.category];
                      const Icon = meta.icon;
                      const isLow = sp.qtyOnHand <= sp.minQty;
                      return (
                        <tr key={sp.id} className="border-b border-gray-100 dark:border-slate-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{sp.code}</td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                            {sp.name}
                            {isLow && (
                              <Badge className="ml-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 text-[10px] px-1.5">
                                <AlertTriangle className="w-3 h-3 mr-0.5" /> Low
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${meta.cls}`}>
                              <Icon className="w-3.5 h-3.5" /> {meta.label}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${isLow ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>
                            {sp.qtyOnHand} {sp.uom}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{sp.minQty}</td>
                          <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">FJD {sp.unitCost.toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{sp.supplier}</td>
                          <td className="px-4 py-3"><Badge variant="outline" className="border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono text-[10px]">{sp.binLocation}</Badge></td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {sp.lastIssuedAt ? `${formatDate(sp.lastIssuedAt)} (${sp.lastIssuedQty} ${sp.uom})` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => openIssue(sp)} disabled={sp.qtyOnHand === 0}
                                className="h-7 px-2 text-xs border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                <ArrowUpFromLine className="w-3.5 h-3.5 mr-1" /> Issue
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setReceivePart(sp); setReceiveQty(1); }}
                                className="h-7 px-2 text-xs border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                <ArrowDownToLine className="w-3.5 h-3.5 mr-1" /> Receive
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openEdit(sp)} className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${sp.code} — ${sp.name}?`)) deleteSparePart(sp.id); }} className="h-7 w-7 p-0 text-red-500 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">No spare parts match your filter.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card className="border-gray-200 dark:border-slate-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Part</th>
                      <th className="px-4 py-3 font-medium text-right">Qty</th>
                      <th className="px-4 py-3 font-medium">Line / Zone</th>
                      <th className="px-4 py-3 font-medium">Work Order</th>
                      <th className="px-4 py-3 font-medium">Purpose</th>
                      <th className="px-4 py-3 font-medium">Issued By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockIssues.map((si) => {
                      const sp = spareParts.find((p) => p.id === si.sparePartId);
                      const line = fillingLines.find((fl) => fl.id === si.lineId);
                      const zone = lineZones.find((z) => z.id === si.zoneId);
                      return (
                        <tr key={si.id} className="border-b border-gray-100 dark:border-slate-800/60 last:border-0">
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(si.issuedAt)}</td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{sp ? `${sp.code} — ${sp.name}` : si.sparePartId}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{si.qty}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{line ? line.name.split(" - ")[0] : "—"}{zone ? ` · ${zone.name}` : ""}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-mono">{si.workOrderId ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{si.purpose}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{si.issuedBy}</td>
                        </tr>
                      );
                    })}
                    {stockIssues.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No stock issues logged yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create / Edit dialog */}
      <Dialog open={showCreate || !!editPart} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditPart(null); } }}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">{editPart ? `Edit ${editPart.code}` : "Add Spare Part"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">{formFields}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditPart(null); }} className="border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={() => savePart(editPart ?? undefined)} className="bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 text-white">
              {editPart ? "Save Changes" : "Add Part"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue dialog */}
      <Dialog open={!!issuePart} onOpenChange={(o) => { if (!o) setIssuePart(null); }}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Issue Stock — {issuePart?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">{issuePart?.name} · <span className="font-medium text-slate-700 dark:text-slate-300">{issuePart?.qtyOnHand} {issuePart?.uom} on hand</span></p>
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity</Label>
              <Input type="number" min={1} max={issuePart?.qtyOnHand} value={issueQty} onChange={(e) => setIssueQty(Math.min(issuePart?.qtyOnHand ?? 1, Math.max(1, Number(e.target.value))))} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Line</Label>
                <Select value={issueLine} onValueChange={(v) => { setIssueLine(v); setIssueZone(""); }}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"><SelectValue placeholder="Select line" /></SelectTrigger>
                  <SelectContent>
                    {fillingLines.map((fl) => (
                      <SelectItem key={fl.id} value={fl.id}>{fl.name.split(" - ")[0]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Zone</Label>
                <Select value={issueZone} onValueChange={setIssueZone} disabled={!issueLine}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"><SelectValue placeholder={issueLine ? "Select zone" : "Pick line first"} /></SelectTrigger>
                  <SelectContent>
                    {zonesForLine.map((z) => (
                      <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Work Order (optional)</Label>
              <Select value={issueWo} onValueChange={setIssueWo}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workOrders.filter((wo) => wo.status === "in_process" || wo.status === "draft").map((wo) => (
                    <SelectItem key={wo.id} value={wo.name}>{wo.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Purpose</Label>
              <Textarea value={issuePurpose} onChange={(e) => setIssuePurpose(e.target.value)} placeholder="e.g. Filler valve O-ring replacement" rows={2} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssuePart(null)} className="border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={confirmIssue} disabled={issueQty > (issuePart?.qtyOnHand ?? 0)} className="bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 text-white">Issue {issueQty} {issuePart?.uom}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive dialog */}
      <Dialog open={!!receivePart} onOpenChange={(o) => { if (!o) setReceivePart(null); }}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Receive Stock — {receivePart?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">{receivePart?.name} · {receivePart?.qtyOnHand} {receivePart?.uom} on hand</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity Received</Label>
              <Input type="number" min={1} value={receiveQty} onChange={(e) => setReceiveQty(Math.max(1, Number(e.target.value)))} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceivePart(null)} className="border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={() => { if (receivePart) receiveStock(receivePart.id, receiveQty); setReceivePart(null); }} className="bg-slate-700 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 text-white">Receive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
