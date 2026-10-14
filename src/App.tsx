import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import WOWizard from "@/pages/WOWizard";
import WOExecution from "@/pages/WOExecution";
import Incidents from "@/pages/Incidents";
import Warehouse from "@/pages/Warehouse";
import FlowMap from "@/pages/FlowMap";
import DigitalTwin from "@/pages/DigitalTwin";
import QC from "@/pages/QC";
import Admin from "@/pages/Admin";
import AdminLines from "@/pages/AdminLines";
import AdminProducts from "@/pages/AdminProducts";
import AdminUsers from "@/pages/AdminUsers";
import AdminReports from "@/pages/AdminReports";
import AdminSettings from "@/pages/AdminSettings";
import AdminBOM from "@/pages/AdminBOM";
import AdminForms from "@/pages/AdminForms";
import AdminWorkflow from "@/pages/AdminWorkflow";
import MaintenanceSchedule from "@/pages/MaintenanceSchedule";
import BOMRequisitions from "@/pages/BOMRequisitions";
import Guide from "@/pages/Guide";
import Mobile from "@/pages/Mobile";
import { defaultRouteByRole } from "@/data/mockData";

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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AuthLayout><Dashboard /></AuthLayout>} />
        <Route path="/workorders/new" element={<AuthLayout><RequirePermission perm="ops-wo-create"><WOWizard /></RequirePermission></AuthLayout>} />
        <Route path="/workorders/:woId" element={<AuthLayout><WOExecution /></AuthLayout>} />
        <Route path="/incidents" element={<AuthLayout><RequirePermission perm="ops-incidents"><Incidents /></RequirePermission></AuthLayout>} />
        <Route path="/warehouse" element={<AuthLayout><RequirePermission perm="ops-warehouse"><Warehouse /></RequirePermission></AuthLayout>} />
        <Route path="/qc" element={<AuthLayout><RequirePermission perm="ops-qc"><QC /></RequirePermission></AuthLayout>} />
        <Route path="/flowmap" element={<AuthLayout><RequirePermission perm="ops-flowmap"><FlowMap /></RequirePermission></AuthLayout>} />
        <Route path="/twin" element={<AuthLayout><RequirePermission perm="ops-twin"><DigitalTwin /></RequirePermission></AuthLayout>} />
        <Route path="/maint-schedule" element={<AuthLayout><RequirePermission perm="ops-maint-schedule"><MaintenanceSchedule /></RequirePermission></AuthLayout>} />
        <Route path="/requisitions" element={<AuthLayout><RequirePermission perm="ops-mixer"><BOMRequisitions /></RequirePermission></AuthLayout>} />
        <Route path="/guide" element={<AuthLayout><Guide /></AuthLayout>} />
        <Route path="/mobile" element={<AuthLayout><RequirePermission perm="ops-mobile"><Mobile /></RequirePermission></AuthLayout>} />
        <Route path="/admin" element={<AuthLayout><RequirePermission perm="admin-dashboard"><Admin /></RequirePermission></AuthLayout>} />
        <Route path="/admin/lines" element={<AuthLayout><RequirePermission perm="admin-lines"><AdminLines /></RequirePermission></AuthLayout>} />
        <Route path="/admin/products" element={<AuthLayout><RequirePermission perm="admin-products"><AdminProducts /></RequirePermission></AuthLayout>} />
        <Route path="/admin/users" element={<AuthLayout><RequirePermission perm="admin-users"><AdminUsers /></RequirePermission></AuthLayout>} />
        <Route path="/admin/reports" element={<AuthLayout><RequirePermission perm="admin-reports"><AdminReports /></RequirePermission></AuthLayout>} />
        <Route path="/admin/settings" element={<AuthLayout><RequirePermission perm="admin-settings"><AdminSettings /></RequirePermission></AuthLayout>} />
        <Route path="/admin/boms" element={<AuthLayout><RequirePermission perm="admin-boms"><AdminBOM /></RequirePermission></AuthLayout>} />
        <Route path="/admin/forms" element={<AuthLayout><RequirePermission perm="admin-forms"><AdminForms /></RequirePermission></AuthLayout>} />
        <Route path="/admin/workflow" element={<AuthLayout><RequirePermission perm="admin-workflow"><AdminWorkflow /></RequirePermission></AuthLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
