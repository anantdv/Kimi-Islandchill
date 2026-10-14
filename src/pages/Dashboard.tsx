import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import {
  PlusCircle, AlertTriangle, ClipboardCheck,
  Wrench, Clock, TrendingUp, Package, ArrowRight,
  CheckCircle2, Truck, FlaskConical,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { workOrders, incidents, maintenanceChecks, requisitions, user, hasPermission } = useAppStore();

  const userRole = user?.role || "";
  const canCreateWO = hasPermission("ops-wo-create");
  const canViewIncidents = hasPermission("ops-incidents");

  // ── ROLE-SPECIFIC DATA ──

  // Operator: their assigned WOs, line incidents
  const operatorWOs = workOrders.filter((w) => w.status === "in_process").slice(0, 3);
  const operatorLine = "FL1";
  const operatorIncidents = incidents.filter((i) => i.line === operatorLine && i.status !== "resolved");

  // QC Inspector: pending checks
  const pendingQcChecks = workOrders
    .filter((w) => w.status === "in_process")
    .reduce((acc, w) => acc + w.qcChecks.filter((q) => q.status === "pending").length, 0);

  // Maintenance: pending clearances
  const pendingMaint = maintenanceChecks.filter((m) => m.status === "pending");

  // Warehouse: low stock alerts
  const lowStockItems = [
    { name: "330ml Labels", qty: 2000, threshold: 5000, unit: "labels" },
    { name: "Cola Concentrate", qty: 125, threshold: 200, unit: "L" },
    { name: "Sugar Syrup", qty: 180, threshold: 300, unit: "L" },
  ];

  // Mixer: approved requisitions waiting
  const approvedReqs = requisitions.filter((r) => r.status === "approved");
  const preparedReqs = requisitions.filter((r) => r.status === "prepared");

  // Production Supervisor: all active WOs, open incidents
  const activeWOs = workOrders.filter((w) => w.status === "in_process");
  const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "acknowledged");

  // Common stats
  const inProgressCount = workOrders.filter((w) => w.status === "in_process").length;
  const efficiency = Math.round((workOrders.reduce((acc, w) => acc + Math.round(w.qty * w.progress / 100), 0) / workOrders.reduce((acc, w) => acc + w.qty, 0)) * 100);

  // ── VIEWS ──

  const StatCard = ({ icon: Icon, label, val, color }: { icon: any; label: string; val: string | number; color: string }) => (
    <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <Icon className={`w-4 h-4 ${color}`} />
          <p className={`text-lg font-bold ${color}`}>{val}</p>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      </CardContent>
    </Card>
  );

  const SectionCard = ({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) => (
    <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const EmptyState = ({ text }: { text: string }) => (
    <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center py-3 flex items-center justify-center gap-1">
      <CheckCircle2 className="w-3.5 h-3.5" /> {text}
    </p>
  );

  // ── ROLE RENDERERS ──

  const renderOperatorView = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ClipboardCheck} label="My Active WOs" val={operatorWOs.length} color="text-cyan-600 dark:text-cyan-400" />
        <StatCard icon={AlertTriangle} label="Line Incidents" val={operatorIncidents.length} color="text-red-600 dark:text-red-400" />
        <StatCard icon={TrendingUp} label="Efficiency" val={`${efficiency}%`} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={Clock} label="Hours Worked" val="6.5" color="text-amber-600 dark:text-amber-400" />
      </div>

      <SectionCard title="My Assigned Work Orders" icon={ClipboardCheck} color="text-cyan-600 dark:text-cyan-400">
        <div className="space-y-2">
          {operatorWOs.length > 0 ? operatorWOs.map((wo) => (
            <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
              <div>
                <p className="text-xs font-medium text-slate-800 dark:text-white">{wo.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{wo.product} — {wo.variant}</p>
              </div>
              <Button size="sm" className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => navigate(`/wo/${wo.id}`)}>
                Open <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No active work orders assigned</p>
          )}
        </div>
      </SectionCard>

      {canViewIncidents && (
        <SectionCard title={`Incidents on My Line (${operatorLine})`} icon={AlertTriangle} color="text-red-600 dark:text-red-400">
          <div className="space-y-2">
            {operatorIncidents.length > 0 ? operatorIncidents.map((inc) => (
              <div key={inc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/20">
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">{inc.type}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{inc.description.slice(0, 60)}...</p>
                </div>
                <Badge className="text-[10px] bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-0">{inc.severity}</Badge>
              </div>
            )) : <EmptyState text="No open incidents on your line" />}
          </div>
        </SectionCard>
      )}
    </div>
  );

  const renderQcView = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FlaskConical} label="Pending Checks" val={pendingQcChecks} color="text-amber-600 dark:text-amber-400" />
        <StatCard icon={ClipboardCheck} label="Active WOs" val={activeWOs.length} color="text-cyan-600 dark:text-cyan-400" />
        <StatCard icon={AlertTriangle} label="Incidents" val={openIncidents.length} color="text-red-600 dark:text-red-400" />
        <StatCard icon={CheckCircle2} label="My Checks Today" val="12" color="text-emerald-600 dark:text-emerald-400" />
      </div>

      <SectionCard title="Pending QC Checks" icon={FlaskConical} color="text-amber-600 dark:text-amber-400">
        <div className="space-y-2">
          {activeWOs.slice(0, 3).map((wo) => (
            <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
              <div>
                <p className="text-xs font-medium text-slate-800 dark:text-white">{wo.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {wo.qcChecks.filter((q) => q.status === "pending").length} pending checks
                </p>
              </div>
              <Button size="sm" className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => navigate(`/qc`)}>
                Check Now <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderMaintView = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Wrench} label="Pending Clearances" val={pendingMaint.length} color="text-amber-600 dark:text-amber-400" />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" val={pendingMaint.filter((m) => m.resolutionStatus === "pending").length} color="text-red-600 dark:text-red-400" />
        <StatCard icon={CheckCircle2} label="Completed Today" val={maintenanceChecks.filter((m) => m.status === "cleared").length} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={ClipboardCheck} label="Active WOs" val={activeWOs.length} color="text-cyan-600 dark:text-cyan-400" />
      </div>

      <SectionCard title="Pending Maintenance Clearances" icon={Wrench} color="text-amber-600 dark:text-amber-400">
        <div className="space-y-2">
          {pendingMaint.length > 0 ? pendingMaint.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/20">
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{m.woName} — {m.line}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{m.notes || "Pre-start check pending"}</p>
              </div>
              <Button size="sm" className="h-7 text-[10px] bg-amber-600 hover:bg-amber-700 text-white" onClick={() => navigate(`/wo/${m.woId}`)}>
                Clear <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )) : <EmptyState text="All clearances up to date" />}
        </div>
      </SectionCard>
    </div>
  );

  const renderWarehouseView = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={AlertTriangle} label="Low Stock Items" val={lowStockItems.length} color="text-red-600 dark:text-red-400" />
        <StatCard icon={Truck} label="Pending Deliveries" val={preparedReqs.length} color="text-purple-600 dark:text-purple-400" />
        <StatCard icon={ClipboardCheck} label="Active WOs" val={activeWOs.length} color="text-cyan-600 dark:text-cyan-400" />
        <StatCard icon={Package} label="Pick Requests" val={approvedReqs.length} color="text-amber-600 dark:text-amber-400" />
      </div>

      <SectionCard title="Low Stock Alerts" icon={AlertTriangle} color="text-red-600 dark:text-red-400">
        <div className="space-y-2">
          {lowStockItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/20">
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400">{item.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.qty.toLocaleString()} {item.unit} (threshold: {item.threshold.toLocaleString()})</p>
              </div>
              <Badge className="text-[10px] bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-0">Low</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Pending Deliveries to Production" icon={Truck} color="text-purple-600 dark:text-purple-400">
        <div className="space-y-2">
          {preparedReqs.length > 0 ? preparedReqs.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-900/20">
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-400">{req.bomName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{req.product} — Prepared by {req.preparedBy}</p>
              </div>
              <Button size="sm" className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 text-white" onClick={() => navigate(`/requisitions`)}>
                View <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )) : <EmptyState text="No pending deliveries" />}
        </div>
      </SectionCard>
    </div>
  );

  const renderMixerView = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Approved Requisitions" val={approvedReqs.length} color="text-blue-600 dark:text-blue-400" />
        <StatCard icon={ClipboardCheck} label="In Picking" val={requisitions.filter((r) => r.status === "picking").length} color="text-amber-600 dark:text-amber-400" />
        <StatCard icon={Truck} label="Prepared" val={preparedReqs.length} color="text-purple-600 dark:text-purple-400" />
        <StatCard icon={CheckCircle2} label="Delivered Today" val={requisitions.filter((r) => r.status === "delivered").length} color="text-emerald-600 dark:text-emerald-400" />
      </div>

      <SectionCard title="Approved Requisitions — Ready to Pick" icon={Package} color="text-blue-600 dark:text-blue-400">
        <div className="space-y-2">
          {approvedReqs.length > 0 ? approvedReqs.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-900/20">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">{req.bomName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{req.product} — Batch {req.batchQty.toLocaleString()} — {req.items.length} items</p>
              </div>
              <Button size="sm" className="h-7 text-[10px] bg-blue-600 hover:bg-blue-700 text-white" onClick={() => navigate(`/requisitions`)}>
                Pick <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )) : <EmptyState text="No approved requisitions waiting" />}
        </div>
      </SectionCard>

      <SectionCard title="Prepared — Ready to Deliver" icon={Truck} color="text-purple-600 dark:text-purple-400">
        <div className="space-y-2">
          {preparedReqs.length > 0 ? preparedReqs.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-900/20">
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-400">{req.bomName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{req.product} — {req.woName}</p>
              </div>
              <Button size="sm" className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 text-white" onClick={() => navigate(`/requisitions`)}>
                Deliver <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )) : <EmptyState text="No prepared batches to deliver" />}
        </div>
      </SectionCard>
    </div>
  );

  const renderSupervisorView = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ClipboardCheck} label="Active WOs" val={activeWOs.length} color="text-cyan-600 dark:text-cyan-400" />
        <StatCard icon={AlertTriangle} label="Open Incidents" val={openIncidents.length} color="text-red-600 dark:text-red-400" />
        <StatCard icon={Wrench} label="Pending Maint." val={pendingMaint.length} color="text-amber-600 dark:text-amber-400" />
        <StatCard icon={TrendingUp} label="Efficiency" val={`${efficiency}%`} color="text-emerald-600 dark:text-emerald-400" />
      </div>

      <SectionCard title="Active Work Orders" icon={ClipboardCheck} color="text-cyan-600 dark:text-cyan-400">
        <div className="space-y-2">
          {activeWOs.slice(0, 3).map((wo) => (
            <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
              <div>
                <p className="text-xs font-medium text-slate-800 dark:text-white">{wo.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{wo.product} — {Math.round(wo.qty * wo.progress / 100)}/{wo.qty} produced</p>
              </div>
              <Button size="sm" className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => navigate(`/wo/${wo.id}`)}>
                View <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ))}
          {activeWOs.length === 0 && <EmptyState text="No active work orders" />}
        </div>
      </SectionCard>

      {canViewIncidents && (
        <SectionCard title="Open Incidents" icon={AlertTriangle} color="text-red-600 dark:text-red-400">
          <div className="space-y-2">
            {openIncidents.slice(0, 3).map((inc) => (
              <div key={inc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/20">
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">{inc.type} — {inc.line}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{inc.description.slice(0, 55)}...</p>
                </div>
                <Badge className="text-[10px] bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-0">{inc.severity}</Badge>
              </div>
            ))}
            {openIncidents.length === 0 && <EmptyState text="No open incidents" />}
          </div>
        </SectionCard>
      )}
    </div>
  );

  const renderManagerView = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ClipboardCheck} label="Total WOs" val={workOrders.length} color="text-cyan-600 dark:text-cyan-400" />
        <StatCard icon={TrendingUp} label="In Progress" val={inProgressCount} color="text-amber-600 dark:text-amber-400" />
        <StatCard icon={CheckCircle2} label="Completed Today" val={workOrders.filter((w) => w.status === "completed").length} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={AlertTriangle} label="Open Incidents" val={openIncidents.length} color="text-red-600 dark:text-red-400" />
      </div>

      <SectionCard title="Factory Overview" icon={TrendingUp} color="text-slate-600 dark:text-slate-400">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Efficiency", val: `${efficiency}%`, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "OEE", val: "78%", color: "text-blue-600 dark:text-blue-400" },
            { label: "Quality Rate", val: "99.2%", color: "text-purple-600 dark:text-purple-400" },
            { label: "Uptime", val: "92%", color: "text-cyan-600 dark:text-cyan-400" },
            { label: "Throughput", val: "4,200/hr", color: "text-amber-600 dark:text-amber-400" },
            { label: "Waste", val: "0.8%", color: "text-red-600 dark:text-red-400" },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
              <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {canViewIncidents && (
        <SectionCard title="Open Incidents" icon={AlertTriangle} color="text-red-600 dark:text-red-400">
          <div className="space-y-2">
            {openIncidents.slice(0, 3).map((inc) => (
              <div key={inc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/20">
                <div>
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">{inc.type} — {inc.line}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{inc.description.slice(0, 55)}...</p>
                </div>
                <Badge className="text-[10px] bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-0">{inc.severity}</Badge>
              </div>
            ))}
            {openIncidents.length === 0 && <EmptyState text="No open incidents" />}
          </div>
        </SectionCard>
      )}
    </div>
  );

  // ── DISPATCH ──

  const renderView = () => {
    switch (userRole) {
      case "Operator": return renderOperatorView();
      case "QC Inspector": return renderQcView();
      case "Maintenance Supervisor": return renderMaintView();
      case "Warehouse Supervisor": return renderWarehouseView();
      case "Ingredient Mixer": return renderMixerView();
      case "Production Supervisor": return renderSupervisorView();
      case "Factory Manager": return renderManagerView();
      case "Planner": return renderSupervisorView();
      case "Administrator": return renderManagerView();
      default: return renderOperatorView();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {userRole} view — {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateWO && (
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-8" onClick={() => navigate("/workorders/new")}>
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> New WO
            </Button>
          )}
        </div>
      </div>

      {renderView()}
    </div>
  );
}
