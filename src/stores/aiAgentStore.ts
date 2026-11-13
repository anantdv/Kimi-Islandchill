import { create } from "zustand";
import type { AgentCommand, AgentScheduledTask, AgentBehavior, AgentIntent, ERPNextConfig, ERPNextReportDef } from "@/data/mockData";
import { agentDefaultTasks, erpnextDefaultConfig, erpnextReportDefinitions } from "@/data/mockData";

const STORAGE_KEY_COMMANDS = "island-mes-agent-commands";
const STORAGE_KEY_TASKS = "island-mes-agent-tasks";
const STORAGE_KEY_BEHAVIOR = "island-mes-agent-behavior";
const STORAGE_KEY_ERPNEXT = "island-mes-erpnext-config";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// ── INTENT PARSER ───────────────────────────────────────────────────────────

const intentPatterns: { intent: AgentIntent; keywords: string[] }[] = [
  { intent: "create_wo", keywords: ["create work order", "new work order", "start work order", "make wo", "new wo", "create wo", "begin production", "start production"] },
  { intent: "create_schedule", keywords: ["create schedule", "new schedule", "schedule maintenance", "plan production", "set schedule", "create plan"] },
  { intent: "generate_report", keywords: ["generate report", "create report", "download report", "export report", "qc report", "production report", "efficiency report", "summary report", "make report"] },
  { intent: "query_status", keywords: ["what is running", "what lines", "running lines", "active work order", "current status", "production status", "how many bottles", "fill level", "efficiency", "oee", "show me", "tell me", "status of"] },
  { intent: "start_dss_run", keywords: ["start dss", "begin dss run", "start production run", "launch dss", "begin production flow", "start process"] },
  { intent: "set_alert", keywords: ["alert me", "notify me", "watch for", "monitor", "send alert", "warn me"] },
  { intent: "erpnext_report", keywords: ["erpnext report", "erp report", "stock report", "bom report", "sales report", "purchase report", "report from erpnext", "report from erp", "erpnext stock", "erpnext bom", "fetch report"] },
  { intent: "erpnext_query", keywords: ["erpnext query", "erp query", "query in erpnext", "check erpnext", "lookup in erp", "find in erp", "erpnext search", "in erpnext", "erp status", "erp data", "erpnext work order", "erpnext item"] },
  { intent: "erpnext_sync", keywords: ["sync erpnext", "sync with erp", "sync with erpnext", "erp sync", "update erp", "push to erp", "pull from erp", "erpnext sync"] },
  { intent: "navigate", keywords: ["go to", "open", "show", "take me to", "navigate to", "view", "load"] },
  { intent: "kaizen", keywords: ["kaizen", "continuous improvement", "improvement idea", "suggestion board", "lean idea", "5s", "pdca", "process improvement", "waste reduction", "kaizen board", "show kaizen", "kaizen stats", "kaizen ideas"] },
  { intent: "vision", keywords: ["vision", "camera analytics", "ai vision", "computer vision", "bottle detection", "missing cap", "fill level", "label check", "camera feed", "vision engine", "show cameras", "vision analytics", "cctv analytics", "defect detection"] },
  { intent: "labels", keywords: ["carton label", "carton labels", "batch label", "print label", "label print", "expiry date", "batch number", "carton coding", "date coding", "label status", "show labels"] },
  { intent: "racks", keywords: ["rack", "racks", "bin", "bins", "warehouse rack", "warehouse bins", "rack layout", "bin location", "storage location", "putaway", "slotting", "show racks"] },
  { intent: "gatepass", keywords: ["gate pass", "gatepass", "dispatch", "vehicle pass", "outward pass", "delivery pass", "truck dispatch", "goods out", "show gate pass", "gate passes"] },
  { intent: "quality", keywords: ["quality", "quality compliance", "quality and compliance", "qc", "quality control", "water quality", "filtration", "water filter", "pH", "turbidity", "TDS", "conductivity", "chlorine", "microbial", "RO membrane", "UV steriliser", "sediment filter", "water test", "guidelines", "compliance", "gmp", "haccp", "iso 22000", "iso 9001", "food safety", "sanitation", "pest control", "allergen", "audit", "checkpoint", "show guidelines"] },
  { intent: "raw-materials", keywords: ["raw material", "raw materials", "sugar", "flavouring", "rm store", "raw material warehouse", "raw stock", "ingredients", "drum", "ibc tote", "ethanol"] },
  { intent: "finished-goods", keywords: ["finished good", "finished goods", "cold store", "fg warehouse", "fg store", "bottled product", "packaged product"] },
  { intent: "help", keywords: ["help", "what can you do", "commands", "assist", "how do i"] },
];

export function parseIntent(text: string): { intent: AgentIntent; confidence: number; params: Record<string, string> } {
  const lower = text.toLowerCase();
  let bestIntent: AgentIntent = "unknown";
  let bestScore = 0;

  for (const { intent, keywords } of intentPatterns) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.length; // longer matches = more specific
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  // ERP context override: if the command mentions ERPNext/ERP but a generic
  // intent won (e.g. "production report from ERPNext"), route to ERPNext
  const mentionsErp = lower.includes("erpnext") || lower.includes("from erp") || lower.includes("in erp") || lower.includes("erp ");
  if (mentionsErp && bestIntent === "generate_report") bestIntent = "erpnext_report";

  // Extract params
  const params: Record<string, string> = {};
  const woMatch = lower.match(/wo[\s-]?(\d{4}[\s-]?\d{3}|\d+)/);
  if (woMatch) params.workOrder = woMatch[1];
  const productMatch = lower.match(/(crush cola|island chill water|bourbon bluez|crush orange|crush pineapple|crush strawberry|crush grape|crush fruit cocktail|crush lemon lime|soda water)/i);
  if (productMatch) params.product = productMatch[1];
  const sizeMatch = lower.match(/(\d+(\.\d+)?)\s?(ml|l)\b/i);
  if (sizeMatch) params.packSize = sizeMatch[0];
  const lineMatch = lower.match(/fl\s?(\d)/i);
  if (lineMatch) params.line = `FL${lineMatch[1]}`;
  const qtyMatch = lower.match(/(\d+)\s?(box|carton|case|bottle|batch)/i);
  if (qtyMatch) params.quantity = qtyMatch[1];

  return { intent: bestIntent, confidence: bestScore, params };
}

// ── STORE ───────────────────────────────────────────────────────────────────

interface AIAgentState {
  isOpen: boolean;
  commands: AgentCommand[];
  tasks: AgentScheduledTask[];
  behavior: AgentBehavior;
  suggestions: string[];
  erpnextConfig: ERPNextConfig;
  erpnextReports: ERPNextReportDef[];
  erpnextLoading: boolean;
  erpnextLastResult: { success: boolean; data?: unknown; error?: string } | null;

  toggleOpen: () => void;
  setOpen: (v: boolean) => void;
  addCommand: (cmd: AgentCommand) => void;
  clearCommands: () => void;
  addTask: (task: AgentScheduledTask) => void;
  updateTask: (id: string, updates: Partial<AgentScheduledTask>) => void;
  deleteTask: (id: string) => void;
  recordPageVisit: (page: string) => void;
  recordCommandPattern: (intent: AgentIntent) => void;
  getSuggestions: (role: string, hour: number) => string[];
  // ERPNext
  setERPNextConfig: (config: Partial<ERPNextConfig>) => void;
  testERPNextConnection: () => Promise<boolean>;
  runERPNextReport: (reportId: string, filters: Record<string, string>) => Promise<{ success: boolean; data?: unknown; error?: string }>;
  queryERPNextDocType: (docType: string, filters?: Record<string, string>) => Promise<{ success: boolean; data?: unknown; error?: string }>;
}

const defaultBehavior: AgentBehavior = {
  pageVisits: {},
  commandPatterns: {},
  timeOfDayPrefs: {},
  roleShortcuts: {},
  lastSuggestions: [],
};

export const useAIAgentStore = create<AIAgentState>((set, get) => ({
  isOpen: false,
  commands: loadJSON(STORAGE_KEY_COMMANDS, []),
  tasks: loadJSON(STORAGE_KEY_TASKS, agentDefaultTasks),
  behavior: loadJSON(STORAGE_KEY_BEHAVIOR, defaultBehavior),
  suggestions: [],
  erpnextConfig: loadJSON(STORAGE_KEY_ERPNEXT, erpnextDefaultConfig),
  erpnextReports: erpnextReportDefinitions,
  erpnextLoading: false,
  erpnextLastResult: null,

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (v) => set({ isOpen: v }),

  addCommand: (cmd) =>
    set((s) => {
      const next = [cmd, ...s.commands].slice(0, 200);
      saveJSON(STORAGE_KEY_COMMANDS, next);
      return { commands: next };
    }),

  clearCommands: () => {
    saveJSON(STORAGE_KEY_COMMANDS, []);
    set({ commands: [] });
  },

  addTask: (task) =>
    set((s) => {
      const next = [...s.tasks, task];
      saveJSON(STORAGE_KEY_TASKS, next);
      return { tasks: next };
    }),

  updateTask: (id, updates) =>
    set((s) => {
      const next = s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      saveJSON(STORAGE_KEY_TASKS, next);
      return { tasks: next };
    }),

  deleteTask: (id) =>
    set((s) => {
      const next = s.tasks.filter((t) => t.id !== id);
      saveJSON(STORAGE_KEY_TASKS, next);
      return { tasks: next };
    }),

  recordPageVisit: (page) =>
    set((s) => {
      const next = {
        ...s.behavior,
        pageVisits: { ...s.behavior.pageVisits, [page]: (s.behavior.pageVisits[page] || 0) + 1 },
      };
      saveJSON(STORAGE_KEY_BEHAVIOR, next);
      return { behavior: next };
    }),

  recordCommandPattern: (intent) =>
    set((s) => {
      const next = {
        ...s.behavior,
        commandPatterns: { ...s.behavior.commandPatterns, [intent]: (s.behavior.commandPatterns[intent] || 0) + 1 },
      };
      saveJSON(STORAGE_KEY_BEHAVIOR, next);
      return { behavior: next };
    }),

  getSuggestions: (role, hour) => {
    const { behavior } = get();
    const suggestions: string[] = [];

    // Time-based suggestions
    if (hour >= 6 && hour <= 9) {
      suggestions.push("Morning brief — show running lines and active WOs");
      suggestions.push("Start today's production runs");
    }
    if (hour >= 11 && hour <= 13) {
      suggestions.push("Check QC status before lunch shift");
    }
    if (hour >= 16 && hour <= 18) {
      suggestions.push("Generate end-of-day production report");
      suggestions.push("Review pending maintenance checks");
    }

    // Role-based
    if (role === "QC Inspector") {
      suggestions.push("Run QC checks on active work orders");
    }
    if (role === "Production Supervisor") {
      suggestions.push("View DSS Board for running processes");
    }
    if (role === "Planner") {
      suggestions.push("Create next week's work orders");
    }

    // Behavior-based: most used commands
    const topCommands = Object.entries(behavior.commandPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([intent]) => {
        const map: Record<string, string> = {
          create_wo: "Create a new work order",
          query_status: "Check production status",
          generate_report: "Generate a report",
          navigate: "Open my most-used page",
          start_dss_run: "Start a DSS production run",
        };
        return map[intent] || `Run ${intent}`;
      });

    suggestions.push(...topCommands);

    return [...new Set(suggestions)].slice(0, 5);
  },

  // ── ERPNext Integration ──────────────────────────────────────────────────

  setERPNextConfig: (config) =>
    set((s) => {
      const next = { ...s.erpnextConfig, ...config };
      saveJSON(STORAGE_KEY_ERPNEXT, next);
      return { erpnextConfig: next };
    }),

  testERPNextConnection: async () => {
    const { erpnextConfig } = get();
    if (!erpnextConfig.enabled || !erpnextConfig.baseUrl) return false;
    set({ erpnextLoading: true });
    try {
      // In production, this calls the actual ERPNext API
      // For now, simulate a connection test with a delay
      await new Promise((r) => setTimeout(r, 1200));
      const success = erpnextConfig.baseUrl.includes("islandchill");
      set((s) => ({
        erpnextConfig: { ...s.erpnextConfig, status: success ? "connected" : "error", connectedAt: success ? new Date().toISOString() : s.erpnextConfig.connectedAt },
        erpnextLoading: false,
        erpnextLastResult: { success, data: success ? { message: "Connected to ERPNext v15" } : undefined, error: success ? undefined : "Connection failed" },
      }));
      return success;
    } catch (e) {
      set({ erpnextLoading: false, erpnextLastResult: { success: false, error: String(e) } });
      return false;
    }
  },

  runERPNextReport: async (reportId, filters) => {
    const { erpnextConfig } = get();
    if (!erpnextConfig.enabled) {
      return { success: false, error: "ERPNext is not enabled. Configure it in Tinni Settings." };
    }
    set({ erpnextLoading: true });
    try {
      await new Promise((r) => setTimeout(r, 1500));
      // Simulate report data
      const mockData = generateMockERPNextReport(reportId, filters);
      const result = { success: true, data: mockData };
      set({ erpnextLoading: false, erpnextLastResult: result });
      return result;
    } catch (e) {
      const result = { success: false, error: String(e) };
      set({ erpnextLoading: false, erpnextLastResult: result });
      return result;
    }
  },

  queryERPNextDocType: async (docType, filters) => {
    const { erpnextConfig } = get();
    if (!erpnextConfig.enabled) {
      return { success: false, error: "ERPNext is not enabled. Configure it in Tinni Settings." };
    }
    set({ erpnextLoading: true });
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const mockData = generateMockERPNextDocType(docType, filters);
      const result = { success: true, data: mockData };
      set({ erpnextLoading: false, erpnextLastResult: result });
      return result;
    } catch (e) {
      const result = { success: false, error: String(e) };
      set({ erpnextLoading: false, erpnextLastResult: result });
      return result;
    }
  },
}));

// ── Mock ERPNext Data Generators ────────────────────────────────────────────

function generateMockERPNextReport(reportId: string, filters: Record<string, string>) {
  const fromDate = filters.from_date || "2025-01-01";
  const toDate = filters.to_date || "2025-01-15";

  switch (reportId) {
    case "rep-stock-balance":
      return {
        report: "Stock Balance",
        period: `${fromDate} to ${toDate}`,
        rows: [
          { item: "RM-Sugar", warehouse: "Stores - ICM", qty: 199260.06, uom: "Kg", value: 398520.12 },
          { item: "FLV-Cola", warehouse: "Stores - ICM", qty: 52.5, uom: "Kg", value: 15750.0 },
          { item: "PKG-Preform105g", warehouse: "Stores - ICM", qty: 8500, uom: "Nos", value: 42500.0 },
          { item: "PKG-CSDCap", warehouse: "Stores - ICM", qty: 12000, uom: "Nos", value: 3600.0 },
          { item: "CO2", warehouse: "Gas Store - ICM", qty: 250, uom: "Kg", value: 12500.0 },
        ],
        total_value: 472870.12,
      };
    case "rep-production-plan":
      return {
        report: "Production Plan Summary",
        period: `${fromDate} to ${toDate}`,
        rows: [
          { plan: "PP-2025-001", item: "Crush Cola 2.5L", planned: 500, produced: 420, status: "In Progress" },
          { plan: "PP-2025-002", item: "Island Chill Water 1.5L", planned: 800, produced: 800, status: "Completed" },
          { plan: "PP-2025-003", item: "Bourbon Bluez 275ml", planned: 300, produced: 150, status: "In Progress" },
        ],
      };
    case "rep-bom-explorer":
      return {
        report: "BOM Explorer",
        bom: "BOM-Crush Cola 2.5L-001",
        items: [
          { item: "RM-Sugar", qty: 2.333, uom: "Kg", rate: 2.1, amount: 4.9 },
          { item: "ADD-SodiumBenzoate", qty: 0.006, uom: "Kg", rate: 15.0, amount: 0.09 },
          { item: "FLV-Cola", qty: 0.062, uom: "Kg", rate: 300.0, amount: 18.6 },
          { item: "ACD-Cola", qty: 0.0212, uom: "Kg", rate: 12.0, amount: 0.25 },
          { item: "Water", qty: 17.5755, uom: "L", rate: 0.05, amount: 0.88 },
          { item: "CO2", qty: 4.0, uom: "g", rate: 50.0, amount: 0.2 },
          { item: "PKG-Preform105g", qty: 8, uom: "Nos", rate: 5.0, amount: 40.0 },
          { item: "PKG-CartonCSD", qty: 1, uom: "Nos", rate: 3.5, amount: 3.5 },
        ],
        total_cost: 68.42,
      };
    case "rep-sales-analytics":
      return {
        report: "Sales Analytics",
        period: `${fromDate} to ${toDate}`,
        rows: [
          { item: "Crush Cola 2.5L", qty_sold: 1200, revenue: 28800, customers: 15 },
          { item: "Island Chill Water 1.5L", qty_sold: 2500, revenue: 37500, customers: 22 },
          { item: "Bourbon Bluez 275ml", qty_sold: 800, revenue: 24000, customers: 8 },
        ],
        total_revenue: 90300,
      };
    case "rep-purchase-order-tracker":
      return {
        report: "Purchase Order Tracker",
        rows: [
          { po: "PO-2025-001", supplier: "Fiji Sugar Corp", status: "To Receive", amount: 45000, received: "60%" },
          { po: "PO-2025-002", supplier: "Crown Packaging", status: "Completed", amount: 28000, received: "100%" },
          { po: "PO-2025-003", supplier: "CO2 Suppliers Ltd", status: "To Bill", amount: 12500, received: "100%" },
        ],
      };
    case "rep-work-order-status":
      return {
        report: "Work Order Status",
        rows: [
          { wo: "WO-2025-001", item: "Island Chill Water 330ml", qty: 500, produced: 500, status: "Completed" },
          { wo: "WO-2025-002", item: "Island Chill Water 500ml", qty: 400, produced: 400, status: "Completed" },
          { wo: "WO-2025-005", item: "Crush Cola 2.5L", qty: 100, produced: 35, status: "In Process" },
          { wo: "WO-2025-006", item: "Crush Orange 1.5L", qty: 200, produced: 70, status: "In Process" },
        ],
      };
    default:
      return { report: reportId, rows: [], message: "Report data fetched from ERPNext" };
  }
}

function generateMockERPNextDocType(docType: string, _filters?: Record<string, string>) {
  switch (docType) {
    case "Item":
      return {
        doctype: "Item",
        count: 49,
        items: [
          { name: "Crush Cola 2.5L", item_group: "Beverages", stock_uom: "Box", valuation_rate: 68.42 },
          { name: "Island Chill Water 1.5L", item_group: "Beverages", stock_uom: "Box", valuation_rate: 22.15 },
          { name: "Bourbon Bluez 275ml", item_group: "Beverages", stock_uom: "Box", valuation_rate: 45.8 },
        ],
      };
    case "BOM":
      return {
        doctype: "BOM",
        count: 49,
        boms: [
          { name: "BOM-Crush Cola 2.5L-001", item: "Crush Cola 2.5L", is_active: true, is_default: true },
          { name: "BOM-Island Chill Water 1.5L-001", item: "Island Chill Water 1.5L", is_active: true, is_default: true },
        ],
      };
    case "Work Order":
      return {
        doctype: "Work Order",
        count: 6,
        work_orders: [
          { name: "WO-2025-001", production_item: "Island Chill Water 330ml", qty: 500, status: "Completed" },
          { name: "WO-2025-005", production_item: "Crush Cola 2.5L", qty: 100, status: "In Process" },
        ],
      };
    case "Stock Ledger Entry":
      return {
        doctype: "Stock Ledger Entry",
        count: 1240,
        entries: [
          { item_code: "RM-Sugar", warehouse: "Stores - ICM", qty: 500, valuation_rate: 2.1 },
          { item_code: "FLV-Cola", warehouse: "Stores - ICM", qty: 10, valuation_rate: 300 },
        ],
      };
    default:
      return { doctype: docType, count: 0, message: "Query executed on ERPNext" };
  }
}
