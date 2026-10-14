import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  PlusCircle,
  AlertTriangle,
  Warehouse,
  ClipboardCheck,
  Route,
  Cpu,
  Settings,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Bell,
  Shield,
  Factory,
  Droplets,
  FileText,
  Workflow,
  ListChecks,
  Smartphone,
  Sun,
  Moon,
  CalendarDays,
  Beaker,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItemDef {
  icon: React.ElementType;
  label: string;
  path: string;
  perm: string;
}

const allNavItems: NavItemDef[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", perm: "ops-dashboard" },
  { icon: PlusCircle, label: "New Work Order", path: "/workorders/new", perm: "ops-wo-create" },
  { icon: AlertTriangle, label: "Incidents", path: "/incidents", perm: "ops-incidents" },
  { icon: Warehouse, label: "Warehouse", path: "/warehouse", perm: "ops-warehouse" },
  { icon: ClipboardCheck, label: "QC", path: "/qc", perm: "ops-qc" },
  { icon: Route, label: "Flow Map", path: "/flowmap", perm: "ops-flowmap" },
  { icon: Cpu, label: "Digital Twin", path: "/twin", perm: "ops-twin" },
  { icon: CalendarDays, label: "Maint. Schedule", path: "/maint-schedule", perm: "ops-maint-schedule" },
  { icon: Beaker, label: "BOM Requisitions", path: "/requisitions", perm: "ops-mixer" },
  { icon: Smartphone, label: "Mobile", path: "/mobile", perm: "ops-mobile" },
  { icon: BookOpen, label: "Guide", path: "/guide", perm: "ops-dashboard" },
];

const allAdminItems: NavItemDef[] = [
  { icon: Shield, label: "Admin", path: "/admin", perm: "admin-dashboard" },
  { icon: Factory, label: "Lines & Equipment", path: "/admin/lines", perm: "admin-lines" },
  { icon: Droplets, label: "Products", path: "/admin/products", perm: "admin-products" },
  { icon: FileText, label: "BOMs", path: "/admin/boms", perm: "admin-boms" },
  { icon: ListChecks, label: "Forms", path: "/admin/forms", perm: "admin-forms" },
  { icon: Workflow, label: "Workflow", path: "/admin/workflow", perm: "admin-workflow" },
  { icon: Users, label: "Users", path: "/admin/users", perm: "admin-users" },
  { icon: BarChart3, label: "Reports", path: "/admin/reports", perm: "admin-reports" },
  { icon: Settings, label: "Settings", path: "/admin/settings", perm: "admin-settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, incidents, theme, toggleTheme, hasPermission, canAccessAdmin } = useAppStore();
  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;

  const navItems = allNavItems.filter((item) => hasPermission(item.perm));
  const adminItems = allAdminItems.filter((item) => hasPermission(item.perm));
  const showAdmin = canAccessAdmin();

  const isActive = (path: string) => location.pathname === path;
  const isAdminPage = location.pathname.startsWith("/admin");

  const NavItem = ({ item }: { item: NavItemDef }) => (
    <button
      onClick={() => { navigate(item.path); setMobileOpen(false); }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
        isActive(item.path)
          ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-medium"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50"
      }`}
    >
      <item.icon className={`w-5 h-5 shrink-0 ${isActive(item.path) ? "text-cyan-600 dark:text-cyan-400" : ""}`} />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {!collapsed && item.label === "Incidents" && openIncidents > 0 && (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {openIncidents}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex flex-col bg-white dark:bg-slate-900/50 border-r border-gray-200 dark:border-slate-800 fixed h-full z-30"
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2 }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <Factory className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Island Chill</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">MES v1.0</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.length > 0 && (
            <>
              {!collapsed && <p className="px-3 text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Operations</p>}
              {collapsed && <div className="h-4" />}
              {navItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </>
          )}

          {showAdmin && adminItems.length > 0 && (
            <>
              {!collapsed && <p className="px-3 text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-4 mb-2">Administration</p>}
              {collapsed && <div className="h-4" />}
              {adminItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </>
          )}
        </div>

        {/* Bottom */}
        <div className="p-2 border-t border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 h-full w-[280px] bg-white dark:bg-slate-900/50 z-50 lg:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Factory className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Island Chill</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">MES v1.0</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-500 dark:text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                {navItems.length > 0 && (
                  <>
                    <p className="px-3 text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Operations</p>
                    {navItems.map((item) => (
                      <NavItem key={item.path} item={item} />
                    ))}
                  </>
                )}
                {showAdmin && adminItems.length > 0 && (
                  <>
                    <p className="px-3 text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-4 mb-2">Administration</p>
                    {adminItems.map((item) => (
                      <NavItem key={item.path} item={item} />
                    ))}
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all ${collapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"}`}>
        {/* Top Bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-500 dark:text-slate-400 p-1">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
              {isAdminPage ? "Administration" : "Production Floor"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="relative text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              onClick={toggleTheme}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button className="relative text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              {openIncidents > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {openIncidents}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.avatar || user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-slate-800 dark:text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.role}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-sky-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
