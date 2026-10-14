export interface ProductFamily {
  id: string;
  name: string;
  category: string;
  image: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  size: string;
  uom: string;
  image: string;
  bomId: string;
}

export interface FillingLine {
  id: string;
  name: string;
  status: "idle" | "running" | "down" | "maintenance";
  currentWo?: string;
  speed: number; // bottles per minute
  efficiency: number;
}

export interface WorkOrder {
  id: string;
  name: string;
  product: string;
  variant: string;
  qty: number;
  uom: string;
  fillingLine: string;
  status: "draft" | "in_process" | "completed" | "cancelled";
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  jobCards: JobCard[];
  qcChecks: QCCheck[];
  incidents: Incident[];
  processLoss: number;
  extraGoods: number;
}

export interface JobCard {
  id: string;
  operation: string;
  status: "pending" | "in_progress" | "completed";
  operator?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

export interface QCCheck {
  id: string;
  parameter: string;
  frequency: string;
  dueAt: string;
  status: "pending" | "passed" | "failed" | "overdue";
  value?: string;
  min: number;
  max: number;
}

export interface Incident {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  line: string;
  status: "open" | "acknowledged" | "resolved" | "pending" | "in_progress";
  raisedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  downtime?: number;
  wastageQty?: number;
}

export interface WarehouseZone {
  id: string;
  name: string;
  type: "refrigerated" | "ambient" | "frozen" | "quarantine";
  temp: number;
  humidity: number;
  capacity: number;
  used: number;
  items: ZoneItem[];
}

export interface ZoneItem {
  id: string;
  product: string;
  batch: string;
  qty: number;
  uom: string;
  expiry: string;
}

export const productFamilies: ProductFamily[] = [
  {
    id: "pf1",
    name: "Island Water",
    category: "Still Water",
    image: "/water-500ml.png",
    variants: [
      { id: "v1", name: "330ml PET", sku: "IW-330-PET", size: "330ml", uom: "Bottle", image: "/water-330ml.png", bomId: "BOM-IW-330" },
      { id: "v2", name: "500ml PET", sku: "IW-500-PET", size: "500ml", uom: "Bottle", image: "/water-500ml.png", bomId: "BOM-IW-500" },
      { id: "v3", name: "1.5L PET", sku: "IW-1500-PET", size: "1.5L", uom: "Bottle", image: "/water-1500ml.png", bomId: "BOM-IW-1500" },
    ],
  },
  {
    id: "pf2",
    name: "Bourbon Bluez",
    category: "RTD Cocktail",
    image: "/bourbon-can.png",
    variants: [
      { id: "v4", name: "330ml Can", sku: "BB-330-CAN", size: "330ml", uom: "Can", image: "/bourbon-can.png", bomId: "BOM-BB-330" },
      { id: "v5", name: "275ml Bottle", sku: "BB-275-BTL", size: "275ml", uom: "Bottle", image: "/bourbon-bottle.png", bomId: "BOM-BB-275" },
    ],
  },
];

export const fillingLines: FillingLine[] = [
  { id: "fl1", name: "FL1 - Water Line A", status: "running", currentWo: "WO-2025-001", speed: 280, efficiency: 94.5 },
  { id: "fl2", name: "FL2 - Water Line B", status: "idle", speed: 0, efficiency: 0 },
  { id: "fl3", name: "FL3 - CSD Line", status: "down", currentWo: undefined, speed: 0, efficiency: 0 },
  { id: "fl4", name: "FL4 - RTD Line", status: "running", currentWo: "WO-2025-004", speed: 180, efficiency: 91.2 },
];

export const workOrders: WorkOrder[] = [
  {
    id: "wo1",
    name: "WO-2025-001",
    product: "Island Water",
    variant: "500ml PET",
    qty: 15000,
    uom: "Bottle",
    fillingLine: "FL1 - Water Line A",
    status: "in_process",
    progress: 72,
    createdAt: "2025-01-15T06:00:00Z",
    startedAt: "2025-01-15T07:30:00Z",
    jobCards: [
      { id: "jc1", operation: "Raw Water Intake", status: "completed", operator: "John M.", startedAt: "07:30", completedAt: "08:15", duration: 45 },
      { id: "jc2", operation: "Mixing & Blending", status: "completed", operator: "John M.", startedAt: "08:15", completedAt: "09:30", duration: 75 },
      { id: "jc3", operation: "Carbonation", status: "completed", operator: "Sarah K.", startedAt: "09:30", completedAt: "10:00", duration: 30 },
      { id: "jc4", operation: "Filling & Capping", status: "in_progress", operator: "Sarah K.", startedAt: "10:00" },
      { id: "jc5", operation: "Labelling", status: "pending" },
      { id: "jc6", operation: "Palletising", status: "pending" },
    ],
    qcChecks: [
      { id: "qc1", parameter: "pH Level", frequency: "Every 30 min", dueAt: "10:30", status: "passed", value: "7.2", min: 6.5, max: 7.5 },
      { id: "qc2", parameter: "TDS (ppm)", frequency: "Every 30 min", dueAt: "10:30", status: "passed", value: "145", min: 100, max: 200 },
      { id: "qc3", parameter: "Brix", frequency: "Per Batch", dueAt: "11:00", status: "pending", min: 0, max: 0.5 },
      { id: "qc4", parameter: "CO2 Volume", frequency: "Every 60 min", dueAt: "11:00", status: "pending", min: 3.0, max: 4.0 },
      { id: "qc5", parameter: "Microbial", frequency: "Per Batch", dueAt: "12:00", status: "pending", min: 0, max: 0 },
    ],
    incidents: [],
    processLoss: 0,
    extraGoods: 0,
  },
  {
    id: "wo2",
    name: "WO-2025-002",
    product: "Island Water",
    variant: "330ml PET",
    qty: 24000,
    uom: "Bottle",
    fillingLine: "FL2 - Water Line B",
    status: "draft",
    progress: 0,
    createdAt: "2025-01-15T08:00:00Z",
    jobCards: [],
    qcChecks: [],
    incidents: [],
    processLoss: 0,
    extraGoods: 0,
  },
  {
    id: "wo3",
    name: "WO-2025-003",
    product: "Island Water",
    variant: "1.5L PET",
    qty: 8000,
    uom: "Bottle",
    fillingLine: "FL1 - Water Line A",
    status: "draft",
    progress: 0,
    createdAt: "2025-01-15T09:00:00Z",
    jobCards: [],
    qcChecks: [],
    incidents: [],
    processLoss: 0,
    extraGoods: 0,
  },
  {
    id: "wo4",
    name: "WO-2025-004",
    product: "Bourbon Bluez",
    variant: "330ml Can",
    qty: 12000,
    uom: "Can",
    fillingLine: "FL4 - RTD Line",
    status: "in_process",
    progress: 45,
    createdAt: "2025-01-15T05:30:00Z",
    startedAt: "2025-01-15T06:00:00Z",
    jobCards: [
      { id: "jc7", operation: "Alcohol Blending", status: "completed", operator: "Mike R.", startedAt: "06:00", completedAt: "07:45", duration: 105 },
      { id: "jc8", operation: "Mixing & Flavour", status: "completed", operator: "Mike R.", startedAt: "07:45", completedAt: "09:00", duration: 75 },
      { id: "jc9", operation: "Can Filling", status: "in_progress", operator: "Lisa T.", startedAt: "09:00" },
      { id: "jc10", operation: "Pasteurisation", status: "pending" },
      { id: "jc11", operation: "Labelling & Packing", status: "pending" },
    ],
    qcChecks: [
      { id: "qc6", parameter: "Alcohol %", frequency: "Every 30 min", dueAt: "10:00", status: "passed", value: "5.5", min: 5.0, max: 6.0 },
      { id: "qc7", parameter: "Brix", frequency: "Every 30 min", dueAt: "10:00", status: "passed", value: "8.2", min: 7.5, max: 9.0 },
      { id: "qc8", parameter: "CO2 Volume", frequency: "Every 60 min", dueAt: "10:30", status: "pending", min: 2.5, max: 3.5 },
    ],
    incidents: [
      { id: "inc1", type: "Equipment Fault", severity: "high", description: "Can seamer misalignment detected — 3 rejected units", line: "FL4", status: "acknowledged", raisedAt: "09:15", acknowledgedAt: "09:22", downtime: 7, wastageQty: 3 },
    ],
    processLoss: 0,
    extraGoods: 0,
  },
];

export const incidents: Incident[] = [
  { id: "inc1", type: "Equipment Fault", severity: "high", description: "Can seamer misalignment detected — 3 rejected units", line: "FL4", status: "acknowledged", raisedAt: "09:15", acknowledgedAt: "09:22", downtime: 7, wastageQty: 3 },
  { id: "inc2", type: "Quality Alert", severity: "critical", description: "pH reading 8.1 exceeds max limit 7.5 on FL1", line: "FL1", status: "open", raisedAt: "10:05" },
  { id: "inc3", type: "Material Shortage", severity: "medium", description: "330ml labels running low — 2000 remaining", line: "FL2", status: "open", raisedAt: "08:30" },
  { id: "inc4", type: "Cleaning Required", severity: "low", description: "FL3 post-CIP verification pending", line: "FL3", status: "resolved", raisedAt: "07:00", acknowledgedAt: "07:10", resolvedAt: "08:00", downtime: 60 },
  { id: "inc5", type: "Safety", severity: "high", description: "Emergency stop triggered on FL3 — conveyor jam", line: "FL3", status: "open", raisedAt: "09:45" },
];

// ── INCIDENT INVESTIGATION ──────────────────────────────────────────────────

export interface InvestigationChecklistItem {
  id: string;
  step: string;
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
  notes?: string;
}

export interface IncidentInvestigation {
  id: string;
  incidentId: string;
  incidentTitle: string;
  checklist: InvestigationChecklistItem[];
  rootCauseCategory: string;
  rootCauseDetail: string;
  actionTaken: string;
  photos: string[];
  resolutionStatus: "resolved" | "pending";
  pendingReason?: string;
  investigatedBy: string;
  investigatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export const investigationChecklistTemplate: InvestigationChecklistItem[] = [
  { id: "chk1", step: "Site / equipment inspected immediately", checked: false },
  { id: "chk2", step: "Affected product isolated and quarantined", checked: false },
  { id: "chk3", step: "Witnesses interviewed (if applicable)", checked: false },
  { id: "chk4", step: "QC records and batch data reviewed", checked: false },
  { id: "chk5", step: "Maintenance logs reviewed", checked: false },
  { id: "chk6", step: "Photos of incident scene captured", checked: false },
  { id: "chk7", step: "Root cause identified and documented", checked: false },
  { id: "chk8", step: "Corrective action defined and assigned", checked: false },
  { id: "chk9", step: "Preventive action plan created", checked: false },
  { id: "chk10", step: "Management review and sign-off", checked: false },
];

export const rootCauseCategories = [
  "Mechanical Failure",
  "Electrical Fault",
  "Human Error / Procedure Violation",
  "Material / Input Defect",
  "Environmental Factor",
  "Inadequate Procedure / Training",
  "Software / Control System",
  "External Supplier Issue",
  "Other",
];

export const incidentInvestigations: IncidentInvestigation[] = [
  {
    id: "inv1",
    incidentId: "inc1",
    incidentTitle: "Can seamer misalignment",
    checklist: [
      { id: "chk1", step: "Site / equipment inspected immediately", checked: true, checkedAt: "2025-01-15T09:20:00Z", checkedBy: "Dave R." },
      { id: "chk2", step: "Affected product isolated and quarantined", checked: true, checkedAt: "2025-01-15T09:25:00Z", checkedBy: "Carlos M." },
      { id: "chk3", step: "Witnesses interviewed (if applicable)", checked: false },
      { id: "chk4", step: "QC records and batch data reviewed", checked: true, checkedAt: "2025-01-15T09:35:00Z", checkedBy: "Priya N." },
      { id: "chk5", step: "Maintenance logs reviewed", checked: true, checkedAt: "2025-01-15T09:40:00Z", checkedBy: "Dave R." },
      { id: "chk6", step: "Photos of incident scene captured", checked: true, checkedAt: "2025-01-15T09:30:00Z", checkedBy: "Dave R." },
      { id: "chk7", step: "Root cause identified and documented", checked: true, checkedAt: "2025-01-15T09:45:00Z", checkedBy: "Dave R." },
      { id: "chk8", step: "Corrective action defined and assigned", checked: false },
      { id: "chk9", step: "Preventive action plan created", checked: false },
      { id: "chk10", step: "Management review and sign-off", checked: false },
    ],
    rootCauseCategory: "Mechanical Failure",
    rootCauseDetail: "Seamer tooling worn after extended run. Guide plate bolt loose causing 2mm offset.",
    actionTaken: "Replaced seamer tooling set. Torqued guide plate bolts to 45Nm. Ran 50-unit trial — all within spec.",
    photos: ["img1", "img2"],
    resolutionStatus: "pending",
    pendingReason: "Awaiting QC sign-off on trial batch before releasing full production.",
    investigatedBy: "Dave R.",
    investigatedAt: "2025-01-15T09:15:00Z",
  },
  {
    id: "inv4",
    incidentId: "inc4",
    incidentTitle: "FL3 post-CIP verification",
    checklist: [
      { id: "chk1", step: "Site / equipment inspected immediately", checked: true, checkedAt: "2025-01-15T07:05:00Z", checkedBy: "John M." },
      { id: "chk2", step: "Affected product isolated and quarantined", checked: false },
      { id: "chk3", step: "Witnesses interviewed (if applicable)", checked: false },
      { id: "chk4", step: "QC records and batch data reviewed", checked: true, checkedAt: "2025-01-15T07:15:00Z", checkedBy: "Priya N." },
      { id: "chk5", step: "Maintenance logs reviewed", checked: true, checkedAt: "2025-01-15T07:10:00Z", checkedBy: "Dave R." },
      { id: "chk6", step: "Photos of incident scene captured", checked: true, checkedAt: "2025-01-15T07:20:00Z", checkedBy: "John M." },
      { id: "chk7", step: "Root cause identified and documented", checked: true, checkedAt: "2025-01-15T07:25:00Z", checkedBy: "Dave R." },
      { id: "chk8", step: "Corrective action defined and assigned", checked: true, checkedAt: "2025-01-15T07:30:00Z", checkedBy: "Dave R." },
      { id: "chk9", step: "Preventive action plan created", checked: true, checkedAt: "2025-01-15T07:35:00Z", checkedBy: "Dave R." },
      { id: "chk10", step: "Management review and sign-off", checked: true, checkedAt: "2025-01-15T08:00:00Z", checkedBy: "Sarah K." },
    ],
    rootCauseCategory: "Inadequate Procedure / Training",
    rootCauseDetail: "CIP rinse cycle shortened by operator to save time. Residue detected in ATP swab.",
    actionTaken: "Re-ran full CIP cycle. Operator retrained on CIP protocol. ATP swab re-tested — passed.",
    photos: ["img3"],
    resolutionStatus: "resolved",
    investigatedBy: "Dave R.",
    investigatedAt: "2025-01-15T07:00:00Z",
    reviewedBy: "Sarah K.",
    reviewedAt: "2025-01-15T08:00:00Z",
  },
];

export const warehouseZones: WarehouseZone[] = [
  {
    id: "z1", name: "Cold Store A", type: "refrigerated", temp: 4.2, humidity: 65, capacity: 5000, used: 3200,
    items: [
      { id: "zi1", product: "Island Water 500ml", batch: "B-20250115-A", qty: 1200, uom: "Case", expiry: "2026-01-15" },
      { id: "zi2", product: "Bourbon Bluez 330ml", batch: "B-20250114-B", qty: 800, uom: "Case", expiry: "2026-01-14" },
    ],
  },
  {
    id: "z2", name: "Cold Store B", type: "refrigerated", temp: 3.8, humidity: 62, capacity: 5000, used: 1800,
    items: [
      { id: "zi3", product: "Island Water 1.5L", batch: "B-20250113-C", qty: 600, uom: "Case", expiry: "2026-01-13" },
    ],
  },
  {
    id: "z3", name: "Ambient Store", type: "ambient", temp: 22.1, humidity: 45, capacity: 8000, used: 4500,
    items: [
      { id: "zi4", product: "Island Water 330ml", batch: "B-20250112-D", qty: 2000, uom: "Case", expiry: "2027-01-12" },
      { id: "zi5", product: "Bourbon Bluez 275ml", batch: "B-20250111-E", qty: 1500, uom: "Case", expiry: "2026-07-11" },
    ],
  },
  {
    id: "z4", name: "Quarantine", type: "quarantine", temp: 5.0, humidity: 60, capacity: 500, used: 150,
    items: [
      { id: "zi6", product: "Island Water 500ml", batch: "B-20250115-Q", qty: 150, uom: "Case", expiry: "2026-01-15" },
    ],
  },
  {
    id: "z5", name: "Dispatch Dock", type: "ambient", temp: 24.0, humidity: 50, capacity: 2000, used: 800,
    items: [
      { id: "zi7", product: "Island Water 500ml", batch: "B-20250110-D", qty: 400, uom: "Case", expiry: "2026-01-10" },
      { id: "zi8", product: "Bourbon Bluez 330ml", batch: "B-20250109-D", qty: 400, uom: "Case", expiry: "2026-01-09" },
    ],
  },
];

export interface BOMHeader {
  id: string;
  name: string;
  variant: string;
  sku: string;
  status: "active" | "pending" | "obsolete";
  revision: string;
  effectiveDate: string;
  quantity: number;
  uom: string;
  items: BOMItem[];
}

export interface BOMItem {
  id: string;
  itemCode: string;
  itemName: string;
  itemType: "raw_material" | "packaging" | "additive" | "co2";
  qty: number;
  uom: string;
  scrapAllowance: number; // percentage
  costPerUnit: number;
}

export const boms: BOMHeader[] = [
  {
    id: "BOM-IW-330",
    name: "Island Water 330ml PET",
    variant: "330ml PET",
    sku: "IW-330-PET",
    status: "active",
    revision: "Rev 3",
    effectiveDate: "2025-01-01",
    quantity: 1000,
    uom: "Bottle",
    items: [
      { id: "bi1", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 330, uom: "ml", scrapAllowance: 2.0, costPerUnit: 0.0012 },
      { id: "bi2", itemCode: "PKG-330PET", itemName: "330ml PET Bottle", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.085 },
      { id: "bi3", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.3, costPerUnit: 0.012 },
      { id: "bi4", itemCode: "PKG-LabelIW", itemName: "Island Water Label", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.018 },
      { id: "bi5", itemCode: "PKG-Shrink24", itemName: "24-Pack Shrink Wrap", itemType: "packaging", qty: 0.0417, uom: "pc", scrapAllowance: 1.0, costPerUnit: 0.45 },
      { id: "bi6", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 0.05, uom: "g", scrapAllowance: 1.5, costPerUnit: 0.8 },
    ],
  },
  {
    id: "BOM-IW-500",
    name: "Island Water 500ml PET",
    variant: "500ml PET",
    sku: "IW-500-PET",
    status: "active",
    revision: "Rev 4",
    effectiveDate: "2025-01-01",
    quantity: 1000,
    uom: "Bottle",
    items: [
      { id: "bi7", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 500, uom: "ml", scrapAllowance: 2.0, costPerUnit: 0.0012 },
      { id: "bi8", itemCode: "PKG-500PET", itemName: "500ml PET Bottle", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.095 },
      { id: "bi9", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.3, costPerUnit: 0.012 },
      { id: "bi10", itemCode: "PKG-LabelIW", itemName: "Island Water Label", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.018 },
      { id: "bi11", itemCode: "PKG-Shrink12", itemName: "12-Pack Shrink Wrap", itemType: "packaging", qty: 0.0833, uom: "pc", scrapAllowance: 1.0, costPerUnit: 0.38 },
      { id: "bi12", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 0.08, uom: "g", scrapAllowance: 1.5, costPerUnit: 0.8 },
    ],
  },
  {
    id: "BOM-IW-1500",
    name: "Island Water 1.5L PET",
    variant: "1.5L PET",
    sku: "IW-1500-PET",
    status: "active",
    revision: "Rev 2",
    effectiveDate: "2025-01-01",
    quantity: 1000,
    uom: "Bottle",
    items: [
      { id: "bi13", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 1500, uom: "ml", scrapAllowance: 2.0, costPerUnit: 0.0012 },
      { id: "bi14", itemCode: "PKG-1500PET", itemName: "1.5L PET Bottle", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.14 },
      { id: "bi15", itemCode: "PKG-Cap38", itemName: "38mm Screw Cap", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.3, costPerUnit: 0.018 },
      { id: "bi16", itemCode: "PKG-LabelIW-L", itemName: "Island Water Large Label", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.022 },
      { id: "bi17", itemCode: "PKG-Carton6", itemName: "6-Pack Carton", itemType: "packaging", qty: 0.1667, uom: "pc", scrapAllowance: 1.0, costPerUnit: 0.55 },
      { id: "bi18", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 0.2, uom: "g", scrapAllowance: 1.5, costPerUnit: 0.8 },
    ],
  },
  {
    id: "BOM-BB-330",
    name: "Bourbon Bluez 330ml Can",
    variant: "330ml Can",
    sku: "BB-330-CAN",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1000,
    uom: "Can",
    items: [
      { id: "bi19", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 220, uom: "ml", scrapAllowance: 2.0, costPerUnit: 0.0012 },
      { id: "bi20", itemCode: "RM-Bourbon", itemName: "Bourbon Spirit", itemType: "raw_material", qty: 55, uom: "ml", scrapAllowance: 1.5, costPerUnit: 0.045 },
      { id: "bi21", itemCode: "RM-Flavour", itemName: "Blueberry Flavouring", itemType: "raw_material", qty: 8, uom: "ml", scrapAllowance: 2.0, costPerUnit: 0.12 },
      { id: "bi22", itemCode: "PKG-330Can", itemName: "330ml Aluminium Can", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.065 },
      { id: "bi23", itemCode: "PKG-Lid330", itemName: "Can Lid 202", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.3, costPerUnit: 0.008 },
      { id: "bi24", itemCode: "PKG-SleeveBB", itemName: "Bourbon Bluez Sleeve", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.025 },
      { id: "bi25", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 2.5, uom: "g", scrapAllowance: 5.0, costPerUnit: 0.003 },
      { id: "bi26", itemCode: "PKG-Tray24", itemName: "24-Pack Plastic Tray", itemType: "packaging", qty: 0.0417, uom: "pc", scrapAllowance: 1.0, costPerUnit: 0.42 },
    ],
  },
  {
    id: "BOM-BB-275",
    name: "Bourbon Bluez 275ml Bottle",
    variant: "275ml Bottle",
    sku: "BB-275-BTL",
    status: "pending",
    revision: "Rev 0",
    effectiveDate: "2025-02-01",
    quantity: 1000,
    uom: "Bottle",
    items: [
      { id: "bi27", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 185, uom: "ml", scrapAllowance: 2.0, costPerUnit: 0.0012 },
      { id: "bi28", itemCode: "RM-Bourbon", itemName: "Bourbon Spirit", itemType: "raw_material", qty: 45, uom: "ml", scrapAllowance: 1.5, costPerUnit: 0.045 },
      { id: "bi29", itemCode: "RM-Flavour", itemName: "Blueberry Flavouring", itemType: "raw_material", qty: 6, uom: "ml", scrapAllowance: 2.0, costPerUnit: 0.12 },
      { id: "bi30", itemCode: "PKG-275BTL", itemName: "275ml Glass Bottle", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 1.0, costPerUnit: 0.18 },
      { id: "bi31", itemCode: "PKG-Crown26", itemName: "26mm Crown Cap", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.015 },
      { id: "bi32", itemCode: "PKG-LabelBB", itemName: "Bourbon Bluez Label", itemType: "packaging", qty: 1, uom: "pc", scrapAllowance: 0.5, costPerUnit: 0.028 },
      { id: "bi33", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 2.0, uom: "g", scrapAllowance: 5.0, costPerUnit: 0.003 },
      { id: "bi34", itemCode: "PKG-Carton12", itemName: "12-Pack Carton", itemType: "packaging", qty: 0.0833, uom: "pc", scrapAllowance: 1.0, costPerUnit: 0.48 },
    ],
  },
];

export const processRoutes = [
  {
    id: "r1",
    name: "Still Water — PET",
    stages: [
      { name: "Raw Water Intake", duration: "45 min", equipment: ["Pump Station", "Sand Filter"] },
      { name: "Mixing & Blending", duration: "75 min", equipment: ["Mix Tank 1", "UV Steriliser"] },
      { name: "Carbonation", duration: "30 min", equipment: ["Carbonator"] },
      { name: "Filling & Capping", duration: "180 min", equipment: ["Filler FL1", "Capper FL1"] },
      { name: "Labelling", duration: "120 min", equipment: ["Labeler FL1"] },
      { name: "Palletising", duration: "90 min", equipment: ["Palletiser FL1", "Stretch Wrapper"] },
    ],
  },
  {
    id: "r2",
    name: "RTD Cocktail — Can",
    stages: [
      { name: "Alcohol Blending", duration: "105 min", equipment: ["Blend Tank A", "Spirit Pump"] },
      { name: "Mixing & Flavour", duration: "75 min", equipment: ["Mix Tank B", "Heat Exchanger"] },
      { name: "Can Filling", duration: "150 min", equipment: ["Can Filler FL4", "Seamer FL4"] },
      { name: "Pasteurisation", duration: "60 min", equipment: ["Tunnel Pasteuriser"] },
      { name: "Labelling & Packing", duration: "120 min", equipment: ["Labeler FL4", "Case Packer"] },
    ],
  },
];

// ── QC FORMS ────────────────────────────────────────────────────────────────

export interface QCForm {
  id: string;
  code: string;
  title: string;
  category: string;
  stage: string;
  frequency: string;
  fields: QCFormField[];
  attachments: string[];
  active: boolean;
}

export interface QCFormField {
  id: string;
  label: string;
  type: "number" | "text" | "select" | "checkbox" | "photo";
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
}

export const qcForms: QCForm[] = [
  {
    id: "qf1",
    code: "QC-F-001",
    title: "Raw Water Intake Quality Check",
    category: "Water Treatment",
    stage: "Raw Water Intake",
    frequency: "Every Batch",
    active: true,
    attachments: [],
    fields: [
      { id: "f1", label: "pH Level", type: "number", required: true, min: 6.5, max: 7.5, unit: "pH" },
      { id: "f2", label: "Turbidity", type: "number", required: true, min: 0, max: 1, unit: "NTU" },
      { id: "f3", label: "Chlorine Residual", type: "number", required: true, min: 0, max: 0.5, unit: "mg/L" },
      { id: "f4", label: "Intake Photo", type: "photo", required: false },
      { id: "f5", label: "Remarks", type: "text", required: false },
    ],
  },
  {
    id: "qf2",
    code: "QC-F-002",
    title: "Mixing & Blending Verification",
    category: "Mixing",
    stage: "Mixing & Blending",
    frequency: "Every Batch",
    active: true,
    attachments: [],
    fields: [
      { id: "f6", label: "Mix Tank Temp", type: "number", required: true, min: 15, max: 25, unit: "°C" },
      { id: "f7", label: "Mix Duration", type: "number", required: true, min: 60, max: 90, unit: "min" },
      { id: "f8", label: "Mineral Dose Verified", type: "checkbox", required: true },
      { id: "f9", label: "Tank Cleanliness Photo", type: "photo", required: true },
      { id: "f10", label: "Operator Sign-off", type: "text", required: true },
    ],
  },
  {
    id: "qf3",
    code: "QC-F-003",
    title: "Carbonation Quality Check",
    category: "Carbonation",
    stage: "Carbonation",
    frequency: "Every 30 min",
    active: true,
    attachments: [],
    fields: [
      { id: "f11", label: "CO2 Volume", type: "number", required: true, min: 3.0, max: 4.0, unit: "vol" },
      { id: "f12", label: "Pressure", type: "number", required: true, min: 3.5, max: 5.0, unit: "bar" },
      { id: "f13", label: "Temperature", type: "number", required: true, min: 2, max: 8, unit: "°C" },
      { id: "f14", label: "Pass / Fail", type: "select", required: true, options: ["Pass", "Fail", "Conditional"] },
    ],
  },
  {
    id: "qf4",
    code: "QC-F-004",
    title: "Filling & Capping Inspection",
    category: "Filling",
    stage: "Filling & Capping",
    frequency: "Every 60 min",
    active: true,
    attachments: [],
    fields: [
      { id: "f15", label: "Fill Level", type: "number", required: true, min: 95, max: 102, unit: "%" },
      { id: "f16", label: "Cap Torque", type: "number", required: true, min: 15, max: 25, unit: "Ncm" },
      { id: "f17", label: "Leak Test Result", type: "select", required: true, options: ["Pass", "Fail"] },
      { id: "f18", label: "Bottle Defect Count", type: "number", required: true, min: 0, max: 10, unit: "pcs" },
      { id: "f19", label: "Defect Photo", type: "photo", required: false },
    ],
  },
  {
    id: "qf5",
    code: "QC-F-005",
    title: "Labelling Verification",
    category: "Packaging",
    stage: "Labelling",
    frequency: "Every Batch",
    active: true,
    attachments: [],
    fields: [
      { id: "f20", label: "Label Position", type: "select", required: true, options: ["OK", "Offset", "Wrinkled"] },
      { id: "f21", label: "Batch Code Legible", type: "checkbox", required: true },
      { id: "f22", label: "Expiry Date Correct", type: "checkbox", required: true },
      { id: "f23", label: "Label Photo", type: "photo", required: true },
    ],
  },
  {
    id: "qf6",
    code: "QC-F-006",
    title: "Alcohol Blending Verification",
    category: "Blending",
    stage: "Alcohol Blending",
    frequency: "Every Batch",
    active: true,
    attachments: [],
    fields: [
      { id: "f24", label: "Alcohol %", type: "number", required: true, min: 5.0, max: 6.0, unit: "% ABV" },
      { id: "f25", label: "Spirit Lot Number", type: "text", required: true },
      { id: "f26", label: "Blend Ratio Verified", type: "checkbox", required: true },
      { id: "f27", label: "Blend Tank Photo", type: "photo", required: false },
    ],
  },
  {
    id: "qf7",
    code: "QC-F-007",
    title: "Can Seamer Integrity Check",
    category: "Filling",
    stage: "Can Filling",
    frequency: "Every 30 min",
    active: true,
    attachments: [],
    fields: [
      { id: "f28", label: "Seam Thickness", type: "number", required: true, min: 1.0, max: 1.4, unit: "mm" },
      { id: "f29", label: "Seam Height", type: "number", required: true, min: 3.0, max: 3.5, unit: "mm" },
      { id: "f30", label: "Visual Seam OK", type: "checkbox", required: true },
      { id: "f31", label: "Seam Photo", type: "photo", required: true },
    ],
  },
  {
    id: "qf8",
    code: "QC-F-008",
    title: "Pasteurisation Validation",
    category: "Pasteurisation",
    stage: "Pasteurisation",
    frequency: "Every Batch",
    active: true,
    attachments: [],
    fields: [
      { id: "f32", label: "PU Value", type: "number", required: true, min: 10, max: 25, unit: "PU" },
      { id: "f33", label: "Max Temp", type: "number", required: true, min: 60, max: 65, unit: "°C" },
      { id: "f34", label: "Hold Time", type: "number", required: true, min: 10, max: 20, unit: "min" },
      { id: "f35", label: "Chart Recorder OK", type: "checkbox", required: true },
    ],
  },
  {
    id: "qf9",
    code: "QC-F-009",
    title: "Palletising Final Check",
    category: "Packaging",
    stage: "Palletising",
    frequency: "Every Pallet",
    active: true,
    attachments: [],
    fields: [
      { id: "f36", label: "Layer Count", type: "number", required: true, min: 5, max: 8, unit: "layers" },
      { id: "f37", label: "Cases per Layer", type: "number", required: true, min: 10, max: 15, unit: "cases" },
      { id: "f38", label: "Pallet Label OK", type: "checkbox", required: true },
      { id: "f39", label: "Pallet Photo", type: "photo", required: false },
    ],
  },
  {
    id: "qf10",
    code: "QC-F-010",
    title: "Microbial Sampling",
    category: "Lab",
    stage: "All",
    frequency: "Daily",
    active: true,
    attachments: [],
    fields: [
      { id: "f40", label: "TPC Count", type: "number", required: true, min: 0, max: 100, unit: "CFU/ml" },
      { id: "f41", label: "Yeast & Mould", type: "number", required: true, min: 0, max: 10, unit: "CFU/ml" },
      { id: "f42", label: "Coliform", type: "select", required: true, options: ["Absent", "Present"] },
      { id: "f43", label: "Sample Photo", type: "photo", required: false },
    ],
  },
];

// ── MAINTENANCE CLEARANCE ───────────────────────────────────────────────────

export interface MaintenanceCheck {
  id: string;
  woId: string;
  woName: string;
  line: string;
  status: "pending" | "in_progress" | "cleared" | "rejected";
  raisedAt: string;
  clearedAt?: string;
  supervisor: string;
  supervisorRole: string;
  items: MaintenanceCheckItem[];
  photos: string[];
  notes?: string;
  resolutionStatus?: "resolved" | "pending";
  pendingReason?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface MaintenanceCheckItem {
  id: string;
  check: string;
  category: "safety" | "mechanical" | "electrical" | "hygiene";
  status: "pass" | "fail" | "na";
  photo?: string;
  notes?: string;
}

export const maintenanceChecks: MaintenanceCheck[] = [
  {
    id: "mc1",
    woId: "wo1",
    woName: "WO-2025-001",
    line: "FL1",
    status: "cleared",
    raisedAt: "2025-01-15T06:00:00Z",
    clearedAt: "2025-01-15T06:45:00Z",
    supervisor: "Dave R.",
    supervisorRole: "Maintenance Supervisor",
    photos: [],
    notes: "All pre-start checks passed. Conveyor lubrication levels OK.",
    resolutionStatus: "resolved",
    resolvedAt: "2025-01-15T06:45:00Z",
    resolutionNotes: "All pre-start checks completed satisfactorily. Line cleared for production.",
    items: [
      { id: "mci1", check: "Emergency stop buttons functional", category: "safety", status: "pass" },
      { id: "mci2", check: "Guard covers in place", category: "safety", status: "pass" },
      { id: "mci3", check: "Conveyor belt tension OK", category: "mechanical", status: "pass" },
      { id: "mci4", check: "Filler nozzles clean and aligned", category: "hygiene", status: "pass" },
      { id: "mci5", check: "Air pressure at 6 bar", category: "mechanical", status: "pass" },
      { id: "mci6", check: "Electrical panel no faults", category: "electrical", status: "pass" },
      { id: "mci7", check: "CIP cycle completed", category: "hygiene", status: "pass" },
    ],
  },
  {
    id: "mc2",
    woId: "wo4",
    woName: "WO-2025-004",
    line: "FL4",
    status: "cleared",
    raisedAt: "2025-01-15T05:30:00Z",
    clearedAt: "2025-01-15T05:50:00Z",
    supervisor: "Dave R.",
    supervisorRole: "Maintenance Supervisor",
    photos: [],
    notes: "Seamer alignment verified. Can magazine loaded.",
    resolutionStatus: "resolved",
    resolvedAt: "2025-01-15T05:50:00Z",
    resolutionNotes: "Seamer alignment verified within tolerance. Can magazine loaded and sensor confirmed operational.",
    items: [
      { id: "mci8", check: "Emergency stop buttons functional", category: "safety", status: "pass" },
      { id: "mci9", check: "Seamer tooling condition", category: "mechanical", status: "pass" },
      { id: "mci10", check: "Can magazine level sensor OK", category: "electrical", status: "pass" },
      { id: "mci11", check: "Pasteuriser water level", category: "mechanical", status: "pass" },
      { id: "mci12", check: "CO2 pressure at 4.5 bar", category: "mechanical", status: "pass" },
    ],
  },
  {
    id: "mc3",
    woId: "wo2",
    woName: "WO-2025-002",
    line: "FL2",
    status: "pending",
    raisedAt: "2025-01-15T08:00:00Z",
    supervisor: "Dave R.",
    supervisorRole: "Maintenance Supervisor",
    photos: [],
    notes: "Awaiting spare parts delivery for label applicator.",
    resolutionStatus: "pending",
    pendingReason: "Replacement label applicator roller on order (ETA: 2 hours). Cannot complete tension check until roller installed.",
    items: [
      { id: "mci13", check: "Emergency stop buttons functional", category: "safety", status: "na" },
      { id: "mci14", check: "Conveyor belt tension OK", category: "mechanical", status: "na", notes: "Cannot verify — roller removal in progress" },
      { id: "mci15", check: "Label applicator alignment", category: "mechanical", status: "na", notes: "Awaiting new roller" },
      { id: "mci16", check: "CIP cycle completed", category: "hygiene", status: "na" },
    ],
  },
];

// ── BOM REQUISITION (Ingredient Mixer Workflow) ──────────────────────────────

export interface BOMRequisitionItem {
  id: string;
  ingredient: string;
  qtyRequired: number;
  qtyFetched: number;
  unit: string;
  lotNo?: string;
  expiryDate?: string;
  location: string;
  status: "pending" | "fetched" | "verified";
  notes?: string;
}

export interface BOMRequisition {
  id: string;
  bomId: string;
  bomName: string;
  woId: string;
  woName: string;
  product: string;
  variant: string;
  batchQty: number;
  status: "draft" | "approved" | "picking" | "prepared" | "delivered" | "rejected";
  items: BOMRequisitionItem[];
  requestedBy: string;
  requestedAt: string;
  preparedBy?: string;
  preparedAt?: string;
  deliveredTo?: string;
  deliveredAt?: string;
  mixerNotes?: string;
}

export const bomRequisitions: BOMRequisition[] = [
  {
    id: "req1",
    bomId: "bom1",
    bomName: "BOM-IC-001",
    woId: "wo1",
    woName: "WO-2025-001",
    product: "Island Chill Original",
    variant: "500ml Bottle",
    batchQty: 5000,
    status: "delivered",
    requestedBy: "Sarah K.",
    requestedAt: "2025-01-15T05:00:00Z",
    preparedBy: "Raj P.",
    preparedAt: "2025-01-15T05:30:00Z",
    deliveredTo: "FL1 - Operator John M.",
    deliveredAt: "2025-01-15T05:45:00Z",
    items: [
      { id: "ri1", ingredient: "Cola Concentrate", qtyRequired: 125.0, qtyFetched: 125.0, unit: "L", lotNo: "CC-24-112", expiryDate: "2026-06-01", location: "RM-A12", status: "verified" },
      { id: "ri2", ingredient: "Sugar Syrup", qtyRequired: 250.0, qtyFetched: 250.0, unit: "L", lotNo: "SS-24-089", expiryDate: "2025-12-15", location: "RM-B03", status: "verified" },
      { id: "ri3", ingredient: "Purified Water", qtyRequired: 4625.0, qtyFetched: 4625.0, unit: "L", lotNo: "PW-25-004", expiryDate: "2025-04-01", location: "RM-C01", status: "verified" },
      { id: "ri4", ingredient: "CO2", qtyRequired: 45.0, qtyFetched: 45.0, unit: "kg", lotNo: "CO2-24-056", expiryDate: "2025-12-31", location: "RM-D04", status: "verified" },
      { id: "ri5", ingredient: "Caramel Colour E150d", qtyRequired: 2.5, qtyFetched: 2.5, unit: "kg", lotNo: "CCOL-24-033", expiryDate: "2026-03-20", location: "RM-A05", status: "verified" },
      { id: "ri6", ingredient: "Citric Acid", qtyRequired: 1.5, qtyFetched: 1.5, unit: "kg", lotNo: "CA-24-067", expiryDate: "2026-01-10", location: "RM-A07", status: "verified" },
    ],
  },
  {
    id: "req2",
    bomId: "bom4",
    bomName: "BOM-BB-004",
    woId: "wo4",
    woName: "WO-2025-004",
    product: "Bourbon Bluez",
    variant: "330ml Can",
    batchQty: 12000,
    status: "prepared",
    requestedBy: "Sarah K.",
    requestedAt: "2025-01-15T05:00:00Z",
    preparedBy: "Raj P.",
    preparedAt: "2025-01-15T05:20:00Z",
    items: [
      { id: "ri7", ingredient: "Cola Concentrate", qtyRequired: 180.0, qtyFetched: 180.0, unit: "L", lotNo: "CC-24-112", expiryDate: "2026-06-01", location: "RM-A12", status: "verified" },
      { id: "ri8", ingredient: "Sugar Syrup", qtyRequired: 360.0, qtyFetched: 360.0, unit: "L", lotNo: "SS-24-089", expiryDate: "2025-12-15", location: "RM-B03", status: "verified" },
      { id: "ri9", ingredient: "Ethanol 96%", qtyRequired: 660.0, qtyFetched: 660.0, unit: "L", lotNo: "ETH-24-045", expiryDate: "2026-01-31", location: "RM-E02", status: "verified" },
      { id: "ri10", ingredient: "Purified Water", qtyRequired: 10500.0, qtyFetched: 10500.0, unit: "L", lotNo: "PW-25-004", expiryDate: "2025-04-01", location: "RM-C01", status: "verified" },
      { id: "ri11", ingredient: "CO2", qtyRequired: 110.0, qtyFetched: 110.0, unit: "kg", lotNo: "CO2-24-056", expiryDate: "2025-12-31", location: "RM-D04", status: "verified" },
    ],
  },
  {
    id: "req3",
    bomId: "bom2",
    bomName: "BOM-IC-002",
    woId: "wo2",
    woName: "WO-2025-002",
    product: "Island Chill Original",
    variant: "1L Bottle",
    batchQty: 3000,
    status: "approved",
    requestedBy: "Sarah K.",
    requestedAt: "2025-01-15T07:30:00Z",
    items: [
      { id: "ri12", ingredient: "Cola Concentrate", qtyRequired: 90.0, qtyFetched: 0, unit: "L", location: "RM-A12", status: "pending" },
      { id: "ri13", ingredient: "Sugar Syrup", qtyRequired: 180.0, qtyFetched: 0, unit: "L", location: "RM-B03", status: "pending" },
      { id: "ri14", ingredient: "Purified Water", qtyRequired: 2730.0, qtyFetched: 0, unit: "L", location: "RM-C01", status: "pending" },
    ],
  },
  {
    id: "req4",
    bomId: "bom3",
    bomName: "BOM-IC-003",
    woId: "wo3",
    woName: "WO-2025-003",
    product: "Bourbon Bluez",
    variant: "500ml Bottle",
    batchQty: 5000,
    status: "draft",
    requestedBy: "Lisa T.",
    requestedAt: "2025-01-15T08:00:00Z",
    items: [
      { id: "ri15", ingredient: "Cola Concentrate", qtyRequired: 125.0, qtyFetched: 0, unit: "L", location: "RM-A12", status: "pending" },
      { id: "ri16", ingredient: "Sugar Syrup", qtyRequired: 250.0, qtyFetched: 0, unit: "L", location: "RM-B03", status: "pending" },
      { id: "ri17", ingredient: "Ethanol 96%", qtyRequired: 275.0, qtyFetched: 0, unit: "L", location: "RM-E02", status: "pending" },
      { id: "ri18", ingredient: "Purified Water", qtyRequired: 4350.0, qtyFetched: 0, unit: "L", location: "RM-C01", status: "pending" },
      { id: "ri19", ingredient: "CO2", qtyRequired: 45.0, qtyFetched: 0, unit: "kg", location: "RM-D04", status: "pending" },
    ],
  },
];

// ── WORKFLOW / JOB ALLOCATION ───────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  name: string;
  role: string;
  roleIcon: string;
  order: number;
  status: "pending" | "active" | "completed" | "skipped";
  assignedTo?: string;
  assignedAt?: string;
  completedAt?: string;
  duration?: number;
  role2?: string;
}

export interface WorkflowInstance {
  id: string;
  woId: string;
  woName: string;
  steps: WorkflowStep[];
  currentStepIndex: number;
}

export const workflows: WorkflowInstance[] = [
  {
    id: "wf1",
    woId: "wo1",
    woName: "WO-2025-001",
    currentStepIndex: 3,
    steps: [
      { id: "ws1", name: "WO Created", role: "Planner", roleIcon: "clipboard", order: 1, status: "completed", assignedTo: "Sarah K.", assignedAt: "06:00", completedAt: "06:05", duration: 5 },
      { id: "ws2", name: "BOM Requisition", role: "Ingredient Mixer", roleIcon: "beaker", order: 2, status: "completed", assignedTo: "Raj P.", assignedAt: "05:00", completedAt: "05:45", duration: 45 },
      { id: "ws3", name: "Maintenance Clearance", role: "Maintenance", roleIcon: "wrench", order: 3, status: "completed", assignedTo: "Dave R.", assignedAt: "06:00", completedAt: "06:45", duration: 45 },
      { id: "ws4", name: "QC Pre-start Check", role: "QC Inspector", roleIcon: "flask", order: 4, status: "completed", assignedTo: "Priya N.", assignedAt: "06:45", completedAt: "07:00", duration: 15 },
      { id: "ws5", name: "Production Start", role: "Operator", roleIcon: "factory", order: 5, status: "completed", assignedTo: "John M.", assignedAt: "07:00", completedAt: "07:30", duration: 30 },
      { id: "ws6", name: "In-Process QC", role: "QC Inspector", roleIcon: "flask", order: 6, status: "active", assignedTo: "Priya N.", assignedAt: "07:30" },
      { id: "ws7", name: "Production Complete", role: "Operator", roleIcon: "factory", order: 7, status: "pending", role2: "Supervisor" },
      { id: "ws8", name: "Final QC Release", role: "QC Inspector", roleIcon: "flask", order: 8, status: "pending" },
      { id: "ws9", name: "Warehouse Receipt", role: "Warehouse", roleIcon: "warehouse", order: 9, status: "pending" },
      { id: "ws10", name: "WO Closed", role: "Supervisor", roleIcon: "shield", order: 10, status: "pending" },
    ],
  },
  {
    id: "wf2",
    woId: "wo4",
    woName: "WO-2025-004",
    currentStepIndex: 5,
    steps: [
      { id: "ws11", name: "WO Created", role: "Planner", roleIcon: "clipboard", order: 1, status: "completed", assignedTo: "Sarah K.", assignedAt: "05:30", completedAt: "05:32", duration: 2 },
      { id: "ws12", name: "BOM Requisition", role: "Ingredient Mixer", roleIcon: "beaker", order: 2, status: "completed", assignedTo: "Raj P.", assignedAt: "05:00", completedAt: "05:20", duration: 20 },
      { id: "ws13", name: "Maintenance Clearance", role: "Maintenance", roleIcon: "wrench", order: 3, status: "completed", assignedTo: "Dave R.", assignedAt: "05:30", completedAt: "05:50", duration: 20 },
      { id: "ws14", name: "QC Pre-start Check", role: "QC Inspector", roleIcon: "flask", order: 4, status: "completed", assignedTo: "Priya N.", assignedAt: "05:50", completedAt: "06:00", duration: 10 },
      { id: "ws15", name: "Production Start", role: "Operator", roleIcon: "factory", order: 5, status: "completed", assignedTo: "Mike R.", assignedAt: "06:00", completedAt: "06:00", duration: 0 },
      { id: "ws16", name: "In-Process QC", role: "QC Inspector", roleIcon: "flask", order: 6, status: "active", assignedTo: "Priya N.", assignedAt: "06:00" },
      { id: "ws17", name: "Production Complete", role: "Operator", roleIcon: "factory", order: 7, status: "pending" },
      { id: "ws18", name: "Final QC Release", role: "QC Inspector", roleIcon: "flask", order: 8, status: "pending" },
      { id: "ws19", name: "Warehouse Receipt", role: "Warehouse", roleIcon: "warehouse", order: 9, status: "pending" },
      { id: "ws20", name: "WO Closed", role: "Supervisor", roleIcon: "shield", order: 10, status: "pending" },
    ],
  },
  {
    id: "wf3",
    woId: "wo2",
    woName: "WO-2025-002",
    currentStepIndex: 0,
    steps: [
      { id: "ws21", name: "WO Created", role: "Planner", roleIcon: "clipboard", order: 1, status: "completed", assignedTo: "Sarah K.", assignedAt: "08:00", completedAt: "08:01", duration: 1 },
      { id: "ws22", name: "BOM Requisition", role: "Ingredient Mixer", roleIcon: "beaker", order: 2, status: "pending" },
      { id: "ws23", name: "Maintenance Clearance", role: "Maintenance", roleIcon: "wrench", order: 3, status: "pending" },
      { id: "ws24", name: "QC Pre-start Check", role: "QC Inspector", roleIcon: "flask", order: 4, status: "pending" },
      { id: "ws25", name: "Production Start", role: "Operator", roleIcon: "factory", order: 5, status: "pending" },
      { id: "ws26", name: "In-Process QC", role: "QC Inspector", roleIcon: "flask", order: 6, status: "pending" },
      { id: "ws27", name: "Production Complete", role: "Operator", roleIcon: "factory", order: 7, status: "pending" },
      { id: "ws28", name: "Final QC Release", role: "QC Inspector", roleIcon: "flask", order: 8, status: "pending" },
      { id: "ws29", name: "Warehouse Receipt", role: "Warehouse", roleIcon: "warehouse", order: 9, status: "pending" },
      { id: "ws30", name: "WO Closed", role: "Supervisor", roleIcon: "shield", order: 10, status: "pending" },
    ],
  },
];

// ── MES FORMS (General) ─────────────────────────────────────────────────────

export interface MESForm {
  id: string;
  code: string;
  title: string;
  category: string;
  subcategory: string;
  version: string;
  active: boolean;
  fields: number;
  attachments: number;
  lastUpdated: string;
}

export const mesForms: MESForm[] = [
  { id: "mf1", code: "F-001", title: "Production Start Checklist", category: "Production", subcategory: "Start-up", version: "v2.1", active: true, fields: 12, attachments: 2, lastUpdated: "2025-01-01" },
  { id: "mf2", code: "F-002", title: "Shift Handover Log", category: "Production", subcategory: "Shift", version: "v1.3", active: true, fields: 8, attachments: 1, lastUpdated: "2025-01-01" },
  { id: "mf3", code: "F-003", title: "Changeover Record", category: "Production", subcategory: "Changeover", version: "v3.0", active: true, fields: 15, attachments: 3, lastUpdated: "2025-01-01" },
  { id: "mf4", code: "F-004", title: "Line Clearance Checklist", category: "Production", subcategory: "Clearance", version: "v1.5", active: true, fields: 10, attachments: 2, lastUpdated: "2025-01-01" },
  { id: "mf5", code: "F-005", title: "Process Loss Record", category: "Production", subcategory: "Loss", version: "v2.0", active: true, fields: 6, attachments: 1, lastUpdated: "2025-01-01" },
  { id: "mf6", code: "F-006", title: "CIP Verification Form", category: "Quality", subcategory: "Hygiene", version: "v4.1", active: true, fields: 14, attachments: 2, lastUpdated: "2025-01-01" },
  { id: "mf7", code: "F-007", title: "HACCP Monitoring Log", category: "Quality", subcategory: "HACCP", version: "v2.2", active: true, fields: 20, attachments: 4, lastUpdated: "2025-01-01" },
  { id: "mf8", code: "F-008", title: "Non-Conformance Report", category: "Quality", subcategory: "NCR", version: "v1.8", active: true, fields: 10, attachments: 3, lastUpdated: "2025-01-01" },
  { id: "mf9", code: "F-009", title: "Calibration Record", category: "Quality", subcategory: "Calibration", version: "v3.2", active: true, fields: 8, attachments: 2, lastUpdated: "2025-01-01" },
  { id: "mf10", code: "F-010", title: "Internal Audit Checklist", category: "Quality", subcategory: "Audit", version: "v1.0", active: true, fields: 25, attachments: 5, lastUpdated: "2025-01-01" },
  { id: "mf11", code: "F-011", title: "Equipment PM Record", category: "Maintenance", subcategory: "PM", version: "v2.5", active: true, fields: 16, attachments: 3, lastUpdated: "2025-01-01" },
  { id: "mf12", code: "F-012", title: "Breakdown Report", category: "Maintenance", subcategory: "Breakdown", version: "v1.4", active: true, fields: 12, attachments: 2, lastUpdated: "2025-01-01" },
  { id: "mf13", code: "F-013", title: "Spare Parts Requisition", category: "Maintenance", subcategory: "Spares", version: "v1.1", active: true, fields: 8, attachments: 1, lastUpdated: "2025-01-01" },
  { id: "mf14", code: "F-014", title: "Goods Receipt Note", category: "Warehouse", subcategory: "Inbound", version: "v2.0", active: true, fields: 10, attachments: 2, lastUpdated: "2025-01-01" },
  { id: "mf15", code: "F-015", title: "Dispatch Note", category: "Warehouse", subcategory: "Outbound", version: "v1.9", active: true, fields: 8, attachments: 1, lastUpdated: "2025-01-01" },
  { id: "mf16", code: "F-016", title: "Stock Adjustment Form", category: "Warehouse", subcategory: "Inventory", version: "v1.2", active: true, fields: 6, attachments: 1, lastUpdated: "2025-01-01" },
  { id: "mf17", code: "F-017", title: "Incident Investigation", category: "Safety", subcategory: "Incident", version: "v2.3", active: true, fields: 18, attachments: 4, lastUpdated: "2025-01-01" },
  { id: "mf18", code: "F-018", title: "Near Miss Report", category: "Safety", subcategory: "Near Miss", version: "v1.0", active: true, fields: 10, attachments: 2, lastUpdated: "2025-01-01" },
  { id: "mf19", code: "F-019", title: "PPE Inspection Checklist", category: "Safety", subcategory: "PPE", version: "v1.1", active: true, fields: 8, attachments: 1, lastUpdated: "2025-01-01" },
  { id: "mf20", code: "F-020", title: "Training Attendance Log", category: "HR", subcategory: "Training", version: "v1.0", active: true, fields: 5, attachments: 1, lastUpdated: "2025-01-01" },
];


// ── ROLES & PERMISSIONS ─────────────────────────────────────────────────────

export interface PermissionModule {
  id: string;
  name: string;
  submodules: PermissionSubmodule[];
}

export interface PermissionSubmodule {
  id: string;
  name: string;
  moduleId: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  color: string;
  builtIn: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  active: boolean;
  lastLogin?: string;
  permissions: string[]; // submodule IDs
}

export const permissionModules: PermissionModule[] = [
  {
    id: "ops",
    name: "Operations",
    submodules: [
      { id: "ops-dashboard", name: "Dashboard", moduleId: "ops" },
      { id: "ops-wo", name: "Work Orders (View)", moduleId: "ops" },
      { id: "ops-wo-create", name: "Create Work Order", moduleId: "ops" },
      { id: "ops-incidents", name: "View Incidents", moduleId: "ops" },
      { id: "ops-incidents-report", name: "Report Incidents", moduleId: "ops" },
      { id: "ops-incidents-investigate", name: "Investigate Incidents", moduleId: "ops" },
      { id: "ops-warehouse", name: "Warehouse", moduleId: "ops" },
      { id: "ops-qc", name: "Quality Control", moduleId: "ops" },
      { id: "ops-flowmap", name: "Flow Map", moduleId: "ops" },
      { id: "ops-twin", name: "Digital Twin", moduleId: "ops" },
      { id: "ops-mobile", name: "Mobile Plan", moduleId: "ops" },
      { id: "ops-maint-schedule", name: "Maintenance Schedule", moduleId: "ops" },
      { id: "ops-mixer", name: "BOM Requisitions", moduleId: "ops" },
      { id: "ops-mixer-execute", name: "Pick & Deliver Ingredients", moduleId: "ops" },
    ],
  },
  {
    id: "admin",
    name: "Administration",
    submodules: [
      { id: "admin-dashboard", name: "Admin Dashboard", moduleId: "admin" },
      { id: "admin-lines", name: "Lines & Equipment", moduleId: "admin" },
      { id: "admin-products", name: "Products", moduleId: "admin" },
      { id: "admin-boms", name: "BOMs", moduleId: "admin" },
      { id: "admin-forms", name: "Forms", moduleId: "admin" },
      { id: "admin-workflow", name: "Workflow", moduleId: "admin" },
      { id: "admin-users", name: "Users & Privileges", moduleId: "admin" },
      { id: "admin-reports", name: "Reports", moduleId: "admin" },
      { id: "admin-settings", name: "Settings", moduleId: "admin" },
    ],
  },
];

// All available permission IDs
export const allPermissionIds = permissionModules.flatMap((m) => m.submodules.map((s) => s.id));

// Built-in role definitions (Administrator can create/edit these)
// Rational permission matrix by job function:
// - Operator: view WOs, execute assigned jobs, VIEW incidents, REPORT incidents only
// - QC Inspector: QC checks, VIEW incidents, REPORT incidents only
// - Warehouse Supervisor: warehouse ops, VIEW incidents, REPORT incidents only
// - Maintenance Supervisor: equipment, twin, VIEW + REPORT + INVESTIGATE incidents
// - Production Supervisor: floor oversight, VIEW + REPORT + INVESTIGATE incidents, allocate
// - Factory Manager: all ops + admin reports
// - Planner: production planning, create WOs, workflow, BOMs
// - Administrator: full system access
export const builtInRoles: RoleDefinition[] = [
  {
    id: "role-admin",
    name: "Administrator",
    description: "Full system access. Can manage users, roles, and all modules.",
    permissions: allPermissionIds,
    color: "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
    builtIn: true,
  },
  {
    id: "role-factory-manager",
    name: "Factory Manager",
    description: "Manages all production operations. Can create work orders, investigate incidents, and view reports.",
    permissions: [
      "ops-dashboard", "ops-wo", "ops-wo-create",
      "ops-incidents", "ops-incidents-report", "ops-incidents-investigate",
      "ops-warehouse", "ops-qc", "ops-flowmap", "ops-twin", "ops-mobile", "ops-maint-schedule",
      "ops-mixer", "ops-mixer-execute",
      "admin-reports",
    ],
    color: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/30",
    builtIn: true,
  },
  {
    id: "role-production-supervisor",
    name: "Production Supervisor",
    description: "Oversees production floor. Can investigate incidents, manage WOs, and view QC.",
    permissions: [
      "ops-dashboard", "ops-wo", "ops-qc", "ops-flowmap", "ops-twin", "ops-maint-schedule",
      "ops-incidents", "ops-incidents-report", "ops-incidents-investigate",
      "ops-mixer",
    ],
    color: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
    builtIn: true,
  },
  {
    id: "role-qc-inspector",
    name: "QC Inspector",
    description: "Handles quality checks and QC forms. Can view and report incidents but not investigate.",
    permissions: [
      "ops-dashboard", "ops-qc", "ops-flowmap",
      "ops-incidents", "ops-incidents-report",
    ],
    color: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
    builtIn: true,
  },
  {
    id: "role-maintenance-supervisor",
    name: "Maintenance Supervisor",
    description: "Manages equipment, pre-start checks, digital twin, and investigates maintenance-related incidents.",
    permissions: [
      "ops-dashboard", "ops-wo", "ops-flowmap", "ops-twin", "ops-maint-schedule",
      "ops-incidents", "ops-incidents-report", "ops-incidents-investigate",
    ],
    color: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
    builtIn: true,
  },
  {
    id: "role-warehouse-supervisor",
    name: "Warehouse Supervisor",
    description: "Manages inventory, stock movements, and warehouse operations. Can report incidents.",
    permissions: [
      "ops-dashboard", "ops-warehouse", "ops-flowmap",
      "ops-incidents", "ops-incidents-report",
    ],
    color: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30",
    builtIn: true,
  },
  {
    id: "role-operator",
    name: "Operator",
    description: "Executes assigned job cards and views WOs. Can report incidents on their line only.",
    permissions: [
      "ops-dashboard", "ops-wo",
      "ops-incidents", "ops-incidents-report",
    ],
    color: "bg-gray-50 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border-gray-200 dark:border-slate-800",
    builtIn: true,
  },
  {
    id: "role-planner",
    name: "Planner",
    description: "Plans production schedules, creates WOs, manages BOMs and workflow configuration.",
    permissions: [
      "ops-dashboard", "ops-wo", "ops-wo-create", "ops-flowmap", "ops-maint-schedule",
      "admin-workflow", "admin-boms", "admin-products",
    ],
    color: "bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30",
    builtIn: true,
  },
  {
    id: "role-mixer",
    name: "Ingredient Mixer",
    description: "Fetches raw materials from store per BOM requisition, verifies quantities, and delivers to production.",
    permissions: [
      "ops-dashboard", "ops-mixer", "ops-mixer-execute", "ops-flowmap",
    ],
    color: "bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/30",
    builtIn: true,
  },
];

// Helper: get permissions for a role name
export function getRolePermissions(roleName: string): string[] {
  const role = builtInRoles.find((r) => r.name === roleName);
  return role ? role.permissions : [];
}

// Helper: get role color class
export function getRoleColor(roleName: string): string {
  const role = builtInRoles.find((r) => r.name === roleName);
  return role ? role.color : "bg-gray-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-gray-200 dark:border-slate-700";
}

// Default home route by role name
export const defaultRouteByRole: Record<string, string> = {
  "Administrator": "/admin",
  "Factory Manager": "/",
  "Production Supervisor": "/",
  "QC Inspector": "/qc",
  "Maintenance Supervisor": "/maint-schedule",
  "Warehouse Supervisor": "/warehouse",
  "Operator": "/",
  "Planner": "/workorders",
  "Ingredient Mixer": "/requisitions",
};

export const appUsers: AppUser[] = [
  { id: "u1", name: "Admin User", email: "admin@islandchill.com", role: "Administrator", avatar: "AU", active: true, lastLogin: "2025-01-15 08:00", permissions: getRolePermissions("Administrator") },
  { id: "u2", name: "Sarah K.", email: "sarah@islandchill.com", role: "Factory Manager", avatar: "SK", active: true, lastLogin: "2025-01-15 07:45", permissions: getRolePermissions("Factory Manager") },
  { id: "u3", name: "Mike R.", email: "mike@islandchill.com", role: "Production Supervisor", avatar: "MR", active: true, lastLogin: "2025-01-14 18:30", permissions: getRolePermissions("Production Supervisor") },
  { id: "u4", name: "Priya N.", email: "priya@islandchill.com", role: "QC Inspector", avatar: "PN", active: true, lastLogin: "2025-01-15 06:00", permissions: getRolePermissions("QC Inspector") },
  { id: "u5", name: "Dave R.", email: "dave@islandchill.com", role: "Maintenance Supervisor", avatar: "DR", active: true, lastLogin: "2025-01-15 05:30", permissions: getRolePermissions("Maintenance Supervisor") },
  { id: "u6", name: "Carlos M.", email: "carlos@islandchill.com", role: "Warehouse Supervisor", avatar: "CM", active: true, lastLogin: "2025-01-14 16:00", permissions: getRolePermissions("Warehouse Supervisor") },
  { id: "u7", name: "John M.", email: "john@islandchill.com", role: "Operator", avatar: "JM", active: true, lastLogin: "2025-01-15 07:00", permissions: getRolePermissions("Operator") },
  { id: "u8", name: "Lisa T.", email: "lisa@islandchill.com", role: "Planner", avatar: "LT", active: true, lastLogin: "2025-01-15 08:15", permissions: getRolePermissions("Planner") },
  { id: "u9", name: "Tom H.", email: "tom@islandchill.com", role: "Operator", avatar: "TH", active: false, permissions: getRolePermissions("Operator") },
  { id: "u10", name: "Raj P.", email: "raj@islandchill.com", role: "Ingredient Mixer", avatar: "RP", active: true, lastLogin: "2025-01-15 05:30", permissions: getRolePermissions("Ingredient Mixer") },
];
