import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WorkOrder,
  Incident,
  WarehouseZone,
  AppUser,
  RoleDefinition,
  IncidentInvestigation,
  MaintenanceCheck,
  BOMRequisition,
  FillingLine,
  IoTSensor,
  IoTAlert,
  ProductionAnalytics,
  DSSFlowTemplate,
  DSSActiveRun,
  DSSNodeState,
  DSSFaultReport,
  Shift,
  Employee,
  ShiftAssignment,
  ClockRecord,
  FaceRegistration,
  SMTPConfig,
  NotificationTemplate,
  NotificationLog,
  CommsConfig,
  CommsMessage,
  BOMHeader,
  ProductFamily,
  MESForm,
  PurchaseOrder,
  KaizenSuggestion,
  CartonLabel,
  WarehouseRack,
  WarehouseBin,
  GatePass,
  ComplianceCheckpoint,
  ComplianceSettings,
  WaterQualityReading,
  FilterStatus,
  SparePart,
  LineZone,
  StockIssue,
  ERPStockItem,
} from "@/data/mockData";
import { generateId } from "@/lib/utils";
import {
  workOrders as initialWOs,
  incidents as initialIncidents,
  warehouseZones as initialZones,
  appUsers as initialUsers,
  builtInRoles as initialRoles,
  incidentInvestigations as initialInvestigations,
  maintenanceChecks as initialMaintenanceChecks,
  bomRequisitions as initialRequisitions,
  fillingLines as initialFillingLines,
  mesForms as initialMESForms,
  purchaseOrders as initialPurchaseOrders,
  iotSensors as initialSensors,
  iotAlerts as initialAlerts,
  productionAnalytics as initialAnalytics,
  dssFlowTemplates as initialTemplates,
  dssActiveRuns as initialRuns,
  spareParts as initialSpareParts,
  lineZones as initialLineZones,
  stockIssues as initialStockIssues,
  erpStockItems as initialERPStockItems,
  getRolePermissions,
  defaultShifts,
  defaultEmployees,
  defaultShiftAssignments,
  defaultClockRecords,
  defaultFaceRegistrations,
  defaultSMTPConfig,
  defaultNotificationTemplates,
  defaultNotificationLogs,
  defaultCommsConfigs,
  defaultCommsMessages,
  boms as initialBOMs,
  productFamilies as initialProductFamilies,
  defaultKaizenSuggestions,
  defaultCartonLabels,
  defaultWarehouseRacks,
  defaultWarehouseBins,
  defaultGatePasses,
  defaultComplianceCheckpoints,
  defaultComplianceSettings,
  defaultWaterQualityReadings,
  defaultFilterStatuses,
} from "@/data/mockData";

interface LoggedInUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  avatarUrl?: string;
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
  fillingLines: FillingLine[];
  mesForms: MESForm[];
  purchaseOrders: PurchaseOrder[];
  iotSensors: IoTSensor[];
  iotAlerts: IoTAlert[];
  productionAnalytics: ProductionAnalytics[];
  dssTemplates: DSSFlowTemplate[];
  dssActiveRuns: DSSActiveRun[];
  boms: BOMHeader[];
  productFamilies: ProductFamily[];

  // Spare Parts & Line Zones
  spareParts: SparePart[];
  lineZones: LineZone[];
  stockIssues: StockIssue[];
  addSparePart: (sp: SparePart) => void;
  updateSparePart: (id: string, updates: Partial<SparePart>) => void;
  deleteSparePart: (id: string) => void;
  issueStock: (sparePartId: string, qty: number, meta: { workOrderId?: string; lineId?: string; zoneId?: string; purpose: string }) => void;
  receiveStock: (sparePartId: string, qty: number) => void;
  updateLineZone: (id: string, updates: Partial<LineZone>) => void;

  // ERP Stock (real-time mirror)
  erpStockItems: ERPStockItem[];
  lastERPSyncAt: string;
  simulateERPSync: () => void;
  activeTab: string;
  theme: "light" | "dark";

  // Shift Management
  shifts: Shift[];
  employees: Employee[];
  shiftAssignments: ShiftAssignment[];
  clockRecords: ClockRecord[];
  faceRegistrations: FaceRegistration[];

  // Mail & Notifications
  smtpConfig: SMTPConfig;
  notificationTemplates: NotificationTemplate[];
  notificationLogs: NotificationLog[];

  // Communication Platforms
  commsConfigs: CommsConfig[];
  commsMessages: CommsMessage[];

  // Kaizen / Continuous Improvement
  kaizenSuggestions: KaizenSuggestion[];

  // Carton Labels
  cartonLabels: CartonLabel[];

  // Warehouse Racks / Bins
  warehouseRacks: WarehouseRack[];
  warehouseBins: WarehouseBin[];

  // Gate Pass
  gatePasses: GatePass[];

  // Compliance / Guidelines
  complianceCheckpoints: ComplianceCheckpoint[];
  complianceSettings: ComplianceSettings;
  updateComplianceCheckpoint: (id: string, updates: Partial<ComplianceCheckpoint>) => void;
  updateComplianceSettings: (settings: Partial<ComplianceSettings>) => void;

  // Water Filtration Quality
  waterQualityReadings: WaterQualityReading[];
  filterStatuses: FilterStatus[];
  addWaterQualityReading: (r: WaterQualityReading) => void;
  updateFilterStatus: (id: string, updates: Partial<FilterStatus>) => void;

  // Auth
  login: (userId: string) => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<LoggedInUser>) => void;

  // Permissions
  hasPermission: (submoduleId: string) => boolean;
  canAccessAdmin: () => boolean;

  // User management (admin only)
  updateUserPermissions: (userId: string, permissions: string[]) => void;
  toggleUserActive: (userId: string) => void;
  addUser: (user: AppUser) => void;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;

  // Line management (admin only)
  addLine: (line: FillingLine) => void;
  updateLine: (id: string, updates: Partial<FillingLine>) => void;
  deleteLine: (id: string) => void;

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
  addMESForm: (form: MESForm) => void;
  updateMESForm: (id: string, updates: Partial<MESForm>) => void;
  deleteMESForm: (id: string) => void;
  addPurchaseOrder: (po: PurchaseOrder) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  addRequisition: (req: BOMRequisition) => void;
  updateRequisition: (id: string, updates: Partial<BOMRequisition>) => void;
  setActiveTab: (tab: string) => void;

  // IoT
  updateSensor: (id: string, updates: Partial<IoTSensor>) => void;
  acknowledgeAlert: (id: string) => void;
  addAnalytics: (data: ProductionAnalytics) => void;

  // DSS
  addTemplate: (tpl: DSSFlowTemplate) => void;
  updateTemplate: (id: string, updates: Partial<DSSFlowTemplate>) => void;
  deleteTemplate: (id: string) => void;
  addRun: (run: DSSActiveRun) => void;
  updateRun: (id: string, updates: Partial<DSSActiveRun>) => void;
  updateNodeState: (runId: string, nodeId: string, state: Partial<DSSNodeState>) => void;
  submitNodeForm: (runId: string, nodeId: string, formData: Record<string, string | number | boolean>) => void;
  reportFault: (runId: string, fault: DSSFaultReport) => void;
  resolveFault: (runId: string, faultId: string, resolution: { repairedBy: string; repairNotes: string }) => void;

  // Theme
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;

  // BOM
  addBOM: (bom: BOMHeader) => void;
  updateBOM: (id: string, updates: Partial<BOMHeader>) => void;
  deleteBOM: (id: string) => void;

  // Product Families
  addProductFamily: (pf: ProductFamily) => void;
  updateProductFamily: (id: string, updates: Partial<ProductFamily>) => void;
  deleteProductFamily: (id: string) => void;

  // Shift Management
  addShift: (shift: Shift) => void;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  addEmployee: (emp: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  assignShift: (assignment: ShiftAssignment) => void;
  removeShiftAssignment: (id: string) => void;
  clockInOut: (record: ClockRecord) => void;
  registerFace: (reg: FaceRegistration) => void;

  // Mail & Notifications
  setSMTPConfig: (config: Partial<SMTPConfig>) => void;
  addNotificationTemplate: (tpl: NotificationTemplate) => void;
  updateNotificationTemplate: (id: string, updates: Partial<NotificationTemplate>) => void;
  deleteNotificationTemplate: (id: string) => void;
  addNotificationLog: (log: NotificationLog) => void;

  // Communication
  setCommsConfig: (channel: CommsConfig["channel"], config: Partial<CommsConfig>) => void;
  addCommsMessage: (msg: CommsMessage) => void;
  markCommsRead: (id: string) => void;

  // Kaizen
  addKaizen: (k: KaizenSuggestion) => void;
  updateKaizen: (id: string, updates: Partial<KaizenSuggestion>) => void;
  deleteKaizen: (id: string) => void;

  // Carton Labels
  addCartonLabel: (cl: CartonLabel) => void;
  updateCartonLabel: (id: string, updates: Partial<CartonLabel>) => void;
  deleteCartonLabel: (id: string) => void;

  // Warehouse Racks / Bins
  addWarehouseRack: (rack: WarehouseRack) => void;
  updateWarehouseRack: (id: string, updates: Partial<WarehouseRack>) => void;
  deleteWarehouseRack: (id: string) => void;
  addWarehouseBin: (bin: WarehouseBin) => void;
  updateWarehouseBin: (id: string, updates: Partial<WarehouseBin>) => void;
  deleteWarehouseBin: (id: string) => void;

  // Gate Pass
  addGatePass: (gp: GatePass) => void;
  updateGatePass: (id: string, updates: Partial<GatePass>) => void;
  deleteGatePass: (id: string) => void;
}

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("island-mes-theme") as "light" | "dark" | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
  fillingLines: initialFillingLines,
  mesForms: initialMESForms,
  purchaseOrders: initialPurchaseOrders,
  iotSensors: initialSensors,
  iotAlerts: initialAlerts,
  productionAnalytics: initialAnalytics,
  dssTemplates: initialTemplates,
  dssActiveRuns: initialRuns,
  boms: initialBOMs,
  productFamilies: initialProductFamilies,

  // Spare Parts & Line Zones
  spareParts: initialSpareParts,
  lineZones: initialLineZones,
  stockIssues: initialStockIssues,
  addSparePart: (sp: SparePart) =>
    set((state: AppState) => ({ spareParts: [sp, ...state.spareParts] })),
  updateSparePart: (id: string, updates: Partial<SparePart>) =>
    set((state: AppState) => ({
      spareParts: state.spareParts.map((sp: SparePart) =>
        sp.id === id ? { ...sp, ...updates } : sp
      ),
    })),
  deleteSparePart: (id: string) =>
    set((state: AppState) => ({
      spareParts: state.spareParts.filter((sp: SparePart) => sp.id !== id),
    })),
  issueStock: (sparePartId: string, qty: number, meta: { workOrderId?: string; lineId?: string; zoneId?: string; purpose: string }) => {
    const state = get();
    const sp = state.spareParts.find((p: SparePart) => p.id === sparePartId);
    if (!sp || qty <= 0 || sp.qtyOnHand < qty) return;
    const now = new Date().toISOString();
    const issue: StockIssue = {
      id: generateId("si"),
      sparePartId,
      qty,
      workOrderId: meta.workOrderId,
      lineId: meta.lineId,
      zoneId: meta.zoneId,
      issuedBy: state.user?.name ?? "Unknown",
      issuedAt: now,
      purpose: meta.purpose,
    };
    set((s: AppState) => ({
      spareParts: s.spareParts.map((p: SparePart) =>
        p.id === sparePartId
          ? { ...p, qtyOnHand: p.qtyOnHand - qty, lastIssuedAt: now, lastIssuedQty: qty }
          : p
      ),
      stockIssues: [issue, ...s.stockIssues],
    }));
  },
  receiveStock: (sparePartId: string, qty: number) =>
    set((state: AppState) => ({
      spareParts: state.spareParts.map((p: SparePart) =>
        p.id === sparePartId ? { ...p, qtyOnHand: p.qtyOnHand + qty } : p
      ),
    })),
  updateLineZone: (id: string, updates: Partial<LineZone>) =>
    set((state: AppState) => ({
      lineZones: state.lineZones.map((z: LineZone) =>
        z.id === id ? { ...z, ...updates } : z
      ),
    })),

  // ERP Stock (simulated real-time mirror — replace simulateERPSync with a real ERP feed)
  erpStockItems: initialERPStockItems,
  lastERPSyncAt: new Date().toISOString(),
  simulateERPSync: () =>
    set((state: AppState) => {
      // Random small movements on a few items to simulate live ERP postings
      const idxs = new Set<number>();
      while (idxs.size < Math.min(3, state.erpStockItems.length)) {
        idxs.add(Math.floor(Math.random() * state.erpStockItems.length));
      }
      const now = new Date().toISOString();
      return {
        lastERPSyncAt: now,
        erpStockItems: state.erpStockItems.map((it: ERPStockItem, i: number) => {
          if (!idxs.has(i)) return it;
          const delta = Math.random() < 0.55 ? -1 : 1;
          const qty = Math.max(0, it.qtyOnHand + delta * Math.max(1, Math.round(Math.random() * 5)));
          return {
            ...it,
            qtyOnHand: qty,
            lastMovementType: delta < 0 ? "issue" : "receipt",
            lastMovementAt: now,
          };
        }),
      };
    }),

  activeTab: "overview",
  theme: getInitialTheme(),

  // Shift Management
  shifts: defaultShifts,
  employees: defaultEmployees,
  shiftAssignments: defaultShiftAssignments,
  clockRecords: defaultClockRecords,
  faceRegistrations: defaultFaceRegistrations,

  // Mail & Notifications
  smtpConfig: defaultSMTPConfig,
  notificationTemplates: defaultNotificationTemplates,
  notificationLogs: defaultNotificationLogs,

  // Communication
  commsConfigs: defaultCommsConfigs,
  commsMessages: defaultCommsMessages,

  // Kaizen
  kaizenSuggestions: defaultKaizenSuggestions,

  // Carton Labels
  cartonLabels: defaultCartonLabels,

  // Warehouse Racks / Bins
  warehouseRacks: defaultWarehouseRacks,
  warehouseBins: defaultWarehouseBins,

  // Gate Pass
  gatePasses: defaultGatePasses,

  // Compliance
  complianceCheckpoints: defaultComplianceCheckpoints,
  complianceSettings: defaultComplianceSettings,

  // Water Filtration Quality
  waterQualityReadings: defaultWaterQualityReadings,
  filterStatuses: defaultFilterStatuses,

  login: (userId: string) => {
    const target = get().appUsers.find((u) => u.id === userId);
    if (!target) return;
    const loggedIn: LoggedInUser = {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      avatar: target.avatar,
      avatarUrl: target.avatarUrl,
      permissions: target.permissions.length > 0
        ? target.permissions
        : getRolePermissions(target.role),
    };
    set({ user: loggedIn, isAuthenticated: true });
  },

  logout: () => set({ user: null, isAuthenticated: false }),

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

  addUser: (user) =>
    set((state: AppState) => ({ appUsers: [...state.appUsers, user] })),

  updateUser: (id, updates) =>
    set((state: AppState) => ({
      appUsers: state.appUsers.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    })),

  deleteUser: (id) =>
    set((state: AppState) => ({
      appUsers: state.appUsers.filter((u) => u.id !== id),
    })),

  addLine: (line) =>
    set((state: AppState) => ({ fillingLines: [...state.fillingLines, line] })),

  updateLine: (id, updates) =>
    set((state: AppState) => ({
      fillingLines: state.fillingLines.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  deleteLine: (id) =>
    set((state: AppState) => ({
      fillingLines: state.fillingLines.filter((l) => l.id !== id),
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

  addMESForm: (form: MESForm) =>
    set((state: AppState) => ({ mesForms: [form, ...state.mesForms] })),

  updateMESForm: (id: string, updates: Partial<MESForm>) =>
    set((state: AppState) => ({
      mesForms: state.mesForms.map((f: MESForm) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  deleteMESForm: (id: string) =>
    set((state: AppState) => ({
      mesForms: state.mesForms.filter((f: MESForm) => f.id !== id),
    })),

  addPurchaseOrder: (po: PurchaseOrder) =>
    set((state: AppState) => ({ purchaseOrders: [po, ...state.purchaseOrders] })),

  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) =>
    set((state: AppState) => ({
      purchaseOrders: state.purchaseOrders.map((po: PurchaseOrder) =>
        po.id === id ? { ...po, ...updates } : po
      ),
    })),

  deletePurchaseOrder: (id: string) =>
    set((state: AppState) => ({
      purchaseOrders: state.purchaseOrders.filter((po: PurchaseOrder) => po.id !== id),
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

  updateSensor: (id: string, updates: Partial<IoTSensor>) =>
    set((state: AppState) => ({
      iotSensors: state.iotSensors.map((s: IoTSensor) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  acknowledgeAlert: (id: string) =>
    set((state: AppState) => ({
      iotAlerts: state.iotAlerts.map((a: IoTAlert) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    })),

  addAnalytics: (data: ProductionAnalytics) =>
    set((state: AppState) => ({
      productionAnalytics: [data, ...state.productionAnalytics].slice(0, 100),
    })),

  addTemplate: (tpl: DSSFlowTemplate) =>
    set((state: AppState) => ({ dssTemplates: [...state.dssTemplates, tpl] })),

  updateTemplate: (id: string, updates: Partial<DSSFlowTemplate>) =>
    set((state: AppState) => ({
      dssTemplates: state.dssTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTemplate: (id: string) =>
    set((state: AppState) => ({
      dssTemplates: state.dssTemplates.filter((t) => t.id !== id),
    })),

  addRun: (run: DSSActiveRun) =>
    set((state: AppState) => ({ dssActiveRuns: [run, ...state.dssActiveRuns] })),

  updateRun: (id: string, updates: Partial<DSSActiveRun>) =>
    set((state: AppState) => ({
      dssActiveRuns: state.dssActiveRuns.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  updateNodeState: (runId: string, nodeId: string, nodeState: Partial<DSSNodeState>) =>
    set((state: AppState) => ({
      dssActiveRuns: state.dssActiveRuns.map((r) => {
        if (r.id !== runId) return r;
        return {
          ...r,
          nodeStates: r.nodeStates.map((ns) => (ns.nodeId === nodeId ? { ...ns, ...nodeState } : ns)),
        };
      }),
    })),

  submitNodeForm: (runId: string, nodeId: string, formData: Record<string, string | number | boolean>) =>
    set((state: AppState) => ({
      dssActiveRuns: state.dssActiveRuns.map((r) => {
        if (r.id !== runId) return r;
        return {
          ...r,
          nodeStates: r.nodeStates.map((ns) =>
            ns.nodeId === nodeId ? { ...ns, formData, completedAt: new Date().toISOString(), status: "completed" as const } : ns
          ),
        };
      }),
    })),

  reportFault: (runId: string, fault: DSSFaultReport) =>
    set((state: AppState) => ({
      dssActiveRuns: state.dssActiveRuns.map((r) => {
        if (r.id !== runId) return r;
        return {
          ...r,
          faults: [...r.faults, fault],
          nodeStates: r.nodeStates.map((ns) =>
            ns.nodeId === fault.nodeId ? { ...ns, status: "on_hold" as const, faultId: fault.id } : ns
          ),
        };
      }),
    })),

  resolveFault: (runId: string, faultId: string, resolution: { repairedBy: string; repairNotes: string }) =>
    set((state: AppState) => ({
      dssActiveRuns: state.dssActiveRuns.map((r) => {
        if (r.id !== runId) return r;
        const updatedFaults = r.faults.map((f) =>
          f.id === faultId
            ? { ...f, status: "resolved" as const, repairedBy: resolution.repairedBy, repairedAt: new Date().toISOString(), repairNotes: resolution.repairNotes }
            : f
        );
        return {
          ...r,
          faults: updatedFaults,
          nodeStates: r.nodeStates.map((ns) =>
            ns.faultId === faultId ? { ...ns, status: "ready" as const, faultId: undefined } : ns
          ),
        };
      }),
    })),

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

  updateUserProfile: (updates) =>
    set((state: AppState) => {
      const nextUser = state.user ? { ...state.user, ...updates } : null;
      const nextUsers = state.appUsers.map((u) =>
        state.user && u.id === state.user.id ? { ...u, ...updates } : u
      );
      return { user: nextUser, appUsers: nextUsers };
    }),

  // ── Shift Management ───────────────────────────────────────────────────────
  addShift: (shift) =>
    set((state: AppState) => ({ shifts: [...state.shifts, shift] })),

  updateShift: (id, updates) =>
    set((state: AppState) => ({
      shifts: state.shifts.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  deleteShift: (id) =>
    set((state: AppState) => ({
      shifts: state.shifts.filter((s) => s.id !== id),
      shiftAssignments: state.shiftAssignments.filter((a) => a.shiftId !== id),
    })),

  addEmployee: (emp) =>
    set((state: AppState) => ({ employees: [...state.employees, emp] })),

  updateEmployee: (id, updates) =>
    set((state: AppState) => ({
      employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteEmployee: (id) =>
    set((state: AppState) => ({
      employees: state.employees.filter((e) => e.id !== id),
      shiftAssignments: state.shiftAssignments.filter((a) => a.employeeId !== id),
      faceRegistrations: state.faceRegistrations.filter((f) => f.employeeId !== id),
    })),

  assignShift: (assignment) =>
    set((state: AppState) => ({
      shiftAssignments: [...state.shiftAssignments, assignment],
    })),

  removeShiftAssignment: (id) =>
    set((state: AppState) => ({
      shiftAssignments: state.shiftAssignments.filter((a) => a.id !== id),
    })),

  clockInOut: (record) =>
    set((state: AppState) => ({
      clockRecords: [record, ...state.clockRecords],
    })),

  registerFace: (reg) =>
    set((state: AppState) => ({
      faceRegistrations: [
        ...state.faceRegistrations.filter((f) => f.employeeId !== reg.employeeId),
        reg,
      ],
    })),

  // ── Mail & Notifications ───────────────────────────────────────────────────
  setSMTPConfig: (config) =>
    set((state: AppState) => ({
      smtpConfig: { ...state.smtpConfig, ...config },
    })),

  addNotificationTemplate: (tpl) =>
    set((state: AppState) => ({
      notificationTemplates: [...state.notificationTemplates, tpl],
    })),

  updateNotificationTemplate: (id, updates) =>
    set((state: AppState) => ({
      notificationTemplates: state.notificationTemplates.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  deleteNotificationTemplate: (id) =>
    set((state: AppState) => ({
      notificationTemplates: state.notificationTemplates.filter((t) => t.id !== id),
    })),

  addNotificationLog: (log) =>
    set((state: AppState) => ({
      notificationLogs: [log, ...state.notificationLogs],
    })),

  // ── Communication ──────────────────────────────────────────────────────────
  setCommsConfig: (channel, config) =>
    set((state: AppState) => ({
      commsConfigs: state.commsConfigs.map((c) =>
        c.channel === channel ? { ...c, ...config } : c
      ),
    })),

  addCommsMessage: (msg) =>
    set((state: AppState) => ({
      commsMessages: [msg, ...state.commsMessages],
    })),

  markCommsRead: (id) =>
    set((state: AppState) => ({
      commsMessages: state.commsMessages.map((m) =>
        m.id === id ? { ...m, read: true } : m
      ),
    })),

  // ── BOM ────────────────────────────────────────────────────────────────────
  addBOM: (bom) =>
    set((state: AppState) => ({ boms: [bom, ...state.boms] })),

  updateBOM: (id, updates) =>
    set((state: AppState) => ({
      boms: state.boms.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  deleteBOM: (id) =>
    set((state: AppState) => ({
      boms: state.boms.filter((b) => b.id !== id),
    })),

  // ── Product Families ───────────────────────────────────────────────────────
  addProductFamily: (pf) =>
    set((state: AppState) => ({
      productFamilies: [pf, ...state.productFamilies],
    })),

  updateProductFamily: (id, updates) =>
    set((state: AppState) => ({
      productFamilies: state.productFamilies.map((pf) =>
        pf.id === id ? { ...pf, ...updates } : pf
      ),
    })),

  deleteProductFamily: (id) =>
    set((state: AppState) => ({
      productFamilies: state.productFamilies.filter((pf) => pf.id !== id),
    })),

  // ── Kaizen ─────────────────────────────────────────────────────────────────
  addKaizen: (k) =>
    set((state: AppState) => ({
      kaizenSuggestions: [k, ...state.kaizenSuggestions],
    })),

  updateKaizen: (id, updates) =>
    set((state: AppState) => ({
      kaizenSuggestions: state.kaizenSuggestions.map((k) =>
        k.id === id ? { ...k, ...updates } : k
      ),
    })),

  deleteKaizen: (id) =>
    set((state: AppState) => ({
      kaizenSuggestions: state.kaizenSuggestions.filter((k) => k.id !== id),
    })),

  // ── Carton Labels ──────────────────────────────────────────────────────────
  addCartonLabel: (cl) =>
    set((state: AppState) => ({
      cartonLabels: [cl, ...state.cartonLabels],
    })),

  updateCartonLabel: (id, updates) =>
    set((state: AppState) => ({
      cartonLabels: state.cartonLabels.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  deleteCartonLabel: (id) =>
    set((state: AppState) => ({
      cartonLabels: state.cartonLabels.filter((c) => c.id !== id),
    })),

  // ── Warehouse Racks / Bins ─────────────────────────────────────────────────
  addWarehouseRack: (rack) =>
    set((state: AppState) => ({
      warehouseRacks: [...state.warehouseRacks, rack],
    })),

  updateWarehouseRack: (id, updates) =>
    set((state: AppState) => ({
      warehouseRacks: state.warehouseRacks.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  deleteWarehouseRack: (id) =>
    set((state: AppState) => ({
      warehouseRacks: state.warehouseRacks.filter((r) => r.id !== id),
      warehouseBins: state.warehouseBins.filter((b) => b.rackId !== id),
    })),

  addWarehouseBin: (bin) =>
    set((state: AppState) => ({
      warehouseBins: [...state.warehouseBins, bin],
    })),

  updateWarehouseBin: (id, updates) =>
    set((state: AppState) => ({
      warehouseBins: state.warehouseBins.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  deleteWarehouseBin: (id) =>
    set((state: AppState) => ({
      warehouseBins: state.warehouseBins.filter((b) => b.id !== id),
    })),

  // ── Gate Pass ──────────────────────────────────────────────────────────────
  addGatePass: (gp) =>
    set((state: AppState) => ({
      gatePasses: [gp, ...state.gatePasses],
    })),

  updateGatePass: (id, updates) =>
    set((state: AppState) => ({
      gatePasses: state.gatePasses.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })),

  deleteGatePass: (id) =>
    set((state: AppState) => ({
      gatePasses: state.gatePasses.filter((g) => g.id !== id),
    })),

  // ── Compliance / Guidelines ────────────────────────────────────────────────
  updateComplianceCheckpoint: (id, updates) =>
    set((state: AppState) => ({
      complianceCheckpoints: state.complianceCheckpoints.map((cp) =>
        cp.id === id ? { ...cp, ...updates } : cp
      ),
    })),

  updateComplianceSettings: (settings) =>
    set((state: AppState) => ({
      complianceSettings: { ...state.complianceSettings, ...settings },
    })),

  // ── Water Filtration Quality ───────────────────────────────────────────────
  addWaterQualityReading: (r) =>
    set((state: AppState) => ({
      waterQualityReadings: [r, ...state.waterQualityReadings],
    })),

  updateFilterStatus: (id, updates) =>
    set((state: AppState) => ({
      filterStatuses: state.filterStatuses.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),
  }),
  {
    name: "island-mes-store",
    partialize: (state) => {
      const { appUsers: _u, roles: _r, ...rest } = state;
      return rest;
    },
  }
  )
);
