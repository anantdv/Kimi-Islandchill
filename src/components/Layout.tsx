import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  AlertTriangle,
  Warehouse,
  Wrench,
  Cpu,
  Settings,
  Users,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Bell,
  Shield,
  Factory,
  Workflow,
  ListChecks,
  Sun,
  Moon,
  Lock,
  Unlock,
  GripVertical,
  Pencil,
  Check,
  Sparkles,
  ClipboardList,
  Eye,
  ShieldCheck,
  Droplets,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AIAgentChat from "@/components/AIAgentChat";

interface NavChild {
  label: string;
  path: string;
  perm: string;
}

interface NavItemDef {
  icon: React.ElementType;
  label: string;
  path: string;
  perm: string;
  children?: NavChild[];
}

const allNavItems: NavItemDef[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", perm: "ops-dashboard" },
  {
    icon: ClipboardList, label: "Work Orders", path: "/workorders", perm: "ops-wo",
    children: [
      { label: "All Work Orders", path: "/workorders", perm: "ops-wo" },
      { label: "Direct Work Order", path: "/workorders/new", perm: "ops-wo-create" },
      { label: "P.O to Work Order", path: "/purchase-orders", perm: "ops-po" },
      { label: "DSS Board", path: "/dss", perm: "ops-dss" },
    ],
  },
  { icon: Cpu, label: "Digital Twin", path: "/twin", perm: "ops-twin" },
  { icon: Eye, label: "Vision Analytics", path: "/vision", perm: "ops-dashboard" },
  { icon: AlertTriangle, label: "Incidents", path: "/incidents", perm: "ops-incidents" },
  {
    icon: Warehouse, label: "Warehouse", path: "/warehouse", perm: "ops-warehouse",
    children: [
      { label: "Raw Materials", path: "/warehouse/raw-materials", perm: "ops-warehouse" },
      { label: "Finished Goods", path: "/warehouse/finished-goods", perm: "ops-warehouse" },
      { label: "Carton Labels", path: "/carton-labels", perm: "ops-carton-labels" },
      { label: "Gate Pass", path: "/gate-pass", perm: "ops-gate-pass" },
      { label: "Stock On Hand", path: "/stock", perm: "ops-warehouse" },
    ],
  },
  {
    icon: ShieldCheck, label: "Quality & Compliance", path: "/quality", perm: "ops-qc",
    children: [
      { label: "QC Checks", path: "/quality?tab=qc", perm: "ops-qc" },
      { label: "Water Quality", path: "/quality?tab=water", perm: "ops-qc" },
      { label: "Compliance", path: "/quality?tab=compliance", perm: "ops-qc" },
    ],
  },
  {
    icon: Wrench, label: "Engineering & Planning", path: "/maint-schedule", perm: "ops-maint-schedule",
    children: [
      { label: "Maint. Schedule", path: "/maint-schedule", perm: "ops-maint-schedule" },
      { label: "Spare Parts & Inventory", path: "/maintenance/spares", perm: "ops-maint-schedule" },
      { label: "Line Zones & Parts", path: "/line-zones", perm: "ops-twin" },
      { label: "BOM Requisitions", path: "/requisitions", perm: "ops-mixer" },
    ],
  },
  {
    icon: Users, label: "People & Operations", path: "/shifts", perm: "ops-dashboard",
    children: [
      { label: "Shift Management", path: "/shifts", perm: "ops-dashboard" },
      { label: "Attendance", path: "/attendance", perm: "ops-dashboard" },
      { label: "Kaizen Board", path: "/kaizen", perm: "ops-kaizen" },
      { label: "Mail & Alerts", path: "/notifications", perm: "ops-dashboard" },
    ],
  },
  { icon: Sparkles, label: "Tinni", path: "/agent", perm: "ops-dashboard" },
];

const allAdminItems: NavItemDef[] = [
  { icon: Shield, label: "Admin", path: "/admin", perm: "admin-dashboard" },
  { icon: Factory, label: "Lines & Equipment", path: "/admin/lines", perm: "admin-lines" },
  { icon: Droplets, label: "Products & BOMs", path: "/admin/products", perm: "admin-products" },
  { icon: ListChecks, label: "Forms", path: "/admin/forms", perm: "admin-forms" },
  { icon: Workflow, label: "Workflow", path: "/admin/workflow", perm: "admin-workflow" },
  { icon: Users, label: "Users", path: "/admin/users", perm: "admin-users" },
  { icon: Settings, label: "Settings", path: "/admin/settings", perm: "admin-settings" },
];

const DEFAULT_EXPANDED_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 420;
const COLLAPSED_WIDTH = 72;
const STORAGE_KEY_WIDTH = "island-mes-sidebar-width";
const STORAGE_KEY_LOCKED = "island-mes-sidebar-locked";
const STORAGE_KEY_NAV_ORDER = "island-mes-nav-order";
const STORAGE_KEY_ADMIN_ORDER = "island-mes-admin-order";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, incidents, theme, toggleTheme, hasPermission, canAccessAdmin } = useAppStore();
  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;

  // ── RESIZABLE SIDEBAR STATE ──
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = Number(localStorage.getItem(STORAGE_KEY_WIDTH));
      return saved >= MIN_WIDTH && saved <= MAX_WIDTH ? saved : DEFAULT_EXPANDED_WIDTH;
    }
    return DEFAULT_EXPANDED_WIDTH;
  });
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_LOCKED);
      return saved === null ? true : saved === "true";
    }
    return true;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [showResizeHint, setShowResizeHint] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(sidebarWidth);

  // Persist width & lock
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_WIDTH, String(sidebarWidth));
    }
  }, [sidebarWidth]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_LOCKED, String(isLocked));
    }
  }, [isLocked]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (isLocked || collapsed) return;
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
  }, [isLocked, collapsed, sidebarWidth]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const delta = e.clientX - startXRef.current;
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + delta));
    setSidebarWidth(newWidth);
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  // ── SCROLL MAIN CONTENT TO TOP ON NAVIGATION ──
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // ── NAV REORDER STATE ──
  const [reorderMode, setReorderMode] = useState(false);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["/workorders", "/quality"]));
  const [draggingPath, setDraggingPath] = useState<string | null>(null);

  // Load custom order from localStorage and apply to source arrays
  const getOrdered = (defaults: NavItemDef[], storageKey: string): NavItemDef[] => {
    if (typeof window === "undefined") return defaults;
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaults;
    try {
      const paths: string[] = JSON.parse(saved);
      const map = new Map(defaults.map((d) => [d.path, d]));
      const ordered = paths.map((p) => map.get(p)).filter(Boolean) as NavItemDef[];
      // Append any new items not in saved order
      const seen = new Set(paths);
      defaults.forEach((d) => { if (!seen.has(d.path)) ordered.push(d); });
      return ordered;
    } catch {
      return defaults;
    }
  };

  const [orderedNavItems, setOrderedNavItems] = useState<NavItemDef[]>(() =>
    getOrdered(allNavItems, STORAGE_KEY_NAV_ORDER)
  );
  const [orderedAdminItems, setOrderedAdminItems] = useState<NavItemDef[]>(() =>
    getOrdered(allAdminItems, STORAGE_KEY_ADMIN_ORDER)
  );

  // Re-sync if source arrays change (e.g. new items added)
  useEffect(() => {
    setOrderedNavItems(getOrdered(allNavItems, STORAGE_KEY_NAV_ORDER));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNavItems.length]);
  useEffect(() => {
    setOrderedAdminItems(getOrdered(allAdminItems, STORAGE_KEY_ADMIN_ORDER));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAdminItems.length]);

  const persistNavOrder = (items: NavItemDef[], key: string) => {
    localStorage.setItem(key, JSON.stringify(items.map((i) => i.path)));
  };

  const navItems = orderedNavItems.filter((item) => hasPermission(item.perm));
  const adminItems = orderedAdminItems.filter((item) => hasPermission(item.perm));
  const showAdmin = canAccessAdmin();

  const handleDragStart = (e: React.DragEvent, path: string) => {
    setDraggingPath(path);
    e.dataTransfer.effectAllowed = "move";
    // Set a transparent drag image or small ghost
    const el = e.currentTarget as HTMLElement;
    if (el) {
      e.dataTransfer.setDragImage(el, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent, section: string, index: number) => {
    e.preventDefault();
    if (dragOverSection !== section || dragOverIndex !== index) {
      setDragOverSection(section);
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, section: string, dropIndex: number) => {
    e.preventDefault();
    if (!draggingPath) return;

    const isNav = section === "ops";
    const list = isNav ? [...navItems] : [...adminItems];
    const setList = isNav ? setOrderedNavItems : setOrderedAdminItems;
    const storageKey = isNav ? STORAGE_KEY_NAV_ORDER : STORAGE_KEY_ADMIN_ORDER;
    const fullSource = isNav ? orderedNavItems : orderedAdminItems;

    const fromIndex = list.findIndex((i) => i.path === draggingPath);
    if (fromIndex === -1) return;

    // Remove from current position and insert at dropIndex
    const [moved] = list.splice(fromIndex, 1);
    // Adjust drop index if removing before insertion point
    const adjustedDrop = dropIndex > fromIndex ? dropIndex - 1 : dropIndex;
    list.splice(adjustedDrop, 0, moved);

    // Build new full ordered list (including hidden permission items)
    const reorderedPaths = list.map((i) => i.path);
    const fullMap = new Map(fullSource.map((i) => [i.path, i]));
    const newFullOrder = reorderedPaths.map((p) => fullMap.get(p)).filter(Boolean) as NavItemDef[];
    const seen = new Set(reorderedPaths);
    fullSource.forEach((i) => { if (!seen.has(i.path)) newFullOrder.push(i); });

    setList(newFullOrder);
    persistNavOrder(newFullOrder, storageKey);
    setDraggingPath(null);
    setDragOverSection(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingPath(null);
    setDragOverSection(null);
    setDragOverIndex(null);
  };

  const stripQuery = (p: string) => p.split("?")[0];
  const isActive = (path: string) => {
    const cleanPath = stripQuery(path);
    return location.pathname === cleanPath || (cleanPath !== "/" && location.pathname.startsWith(cleanPath + "/"));
  };
  const isAdminPage = location.pathname.startsWith("/admin");

  const currentWidth = collapsed ? COLLAPSED_WIDTH : sidebarWidth;

  // Update CSS custom property for sidebar width (SSR-safe)
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", `${currentWidth}px`);
  }, [currentWidth]);

  const toggleGroup = (path: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  const isGroupActive = (item: NavItemDef) => {
    if (isActive(item.path)) return true;
    return item.children?.some((c) => isActive(c.path)) ?? false;
  };

  const NavItem = ({
    item,
    section,
    index,
  }: {
    item: NavItemDef;
    section: string;
    index: number;
  }) => {
    const isDragging = draggingPath === item.path;
    const hasChildren = (item.children?.length ?? 0) > 0;
    const expanded = expandedGroups.has(item.path);
    const groupActive = isGroupActive(item);
    const visibleChildren = item.children?.filter((c) => hasPermission(c.perm)) ?? [];

    return (
      <div className="relative">
        {/* Drop indicator above this item */}
        {reorderMode && dragOverSection === section && dragOverIndex === index && draggingPath !== item.path && (
          <div className="absolute -top-[3px] left-0 right-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="h-[2px] w-full bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            <div className="absolute w-2 h-2 rounded-full bg-cyan-400" />
          </div>
        )}
        {/* Parent button */}
        <div
          draggable={reorderMode}
          onDragStart={(e) => handleDragStart(e, item.path)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, section, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, section, index)}
          className={`flex items-center gap-1 rounded-lg text-sm transition-all select-none ${
            groupActive
              ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-medium"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50"
          } ${isDragging ? "opacity-40" : ""} ${reorderMode ? "cursor-grab active:cursor-grabbing" : ""}`}
        >
          <button
            onClick={() => {
              if (reorderMode) return;
              navigate(item.path);
              setMobileOpen(false);
            }}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 text-left"
          >
            {reorderMode && !collapsed && (
              <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            )}
            <item.icon className={`w-5 h-5 shrink-0 ${groupActive ? "text-cyan-600 dark:text-cyan-400" : ""}`} />
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
            {!collapsed && item.label === "Incidents" && openIncidents > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {openIncidents}
              </span>
            )}
          </button>
          {!collapsed && hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (reorderMode) return;
                toggleGroup(item.path);
              }}
              className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </button>
          )}
        </div>

        {/* Child items */}
        {!collapsed && hasChildren && expanded && visibleChildren.length > 0 && (
          <div className="ml-5 pl-3 border-l border-gray-200 dark:border-slate-800 space-y-0.5 mt-0.5">
            {visibleChildren.map((child) => (
              <button
                key={child.path}
                onClick={() => { navigate(child.path); setMobileOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                  isActive(child.path)
                    ? "bg-cyan-50/50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <span className="truncate">{child.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const DropZoneEnd = ({ section, index }: { section: string; index: number }) => (
    <div
      className="relative h-1"
      onDragOver={(e) => handleDragOver(e, section, index)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, section, index)}
    >
      {reorderMode && dragOverSection === section && dragOverIndex === index && (
        <div className="absolute -top-[3px] left-0 right-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="h-[2px] w-full bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
          <div className="absolute w-2 h-2 rounded-full bg-cyan-400" />
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[100dvh] overflow-hidden bg-sky-50 dark:bg-slate-950 flex">
      {/* Desktop Sidebar — plain aside to avoid Framer Motion scroll resets on re-render */}
      <aside
        ref={sidebarRef}
        className="hidden lg:flex flex-col bg-white dark:bg-slate-900/50 border-r border-gray-200 dark:border-slate-800 fixed h-full z-30 group/sidebar"
        style={{
          width: currentWidth,
          transition: isResizing ? undefined : "width 0.2s ease",
        }}
        onMouseEnter={() => !isLocked && setShowResizeHint(true)}
        onMouseLeave={() => setShowResizeHint(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <Factory className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight whitespace-nowrap">Island Chill</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap">MES v1.0</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 ${reorderMode ? "space-y-0.5" : "space-y-1"}`}>
          {navItems.length > 0 && (
            <>
              {!collapsed && (
                <div className="flex items-center justify-between px-3 mb-2">
                  <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">Operations</p>
                  {reorderMode && <GripVertical className="w-3 h-3 text-slate-300" />}
                </div>
              )}
              {collapsed && <div className="h-4" />}
              {navItems.map((item, i) => (
                <NavItem key={item.path} item={item} section="ops" index={i} />
              ))}
              <DropZoneEnd section="ops" index={navItems.length} />
            </>
          )}

          {showAdmin && adminItems.length > 0 && (
            <>
              {!collapsed && (
                <div className="flex items-center justify-between px-3 mt-4 mb-2">
                  <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">Administration</p>
                  {reorderMode && <GripVertical className="w-3 h-3 text-slate-300" />}
                </div>
              )}
              {collapsed && <div className="h-4" />}
              {adminItems.map((item, i) => (
                <NavItem key={item.path} item={item} section="admin" index={i} />
              ))}
              <DropZoneEnd section="admin" index={adminItems.length} />
            </>
          )}
        </div>

        {/* Bottom controls: Collapse + Lock + Reorder */}
        <div className="p-2 border-t border-gray-200 dark:border-slate-800">
          <div className={`flex items-center gap-1 ${collapsed ? "flex-col" : "flex-row"}`}>
            <button
              onClick={toggleCollapse}
              className="flex-1 flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronRight className={`w-5 h-5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            </button>
            {!collapsed && (
              <>
                <button
                  onClick={() => setIsLocked((prev) => !prev)}
                  className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                    isLocked
                      ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10"
                      : "text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                  }`}
                  title={isLocked ? "Unlock sidebar width" : "Lock sidebar width"}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setReorderMode((prev) => !prev);
                    setDragOverSection(null);
                    setDragOverIndex(null);
                    setDraggingPath(null);
                  }}
                  className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                    reorderMode
                      ? "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10"
                      : "text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-500/10"
                  }`}
                  title={reorderMode ? "Done reordering" : "Reorder nav items"}
                >
                  {reorderMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
          {!collapsed && reorderMode && (
            <p className="text-center text-[9px] text-pink-600 dark:text-pink-400 mt-1 animate-pulse">
              Drag items to reorder
            </p>
          )}
          {!collapsed && !isLocked && !reorderMode && (
            <p className="text-center text-[9px] text-amber-600 dark:text-amber-400 mt-1 animate-pulse">
              Drag edge to resize
            </p>
          )}
        </div>

        {/* Resize Handle */}
        {!collapsed && (
          <div
            className={`absolute top-0 right-0 h-full w-3 cursor-col-resize z-50 flex items-center justify-center ${
              isResizing ? "cursor-col-resize" : isLocked ? "cursor-default" : "cursor-col-resize"
            }`}
            onMouseDown={handleResizeStart}
          >
            {/* Visual indicator line */}
            <div
              className={`h-16 w-0.5 rounded-full transition-all ${
                isResizing
                  ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                  : !isLocked && showResizeHint
                  ? "bg-slate-300 dark:bg-slate-600 group-hover/sidebar:bg-cyan-400"
                  : "bg-transparent group-hover/sidebar:bg-slate-200 dark:group-hover/sidebar:bg-slate-700"
              }`}
            />
            {/* Grip dots when hovering unlocked */}
            {!isLocked && (showResizeHint || isResizing) && (
              <div className="absolute flex flex-col gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`w-1 h-1 rounded-full transition-all ${isResizing ? "bg-cyan-400" : "bg-slate-400 dark:bg-slate-500"}`} />
                ))}
              </div>
            )}
          </div>
        )}
      </aside>

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
                    {navItems.map((item, i) => (
                      <NavItem key={item.path} item={item} section="ops" index={i} />
                    ))}
                  </>
                )}
                {showAdmin && adminItems.length > 0 && (
                  <>
                    <p className="px-3 text-[10px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-4 mb-2">Administration</p>
                    {adminItems.map((item, i) => (
                      <NavItem key={item.path} item={item} section="admin" index={i} />
                    ))}
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content — dynamic margin based on sidebar width */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden lg:ml-[var(--sidebar-width)] transition-all duration-200">
        {/* Top Bar */}
        <header className="h-16 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 z-20 flex items-center justify-between px-4 lg:px-6">
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
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.avatar || user?.name?.charAt(0) || "U"
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-slate-800 dark:text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.role}</p>
              </div>
            </button>
            <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content — independently scrollable so sidebar stays locked */}
        <main ref={mainRef} className="flex-1 overflow-y-auto bg-sky-50 dark:bg-slate-950">
          {children}
        </main>
      </div>

      {/* AI Agent Floating Chat */}
      <AIAgentChat />
    </div>
  );
}
