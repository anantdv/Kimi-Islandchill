import { create } from "zustand";
import type {
  WorkOrder,
  Incident,
  WarehouseZone,
  AppUser,
  RoleDefinition,
  IncidentInvestigation,
  MaintenanceCheck,
  BOMRequisition,
} from "@/data/mockData";
import {
  workOrders as initialWOs,
  incidents as initialIncidents,
  warehouseZones as initialZones,
  appUsers as initialUsers,
  builtInRoles as initialRoles,
  incidentInvestigations as initialInvestigations,
  maintenanceChecks as initialMaintenanceChecks,
  bomRequisitions as initialRequisitions,
  getRolePermissions,
} from "@/data/mockData";
import type { ErpnextConnection } from "@/services/erpnext";
import { getConnection as getErpConnection, setConnection as setErpConnection } from "@/services/erpnext";

interface LoggedInUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  permissions: string[];
}

interface AppState {
  user: LoggedInUser | null;
  isAuthenticated: boolean;
  workOrders: WorkOrder[];
  incidents: Incident[];
  warehouseZones: WarehouseZone[];
  appUsers: AppUser[];
  roles: RoleDefinition[];
  investigations: IncidentInvestigation[];
  maintenanceChecks: MaintenanceCheck[];
  requisitions: BOMRequisition[];
  activeTab: string;
  theme: "light" | "dark";
  erpConnection: ErpnextConnection;

  // Auth
  login: (userId: string) => void;
  logout: () => void;

  // ERPNext connection
  setErpConnection: (conn: ErpnextConnection) => void;
  clearErpConnection: () => void;

  // Permissions
  hasPermission: (submoduleId: string) => boolean;
  canAccessAdmin: () => boolean;

  // User management (admin only)
  updateUserPermissions: (userId: string, permissions: string[]) => void;
  toggleUserActive: (userId: string) => void;

  // Role management (admin only)
  addRole: (role: RoleDefinition) => void;
  updateRole: (roleId: string, updates: Partial<RoleDefinition>) => void;
  deleteRole: (roleId: string) => void;

  // Data
  addWorkOrder: (wo: WorkOrder) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  addIncident: (inc: Incident) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  addInvestigation: (inv: IncidentInvestigation) => void;
  updateInvestigation: (id: string, updates: Partial<IncidentInvestigation>) => void;
  updateMaintenanceCheck: (id: string, updates: Partial<MaintenanceCheck>) => void;
  addRequisition: (req: BOMRequisition) => void;
  updateRequisition: (id: string, updates: Partial<BOMRequisition>) => void;
  setActiveTab: (tab: string) => void;

  // Theme
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("island-mes-theme") as "light" | "dark" | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  workOrders: initialWOs,
  incidents: initialIncidents,
  warehouseZones: initialZones,
  appUsers: initialUsers,
  roles: initialRoles,
  investigations: initialInvestigations,
  maintenanceChecks: initialMaintenanceChecks,
  requisitions: initialRequisitions,
  activeTab: "overview",
  theme: getInitialTheme(),
  erpConnection: getErpConnection(),

  login: (userId: string) => {
    const target = get().appUsers.find((u) => u.id === userId);
    if (!target) return;
    const loggedIn: LoggedInUser = {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      avatar: target.avatar,
      permissions: target.permissions.length > 0
        ? target.permissions
        : getRolePermissions(target.role),
    };
    set({ user: loggedIn, isAuthenticated: true });
  },

  logout: () => set({ user: null, isAuthenticated: false }),

  setErpConnection: (conn: ErpnextConnection) => {
    setErpConnection(conn);
    set({ erpConnection: conn });
  },

  clearErpConnection: () => set({ erpConnection: getErpConnection() }),

  hasPermission: (submoduleId: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === "Administrator") return true;
    return user.permissions.includes(submoduleId);
  },

  canAccessAdmin: () => {
    const { user } = get();
    if (!user) return false;
    if (user.role === "Administrator") return true;
    return user.permissions.some((p) => p.startsWith("admin-"));
  },

  updateUserPermissions: (userId: string, permissions: string[]) =>
    set((state: AppState) => ({
      appUsers: state.appUsers.map((u) =>
        u.id === userId ? { ...u, permissions } : u
      ),
    })),

  toggleUserActive: (userId: string) =>
    set((state: AppState) => ({
      appUsers: state.appUsers.map((u) =>
        u.id === userId ? { ...u, active: !u.active } : u
      ),
    })),

  addRole: (role: RoleDefinition) =>
    set((state: AppState) => ({ roles: [...state.roles, role] })),

  updateRole: (roleId: string, updates: Partial<RoleDefinition>) =>
    set((state: AppState) => ({
      roles: state.roles.map((r) =>
        r.id === roleId ? { ...r, ...updates } : r
      ),
    })),

  deleteRole: (roleId: string) =>
    set((state: AppState) => ({
      roles: state.roles.filter((r) => r.id !== roleId),
    })),

  addWorkOrder: (wo: WorkOrder) =>
    set((state: AppState) => ({ workOrders: [wo, ...state.workOrders] })),

  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) =>
    set((state: AppState) => ({
      workOrders: state.workOrders.map((wo: WorkOrder) =>
        wo.id === id ? { ...wo, ...updates } : wo
      ),
    })),

  addIncident: (inc: Incident) =>
    set((state: AppState) => ({ incidents: [inc, ...state.incidents] })),

  updateIncident: (id: string, updates: Partial<Incident>) =>
    set((state: AppState) => ({
      incidents: state.incidents.map((inc: Incident) =>
        inc.id === id ? { ...inc, ...updates } : inc
      ),
    })),

  addInvestigation: (inv: IncidentInvestigation) =>
    set((state: AppState) => ({ investigations: [inv, ...state.investigations] })),

  updateInvestigation: (id: string, updates: Partial<IncidentInvestigation>) =>
    set((state: AppState) => ({
      investigations: state.investigations.map((inv: IncidentInvestigation) =>
        inv.id === id ? { ...inv, ...updates } : inv
      ),
    })),

  updateMaintenanceCheck: (id: string, updates: Partial<MaintenanceCheck>) =>
    set((state: AppState) => ({
      maintenanceChecks: state.maintenanceChecks.map((mc: MaintenanceCheck) =>
        mc.id === id ? { ...mc, ...updates } : mc
      ),
    })),

  addRequisition: (req: BOMRequisition) =>
    set((state: AppState) => ({ requisitions: [req, ...state.requisitions] })),

  updateRequisition: (id: string, updates: Partial<BOMRequisition>) =>
    set((state: AppState) => ({
      requisitions: state.requisitions.map((req: BOMRequisition) =>
        req.id === id ? { ...req, ...updates } : req
      ),
    })),

  setActiveTab: (tab: string) => set({ activeTab: tab }),

  toggleTheme: () =>
    set((state: AppState) => {
      const next = state.theme === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem("island-mes-theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return { theme: next };
    }),

  setTheme: (theme: "light" | "dark") =>
    set(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem("island-mes-theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
      }
      return { theme };
    }),
}));
