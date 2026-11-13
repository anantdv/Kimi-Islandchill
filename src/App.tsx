import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, Component, ReactNode } from "react";
import { useAppStore } from "@/stores/appStore";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import { defaultRouteByRole } from "@/data/mockData";

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 text-red-700">
          <div className="max-w-2xl">
            <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
            <pre className="text-xs bg-white p-3 rounded border border-red-200 overflow-auto">{this.state.error?.stack || this.state.error?.message}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Code-split: heavy pages load on demand to keep the initial bundle light */
const WOWizard = lazy(() => import("@/pages/WOWizard"));
const WOExecution = lazy(() => import("@/pages/WOExecution"));
const WorkOrdersList = lazy(() => import("@/pages/WorkOrdersList"));
const Incidents = lazy(() => import("@/pages/Incidents"));
const Warehouse = lazy(() => import("@/pages/Warehouse"));
const DigitalTwin = lazy(() => import("@/pages/DigitalTwin"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminLines = lazy(() => import("@/pages/AdminLines"));
const AdminProductMaster = lazy(() => import("@/pages/AdminProductMaster"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminSettings = lazy(() => import("@/pages/AdminSettings"));

const AdminForms = lazy(() => import("@/pages/AdminForms"));
const AdminWorkflow = lazy(() => import("@/pages/AdminWorkflow"));
const MaintenanceSchedule = lazy(() => import("@/pages/MaintenanceSchedule"));
const SpareParts = lazy(() => import("@/pages/SpareParts"));
const LineZones = lazy(() => import("@/pages/LineZones"));
const ERPStock = lazy(() => import("@/pages/ERPStock"));
const RawMaterials = lazy(() => import("@/pages/RawMaterials"));
const BOMRequisitions = lazy(() => import("@/pages/BOMRequisitions"));
const PurchaseOrders = lazy(() => import("@/pages/PurchaseOrders"));
const DSSBoard = lazy(() => import("@/pages/DSSBoard"));

const AIAgentPage = lazy(() => import("@/pages/AIAgentPage"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const ShiftManagement = lazy(() => import("@/pages/ShiftManagement"));
const FacialAttendance = lazy(() => import("@/pages/FacialAttendance"));
const MailNotifications = lazy(() => import("@/pages/MailNotifications"));
const KaizenBoard = lazy(() => import("@/pages/KaizenBoard"));
const VisionAnalytics = lazy(() => import("@/pages/VisionAnalytics"));
const CartonLabels = lazy(() => import("@/pages/CartonLabels"));
const GatePass = lazy(() => import("@/pages/GatePass"));
const QualityCompliance = lazy(() => import("@/pages/QualityCompliance"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s: { isAuthenticated: boolean }) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  );
}

function RequirePermission({ perm, children }: { perm: string; children: React.ReactNode }) {
  const hasPermission = useAppStore((s: { hasPermission: (p: string) => boolean }) => s.hasPermission);
  const user = useAppStore((s: { user: { role: string } | null }) => s.user);
  const defaultRoute = user?.role ? defaultRouteByRole[user.role as keyof typeof defaultRouteByRole] : "/";
  return hasPermission(perm) ? <>{children}</> : <Navigate to={defaultRoute} replace />;
}

function App() {
  const theme = useAppStore((s: { theme: string }) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
      <AppErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AuthLayout><Dashboard /></AuthLayout>} />
        <Route path="/workorders" element={<AuthLayout><RequirePermission perm="ops-wo"><WorkOrdersList /></RequirePermission></AuthLayout>} />
        <Route path="/workorders/new" element={<AuthLayout><RequirePermission perm="ops-wo-create"><WOWizard /></RequirePermission></AuthLayout>} />
        <Route path="/workorders/:woId" element={<AuthLayout><WOExecution /></AuthLayout>} />
        <Route path="/incidents" element={<AuthLayout><RequirePermission perm="ops-incidents"><Incidents /></RequirePermission></AuthLayout>} />
        <Route path="/warehouse" element={<AuthLayout><RequirePermission perm="ops-warehouse"><Warehouse /></RequirePermission></AuthLayout>} />
        <Route path="/warehouse/raw-materials" element={<AuthLayout><RequirePermission perm="ops-warehouse"><RawMaterials /></RequirePermission></AuthLayout>} />
        <Route path="/warehouse/finished-goods" element={<AuthLayout><RequirePermission perm="ops-warehouse"><Warehouse /></RequirePermission></AuthLayout>} />
        <Route path="/carton-labels" element={<AuthLayout><RequirePermission perm="ops-carton-labels"><CartonLabels /></RequirePermission></AuthLayout>} />
        <Route path="/gate-pass" element={<AuthLayout><RequirePermission perm="ops-gate-pass"><GatePass /></RequirePermission></AuthLayout>} />
        <Route path="/quality" element={<AuthLayout><RequirePermission perm="ops-qc"><QualityCompliance /></RequirePermission></AuthLayout>} />
        <Route path="/guidelines" element={<AuthLayout><RequirePermission perm="ops-qc"><Navigate to="/quality?tab=compliance" replace /></RequirePermission></AuthLayout>} />
        <Route path="/water-quality" element={<AuthLayout><RequirePermission perm="ops-qc"><Navigate to="/quality?tab=water" replace /></RequirePermission></AuthLayout>} />
        <Route path="/qc" element={<AuthLayout><RequirePermission perm="ops-qc"><Navigate to="/quality?tab=qc" replace /></RequirePermission></AuthLayout>} />
        <Route path="/flowmap" element={<AuthLayout><RequirePermission perm="ops-dss"><Navigate to="/dss" replace /></RequirePermission></AuthLayout>} />
        <Route path="/twin" element={<AuthLayout><RequirePermission perm="ops-twin"><DigitalTwin /></RequirePermission></AuthLayout>} />
        <Route path="/maint-schedule" element={<AuthLayout><RequirePermission perm="ops-maint-schedule"><MaintenanceSchedule /></RequirePermission></AuthLayout>} />
        <Route path="/maintenance/spares" element={<AuthLayout><RequirePermission perm="ops-maint-schedule"><SpareParts /></RequirePermission></AuthLayout>} />
        <Route path="/line-zones" element={<AuthLayout><RequirePermission perm="ops-twin"><LineZones /></RequirePermission></AuthLayout>} />
        <Route path="/stock" element={<AuthLayout><RequirePermission perm="ops-warehouse"><ERPStock /></RequirePermission></AuthLayout>} />
        <Route path="/requisitions" element={<AuthLayout><RequirePermission perm="ops-mixer"><BOMRequisitions /></RequirePermission></AuthLayout>} />
        <Route path="/purchase-orders" element={<AuthLayout><RequirePermission perm="ops-po"><PurchaseOrders /></RequirePermission></AuthLayout>} />
        <Route path="/admin" element={<AuthLayout><RequirePermission perm="admin-dashboard"><Admin /></RequirePermission></AuthLayout>} />
        <Route path="/admin/lines" element={<AuthLayout><RequirePermission perm="admin-lines"><AdminLines /></RequirePermission></AuthLayout>} />
        <Route path="/admin/products" element={<AuthLayout><RequirePermission perm="admin-products"><AdminProductMaster /></RequirePermission></AuthLayout>} />
        <Route path="/admin/users" element={<AuthLayout><RequirePermission perm="admin-users"><AdminUsers /></RequirePermission></AuthLayout>} />
        <Route path="/admin/reports" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/settings" element={<AuthLayout><RequirePermission perm="admin-settings"><AdminSettings /></RequirePermission></AuthLayout>} />
        <Route path="/admin/boms" element={<AuthLayout><RequirePermission perm="admin-boms"><Navigate to="/admin/products" replace /></RequirePermission></AuthLayout>} />
        <Route path="/admin/forms" element={<AuthLayout><RequirePermission perm="admin-forms"><AdminForms /></RequirePermission></AuthLayout>} />
        <Route path="/admin/workflow" element={<AuthLayout><RequirePermission perm="admin-workflow"><AdminWorkflow /></RequirePermission></AuthLayout>} />
        <Route path="/dss" element={<AuthLayout><RequirePermission perm="ops-dss"><DSSBoard /></RequirePermission></AuthLayout>} />
        <Route path="/agent" element={<AuthLayout><AIAgentPage /></AuthLayout>} />
        <Route path="/profile" element={<AuthLayout><UserProfile /></AuthLayout>} />
        <Route path="/shifts" element={<AuthLayout><ShiftManagement /></AuthLayout>} />
        <Route path="/attendance" element={<AuthLayout><FacialAttendance /></AuthLayout>} />
        <Route path="/notifications" element={<AuthLayout><MailNotifications /></AuthLayout>} />
        <Route path="/kaizen" element={<AuthLayout><RequirePermission perm="ops-kaizen"><KaizenBoard /></RequirePermission></AuthLayout>} />
        <Route path="/vision" element={<AuthLayout><VisionAnalytics /></AuthLayout>} />
      </Routes>
      </AppErrorBoundary>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
