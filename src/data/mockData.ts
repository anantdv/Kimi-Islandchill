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
  cameraId?: string;
  analytics?: {
    defectRate: number;
    throughput: number;
    uptime: number;
  };
}

// ── IOT SENSORS ─────────────────────────────────────────────────────────────

export interface IoTSensor {
  id: string;
  lineId: string;
  sensorType: "temperature" | "pressure" | "flow_rate" | "vibration" | "humidity" | "co2" | "ph" | "tds" | "turbidity" | "conductivity";
  sensorName: string;
  unit: string;
  currentValue: number;
  minSafe: number;
  maxSafe: number;
  status: "normal" | "warning" | "critical";
  lastReading: string;
  trend: "up" | "down" | "stable";
}

export interface IoTAlert {
  id: string;
  sensorId: string;
  lineId: string;
  message: string;
  severity: "info" | "warning" | "critical";
  triggeredAt: string;
  acknowledged: boolean;
}

export interface ProductionAnalytics {
  lineId: string;
  timestamp: string;
  bottlesProduced: number;
  rejectCount: number;
  throughput: number;
  defectRate: number;
  fillLevelVariance: number; // percentage
  capTorqueAverage: number;
  labelPlacementAccuracy: number; // percentage
  lineSpeed: number;
}

export interface FlowVersion {
  id: string;
  savedAt: string;
  savedBy?: string;
  nodes: DSSFlowNode[];
  edges: DSSFlowEdge[];
}

export interface WorkOrder {
  id: string;
  name: string;
  product: string;
  variant: string;
  qty: number;
  uom: string;
  fillingLine: string;
  bomId?: string;
  status: "draft" | "in_process" | "completed" | "cancelled";
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  jobCards: JobCard[];
  qcChecks: QCCheck[];
  incidents: Incident[];
  processLoss?: number;
  extraGoods?: number;
  processFlow?: { nodes: DSSFlowNode[]; edges: DSSFlowEdge[] };
  flowVersions?: FlowVersion[];
  flowModifiedAt?: string;
  flowModifiedBy?: string;
}

export interface JobCard {
  id: string;
  operation: string;
  status: "pending" | "in_progress" | "on_hold" | "completed";
  operator?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  forQuantity?: number;
  totalCompletedQty?: number;
  isPaused?: boolean;
  qcForms?: { form_doctype: string; form_name: string; status: string; required?: number }[];
  timeLogs?: any[];
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
  category: "raw_material" | "finished_good" | "dispatch";
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
  storageTemp: { min: number; max: number }; // mandatory storage temperature range in °C
  // RM-specific: container tracking
  containerType?: "drum" | "ibc_tote" | "square_box" | "bulk_bag" | "case" | "pallet";
  volume?: { current: number; capacity: number; unit: string }; // for liquid RM
  concentration?: string; // e.g. "40% v/v" for ethanol mixtures
  // FG-specific: case/pallet tracking
  casesPerPallet?: number;
  palletCount?: number;
}

export const productFamilies: ProductFamily[] = [
  {
    id: "pf1",
    name: "Bourbon Bluez",
    category: "RTD Cocktail",
    image: "/bourbon-can.png",
    variants: [
      { id: "v100", name: "330ml Can", sku: "BB-330-CAN", size: "330ml", uom: "Can", image: "/bourbon-can.png", bomId: "BOM-BB-330" },
      { id: "v101", name: "275ml Bottle", sku: "BB-275-BTL", size: "275ml", uom: "Bottle", image: "/bourbon-bottle.png", bomId: "BOM-BB-275" },
    ],
  },
  {
    id: "pf2",
    name: "Crush Cola",
    category: "Carbonated Soft Drink",
    image: "/water-1500ml.png",
    variants: [
      { id: "v102", name: "2.5L PET", sku: "CC-2500-PET", size: "2.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Cola 2.5L-001" },
      { id: "v103", name: "1.5L PET", sku: "CC-1500-PET", size: "1.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Cola 1.5L-002" },
      { id: "v104", name: "1L PET", sku: "CC-1000-PET", size: "1L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Cola 1L-003" },
      { id: "v105", name: "600ml PET", sku: "CC-600-PET", size: "600ml", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Cola 600ml-004" },
      { id: "v106", name: "500ml PET", sku: "CC-500-PET", size: "500ml", uom: "Box", image: "/water-500ml.png", bomId: "BOM-Crush Cola 500ml-005" },
      { id: "v107", name: "330ml Can", sku: "CC-330-CAN", size: "330ml", uom: "Box", image: "/bourbon-can.png", bomId: "BOM-Crush Cola 330ml-006" },
    ],
  },
  {
    id: "pf3",
    name: "Crush Fruit Cocktail",
    category: "Carbonated Soft Drink",
    image: "/water-1500ml.png",
    variants: [
      { id: "v108", name: "2.5L PET", sku: "FC-2500-PET", size: "2.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Fruit Cocktail 2.5L-002" },
      { id: "v109", name: "1.5L PET", sku: "FC-1500-PET", size: "1.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Fruit Cocktail 1.5L-002" },
      { id: "v110", name: "1L PET", sku: "FC-1000-PET", size: "1L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Fruit Cocktail 1L-003" },
      { id: "v111", name: "600ml PET", sku: "FC-600-PET", size: "600ml", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Fruit Cocktail 600ml-004" },
      { id: "v112", name: "500ml PET", sku: "FC-500-PET", size: "500ml", uom: "Box", image: "/water-500ml.png", bomId: "BOM-Crush Fruit Cocktail 500ml-005" },
      { id: "v113", name: "330ml Can", sku: "FC-330-CAN", size: "330ml", uom: "Box", image: "/bourbon-can.png", bomId: "BOM-Crush Fruit Cocktail 330ml-006" },
    ],
  },
  {
    id: "pf4",
    name: "Crush Grape",
    category: "Carbonated Soft Drink",
    image: "/water-1500ml.png",
    variants: [
      { id: "v114", name: "2.5L PET", sku: "CG-2500-PET", size: "2.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Grape 2.5L-001" },
      { id: "v115", name: "1.5L PET", sku: "CG-1500-PET", size: "1.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Grape 1.5L-002" },
      { id: "v116", name: "1L PET", sku: "CG-1000-PET", size: "1L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Grape 1L-003" },
    ],
  },
  {
    id: "pf5",
    name: "Crush Lemon Lime",
    category: "Carbonated Soft Drink",
    image: "/water-1500ml.png",
    variants: [
      { id: "v117", name: "2.5L PET", sku: "CL-2500-PET", size: "2.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Lemon Lime 2.5L-001" },
      { id: "v118", name: "1.5L PET", sku: "CL-1500-PET", size: "1.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Lemon Lime 1.5L-002" },
      { id: "v119", name: "1L PET", sku: "CL-1000-PET", size: "1L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Lemon Lime 1L-003" },
      { id: "v120", name: "600ml PET", sku: "CL-600-PET", size: "600ml", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Lemon Lime 600ml-004" },
    ],
  },
  {
    id: "pf6",
    name: "Crush Orange",
    category: "Carbonated Soft Drink",
    image: "/water-1500ml.png",
    variants: [
      { id: "v121", name: "2.5L PET", sku: "CO-2500-PET", size: "2.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Orange 2.5L-001" },
      { id: "v122", name: "1.5L PET", sku: "CO-1500-PET", size: "1.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Orange 1.5L-002" },
      { id: "v123", name: "1L PET", sku: "CO-1000-PET", size: "1L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Orange 1L-003" },
      { id: "v124", name: "600ml PET", sku: "CO-600-PET", size: "600ml", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Orange 600ml-004" },
      { id: "v125", name: "500ml PET", sku: "CO-500-PET", size: "500ml", uom: "Box", image: "/water-500ml.png", bomId: "BOM-Crush Orange 500ml-005" },
      { id: "v126", name: "330ml Can", sku: "CO-330-CAN", size: "330ml", uom: "Box", image: "/bourbon-can.png", bomId: "BOM-Crush Orange 330ml-006" },
    ],
  },
  {
    id: "pf7",
    name: "Crush Pineapple",
    category: "Carbonated Soft Drink",
    image: "/water-1500ml.png",
    variants: [
      { id: "v127", name: "2.5L PET", sku: "CP-2500-PET", size: "2.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Pineapple 2.5L-001" },
      { id: "v128", name: "1.5L PET", sku: "CP-1500-PET", size: "1.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Pineapple 1.5L-002" },
      { id: "v129", name: "1L PET", sku: "CP-1000-PET", size: "1L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Pineapple 1L-003" },
      { id: "v130", name: "600ml PET", sku: "CP-600-PET", size: "600ml", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Pineapple 600ml-004" },
      { id: "v131", name: "500ml PET", sku: "CP-500-PET", size: "500ml", uom: "Box", image: "/water-500ml.png", bomId: "BOM-Crush Pineapple 500ml-005" },
      { id: "v132", name: "330ml Can", sku: "CP-330-CAN", size: "330ml", uom: "Box", image: "/bourbon-can.png", bomId: "BOM-Crush Pineapple 330ml-006" },
    ],
  },
  {
    id: "pf8",
    name: "Island Chill Soda",
    category: "Sparkling Water",
    image: "/water-1500ml.png",
    variants: [
      { id: "v133", name: "1.5L PET", sku: "SW-1500-PET", size: "1.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Island Chill Soda 1.5L-001" },
      { id: "v134", name: "500ml PET", sku: "SW-500-PET", size: "500ml", uom: "Box", image: "/water-500ml.png", bomId: "BOM-Island Chill Soda 500ml-002" },
      { id: "v135", name: "2L PET", sku: "SW-2000-PET", size: "2L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Island Chill Soda 2L-003" },
    ],
  },
  {
    id: "pf9",
    name: "Crush Strawberry",
    category: "Carbonated Soft Drink",
    image: "/water-1500ml.png",
    variants: [
      { id: "v136", name: "2.5L PET", sku: "CS-2500-PET", size: "2.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Strawberry 2.5L-001" },
      { id: "v137", name: "1.5L PET", sku: "CS-1500-PET", size: "1.5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Strawberry 1.5L-002" },
      { id: "v138", name: "1L PET", sku: "CS-1000-PET", size: "1L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Strawberry 1L-003" },
      { id: "v139", name: "600ml PET", sku: "CS-600-PET", size: "600ml", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Crush Strawberry 600ml-004" },
      { id: "v140", name: "500ml PET", sku: "CS-500-PET", size: "500ml", uom: "Box", image: "/water-500ml.png", bomId: "BOM-Crush Strawberry 500ml-005" },
      { id: "v141", name: "330ml Can", sku: "CS-330-CAN", size: "330ml", uom: "Box", image: "/bourbon-can.png", bomId: "BOM-Crush Strawberry 330ml-006" },
    ],
  },
  {
    id: "pf10",
    name: "Island Water",
    category: "Still Water",
    image: "/water-330ml.png",
    variants: [
      { id: "v142", name: "330ml PET", sku: "IW-330-PET", size: "330ml", uom: "Bottle", image: "/water-330ml.png", bomId: "BOM-IW-330" },
      { id: "v143", name: "500ml PET", sku: "IW-500-PET", size: "500ml", uom: "Bottle", image: "/water-500ml.png", bomId: "BOM-IW-500" },
      { id: "v144", name: "1.5L PET", sku: "IW-1500-PET", size: "1.5L", uom: "Bottle", image: "/water-1500ml.png", bomId: "BOM-IW-1500" },
      { id: "v145", name: "750ml PET", sku: "IW-750-PET", size: "750ml", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Island Chill Water 750ml-001" },
      { id: "v146", name: "1L PET", sku: "IW-1000-PET", size: "1L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Island Chill Water 1L-002" },
      { id: "v147", name: "2L PET", sku: "IW-2000-PET", size: "2L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Island Chill Water 2L-003" },
      { id: "v148", name: "5L PET", sku: "IW-5000-PET", size: "5L", uom: "Box", image: "/water-1500ml.png", bomId: "BOM-Island Chill Water 5L-004" },
    ],
  },
];

export const fillingLines: FillingLine[] = [
  { id: "fl1", name: "FL1 - Water Line A", status: "running", currentWo: "WO-2025-001", speed: 280, efficiency: 94.5, cameraId: "CAM-FL1-01", analytics: { defectRate: 0.3, throughput: 16800, uptime: 94.5 } },
  { id: "fl2", name: "FL2 - Water Line B", status: "idle", speed: 0, efficiency: 0, cameraId: "CAM-FL2-01", analytics: { defectRate: 0, throughput: 0, uptime: 0 } },
  { id: "fl3", name: "FL3 - CSD Line A", status: "running", currentWo: undefined, speed: 220, efficiency: 88.5, cameraId: "CAM-FL3-01", analytics: { defectRate: 0.8, throughput: 13200, uptime: 88.5 } },
  { id: "fl4", name: "FL4 - RTD Line", status: "running", currentWo: "WO-2025-004", speed: 180, efficiency: 91.2, cameraId: "CAM-FL4-01", analytics: { defectRate: 0.5, throughput: 10800, uptime: 91.2 } },
  { id: "fl5", name: "FL5 - CSD Line B", status: "idle", speed: 0, efficiency: 0, cameraId: "CAM-FL5-01", analytics: { defectRate: 0, throughput: 0, uptime: 0 } },
  { id: "fl6", name: "FL6 - Soda Water Line", status: "idle", speed: 0, efficiency: 0, cameraId: "CAM-FL6-01", analytics: { defectRate: 0, throughput: 0, uptime: 0 } },
  { id: "fl7", name: "FL7 - Canning Line", status: "idle", speed: 0, efficiency: 0, cameraId: "CAM-FL7-01", analytics: { defectRate: 0, throughput: 0, uptime: 0 } },
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
    bomId: "BOM-IW-500",
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
    incidents: [
      { id: "inc2", type: "Quality Alert", severity: "critical", description: "pH reading 8.1 exceeds max limit 7.5 on FL1", line: "FL1", status: "open", raisedAt: "10:05" },
    ],
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
    bomId: "BOM-IW-330",
    status: "draft",
    progress: 0,
    createdAt: "2025-01-15T08:00:00Z",
    jobCards: [],
    qcChecks: [],
    incidents: [
      { id: "inc3", type: "Material Shortage", severity: "medium", description: "330ml labels running low — 2000 remaining", line: "FL2", status: "open", raisedAt: "08:30" },
    ],
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
    bomId: "BOM-IW-1500",
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
    bomId: "BOM-BB-330",
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
  {
    id: "wo5",
    name: "WO-2025-005",
    product: "Crush Cola",
    variant: "2.5L PET",
    qty: 100,
    uom: "Box",
    fillingLine: "FL3 - CSD Line A",
    bomId: "BOM-Crush Cola 2.5L-001",
    status: "draft",
    progress: 0,
    createdAt: "2025-01-16T06:00:00Z",
    jobCards: [],
    qcChecks: [],
    incidents: [],
    processLoss: 0,
    extraGoods: 0,
  },
  {
    id: "wo6",
    name: "WO-2025-006",
    product: "Crush Orange",
    variant: "1.5L PET",
    qty: 200,
    uom: "Box",
    fillingLine: "FL5 - CSD Line B",
    bomId: "BOM-Crush Orange 1.5L-002",
    status: "in_process",
    progress: 35,
    createdAt: "2025-01-16T05:00:00Z",
    startedAt: "2025-01-16T05:30:00Z",
    jobCards: [
      { id: "jc12", operation: "Syrup Preparation", status: "completed", operator: "Mike R.", startedAt: "05:30", completedAt: "06:45", duration: 75 },
      { id: "jc13", operation: "Mixing & Carbonation", status: "in_progress", operator: "Sarah K.", startedAt: "06:45" },
      { id: "jc14", operation: "Filling & Capping", status: "pending" },
      { id: "jc15", operation: "Labelling", status: "pending" },
      { id: "jc16", operation: "Palletising", status: "pending" },
    ],
    qcChecks: [
      { id: "qc9", parameter: "Brix", frequency: "Every 30 min", dueAt: "07:15", status: "passed", value: "10.5", min: 10.0, max: 11.0 },
      { id: "qc10", parameter: "CO2 Volume", frequency: "Every 60 min", dueAt: "07:30", status: "pending", min: 3.5, max: 4.5 },
      { id: "qc11", parameter: "pH Level", frequency: "Every 30 min", dueAt: "07:15", status: "passed", value: "3.2", min: 3.0, max: 3.5 },
    ],
    incidents: [],
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
  // ── Finished Goods ───────────────────────────────────────────────────────────
  {
    id: "z1", name: "Cold Store A", type: "refrigerated", category: "finished_good", temp: 4.2, humidity: 65, capacity: 5000, used: 3200,
    items: [
      { id: "zi1", product: "Island Water 500ml", batch: "B-20250115-A", qty: 1200, uom: "Case", expiry: "2026-01-15", storageTemp: { min: 2, max: 8 }, containerType: "case", casesPerPallet: 72, palletCount: 17 },
      { id: "zi2", product: "Bourbon Bluez 330ml", batch: "B-20250114-B", qty: 800, uom: "Case", expiry: "2026-01-14", storageTemp: { min: 2, max: 8 }, containerType: "case", casesPerPallet: 96, palletCount: 9 },
    ],
  },
  {
    id: "z2", name: "Cold Store B", type: "refrigerated", category: "finished_good", temp: 3.8, humidity: 62, capacity: 5000, used: 1800,
    items: [
      { id: "zi3", product: "Island Water 1.5L", batch: "B-20250113-C", qty: 600, uom: "Case", expiry: "2026-01-13", storageTemp: { min: 2, max: 8 }, containerType: "case", casesPerPallet: 48, palletCount: 13 },
    ],
  },
  {
    id: "z3", name: "Ambient FG Store", type: "ambient", category: "finished_good", temp: 22.1, humidity: 45, capacity: 8000, used: 4500,
    items: [
      { id: "zi4", product: "Island Water 330ml", batch: "B-20250112-D", qty: 2000, uom: "Case", expiry: "2027-01-12", storageTemp: { min: 15, max: 30 }, containerType: "case", casesPerPallet: 96, palletCount: 21 },
      { id: "zi5", product: "Bourbon Bluez 275ml", batch: "B-20250111-E", qty: 1500, uom: "Case", expiry: "2026-07-11", storageTemp: { min: 15, max: 30 }, containerType: "case", casesPerPallet: 96, palletCount: 16 },
    ],
  },
  {
    id: "z4", name: "Quarantine", type: "quarantine", category: "finished_good", temp: 5.0, humidity: 60, capacity: 500, used: 150,
    items: [
      { id: "zi6", product: "Island Water 500ml", batch: "B-20250115-Q", qty: 150, uom: "Case", expiry: "2026-01-15", storageTemp: { min: 2, max: 8 }, containerType: "case", casesPerPallet: 72, palletCount: 3 },
    ],
  },
  {
    id: "z5", name: "Dispatch Dock", type: "ambient", category: "dispatch", temp: 24.0, humidity: 50, capacity: 2000, used: 800,
    items: [
      { id: "zi7", product: "Island Water 500ml", batch: "B-20250110-D", qty: 400, uom: "Case", expiry: "2026-01-10", storageTemp: { min: 15, max: 30 }, containerType: "case", casesPerPallet: 72, palletCount: 6 },
      { id: "zi8", product: "Bourbon Bluez 330ml", batch: "B-20250109-D", qty: 400, uom: "Case", expiry: "2026-01-09", storageTemp: { min: 15, max: 30 }, containerType: "case", casesPerPallet: 96, palletCount: 5 },
    ],
  },
  // ── Raw Materials ────────────────────────────────────────────────────────────
  {
    id: "z6", name: "RM Liquid Store", type: "ambient", category: "raw_material", temp: 23.0, humidity: 48, capacity: 4000, used: 2400,
    items: [
      { id: "zi9", product: "Raw Sugar", batch: "SUG-2408", qty: 500, uom: "kg", expiry: "2026-08-15", storageTemp: { min: 15, max: 30 }, containerType: "bulk_bag" },
      { id: "zi10", product: "Cola Flavouring Concentrate", batch: "FLV-2409", qty: 200, uom: "L", expiry: "2025-09-10", storageTemp: { min: 10, max: 25 }, containerType: "ibc_tote", volume: { current: 180, capacity: 275, unit: "L" }, concentration: "100% v/v" },
      { id: "zi11", product: "Orange Flavouring", batch: "FLV-OR-2410", qty: 120, uom: "L", expiry: "2025-10-20", storageTemp: { min: 10, max: 25 }, containerType: "drum", volume: { current: 95, capacity: 200, unit: "L" } },
      { id: "zi12", product: "Ethanol (40% v/v)", batch: "ETH-2407", qty: 1000, uom: "L", expiry: "2027-01-15", storageTemp: { min: 15, max: 30 }, containerType: "ibc_tote", volume: { current: 820, capacity: 1000, unit: "L" }, concentration: "40% v/v" },
      { id: "zi13", product: "Citric Acid", batch: "CA-2406", qty: 25, uom: "kg", expiry: "2026-06-01", storageTemp: { min: 15, max: 30 }, containerType: "square_box" },
      { id: "zi14", product: "Sodium Benzoate", batch: "SB-2405", qty: 50, uom: "kg", expiry: "2026-12-01", storageTemp: { min: 15, max: 30 }, containerType: "square_box" },
      { id: "zi15", product: "CO2 Gas", batch: "CO2-2411", qty: 500, uom: "kg", expiry: "2026-03-01", storageTemp: { min: 10, max: 30 }, containerType: "drum", volume: { current: 420, capacity: 500, unit: "kg" } },
    ],
  },
  {
    id: "z7", name: "RM Packaging Store", type: "ambient", category: "raw_material", temp: 24.5, humidity: 50, capacity: 3000, used: 1200,
    items: [
      { id: "zi16", product: "PET Bottles 500ml", batch: "PET-500-2412", qty: 50000, uom: "units", expiry: "2027-01-01", storageTemp: { min: 15, max: 35 }, containerType: "pallet", palletCount: 25 },
      { id: "zi17", product: "PET Bottles 1.5L", batch: "PET-1500-2412", qty: 20000, uom: "units", expiry: "2027-01-01", storageTemp: { min: 15, max: 35 }, containerType: "pallet", palletCount: 10 },
      { id: "zi18", product: "Aluminium Cans 330ml", batch: "CAN-330-2411", qty: 100000, uom: "units", expiry: "2027-06-01", storageTemp: { min: 15, max: 35 }, containerType: "pallet", palletCount: 40 },
      { id: "zi19", product: "Caps & Closures", batch: "CAP-2412", qty: 150000, uom: "units", expiry: "2027-03-01", storageTemp: { min: 15, max: 35 }, containerType: "pallet", palletCount: 15 },
      { id: "zi20", product: "Shrink Wrap Film", batch: "WRAP-2410", qty: 500, uom: "rolls", expiry: "2026-12-01", storageTemp: { min: 15, max: 35 }, containerType: "pallet", palletCount: 5 },
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
  recipeClass: string;
  fgStockQty?: number;
  productFamilyId?: string; // ← linked product family
  productVariantId?: string; // ← linked variant
  flowTemplateId?: string; // ← linked DSS flow template
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
    recipeClass: "Water",
    productFamilyId: "pf10",
    productVariantId: "v142",
    flowTemplateId: "tpl-water-001",
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
    recipeClass: "Water",
    productFamilyId: "pf10",
    productVariantId: "v143",
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
    recipeClass: "Water",
    productFamilyId: "pf10",
    productVariantId: "v144",
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
    recipeClass: "Bourbon Bluez",
    productFamilyId: "pf1",
    productVariantId: "v100",
    flowTemplateId: "tpl-bourbon-001",
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
    recipeClass: "Bourbon Bluez",
    productFamilyId: "pf1",
    productVariantId: "v101",
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
  {
    id: "BOM-Crush Cola 2.5L-001",
    name: "Crush Cola 2.5L",
    variant: "2.5L PET",
    sku: "CC-2500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Cola",
    productFamilyId: "pf2",
    productVariantId: "v102",
    flowTemplateId: "tpl-cola-001",
    fgStockQty: 100,
    items: [
      { id: "bi1000", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 17.5755, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1001", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 2.333, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1002", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.006, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1003", itemCode: "FLV-Cola", itemName: "Cola Flavor", itemType: "additive", qty: 0.062, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1004", itemCode: "ACD-Cola", itemName: "Cola Acidulant", itemType: "additive", qty: 0.0212, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1005", itemCode: "FLV-LemonLime", itemName: "Lemon Lime", itemType: "additive", qty: 0.002, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1006", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 80.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1007", itemCode: "PKG-Preform105g", itemName: "No. of 105g Preforms", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1008", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1009", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Cola", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1010", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1011", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Cola 1.5L-002",
    name: "Crush Cola 1.5L",
    variant: "1.5L PET",
    sku: "CC-1500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Cola",
    productFamilyId: "pf2",
    productVariantId: "v103",
    fgStockQty: 240,
    items: [
      { id: "bi1012", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 7.909, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1013", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.0498, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1014", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0027, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1015", itemCode: "FLV-Cola", itemName: "Cola Flavor", itemType: "additive", qty: 0.0279, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1016", itemCode: "ACD-Cola", itemName: "Cola Acidulant", itemType: "additive", qty: 0.0095, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1017", itemCode: "FLV-LemonLime", itemName: "Lemon Lime", itemType: "additive", qty: 0.0009, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1018", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 36.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1019", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1020", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1021", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Cola", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1022", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1023", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Cola 1L-003",
    name: "Crush Cola 1L",
    variant: "1L PET",
    sku: "CC-1000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Cola",
    productFamilyId: "pf2",
    productVariantId: "v104",
    fgStockQty: 0,
    items: [
      { id: "bi1024", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1025", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.3998, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1026", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0036, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1027", itemCode: "FLV-Cola", itemName: "Cola Flavor", itemType: "additive", qty: 0.0372, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1028", itemCode: "ACD-Cola", itemName: "Cola Acidulant", itemType: "additive", qty: 0.0127, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1029", itemCode: "FLV-LemonLime", itemName: "Lemon Lime", itemType: "additive", qty: 0.0012, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1030", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 48.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1031", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1032", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1033", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Cola", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1034", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1035", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Cola 600ml-004",
    name: "Crush Cola 600ml",
    variant: "600ml PET",
    sku: "CC-600-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Cola",
    productFamilyId: "pf2",
    productVariantId: "v105",
    fgStockQty: 0,
    items: [
      { id: "bi1036", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 12.6544, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1037", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.6798, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1038", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0043, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1039", itemCode: "FLV-Cola", itemName: "Cola Flavor", itemType: "additive", qty: 0.0446, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1040", itemCode: "ACD-Cola", itemName: "Cola Acidulant", itemType: "additive", qty: 0.0153, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1041", itemCode: "FLV-LemonLime", itemName: "Lemon Lime", itemType: "additive", qty: 0.0014, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1042", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 57.6, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1043", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1044", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1045", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Cola", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1046", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1047", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Cola 500ml-005",
    name: "Crush Cola 500ml",
    variant: "500ml PET",
    sku: "CC-500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Cola",
    productFamilyId: "pf2",
    productVariantId: "v106",
    fgStockQty: 240,
    items: [
      { id: "bi1048", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 5.2727, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1049", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.6999, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1050", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0018, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1051", itemCode: "FLV-Cola", itemName: "Cola Flavor", itemType: "additive", qty: 0.0186, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1052", itemCode: "ACD-Cola", itemName: "Cola Acidulant", itemType: "additive", qty: 0.0064, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1053", itemCode: "FLV-LemonLime", itemName: "Lemon Lime", itemType: "additive", qty: 0.0006, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1054", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 24.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1055", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1056", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1057", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Cola", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1058", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1059", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Cola 330ml-006",
    name: "Crush Cola 330ml",
    variant: "330ml Can",
    sku: "CC-330-CAN",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Cola",
    productFamilyId: "pf2",
    productVariantId: "v107",
    fgStockQty: 25,
    items: [
      { id: "bi1060", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 6.9599, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1061", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.9239, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1062", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0024, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1063", itemCode: "FLV-Cola", itemName: "Cola Flavor", itemType: "additive", qty: 0.0246, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1064", itemCode: "ACD-Cola", itemName: "Cola Acidulant", itemType: "additive", qty: 0.0084, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1065", itemCode: "FLV-LemonLime", itemName: "Lemon Lime", itemType: "additive", qty: 0.0008, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1066", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 31.68, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1067", itemCode: "PKG-330Can", itemName: "330ml Aluminium Can", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1068", itemCode: "PKG-Lid330", itemName: "Can Lid 202", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1069", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Cola", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1070", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1071", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Orange 2.5L-001",
    name: "Crush Orange 2.5L",
    variant: "2.5L PET",
    sku: "CO-2500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Orange",
    productFamilyId: "pf6",
    productVariantId: "v121",
    fgStockQty: 0,
    items: [
      { id: "bi1072", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 17.5755, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1073", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 2.333, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1074", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.006, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1075", itemCode: "FLV-Orange", itemName: "Orange Flavor", itemType: "additive", qty: 0.062, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1076", itemCode: "ACD-Orange", itemName: "Orange Acidulant", itemType: "additive", qty: 0.0212, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1077", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 80.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1078", itemCode: "PKG-Preform105g", itemName: "No. of 105g Preforms", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1079", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1080", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Orange", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1081", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1082", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Orange 1.5L-002",
    name: "Crush Orange 1.5L",
    variant: "1.5L PET",
    sku: "CO-1500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Orange",
    productFamilyId: "pf6",
    productVariantId: "v122",
    fgStockQty: 0,
    items: [
      { id: "bi1083", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 7.909, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1084", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.0498, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1085", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0027, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1086", itemCode: "FLV-Orange", itemName: "Orange Flavor", itemType: "additive", qty: 0.0279, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1087", itemCode: "ACD-Orange", itemName: "Orange Acidulant", itemType: "additive", qty: 0.0095, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1088", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 36.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1089", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1090", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1091", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Orange", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1092", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1093", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Orange 1L-003",
    name: "Crush Orange 1L",
    variant: "1L PET",
    sku: "CO-1000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Orange",
    productFamilyId: "pf6",
    productVariantId: "v123",
    fgStockQty: 0,
    items: [
      { id: "bi1094", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1095", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.3998, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1096", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0036, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1097", itemCode: "FLV-Orange", itemName: "Orange Flavor", itemType: "additive", qty: 0.0372, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1098", itemCode: "ACD-Orange", itemName: "Orange Acidulant", itemType: "additive", qty: 0.0127, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1099", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 48.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1100", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1101", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1102", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Orange", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1103", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1104", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Orange 600ml-004",
    name: "Crush Orange 600ml",
    variant: "600ml PET",
    sku: "CO-600-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Orange",
    productFamilyId: "pf6",
    productVariantId: "v124",
    fgStockQty: 240,
    items: [
      { id: "bi1105", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 12.6544, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1106", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.6798, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1107", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0043, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1108", itemCode: "FLV-Orange", itemName: "Orange Flavor", itemType: "additive", qty: 0.0446, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1109", itemCode: "ACD-Orange", itemName: "Orange Acidulant", itemType: "additive", qty: 0.0153, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1110", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 57.6, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1111", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1112", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1113", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Orange", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1114", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1115", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Orange 500ml-005",
    name: "Crush Orange 500ml",
    variant: "500ml PET",
    sku: "CO-500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Orange",
    productFamilyId: "pf6",
    productVariantId: "v125",
    fgStockQty: 0,
    items: [
      { id: "bi1116", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 5.2727, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1117", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.6999, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1118", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0018, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1119", itemCode: "FLV-Orange", itemName: "Orange Flavor", itemType: "additive", qty: 0.0186, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1120", itemCode: "ACD-Orange", itemName: "Orange Acidulant", itemType: "additive", qty: 0.0064, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1121", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 24.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1122", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1123", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1124", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Orange", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1125", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1126", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Orange 330ml-006",
    name: "Crush Orange 330ml",
    variant: "330ml Can",
    sku: "CO-330-CAN",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Orange",
    productFamilyId: "pf6",
    productVariantId: "v126",
    fgStockQty: 240,
    items: [
      { id: "bi1127", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 6.9599, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1128", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.9239, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1129", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0024, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1130", itemCode: "FLV-Orange", itemName: "Orange Flavor", itemType: "additive", qty: 0.0246, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1131", itemCode: "ACD-Orange", itemName: "Orange Acidulant", itemType: "additive", qty: 0.0084, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1132", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 31.68, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1133", itemCode: "PKG-330Can", itemName: "330ml Aluminium Can", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1134", itemCode: "PKG-Lid330", itemName: "Can Lid 202", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1135", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Orange", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1136", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1137", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Pineapple 2.5L-001",
    name: "Crush Pineapple 2.5L",
    variant: "2.5L PET",
    sku: "CP-2500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Pineapple",
    productFamilyId: "pf7",
    productVariantId: "v127",
    fgStockQty: 240,
    items: [
      { id: "bi1138", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 17.5755, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1139", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 2.333, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1140", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.006, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1141", itemCode: "FLV-Pineapple", itemName: "Pineapple Flavor", itemType: "additive", qty: 0.062, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1142", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0212, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1143", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 80.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1144", itemCode: "PKG-Preform105g", itemName: "No. of 105g Preforms", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1145", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1146", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Pineapple", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1147", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1148", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Pineapple 1.5L-002",
    name: "Crush Pineapple 1.5L",
    variant: "1.5L PET",
    sku: "CP-1500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Pineapple",
    productFamilyId: "pf7",
    productVariantId: "v128",
    fgStockQty: 120,
    items: [
      { id: "bi1149", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 7.909, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1150", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.0498, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1151", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0027, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1152", itemCode: "FLV-Pineapple", itemName: "Pineapple Flavor", itemType: "additive", qty: 0.0279, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1153", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0095, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1154", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 36.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1155", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1156", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1157", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Pineapple", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1158", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1159", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Pineapple 1L-003",
    name: "Crush Pineapple 1L",
    variant: "1L PET",
    sku: "CP-1000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Pineapple",
    productFamilyId: "pf7",
    productVariantId: "v129",
    fgStockQty: 0,
    items: [
      { id: "bi1160", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1161", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.3998, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1162", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0036, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1163", itemCode: "FLV-Pineapple", itemName: "Pineapple Flavor", itemType: "additive", qty: 0.0372, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1164", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0127, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1165", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 48.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1166", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1167", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1168", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Pineapple", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1169", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1170", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Pineapple 600ml-004",
    name: "Crush Pineapple 600ml",
    variant: "600ml PET",
    sku: "CP-600-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Pineapple",
    productFamilyId: "pf7",
    productVariantId: "v130",
    fgStockQty: 120,
    items: [
      { id: "bi1171", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 12.6544, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1172", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.6798, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1173", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0043, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1174", itemCode: "FLV-Pineapple", itemName: "Pineapple Flavor", itemType: "additive", qty: 0.0446, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1175", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0153, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1176", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 57.6, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1177", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1178", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1179", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Pineapple", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1180", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1181", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Pineapple 500ml-005",
    name: "Crush Pineapple 500ml",
    variant: "500ml PET",
    sku: "CP-500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Pineapple",
    productFamilyId: "pf7",
    productVariantId: "v131",
    fgStockQty: 50,
    items: [
      { id: "bi1182", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 5.2727, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1183", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.6999, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1184", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0018, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1185", itemCode: "FLV-Pineapple", itemName: "Pineapple Flavor", itemType: "additive", qty: 0.0186, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1186", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0064, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1187", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 24.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1188", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1189", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1190", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Pineapple", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1191", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1192", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Pineapple 330ml-006",
    name: "Crush Pineapple 330ml",
    variant: "330ml Can",
    sku: "CP-330-CAN",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Pineapple",
    productFamilyId: "pf7",
    productVariantId: "v132",
    fgStockQty: 0,
    items: [
      { id: "bi1193", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 6.9599, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1194", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.9239, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1195", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0024, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1196", itemCode: "FLV-Pineapple", itemName: "Pineapple Flavor", itemType: "additive", qty: 0.0246, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1197", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0084, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1198", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 31.68, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1199", itemCode: "PKG-330Can", itemName: "330ml Aluminium Can", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1200", itemCode: "PKG-Lid330", itemName: "Can Lid 202", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1201", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Pineapple", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1202", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1203", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Strawberry 2.5L-001",
    name: "Crush Strawberry 2.5L",
    variant: "2.5L PET",
    sku: "CS-2500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Strawberry",
    productFamilyId: "pf9",
    productVariantId: "v136",
    fgStockQty: 0,
    items: [
      { id: "bi1204", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 17.5755, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1205", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 2.333, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1206", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.006, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1207", itemCode: "FLV-Strawberry", itemName: "Strawberry Flavor", itemType: "additive", qty: 0.062, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1208", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0212, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1209", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 80.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1210", itemCode: "PKG-Preform105g", itemName: "No. of 105g Preforms", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1211", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1212", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Strawberry", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1213", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1214", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Strawberry 1.5L-002",
    name: "Crush Strawberry 1.5L",
    variant: "1.5L PET",
    sku: "CS-1500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Strawberry",
    productFamilyId: "pf9",
    productVariantId: "v137",
    fgStockQty: 0,
    items: [
      { id: "bi1215", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 7.909, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1216", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.0498, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1217", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0027, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1218", itemCode: "FLV-Strawberry", itemName: "Strawberry Flavor", itemType: "additive", qty: 0.0279, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1219", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0095, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1220", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 36.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1221", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1222", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1223", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Strawberry", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1224", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1225", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Strawberry 1L-003",
    name: "Crush Strawberry 1L",
    variant: "1L PET",
    sku: "CS-1000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Strawberry",
    productFamilyId: "pf9",
    productVariantId: "v138",
    fgStockQty: 0,
    items: [
      { id: "bi1226", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1227", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.3998, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1228", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0036, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1229", itemCode: "FLV-Strawberry", itemName: "Strawberry Flavor", itemType: "additive", qty: 0.0372, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1230", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0127, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1231", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 48.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1232", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1233", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1234", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Strawberry", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1235", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1236", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Strawberry 600ml-004",
    name: "Crush Strawberry 600ml",
    variant: "600ml PET",
    sku: "CS-600-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Strawberry",
    productFamilyId: "pf9",
    productVariantId: "v139",
    fgStockQty: 0,
    items: [
      { id: "bi1237", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 12.6544, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1238", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.6798, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1239", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0043, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1240", itemCode: "FLV-Strawberry", itemName: "Strawberry Flavor", itemType: "additive", qty: 0.0446, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1241", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0153, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1242", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 57.6, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1243", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1244", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1245", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Strawberry", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1246", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1247", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Strawberry 500ml-005",
    name: "Crush Strawberry 500ml",
    variant: "500ml PET",
    sku: "CS-500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Strawberry",
    productFamilyId: "pf9",
    productVariantId: "v140",
    fgStockQty: 120,
    items: [
      { id: "bi1248", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 5.2727, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1249", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.6999, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1250", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0018, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1251", itemCode: "FLV-Strawberry", itemName: "Strawberry Flavor", itemType: "additive", qty: 0.0186, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1252", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0064, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1253", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 24.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1254", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1255", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1256", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Strawberry", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1257", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1258", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Strawberry 330ml-006",
    name: "Crush Strawberry 330ml",
    variant: "330ml Can",
    sku: "CS-330-CAN",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Strawberry",
    productFamilyId: "pf9",
    productVariantId: "v141",
    fgStockQty: 120,
    items: [
      { id: "bi1259", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 6.9599, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1260", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.9239, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1261", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0024, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1262", itemCode: "FLV-Strawberry", itemName: "Strawberry Flavor", itemType: "additive", qty: 0.0246, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1263", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0084, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1264", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 31.68, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1265", itemCode: "PKG-330Can", itemName: "330ml Aluminium Can", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1266", itemCode: "PKG-Lid330", itemName: "Can Lid 202", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1267", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Strawberry", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1268", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1269", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Fruit Cocktail 2.5L-002",
    name: "Crush Fruit Cocktail 2.5L",
    variant: "2.5L PET",
    sku: "FC-2500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Fruit Cocktail",
    productFamilyId: "pf3",
    productVariantId: "v108",
    fgStockQty: 195,
    items: [
      { id: "bi1270", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 17.5755, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1271", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 2.333, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1272", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.006, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1273", itemCode: "FLV-FruitCocktail", itemName: "Fruit Cocktail Flavor", itemType: "additive", qty: 0.062, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1274", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0212, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1275", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 80.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1276", itemCode: "PKG-Preform105g", itemName: "No. of 105g Preforms", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1277", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1278", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Fruit Cocktail", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1279", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1280", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Fruit Cocktail 1.5L-002",
    name: "Crush Fruit Cocktail 1.5L",
    variant: "1.5L PET",
    sku: "FC-1500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Fruit Cocktail",
    productFamilyId: "pf3",
    productVariantId: "v109",
    fgStockQty: 0,
    items: [
      { id: "bi1281", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 7.909, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1282", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.0498, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1283", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0027, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1284", itemCode: "FLV-FruitCocktail", itemName: "Fruit Cocktail Flavor", itemType: "additive", qty: 0.0279, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1285", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0095, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1286", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 36.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1287", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1288", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1289", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Fruit Cocktail", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1290", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1291", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Fruit Cocktail 1L-003",
    name: "Crush Fruit Cocktail 1L",
    variant: "1L PET",
    sku: "FC-1000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Fruit Cocktail",
    productFamilyId: "pf3",
    productVariantId: "v110",
    fgStockQty: 120,
    items: [
      { id: "bi1292", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1293", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.3998, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1294", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0036, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1295", itemCode: "FLV-FruitCocktail", itemName: "Fruit Cocktail Flavor", itemType: "additive", qty: 0.0372, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1296", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0127, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1297", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 48.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1298", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1299", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1300", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Fruit Cocktail", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1301", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1302", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Fruit Cocktail 600ml-004",
    name: "Crush Fruit Cocktail 600ml",
    variant: "600ml PET",
    sku: "FC-600-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Fruit Cocktail",
    productFamilyId: "pf3",
    productVariantId: "v111",
    fgStockQty: 0,
    items: [
      { id: "bi1303", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 12.6544, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1304", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.6798, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1305", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0043, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1306", itemCode: "FLV-FruitCocktail", itemName: "Fruit Cocktail Flavor", itemType: "additive", qty: 0.0446, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1307", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0153, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1308", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 57.6, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1309", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1310", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1311", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Fruit Cocktail", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1312", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1313", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Fruit Cocktail 500ml-005",
    name: "Crush Fruit Cocktail 500ml",
    variant: "500ml PET",
    sku: "FC-500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Fruit Cocktail",
    productFamilyId: "pf3",
    productVariantId: "v112",
    fgStockQty: 240,
    items: [
      { id: "bi1314", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 5.2727, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1315", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.6999, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1316", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0018, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1317", itemCode: "FLV-FruitCocktail", itemName: "Fruit Cocktail Flavor", itemType: "additive", qty: 0.0186, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1318", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0064, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1319", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 24.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1320", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1321", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1322", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Fruit Cocktail", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1323", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1324", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Fruit Cocktail 330ml-006",
    name: "Crush Fruit Cocktail 330ml",
    variant: "330ml Can",
    sku: "FC-330-CAN",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Fruit Cocktail",
    productFamilyId: "pf3",
    productVariantId: "v113",
    fgStockQty: 240,
    items: [
      { id: "bi1325", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 6.9599, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1326", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 0.9239, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1327", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0024, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1328", itemCode: "FLV-FruitCocktail", itemName: "Fruit Cocktail Flavor", itemType: "additive", qty: 0.0246, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1329", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0084, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1330", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 31.68, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1331", itemCode: "PKG-330Can", itemName: "330ml Aluminium Can", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1332", itemCode: "PKG-Lid330", itemName: "Can Lid 202", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1333", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Fruit Cocktail", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1334", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1335", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Lemon Lime 2.5L-001",
    name: "Crush Lemon Lime 2.5L",
    variant: "2.5L PET",
    sku: "CL-2500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Lemon Lime",
    productFamilyId: "pf5",
    productVariantId: "v117",
    fgStockQty: 240,
    items: [
      { id: "bi1336", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 17.5755, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1337", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 2.333, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1338", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.006, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1339", itemCode: "FLV-LemonLime", itemName: "Lemon Lime Flavor", itemType: "additive", qty: 0.062, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1340", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0212, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1341", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 80.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1342", itemCode: "PKG-Preform105g", itemName: "No. of 105g Preforms", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1343", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1344", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Lemon Lime", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1345", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1346", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Lemon Lime 1.5L-002",
    name: "Crush Lemon Lime 1.5L",
    variant: "1.5L PET",
    sku: "CL-1500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Lemon Lime",
    productFamilyId: "pf5",
    productVariantId: "v118",
    fgStockQty: 120,
    items: [
      { id: "bi1347", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 7.909, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1348", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.0498, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1349", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0027, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1350", itemCode: "FLV-LemonLime", itemName: "Lemon Lime Flavor", itemType: "additive", qty: 0.0279, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1351", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0095, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1352", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 36.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1353", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1354", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1355", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Lemon Lime", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1356", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1357", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Lemon Lime 1L-003",
    name: "Crush Lemon Lime 1L",
    variant: "1L PET",
    sku: "CL-1000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Lemon Lime",
    productFamilyId: "pf5",
    productVariantId: "v119",
    fgStockQty: 50,
    items: [
      { id: "bi1358", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1359", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.3998, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1360", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0036, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1361", itemCode: "FLV-LemonLime", itemName: "Lemon Lime Flavor", itemType: "additive", qty: 0.0372, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1362", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0127, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1363", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 48.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1364", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1365", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1366", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Lemon Lime", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1367", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1368", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Lemon Lime 600ml-004",
    name: "Crush Lemon Lime 600ml",
    variant: "600ml PET",
    sku: "CL-600-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Lemon Lime",
    productFamilyId: "pf5",
    productVariantId: "v120",
    fgStockQty: 0,
    items: [
      { id: "bi1369", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 12.6544, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1370", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.6798, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1371", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0043, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1372", itemCode: "FLV-LemonLime", itemName: "Lemon Lime Flavor", itemType: "additive", qty: 0.0446, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1373", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0153, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1374", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 57.6, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1375", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1376", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1377", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Lemon Lime", itemType: "packaging", qty: 24.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1378", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1379", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Grape 2.5L-001",
    name: "Crush Grape 2.5L",
    variant: "2.5L PET",
    sku: "CG-2500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Grape",
    productFamilyId: "pf4",
    productVariantId: "v114",
    fgStockQty: 50,
    items: [
      { id: "bi1380", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 17.5755, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1381", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 2.333, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1382", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.006, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1383", itemCode: "FLV-Grape", itemName: "Grape Flavor", itemType: "additive", qty: 0.062, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1384", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0212, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1385", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 80.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1386", itemCode: "PKG-Preform105g", itemName: "No. of 105g Preforms", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1387", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1388", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Grape", itemType: "packaging", qty: 8.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1389", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1390", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Grape 1.5L-002",
    name: "Crush Grape 1.5L",
    variant: "1.5L PET",
    sku: "CG-1500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Grape",
    productFamilyId: "pf4",
    productVariantId: "v115",
    fgStockQty: 120,
    items: [
      { id: "bi1391", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 7.909, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1392", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.0498, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1393", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0027, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1394", itemCode: "FLV-Grape", itemName: "Grape Flavor", itemType: "additive", qty: 0.0279, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1395", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0095, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1396", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 36.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1397", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1398", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1399", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Grape", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1400", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1401", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Crush Grape 1L-003",
    name: "Crush Grape 1L",
    variant: "1L PET",
    sku: "CG-1000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Grape",
    productFamilyId: "pf4",
    productVariantId: "v116",
    fgStockQty: 25,
    items: [
      { id: "bi1402", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1403", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", qty: 1.3998, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1404", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", qty: 0.0036, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1405", itemCode: "FLV-Grape", itemName: "Grape Flavor", itemType: "additive", qty: 0.0372, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1406", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", qty: 0.0127, uom: "Kg", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1407", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 48.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1408", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1409", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1410", itemCode: "PKG-LabelCSD", itemName: "Labels - Crush Grape", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1411", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1412", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Island Chill Soda 1.5L-001",
    name: "Island Chill Soda 1.5L",
    variant: "1.5L PET",
    sku: "SW-1500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Soda Water",
    productFamilyId: "pf8",
    productVariantId: "v133",
    fgStockQty: 480,
    items: [
      { id: "bi1413", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 7.909, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1414", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 1.35, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1415", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 36.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1416", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1417", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1418", itemCode: "PKG-LabelIW", itemName: "Island Chill Label", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1419", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1420", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Island Chill Soda 500ml-002",
    name: "Island Chill Soda 500ml",
    variant: "500ml PET",
    sku: "SW-500-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Soda Water",
    productFamilyId: "pf8",
    productVariantId: "v134",
    fgStockQty: 480,
    items: [
      { id: "bi1421", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 5.2727, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1422", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 0.9, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1423", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 24.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1424", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1425", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1426", itemCode: "PKG-LabelIW", itemName: "Island Chill Label", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1427", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1428", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Island Chill Soda 2L-003",
    name: "Island Chill Soda 2L",
    variant: "2L PET",
    sku: "SW-2000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Soda Water",
    productFamilyId: "pf8",
    productVariantId: "v135",
    fgStockQty: 0,
    items: [
      { id: "bi1429", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1430", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 1.8, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1431", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", qty: 48.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1432", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1433", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1434", itemCode: "PKG-LabelIW", itemName: "Island Chill Label", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1435", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1436", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Island Chill Water 750ml-001",
    name: "Island Chill Water 750ml",
    variant: "750ml PET",
    sku: "IW-750-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Water",
    productFamilyId: "pf10",
    productVariantId: "v145",
    fgStockQty: 480,
    items: [
      { id: "bi1437", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 7.909, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1438", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 1.35, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1439", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1440", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1441", itemCode: "PKG-LabelIW", itemName: "Island Chill Label", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1442", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1443", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Island Chill Water 1L-002",
    name: "Island Chill Water 1L",
    variant: "1L PET",
    sku: "IW-1000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Water",
    productFamilyId: "pf10",
    productVariantId: "v146",
    fgStockQty: 480,
    items: [
      { id: "bi1444", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1445", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 1.8, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1446", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1447", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1448", itemCode: "PKG-LabelIW", itemName: "Island Chill Label", itemType: "packaging", qty: 12.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1449", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1450", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Island Chill Water 2L-003",
    name: "Island Chill Water 2L",
    variant: "2L PET",
    sku: "IW-2000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Water",
    productFamilyId: "pf10",
    productVariantId: "v147",
    fgStockQty: 0,
    items: [
      { id: "bi1451", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 10.5453, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1452", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 1.8, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1453", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1454", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1455", itemCode: "PKG-LabelIW", itemName: "Island Chill Label", itemType: "packaging", qty: 6.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1456", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1457", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
  {
    id: "BOM-Island Chill Water 5L-004",
    name: "Island Chill Water 5L",
    variant: "5L PET",
    sku: "IW-5000-PET",
    status: "active",
    revision: "Rev 1",
    effectiveDate: "2025-01-01",
    quantity: 1,
    uom: "Box",
    recipeClass: "Water",
    productFamilyId: "pf10",
    productVariantId: "v148",
    fgStockQty: 240,
    items: [
      { id: "bi1458", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", qty: 17.5755, uom: "L", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1459", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", qty: 3.0, uom: "g", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1460", itemCode: "PKG-Preform120g", itemName: "No. of 120g Preforms", itemType: "packaging", qty: 4.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1461", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", qty: 4.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1462", itemCode: "PKG-LabelIW", itemName: "Island Chill Label", itemType: "packaging", qty: 4.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1463", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", qty: 1.0, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
      { id: "bi1464", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", qty: 0.0165, uom: "EACH", scrapAllowance: 1.0, costPerUnit: 0.05 },
    ],
  },
];


// ── ITEM MASTER (synced from ERPNext) ───────────────────────────────────────

export interface ItemMaster {
  id: string;
  itemCode: string;
  itemName: string;
  itemType: "raw_material" | "packaging" | "additive" | "co2" | "finished_good";
  uom: string;
  stockQty: number;
  reorderLevel: number;
  warehouse: string;
  lotNo?: string;
  expiryDate?: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  costPerUnit: number;
  defaultSupplier?: string;
}

export const itemMaster: ItemMaster[] = [
  // Raw Materials
  { id: "im1", itemCode: "RM-Water", itemName: "Purified Water", itemType: "raw_material", uom: "L", stockQty: 125000, reorderLevel: 20000, warehouse: "Stores - RM", lotNo: "PW-25-004", expiryDate: "2025-04-01", status: "in_stock", costPerUnit: 0.0012, defaultSupplier: "Island Water Supply Co." },
  { id: "im2", itemCode: "RM-Bourbon", itemName: "Bourbon Spirit", itemType: "raw_material", uom: "L", stockQty: 8500, reorderLevel: 1500, warehouse: "Stores - RM", lotNo: "BRB-25-001", expiryDate: "2026-01-31", status: "in_stock", costPerUnit: 0.045, defaultSupplier: "Southern Distillers Ltd" },
  { id: "im3", itemCode: "RM-Flavour", itemName: "Blueberry Flavouring", itemType: "raw_material", uom: "L", stockQty: 420, reorderLevel: 100, warehouse: "Stores - RM", lotNo: "BLU-25-001", expiryDate: "2025-11-15", status: "in_stock", costPerUnit: 0.12, defaultSupplier: "FlavorTech International" },
  // Additives
  { id: "im4", itemCode: "ADD-Mineral", itemName: "Mineral Blend", itemType: "additive", uom: "kg", stockQty: 850, reorderLevel: 150, warehouse: "Stores - RM", lotNo: "MIN-25-001", expiryDate: "2026-05-01", status: "in_stock", costPerUnit: 0.8, defaultSupplier: "NutriChem Supplies" },
  // CO2
  { id: "im5", itemCode: "CO2-Gas", itemName: "Food Grade CO2", itemType: "co2", uom: "kg", stockQty: 5200, reorderLevel: 800, warehouse: "Stores - RM", lotNo: "CO2-24-056", expiryDate: "2025-12-31", status: "in_stock", costPerUnit: 0.003, defaultSupplier: "GasCorp Industrial" },
  // Packaging — PET Bottles
  { id: "im6", itemCode: "PKG-330PET", itemName: "330ml PET Bottle", itemType: "packaging", uom: "pc", stockQty: 125000, reorderLevel: 25000, warehouse: "Stores - PKG", lotNo: "BTL-25-010", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 0.085, defaultSupplier: "PlastPack Industries" },
  { id: "im7", itemCode: "PKG-500PET", itemName: "500ml PET Bottle", itemType: "packaging", uom: "pc", stockQty: 98000, reorderLevel: 20000, warehouse: "Stores - PKG", lotNo: "BTL-25-011", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 0.095, defaultSupplier: "PlastPack Industries" },
  { id: "im8", itemCode: "PKG-1500PET", itemName: "1.5L PET Bottle", itemType: "packaging", uom: "pc", stockQty: 45000, reorderLevel: 10000, warehouse: "Stores - PKG", lotNo: "BTL-25-012", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 0.14, defaultSupplier: "PlastPack Industries" },
  { id: "im9", itemCode: "PKG-275BTL", itemName: "275ml Glass Bottle", itemType: "packaging", uom: "pc", stockQty: 32000, reorderLevel: 8000, warehouse: "Stores - PKG", lotNo: "BTL-25-013", expiryDate: "2027-06-30", status: "in_stock", costPerUnit: 0.18, defaultSupplier: "GlassWorks Ltd" },
  // Caps
  { id: "im10", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", itemType: "packaging", uom: "pc", stockQty: 250000, reorderLevel: 50000, warehouse: "Stores - PKG", lotNo: "CAP-25-003", expiryDate: "2027-01-15", status: "in_stock", costPerUnit: 0.012, defaultSupplier: "CapMasters Inc." },
  { id: "im11", itemCode: "PKG-Cap38", itemName: "38mm Screw Cap", itemType: "packaging", uom: "pc", stockQty: 65000, reorderLevel: 15000, warehouse: "Stores - PKG", lotNo: "CAP-25-004", expiryDate: "2027-02-28", status: "in_stock", costPerUnit: 0.018, defaultSupplier: "CapMasters Inc." },
  { id: "im12", itemCode: "PKG-Crown26", itemName: "26mm Crown Cap", itemType: "packaging", uom: "pc", stockQty: 48000, reorderLevel: 12000, warehouse: "Stores - PKG", lotNo: "CAP-25-005", expiryDate: "2027-03-15", status: "in_stock", costPerUnit: 0.015, defaultSupplier: "CapMasters Inc." },
  // Labels
  { id: "im13", itemCode: "PKG-LabelIW", itemName: "Island Water Label", itemType: "packaging", uom: "pc", stockQty: 180000, reorderLevel: 40000, warehouse: "Stores - PKG", lotNo: "LBL-25-007", expiryDate: "2026-08-20", status: "in_stock", costPerUnit: 0.018, defaultSupplier: "LabelPrint Co." },
  { id: "im14", itemCode: "PKG-LabelIW-L", itemName: "Island Water Large Label", itemType: "packaging", uom: "pc", stockQty: 72000, reorderLevel: 15000, warehouse: "Stores - PKG", lotNo: "LBL-25-008", expiryDate: "2026-09-10", status: "in_stock", costPerUnit: 0.022, defaultSupplier: "LabelPrint Co." },
  { id: "im15", itemCode: "PKG-LabelBB", itemName: "Bourbon Bluez Label", itemType: "packaging", uom: "pc", stockQty: 55000, reorderLevel: 12000, warehouse: "Stores - PKG", lotNo: "LBL-25-009", expiryDate: "2026-10-05", status: "in_stock", costPerUnit: 0.028, defaultSupplier: "LabelPrint Co." },
  // Wraps / Cartons / Trays
  { id: "im16", itemCode: "PKG-Shrink24", itemName: "24-Pack Shrink Wrap", itemType: "packaging", uom: "pc", stockQty: 8500, reorderLevel: 2000, warehouse: "Stores - PKG", lotNo: "SHR-25-002", expiryDate: "2027-03-10", status: "in_stock", costPerUnit: 0.45, defaultSupplier: "FlexiPack Solutions" },
  { id: "im17", itemCode: "PKG-Shrink12", itemName: "12-Pack Shrink Wrap", itemType: "packaging", uom: "pc", stockQty: 6200, reorderLevel: 1500, warehouse: "Stores - PKG", lotNo: "SHR-25-003", expiryDate: "2027-04-15", status: "in_stock", costPerUnit: 0.38, defaultSupplier: "FlexiPack Solutions" },
  { id: "im18", itemCode: "PKG-Carton6", itemName: "6-Pack Carton", itemType: "packaging", uom: "pc", stockQty: 15000, reorderLevel: 3000, warehouse: "Stores - PKG", lotNo: "CRT-25-001", expiryDate: "2027-05-20", status: "in_stock", costPerUnit: 0.55, defaultSupplier: "CartonCraft Ltd" },
  { id: "im19", itemCode: "PKG-Carton12", itemName: "12-Pack Carton", itemType: "packaging", uom: "pc", stockQty: 12000, reorderLevel: 2500, warehouse: "Stores - PKG", lotNo: "CRT-25-002", expiryDate: "2027-06-10", status: "in_stock", costPerUnit: 0.48, defaultSupplier: "CartonCraft Ltd" },
  // Cans / Sleeves / Lids
  { id: "im20", itemCode: "PKG-330Can", itemName: "330ml Aluminium Can", itemType: "packaging", uom: "pc", stockQty: 95000, reorderLevel: 20000, warehouse: "Stores - PKG", lotNo: "CAN-25-005", expiryDate: "2027-02-28", status: "in_stock", costPerUnit: 0.065, defaultSupplier: "AluCan Industries" },
  { id: "im21", itemCode: "PKG-Lid330", itemName: "Can Lid 202", itemType: "packaging", uom: "pc", stockQty: 88000, reorderLevel: 18000, warehouse: "Stores - PKG", lotNo: "LID-25-004", expiryDate: "2027-01-20", status: "in_stock", costPerUnit: 0.008, defaultSupplier: "AluCan Industries" },
  { id: "im22", itemCode: "PKG-SleeveBB", itemName: "Bourbon Bluez Sleeve", itemType: "packaging", uom: "pc", stockQty: 60000, reorderLevel: 15000, warehouse: "Stores - PKG", lotNo: "SLV-25-003", expiryDate: "2026-09-15", status: "in_stock", costPerUnit: 0.025, defaultSupplier: "LabelPrint Co." },
  { id: "im23", itemCode: "PKG-Tray24", itemName: "24-Pack Plastic Tray", itemType: "packaging", uom: "pc", stockQty: 4500, reorderLevel: 1000, warehouse: "Stores - PKG", lotNo: "TRY-25-001", expiryDate: "2027-04-01", status: "in_stock", costPerUnit: 0.42, defaultSupplier: "PlastPack Industries" },
  // Finished Goods
  { id: "im24", itemCode: "FG-IW-330", itemName: "Island Water 330ml", itemType: "finished_good", uom: "Bottle", stockQty: 24000, reorderLevel: 5000, warehouse: "Finished Goods", status: "in_stock", costPerUnit: 0.12 },
  { id: "im25", itemCode: "FG-IW-500", itemName: "Island Water 500ml", itemType: "finished_good", uom: "Bottle", stockQty: 15000, reorderLevel: 3000, warehouse: "Finished Goods", status: "in_stock", costPerUnit: 0.14 },
  { id: "im26", itemCode: "FG-IW-1500", itemName: "Island Water 1.5L", itemType: "finished_good", uom: "Bottle", stockQty: 8000, reorderLevel: 2000, warehouse: "Finished Goods", status: "in_stock", costPerUnit: 0.18 },
  { id: "im27", itemCode: "FG-BB-330", itemName: "Bourbon Bluez 330ml Can", itemType: "finished_good", uom: "Can", stockQty: 12000, reorderLevel: 2500, warehouse: "Finished Goods", status: "in_stock", costPerUnit: 0.22 },
  { id: "im28", itemCode: "FG-BB-275", itemName: "Bourbon Bluez 275ml Bottle", itemType: "finished_good", uom: "Bottle", stockQty: 0, reorderLevel: 2000, warehouse: "Finished Goods", status: "out_of_stock", costPerUnit: 0.28 },
  { id: "im29", itemCode: "RM-Sugar", itemName: "Sugar", itemType: "raw_material", uom: "Kg", stockQty: 199260.06, reorderLevel: 25000, warehouse: "Stores - RM", lotNo: "SGR-25-011", expiryDate: "2026-06-30", status: "in_stock", costPerUnit: 0.42, defaultSupplier: "Fiji Sugar Corp" },
  { id: "im30", itemCode: "ADD-SodiumBenzoate", itemName: "Sodium Benzoate", itemType: "additive", uom: "Kg", stockQty: 199997.84, reorderLevel: 500, warehouse: "Stores - RM", lotNo: "SBZ-25-004", expiryDate: "2027-02-28", status: "in_stock", costPerUnit: 2.1, defaultSupplier: "ChemSupply Pacific" },
  { id: "im31", itemCode: "FLV-Cola", itemName: "Cola Flavor", itemType: "additive", uom: "Kg", stockQty: 199990.08, reorderLevel: 800, warehouse: "Stores - RM", lotNo: "FLV-25-001", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 18.5, defaultSupplier: "FlavourTech Intl" },
  { id: "im32", itemCode: "ACD-Cola", itemName: "Cola Acidulant", itemType: "additive", uom: "Kg", stockQty: 199996.61, reorderLevel: 600, warehouse: "Stores - RM", lotNo: "ACD-25-001", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 6.2, defaultSupplier: "FlavourTech Intl" },
  { id: "im33", itemCode: "FLV-LemonLime", itemName: "Lemon Lime", itemType: "additive", uom: "Kg", stockQty: 200049.68, reorderLevel: 600, warehouse: "Stores - RM", lotNo: "FLV-25-007", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 16.8, defaultSupplier: "FlavourTech Intl" },
  { id: "im34", itemCode: "FLV-Orange", itemName: "Orange Flavor", itemType: "additive", uom: "Kg", stockQty: 199988.4, reorderLevel: 800, warehouse: "Stores - RM", lotNo: "FLV-25-002", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 17.2, defaultSupplier: "FlavourTech Intl" },
  { id: "im35", itemCode: "ACD-Orange", itemName: "Orange Acidulant", itemType: "additive", uom: "Kg", stockQty: 199995.12, reorderLevel: 600, warehouse: "Stores - RM", lotNo: "ACD-25-002", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 6.4, defaultSupplier: "FlavourTech Intl" },
  { id: "im36", itemCode: "FLV-Pineapple", itemName: "Pineapple Flavor", itemType: "additive", uom: "Kg", stockQty: 199992.55, reorderLevel: 800, warehouse: "Stores - RM", lotNo: "FLV-25-003", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 17.9, defaultSupplier: "FlavourTech Intl" },
  { id: "im37", itemCode: "FLV-Strawberry", itemName: "Strawberry Flavor", itemType: "additive", uom: "Kg", stockQty: 199991.33, reorderLevel: 800, warehouse: "Stores - RM", lotNo: "FLV-25-004", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 18.1, defaultSupplier: "FlavourTech Intl" },
  { id: "im38", itemCode: "FLV-FruitCocktail", itemName: "Fruit Cocktail Flavor", itemType: "additive", uom: "Kg", stockQty: 199989.71, reorderLevel: 800, warehouse: "Stores - RM", lotNo: "FLV-25-005", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 18.4, defaultSupplier: "FlavourTech Intl" },
  { id: "im39", itemCode: "FLV-Grape", itemName: "Grape Flavor", itemType: "additive", uom: "Kg", stockQty: 199987.2, reorderLevel: 800, warehouse: "Stores - RM", lotNo: "FLV-25-006", expiryDate: "2026-12-31", status: "in_stock", costPerUnit: 17.6, defaultSupplier: "FlavourTech Intl" },
  { id: "im40", itemCode: "ACD-Citric", itemName: "Citric Acid", itemType: "additive", uom: "Kg", stockQty: 199994.8, reorderLevel: 1000, warehouse: "Stores - RM", lotNo: "ACD-25-003", expiryDate: "2027-01-31", status: "in_stock", costPerUnit: 4.8, defaultSupplier: "ChemSupply Pacific" },
  { id: "im41", itemCode: "PKG-Preform105g", itemName: "No. of 105g Preforms", itemType: "packaging", uom: "EACH", stockQty: 197120, reorderLevel: 24000, warehouse: "Stores - PKG", lotNo: "PRF-25-003", expiryDate: "2026-08-31", status: "in_stock", costPerUnit: 0.062, defaultSupplier: "PacRim Packaging" },
  { id: "im42", itemCode: "PKG-Preform68g", itemName: "No. of 68g Preforms", itemType: "packaging", uom: "EACH", stockQty: 24640, reorderLevel: 24000, warehouse: "Stores - PKG", lotNo: "PRF-25-001", expiryDate: "2026-08-31", status: "low_stock", costPerUnit: 0.048, defaultSupplier: "PacRim Packaging" },
  { id: "im43", itemCode: "PKG-Preform48g", itemName: "No. of 48g Preforms", itemType: "packaging", uom: "EACH", stockQty: 197120, reorderLevel: 24000, warehouse: "Stores - PKG", lotNo: "PRF-25-004", expiryDate: "2026-08-31", status: "in_stock", costPerUnit: 0.036, defaultSupplier: "PacRim Packaging" },
  { id: "im44", itemCode: "PKG-Preform32g", itemName: "No. of 32g Preforms", itemType: "packaging", uom: "EACH", stockQty: 197120, reorderLevel: 24000, warehouse: "Stores - PKG", lotNo: "PRF-25-005", expiryDate: "2026-08-31", status: "in_stock", costPerUnit: 0.024, defaultSupplier: "PacRim Packaging" },
  { id: "im45", itemCode: "PKG-Preform120g", itemName: "No. of 120g Preforms", itemType: "packaging", uom: "EACH", stockQty: 98560, reorderLevel: 12000, warehouse: "Stores - PKG", lotNo: "PRF-25-006", expiryDate: "2026-08-31", status: "in_stock", costPerUnit: 0.071, defaultSupplier: "PacRim Packaging" },
  { id: "im46", itemCode: "PKG-CSDCap", itemName: "No. of CSD Caps", itemType: "packaging", uom: "EACH", stockQty: 197120, reorderLevel: 24000, warehouse: "Stores - PKG", lotNo: "CAP-25-002", expiryDate: "2027-03-31", status: "in_stock", costPerUnit: 0.011, defaultSupplier: "PacRim Packaging" },
  { id: "im47", itemCode: "PKG-LabelCSD", itemName: "CSD Labels (Generic)", itemType: "packaging", uom: "EACH", stockQty: 197120, reorderLevel: 24000, warehouse: "Stores - PKG", lotNo: "LBL-25-010", expiryDate: "2026-10-15", status: "in_stock", costPerUnit: 0.019, defaultSupplier: "LabelPrint Co." },
  { id: "im48", itemCode: "PKG-CartonCSD", itemName: "No. of Cartons", itemType: "packaging", uom: "EACH", stockQty: 199640, reorderLevel: 20000, warehouse: "Stores - PKG", lotNo: "CTN-25-004", expiryDate: "2026-11-30", status: "in_stock", costPerUnit: 0.34, defaultSupplier: "CorruPack Ltd" },
  { id: "im49", itemCode: "PKG-CelloTape", itemName: "No. of Cello Tape", itemType: "packaging", uom: "EACH", stockQty: 199994.07, reorderLevel: 2000, warehouse: "Stores - PKG", lotNo: "TAP-25-002", expiryDate: "2027-05-31", status: "in_stock", costPerUnit: 0.55, defaultSupplier: "CorruPack Ltd" },
];

// ── PURCHASE ORDERS ──────────────────────────────────────────────────────────

export interface PurchaseOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  qtyOrdered: number;
  qtyReceived: number;
  uom: string;
  unitPrice: number;
  status: "pending" | "partial" | "received";
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  status: "draft" | "approved" | "sent" | "partial" | "received" | "cancelled";
  items: PurchaseOrderItem[];
  totalValue: number;
  linkedWorkOrder?: string;
  linkedWorkOrderName?: string;
  notes?: string;
}

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "po1",
    poNumber: "PO-2025-001",
    supplier: "PlastPack Industries",
    orderDate: "2025-01-10",
    expectedDelivery: "2025-01-20",
    status: "received",
    items: [
      { id: "poi1", itemCode: "PKG-330PET", itemName: "330ml PET Bottle", qtyOrdered: 50000, qtyReceived: 50000, uom: "pc", unitPrice: 0.085, status: "received" },
      { id: "poi2", itemCode: "PKG-500PET", itemName: "500ml PET Bottle", qtyOrdered: 40000, qtyReceived: 40000, uom: "pc", unitPrice: 0.095, status: "received" },
      { id: "poi3", itemCode: "PKG-Cap28", itemName: "28mm Screw Cap", qtyOrdered: 100000, qtyReceived: 100000, uom: "pc", unitPrice: 0.012, status: "received" },
    ],
    totalValue: 8950.00,
    linkedWorkOrder: "wo2",
    linkedWorkOrderName: "WO-2025-002",
    notes: "Full delivery received. QC inspected — all within spec.",
  },
  {
    id: "po2",
    poNumber: "PO-2025-002",
    supplier: "AluCan Industries",
    orderDate: "2025-01-12",
    expectedDelivery: "2025-01-22",
    status: "partial",
    items: [
      { id: "poi4", itemCode: "PKG-330Can", itemName: "330ml Aluminium Can", qtyOrdered: 30000, qtyReceived: 15000, uom: "pc", unitPrice: 0.065, status: "partial" },
      { id: "poi5", itemCode: "PKG-Lid330", itemName: "Can Lid 202", qtyOrdered: 30000, qtyReceived: 30000, uom: "pc", unitPrice: 0.008, status: "received" },
    ],
    totalValue: 2190.00,
    linkedWorkOrder: "wo4",
    linkedWorkOrderName: "WO-2025-004",
    notes: "Cans partial — balance expected 2025-01-25.",
  },
  {
    id: "po3",
    poNumber: "PO-2025-003",
    supplier: "Southern Distillers Ltd",
    orderDate: "2025-01-14",
    expectedDelivery: "2025-01-18",
    status: "approved",
    items: [
      { id: "poi6", itemCode: "RM-Bourbon", itemName: "Bourbon Spirit", qtyOrdered: 2000, qtyReceived: 0, uom: "L", unitPrice: 0.045, status: "pending" },
      { id: "poi7", itemCode: "RM-Flavour", itemName: "Blueberry Flavouring", qtyOrdered: 500, qtyReceived: 0, uom: "L", unitPrice: 0.12, status: "pending" },
    ],
    totalValue: 150.00,
    linkedWorkOrder: "wo3",
    linkedWorkOrderName: "WO-2025-003",
    notes: "Approved — awaiting supplier confirmation.",
  },
  {
    id: "po4",
    poNumber: "PO-2025-004",
    supplier: "Island Water Supply Co.",
    orderDate: "2025-01-15",
    expectedDelivery: "2025-01-16",
    status: "sent",
    items: [
      { id: "poi8", itemCode: "RM-Water", itemName: "Purified Water", qtyOrdered: 50000, qtyReceived: 0, uom: "L", unitPrice: 0.0012, status: "pending" },
    ],
    totalValue: 60.00,
    notes: "Monthly water supply order.",
  },
  {
    id: "po5",
    poNumber: "PO-2025-005",
    supplier: "GasCorp Industrial",
    orderDate: "2025-01-08",
    expectedDelivery: "2025-01-12",
    actualDelivery: "2025-01-12",
    status: "received",
    items: [
      { id: "poi9", itemCode: "CO2-Gas", itemName: "Food Grade CO2", qtyOrdered: 5000, qtyReceived: 5000, uom: "kg", unitPrice: 0.003, status: "received" },
    ],
    totalValue: 15.00,
    notes: "Received and stored in CO2 bay.",
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
    bomId: "BOM-IW-500",
    bomName: "Island Water 500ml PET",
    woId: "wo1",
    woName: "WO-2025-001",
    product: "Island Water",
    variant: "500ml PET",
    batchQty: 15000,
    status: "delivered",
    requestedBy: "Sarah K.",
    requestedAt: "2025-01-15T05:00:00Z",
    preparedBy: "Raj P.",
    preparedAt: "2025-01-15T05:30:00Z",
    deliveredTo: "FL1 - Operator John M.",
    deliveredAt: "2025-01-15T05:45:00Z",
    items: [
      { id: "ri1", ingredient: "Purified Water", qtyRequired: 7500.0, qtyFetched: 7500.0, unit: "L", lotNo: "PW-25-004", expiryDate: "2025-04-01", location: "RM-C01", status: "verified" },
      { id: "ri2", ingredient: "500ml PET Bottle", qtyRequired: 15000.0, qtyFetched: 15000.0, unit: "pc", lotNo: "BTL-25-011", expiryDate: "2026-12-31", location: "PKG-A01", status: "verified" },
      { id: "ri3", ingredient: "28mm Screw Cap", qtyRequired: 15000.0, qtyFetched: 15000.0, unit: "pc", lotNo: "CAP-25-003", expiryDate: "2027-01-15", location: "PKG-B02", status: "verified" },
      { id: "ri4", ingredient: "Island Water Label", qtyRequired: 15000.0, qtyFetched: 15000.0, unit: "pc", lotNo: "LBL-25-007", expiryDate: "2026-08-20", location: "PKG-C03", status: "verified" },
      { id: "ri5", ingredient: "12-Pack Shrink Wrap", qtyRequired: 1250.0, qtyFetched: 1250.0, unit: "pc", lotNo: "SHR-25-002", expiryDate: "2027-03-10", location: "PKG-D01", status: "verified" },
      { id: "ri6", ingredient: "Mineral Blend", qtyRequired: 1.2, qtyFetched: 1.2, unit: "kg", lotNo: "MIN-25-001", expiryDate: "2026-05-01", location: "RM-A05", status: "verified" },
    ],
  },
  {
    id: "req2",
    bomId: "BOM-BB-330",
    bomName: "Bourbon Bluez 330ml Can",
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
      { id: "ri7", ingredient: "Purified Water", qtyRequired: 2640.0, qtyFetched: 2640.0, unit: "L", lotNo: "PW-25-004", expiryDate: "2025-04-01", location: "RM-C01", status: "verified" },
      { id: "ri8", ingredient: "Bourbon Spirit", qtyRequired: 660.0, qtyFetched: 660.0, unit: "L", lotNo: "BRB-25-001", expiryDate: "2026-01-31", location: "RM-E02", status: "verified" },
      { id: "ri9", ingredient: "Blueberry Flavouring", qtyRequired: 96.0, qtyFetched: 96.0, unit: "L", lotNo: "BLU-25-001", expiryDate: "2025-11-15", location: "RM-A08", status: "verified" },
      { id: "ri10", ingredient: "330ml Aluminium Can", qtyRequired: 12000.0, qtyFetched: 12000.0, unit: "pc", lotNo: "CAN-25-005", expiryDate: "2027-02-28", location: "PKG-A03", status: "verified" },
      { id: "ri11", ingredient: "Can Lid 202", qtyRequired: 12000.0, qtyFetched: 12000.0, unit: "pc", lotNo: "LID-25-004", expiryDate: "2027-01-20", location: "PKG-B04", status: "verified" },
      { id: "ri12", ingredient: "Bourbon Bluez Sleeve", qtyRequired: 12000.0, qtyFetched: 12000.0, unit: "pc", lotNo: "SLV-25-003", expiryDate: "2026-09-15", location: "PKG-C05", status: "verified" },
      { id: "ri13", ingredient: "Food Grade CO2", qtyRequired: 30.0, qtyFetched: 30.0, unit: "kg", lotNo: "CO2-24-056", expiryDate: "2025-12-31", location: "RM-D04", status: "verified" },
      { id: "ri14", ingredient: "24-Pack Plastic Tray", qtyRequired: 500.0, qtyFetched: 500.0, unit: "pc", lotNo: "TRY-25-001", expiryDate: "2027-04-01", location: "PKG-D02", status: "verified" },
    ],
  },
  {
    id: "req3",
    bomId: "BOM-IW-330",
    bomName: "Island Water 330ml PET",
    woId: "wo2",
    woName: "WO-2025-002",
    product: "Island Water",
    variant: "330ml PET",
    batchQty: 24000,
    status: "approved",
    requestedBy: "Sarah K.",
    requestedAt: "2025-01-15T07:30:00Z",
    items: [
      { id: "ri15", ingredient: "Purified Water", qtyRequired: 7920.0, qtyFetched: 0, unit: "L", location: "RM-C01", status: "pending" },
      { id: "ri16", ingredient: "330ml PET Bottle", qtyRequired: 24000.0, qtyFetched: 0, unit: "pc", location: "PKG-A01", status: "pending" },
      { id: "ri17", ingredient: "28mm Screw Cap", qtyRequired: 24000.0, qtyFetched: 0, unit: "pc", location: "PKG-B02", status: "pending" },
      { id: "ri18", ingredient: "Island Water Label", qtyRequired: 24000.0, qtyFetched: 0, unit: "pc", location: "PKG-C03", status: "pending" },
      { id: "ri19", ingredient: "24-Pack Shrink Wrap", qtyRequired: 1000.0, qtyFetched: 0, unit: "pc", location: "PKG-D01", status: "pending" },
      { id: "ri20", ingredient: "Mineral Blend", qtyRequired: 1.2, qtyFetched: 0, unit: "kg", location: "RM-A05", status: "pending" },
    ],
  },
  {
    id: "req4",
    bomId: "BOM-IW-1500",
    bomName: "Island Water 1.5L PET",
    woId: "wo3",
    woName: "WO-2025-003",
    product: "Island Water",
    variant: "1.5L PET",
    batchQty: 8000,
    status: "draft",
    requestedBy: "Lisa T.",
    requestedAt: "2025-01-15T08:00:00Z",
    items: [
      { id: "ri21", ingredient: "Purified Water", qtyRequired: 12000.0, qtyFetched: 0, unit: "L", location: "RM-C01", status: "pending" },
      { id: "ri22", ingredient: "1.5L PET Bottle", qtyRequired: 8000.0, qtyFetched: 0, unit: "pc", location: "PKG-A02", status: "pending" },
      { id: "ri23", ingredient: "38mm Screw Cap", qtyRequired: 8000.0, qtyFetched: 0, unit: "pc", location: "PKG-B03", status: "pending" },
      { id: "ri24", ingredient: "Island Water Large Label", qtyRequired: 8000.0, qtyFetched: 0, unit: "pc", location: "PKG-C04", status: "pending" },
      { id: "ri25", ingredient: "6-Pack Carton", qtyRequired: 1334.0, qtyFetched: 0, unit: "pc", location: "PKG-D03", status: "pending" },
      { id: "ri26", ingredient: "Mineral Blend", qtyRequired: 1.6, qtyFetched: 0, unit: "kg", location: "RM-A05", status: "pending" },
    ],
  },
  {
    id: "req5",
    bomId: "BOM-Crush Cola 2.5L-001",
    bomName: "Crush Cola 2.5L",
    woId: "wo5",
    woName: "WO-2025-005",
    product: "Crush Cola",
    variant: "2.5L PET",
    batchQty: 100,
    status: "approved",
    requestedBy: "Mike R.",
    requestedAt: "2025-01-16T06:00:00Z",
    items: [
      { id: "ri27", ingredient: "Purified Water", qtyRequired: 1757.55, qtyFetched: 0, unit: "L", location: "RM-C01", status: "pending" },
      { id: "ri28", ingredient: "Sugar", qtyRequired: 233.3, qtyFetched: 0, unit: "Kg", location: "RM-C02", status: "pending" },
      { id: "ri29", ingredient: "Sodium Benzoate", qtyRequired: 0.6, qtyFetched: 0, unit: "Kg", location: "RM-A06", status: "pending" },
      { id: "ri30", ingredient: "Cola Flavor", qtyRequired: 6.2, qtyFetched: 0, unit: "Kg", location: "RM-A07", status: "pending" },
      { id: "ri31", ingredient: "Cola Acidulant", qtyRequired: 2.12, qtyFetched: 0, unit: "Kg", location: "RM-A07", status: "pending" },
      { id: "ri32", ingredient: "Lemon Lime", qtyRequired: 0.2, qtyFetched: 0, unit: "Kg", location: "RM-A09", status: "pending" },
      { id: "ri33", ingredient: "Food Grade CO2", qtyRequired: 8000.0, qtyFetched: 0, unit: "g", location: "RM-D04", status: "pending" },
      { id: "ri34", ingredient: "No. of 105g Preforms", qtyRequired: 800.0, qtyFetched: 0, unit: "EACH", location: "PKG-A05", status: "pending" },
      { id: "ri35", ingredient: "No. of CSD Caps", qtyRequired: 800.0, qtyFetched: 0, unit: "EACH", location: "PKG-B05", status: "pending" },
      { id: "ri36", ingredient: "Labels - Crush Cola", qtyRequired: 800.0, qtyFetched: 0, unit: "EACH", location: "PKG-C06", status: "pending" },
      { id: "ri37", ingredient: "No. of Cartons", qtyRequired: 100.0, qtyFetched: 0, unit: "EACH", location: "PKG-D04", status: "pending" },
      { id: "ri38", ingredient: "No. of Cello Tape", qtyRequired: 1.65, qtyFetched: 0, unit: "EACH", location: "PKG-E01", status: "pending" },
    ],
  },
  {
    id: "req6",
    bomId: "BOM-Crush Orange 1.5L-002",
    bomName: "Crush Orange 1.5L",
    woId: "wo6",
    woName: "WO-2025-006",
    product: "Crush Orange",
    variant: "1.5L PET",
    batchQty: 200,
    status: "picking",
    requestedBy: "John M.",
    requestedAt: "2025-01-16T07:00:00Z",
    preparedBy: "Raj P.",
    items: [
      { id: "ri39", ingredient: "Purified Water", qtyRequired: 1581.8, qtyFetched: 1581.8, unit: "L", lotNo: "PW-25-004", expiryDate: "2025-04-01", location: "RM-C01", status: "verified" },
      { id: "ri40", ingredient: "Sugar", qtyRequired: 209.97, qtyFetched: 209.97, unit: "Kg", lotNo: "SGR-25-011", expiryDate: "2026-06-30", location: "RM-C02", status: "verified" },
      { id: "ri41", ingredient: "Sodium Benzoate", qtyRequired: 0.54, qtyFetched: 0.54, unit: "Kg", lotNo: "SBZ-25-004", expiryDate: "2027-02-28", location: "RM-A06", status: "verified" },
      { id: "ri42", ingredient: "Orange Flavor", qtyRequired: 5.58, qtyFetched: 5.58, unit: "Kg", lotNo: "FLV-25-002", expiryDate: "2026-12-31", location: "RM-A07", status: "verified" },
      { id: "ri43", ingredient: "Orange Acidulant", qtyRequired: 1.91, qtyFetched: 1.91, unit: "Kg", lotNo: "ACD-25-002", expiryDate: "2026-12-31", location: "RM-A07", status: "verified" },
      { id: "ri44", ingredient: "Food Grade CO2", qtyRequired: 7200.0, qtyFetched: 7200.0, unit: "g", lotNo: "CO2-24-056", expiryDate: "2025-12-31", location: "RM-D04", status: "verified" },
      { id: "ri45", ingredient: "No. of 68g Preforms", qtyRequired: 1200.0, qtyFetched: 1200.0, unit: "EACH", lotNo: "PRF-25-001", expiryDate: "2026-08-31", location: "PKG-A05", status: "verified" },
      { id: "ri46", ingredient: "No. of CSD Caps", qtyRequired: 1200.0, qtyFetched: 1200.0, unit: "EACH", lotNo: "CAP-25-002", expiryDate: "2027-03-31", location: "PKG-B05", status: "verified" },
      { id: "ri47", ingredient: "Labels - Crush Orange", qtyRequired: 1200.0, qtyFetched: 1200.0, unit: "EACH", lotNo: "LBL-25-010", expiryDate: "2026-10-15", location: "PKG-C06", status: "verified" },
      { id: "ri48", ingredient: "No. of Cartons", qtyRequired: 200.0, qtyFetched: 200.0, unit: "EACH", lotNo: "CTN-25-004", expiryDate: "2026-11-30", location: "PKG-D04", status: "verified" },
      { id: "ri49", ingredient: "No. of Cello Tape", qtyRequired: 3.3, qtyFetched: 3.3, unit: "EACH", lotNo: "TAP-25-002", expiryDate: "2027-05-31", location: "PKG-E01", status: "verified" },
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
  {
    id: "wf4",
    woId: "wo3",
    woName: "WO-2025-003",
    currentStepIndex: 1,
    steps: [
      { id: "ws31", name: "WO Created", role: "Planner", roleIcon: "clipboard", order: 1, status: "completed", assignedTo: "Lisa T.", assignedAt: "09:00", completedAt: "09:02", duration: 2 },
      { id: "ws32", name: "BOM Requisition", role: "Ingredient Mixer", roleIcon: "beaker", order: 2, status: "active", assignedTo: "Raj P.", assignedAt: "09:05" },
      { id: "ws33", name: "Maintenance Clearance", role: "Maintenance", roleIcon: "wrench", order: 3, status: "pending" },
      { id: "ws34", name: "QC Pre-start Check", role: "QC Inspector", roleIcon: "flask", order: 4, status: "pending" },
      { id: "ws35", name: "Production Start", role: "Operator", roleIcon: "factory", order: 5, status: "pending" },
      { id: "ws36", name: "In-Process QC", role: "QC Inspector", roleIcon: "flask", order: 6, status: "pending" },
      { id: "ws37", name: "Production Complete", role: "Operator", roleIcon: "factory", order: 7, status: "pending" },
      { id: "ws38", name: "Final QC Release", role: "QC Inspector", roleIcon: "flask", order: 8, status: "pending" },
      { id: "ws39", name: "Warehouse Receipt", role: "Warehouse", roleIcon: "warehouse", order: 9, status: "pending" },
      { id: "ws40", name: "WO Closed", role: "Supervisor", roleIcon: "shield", order: 10, status: "pending" },
    ],
  },
  {
    id: "wf5",
    woId: "wo5",
    woName: "WO-2025-005",
    currentStepIndex: 0,
    steps: [
      { id: "ws41", name: "WO Created", role: "Planner", roleIcon: "clipboard", order: 1, status: "completed", assignedTo: "Mike R.", assignedAt: "06:00", completedAt: "06:01", duration: 1 },
      { id: "ws42", name: "BOM Requisition", role: "Ingredient Mixer", roleIcon: "beaker", order: 2, status: "pending" },
      { id: "ws43", name: "Maintenance Clearance", role: "Maintenance", roleIcon: "wrench", order: 3, status: "pending" },
      { id: "ws44", name: "QC Pre-start Check", role: "QC Inspector", roleIcon: "flask", order: 4, status: "pending" },
      { id: "ws45", name: "Production Start", role: "Operator", roleIcon: "factory", order: 5, status: "pending" },
      { id: "ws46", name: "In-Process QC", role: "QC Inspector", roleIcon: "flask", order: 6, status: "pending" },
      { id: "ws47", name: "Production Complete", role: "Operator", roleIcon: "factory", order: 7, status: "pending" },
      { id: "ws48", name: "Final QC Release", role: "QC Inspector", roleIcon: "flask", order: 8, status: "pending" },
      { id: "ws49", name: "Warehouse Receipt", role: "Warehouse", roleIcon: "warehouse", order: 9, status: "pending" },
      { id: "ws50", name: "WO Closed", role: "Supervisor", roleIcon: "shield", order: 10, status: "pending" },
    ],
  },
  {
    id: "wf6",
    woId: "wo6",
    woName: "WO-2025-006",
    currentStepIndex: 4,
    steps: [
      { id: "ws51", name: "WO Created", role: "Planner", roleIcon: "clipboard", order: 1, status: "completed", assignedTo: "John M.", assignedAt: "05:00", completedAt: "05:02", duration: 2 },
      { id: "ws52", name: "BOM Requisition", role: "Ingredient Mixer", roleIcon: "beaker", order: 2, status: "completed", assignedTo: "Raj P.", assignedAt: "05:00", completedAt: "05:20", duration: 20 },
      { id: "ws53", name: "Maintenance Clearance", role: "Maintenance", roleIcon: "wrench", order: 3, status: "completed", assignedTo: "Dave R.", assignedAt: "05:15", completedAt: "05:30", duration: 15 },
      { id: "ws54", name: "QC Pre-start Check", role: "QC Inspector", roleIcon: "flask", order: 4, status: "completed", assignedTo: "Priya N.", assignedAt: "05:30", completedAt: "05:35", duration: 5 },
      { id: "ws55", name: "Production Start", role: "Operator", roleIcon: "factory", order: 5, status: "completed", assignedTo: "Mike R.", assignedAt: "05:35", completedAt: "05:40", duration: 5 },
      { id: "ws56", name: "In-Process QC", role: "QC Inspector", roleIcon: "flask", order: 6, status: "active", assignedTo: "Priya N.", assignedAt: "05:40" },
      { id: "ws57", name: "Production Complete", role: "Operator", roleIcon: "factory", order: 7, status: "pending" },
      { id: "ws58", name: "Final QC Release", role: "QC Inspector", roleIcon: "flask", order: 8, status: "pending" },
      { id: "ws59", name: "Warehouse Receipt", role: "Warehouse", roleIcon: "warehouse", order: 9, status: "pending" },
      { id: "ws60", name: "WO Closed", role: "Supervisor", roleIcon: "shield", order: 10, status: "pending" },
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
  avatarUrl?: string;
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
      { id: "ops-dss-builder", name: "DSS Flow Builder", moduleId: "ops" },
      { id: "ops-twin", name: "Digital Twin", moduleId: "ops" },
      { id: "ops-maint-schedule", name: "Maintenance Schedule", moduleId: "ops" },
      { id: "ops-mixer", name: "BOM Requisitions", moduleId: "ops" },
      { id: "ops-mixer-execute", name: "Pick & Deliver Ingredients", moduleId: "ops" },
      { id: "ops-po", name: "Purchase Orders", moduleId: "ops" },
      { id: "ops-dss", name: "DSS Board", moduleId: "ops" },
      { id: "ops-kaizen", name: "Kaizen Board", moduleId: "ops" },
      { id: "ops-carton-labels", name: "Carton Labels", moduleId: "ops" },
      { id: "ops-gate-pass", name: "Gate Pass", moduleId: "ops" },
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
      { id: "admin-warehouse-racks", name: "Warehouse Racks & Bins", moduleId: "admin" },
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
      "ops-warehouse", "ops-qc", "ops-dss-builder", "ops-twin", "ops-maint-schedule",
      "ops-mixer", "ops-mixer-execute", "ops-po",
      "ops-dss", "ops-dss-builder", "ops-kaizen",
      "ops-carton-labels", "ops-gate-pass",
    ],
    color: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/30",
    builtIn: true,
  },
  {
    id: "role-production-supervisor",
    name: "Production Supervisor",
    description: "Oversees production floor. Can investigate incidents, manage WOs, and view QC.",
    permissions: [
      "ops-dashboard", "ops-wo", "ops-qc", "ops-dss-builder", "ops-twin", "ops-maint-schedule",
      "ops-incidents", "ops-incidents-report", "ops-incidents-investigate",
      "ops-mixer", "ops-dss", "ops-kaizen",
      "ops-carton-labels", "ops-gate-pass",
    ],
    color: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
    builtIn: true,
  },
  {
    id: "role-qc-inspector",
    name: "QC Inspector",
    description: "Handles quality checks and QC forms. Can view and report incidents but not investigate.",
    permissions: [
      "ops-dashboard", "ops-qc", "ops-dss-builder", "ops-dss",
      "ops-incidents", "ops-incidents-report", "ops-kaizen",
      "ops-carton-labels",
    ],
    color: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
    builtIn: true,
  },
  {
    id: "role-maintenance-supervisor",
    name: "Maintenance Supervisor",
    description: "Manages equipment, pre-start checks, digital twin, and investigates maintenance-related incidents.",
    permissions: [
      "ops-dashboard", "ops-wo", "ops-dss-builder", "ops-twin", "ops-maint-schedule",
      "ops-incidents", "ops-incidents-report", "ops-incidents-investigate", "ops-kaizen",
    ],
    color: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
    builtIn: true,
  },
  {
    id: "role-warehouse-supervisor",
    name: "Warehouse Supervisor",
    description: "Manages inventory, stock movements, and warehouse operations. Can report incidents.",
    permissions: [
      "ops-dashboard", "ops-warehouse", "ops-dss-builder",
      "ops-incidents", "ops-incidents-report", "ops-kaizen",
      "ops-carton-labels", "ops-gate-pass", "admin-warehouse-racks",
    ],
    color: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30",
    builtIn: true,
  },
  {
    id: "role-operator",
    name: "Operator",
    description: "Executes assigned job cards and views WOs. Can report incidents on their line only.",
    permissions: [
      "ops-dashboard", "ops-wo", "ops-dss",
      "ops-incidents", "ops-incidents-report", "ops-kaizen",
      "ops-carton-labels",
    ],
    color: "bg-gray-50 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border-gray-200 dark:border-slate-800",
    builtIn: true,
  },
  {
    id: "role-planner",
    name: "Planner",
    description: "Plans production schedules, creates WOs, manages BOMs and workflow configuration.",
    permissions: [
      "ops-dashboard", "ops-wo", "ops-wo-create", "ops-dss-builder", "ops-maint-schedule",
      "admin-workflow", "admin-boms", "admin-products", "ops-kaizen",
      "ops-carton-labels", "ops-gate-pass",
    ],
    color: "bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30",
    builtIn: true,
  },
  {
    id: "role-mixer",
    name: "Ingredient Mixer",
    description: "Fetches raw materials from store per BOM requisition, verifies quantities, and delivers to production.",
    permissions: [
      "ops-dashboard", "ops-mixer", "ops-mixer-execute", "ops-dss-builder",
    ],
    color: "bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/30",
    builtIn: true,
  },
  {
    id: "role-mes-user",
    name: "MES User",
    description: "ERPNext-backed MES user. Can create, launch, and finish work orders and report incidents.",
    permissions: [
      "ops-dashboard", "ops-wo", "ops-wo-create", "ops-qc", "ops-dss",
      "ops-incidents", "ops-incidents-report", "ops-incidents-investigate", "ops-kaizen",
      "ops-carton-labels", "ops-gate-pass", "ops-warehouse",
    ],
    color: "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/30",
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
  "MES User": "/",
};

// ── IOT SENSOR DATA ─────────────────────────────────────────────────────────

export const iotSensors: IoTSensor[] = [
  // FL1 - Water Line A
  { id: "iot1", lineId: "fl1", sensorType: "temperature", sensorName: "Pasteuriser Temp", unit: "°C", currentValue: 82.4, minSafe: 80, maxSafe: 85, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "stable" },
  { id: "iot2", lineId: "fl1", sensorType: "pressure", sensorName: "Filler Pressure", unit: "bar", currentValue: 2.1, minSafe: 1.8, maxSafe: 2.5, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "up" },
  { id: "iot3", lineId: "fl1", sensorType: "flow_rate", sensorName: "Water Flow", unit: "L/min", currentValue: 1450, minSafe: 1200, maxSafe: 1600, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "stable" },
  { id: "iot4", lineId: "fl1", sensorType: "ph", sensorName: "Product pH", unit: "pH", currentValue: 7.15, minSafe: 6.5, maxSafe: 7.5, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "down" },
  { id: "iot5", lineId: "fl1", sensorType: "tds", sensorName: "TDS Monitor", unit: "ppm", currentValue: 142, minSafe: 100, maxSafe: 200, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "stable" },
  { id: "iot6", lineId: "fl1", sensorType: "vibration", sensorName: "Conveyor Vibration", unit: "mm/s", currentValue: 2.8, minSafe: 0, maxSafe: 4.5, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "up" },
  // FL3 - CSD Line A
  { id: "iot7", lineId: "fl3", sensorType: "temperature", sensorName: "Mixer Temp", unit: "°C", currentValue: 12.5, minSafe: 10, maxSafe: 15, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "stable" },
  { id: "iot8", lineId: "fl3", sensorType: "pressure", sensorName: "CO2 Injector", unit: "bar", currentValue: 3.8, minSafe: 3.5, maxSafe: 4.2, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "down" },
  { id: "iot9", lineId: "fl3", sensorType: "co2", sensorName: "CO2 Concentration", unit: "vol", currentValue: 3.8, minSafe: 3.0, maxSafe: 4.5, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "stable" },
  { id: "iot10", lineId: "fl3", sensorType: "flow_rate", sensorName: "Syrup Flow", unit: "L/min", currentValue: 48, minSafe: 40, maxSafe: 60, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "stable" },
  { id: "iot11", lineId: "fl3", sensorType: "vibration", sensorName: "Filler Head Vibration", unit: "mm/s", currentValue: 5.2, minSafe: 0, maxSafe: 5.0, status: "warning", lastReading: "2025-01-15T10:42:00Z", trend: "up" },
  // FL4 - RTD Line
  { id: "iot12", lineId: "fl4", sensorType: "temperature", sensorName: "Blend Tank Temp", unit: "°C", currentValue: 8.2, minSafe: 5, maxSafe: 12, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "stable" },
  { id: "iot13", lineId: "fl4", sensorType: "pressure", sensorName: "Can Seamer", unit: "bar", currentValue: 2.9, minSafe: 2.5, maxSafe: 3.2, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "stable" },
  { id: "iot14", lineId: "fl4", sensorType: "flow_rate", sensorName: "Spirit Flow", unit: "L/min", currentValue: 12.5, minSafe: 10, maxSafe: 18, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "down" },
  { id: "iot15", lineId: "fl4", sensorType: "humidity", sensorName: "Line Humidity", unit: "%RH", currentValue: 62, minSafe: 40, maxSafe: 70, status: "normal", lastReading: "2025-01-15T10:42:00Z", trend: "up" },
];

export const iotAlerts: IoTAlert[] = [
  { id: "al1", sensorId: "iot11", lineId: "fl3", message: "Filler Head Vibration exceeded threshold (5.2 mm/s)", severity: "warning", triggeredAt: "2025-01-15T10:35:00Z", acknowledged: false },
  { id: "al2", sensorId: "iot4", lineId: "fl1", message: "Product pH trending down — approaching lower limit", severity: "info", triggeredAt: "2025-01-15T10:20:00Z", acknowledged: true },
  { id: "al3", sensorId: "iot13", lineId: "fl4", message: "Can Seamer pressure fluctuation detected", severity: "info", triggeredAt: "2025-01-15T09:45:00Z", acknowledged: false },
];

export const productionAnalytics: ProductionAnalytics[] = [
  { lineId: "fl1", timestamp: "2025-01-15T10:00:00Z", bottlesProduced: 16800, rejectCount: 52, throughput: 16800, defectRate: 0.31, fillLevelVariance: 0.8, capTorqueAverage: 18.5, labelPlacementAccuracy: 99.2, lineSpeed: 280 },
  { lineId: "fl1", timestamp: "2025-01-15T09:00:00Z", bottlesProduced: 15120, rejectCount: 48, throughput: 15120, defectRate: 0.32, fillLevelVariance: 0.9, capTorqueAverage: 18.3, labelPlacementAccuracy: 99.0, lineSpeed: 278 },
  { lineId: "fl3", timestamp: "2025-01-15T10:00:00Z", bottlesProduced: 13200, rejectCount: 108, throughput: 13200, defectRate: 0.82, fillLevelVariance: 1.2, capTorqueAverage: 16.8, labelPlacementAccuracy: 98.5, lineSpeed: 220 },
  { lineId: "fl4", timestamp: "2025-01-15T10:00:00Z", bottlesProduced: 10800, rejectCount: 56, throughput: 10800, defectRate: 0.52, fillLevelVariance: 1.0, capTorqueAverage: 15.2, labelPlacementAccuracy: 98.8, lineSpeed: 180 },
];

// ── DSS NODE TYPES (Flow Builder Palette) ───────────────────────────────────

export interface DSSNodeType {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // tailwind color name
  category: "main" | "support" | "qc" | "lab" | "decision" | "start" | "end";
}

export const dssNodeTypes: DSSNodeType[] = [
  { id: "nt-start", name: "Start", icon: "PlayCircle", color: "emerald", category: "start" },
  { id: "nt-process", name: "Process", icon: "Factory", color: "blue", category: "main" },
  { id: "nt-mix", name: "Mix / Blend", icon: "Beaker", color: "indigo", category: "main" },
  { id: "nt-fill", name: "Fill / Pack", icon: "Droplets", color: "cyan", category: "main" },
  { id: "nt-qc", name: "QC Check", icon: "ClipboardCheck", color: "amber", category: "qc" },
  { id: "nt-lab", name: "Lab Test", icon: "FlaskConical", color: "purple", category: "lab" },
  { id: "nt-support", name: "Support", icon: "Wrench", color: "orange", category: "support" },
  { id: "nt-decision", name: "Decision", icon: "GitBranch", color: "pink", category: "decision" },
  { id: "nt-end", name: "End", icon: "CheckCircle2", color: "emerald", category: "end" },
];

// ── DSS FLOW TEMPLATES ──────────────────────────────────────────────────────

export type DSSFormFieldType = "text" | "number" | "select" | "checkbox" | "date" | "textarea" | "pass_fail";

export interface DSSFormField {
  id: string;
  label: string;
  type: DSSFormFieldType;
  required?: boolean;
  options?: string[]; // for select
  min?: number; // for number
  max?: number; // for number
  unit?: string; // for number
}

export interface DSSNodeForm {
  id: string;
  name: string;
  fields: DSSFormField[];
}

export interface DSSFlowNode {
  id: string;
  typeId: string;
  name: string;
  description?: string;
  x: number; // grid cell 0-24
  y: number; // grid cell 0-20
  role?: string;
  durationMin?: number;
  parallelGroup?: string; // null = sequential
  form?: DSSNodeForm; // attached QC/Inspection form
}

export interface DSSFaultReport {
  id: string;
  runId: string;
  nodeId: string;
  lineId?: string;
  reportedBy: string;
  reportedAt: string;
  severity: "minor" | "major" | "critical";
  category: "mechanical" | "electrical" | "quality" | "material" | "other";
  description: string;
  status: "open" | "repairing" | "resolved";
  repairedBy?: string;
  repairedAt?: string;
  repairNotes?: string;
  resolution?: string;
}

export interface DSSFlowEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
}

export interface DSSFlowTemplate {
  id: string;
  name: string;
  description: string;
  productFamily?: string; // product family name
  bomId?: string; // ← linked BOM
  nodes: DSSFlowNode[];
  edges: DSSFlowEdge[];
  createdAt: string;
  status: "draft" | "published";
}

export const dssFlowTemplates: DSSFlowTemplate[] = [
  {
    id: "tpl-cola-001",
    name: "Crush Cola 2.5L Production",
    description: "Standard CSD production flow for Cola variants",
    productFamily: "Crush Cola",
    bomId: "BOM-Crush Cola 2.5L-001",
    status: "published",
    createdAt: "2025-01-10T08:00:00Z",
    nodes: [
      { id: "n1", typeId: "nt-start", name: "Production Start", x: 12, y: 0 },
      { id: "n2", typeId: "nt-process", name: "Preform Loading", x: 12, y: 2, role: "Operator", durationMin: 30, parallelGroup: "prep" },
      { id: "n3", typeId: "nt-mix", name: "Syrup Mixing", x: 8, y: 4, role: "Ingredient Mixer", durationMin: 45, parallelGroup: "prep" },
      { id: "n4", typeId: "nt-mix", name: "Carbonation", x: 16, y: 4, role: "Operator", durationMin: 30, parallelGroup: "prep" },
      { id: "n5", typeId: "nt-qc", name: "Brix / pH Check", x: 8, y: 6, role: "QC Inspector", durationMin: 15, form: { id: "f-qc-brix", name: "Brix & pH Check", fields: [
        { id: "brix", label: "Brix Value", type: "number", required: true, min: 10, max: 14, unit: "°Brix" },
        { id: "ph", label: "pH Level", type: "number", required: true, min: 2.5, max: 4.5, unit: "pH" },
        { id: "temperature", label: "Sample Temp", type: "number", required: true, min: 15, max: 25, unit: "°C" },
        { id: "result", label: "Result", type: "pass_fail", required: true },
        { id: "notes", label: "Notes", type: "textarea", required: false },
      ]}},
      { id: "n6", typeId: "nt-lab", name: "Micro Sample", x: 16, y: 6, role: "Lab Technician", durationMin: 20, parallelGroup: "qc-prep", form: { id: "f-lab-micro", name: "Microbiology Sample", fields: [
        { id: "sample_id", label: "Sample ID", type: "text", required: true },
        { id: "tpc", label: "Total Plate Count", type: "number", required: true, unit: "CFU/ml" },
        { id: "yeast", label: "Yeast & Mould", type: "number", required: true, unit: "CFU/ml" },
        { id: "coliforms", label: "Coliforms", type: "pass_fail", required: true },
        { id: "test_date", label: "Test Date", type: "date", required: true },
      ]}},
      { id: "n7", typeId: "nt-fill", name: "Blow-Fill-Seal", x: 12, y: 8, role: "Operator", durationMin: 120 },
      { id: "n8", typeId: "nt-qc", name: "Fill Level Check", x: 8, y: 10, role: "QC Inspector", durationMin: 10, parallelGroup: "inline-qc", form: { id: "f-qc-fill", name: "Fill Level Inspection", fields: [
        { id: "fill_min", label: "Min Fill (ml)", type: "number", required: true, min: 2450, max: 2500, unit: "ml" },
        { id: "fill_max", label: "Max Fill (ml)", type: "number", required: true, min: 2450, max: 2550, unit: "ml" },
        { id: "samples_checked", label: "Samples Checked", type: "number", required: true, min: 1, max: 100 },
        { id: "pass_rate", label: "Pass Rate", type: "number", required: true, min: 95, max: 100, unit: "%" },
        { id: "result", label: "Result", type: "pass_fail", required: true },
      ]}},
      { id: "n9", typeId: "nt-qc", name: "Cap Torque Check", x: 16, y: 10, role: "QC Inspector", durationMin: 10, parallelGroup: "inline-qc", form: { id: "f-qc-torque", name: "Cap Torque Test", fields: [
        { id: "torque_min", label: "Min Torque", type: "number", required: true, min: 15, max: 25, unit: "N.cm" },
        { id: "torque_max", label: "Max Torque", type: "number", required: true, min: 15, max: 30, unit: "N.cm" },
        { id: "result", label: "Result", type: "pass_fail", required: true },
        { id: "notes", label: "Notes", type: "textarea", required: false },
      ]}},
      { id: "n10", typeId: "nt-process", name: "Label & Shrink", x: 12, y: 12, role: "Operator", durationMin: 60 },
      { id: "n11", typeId: "nt-qc", name: "Label Placement QC", x: 8, y: 14, role: "QC Inspector", durationMin: 10, form: { id: "f-qc-label", name: "Label Placement Check", fields: [
        { id: "alignment", label: "Alignment", type: "select", required: true, options: ["Perfect", "Slight Offset", "Misaligned", "Crooked"] },
        { id: "wrinkles", label: "Wrinkles / Bubbles", type: "pass_fail", required: true },
        { id: "samples", label: "Samples Checked", type: "number", required: true, min: 1, max: 50 },
        { id: "result", label: "Overall Result", type: "pass_fail", required: true },
      ]}},
      { id: "n12", typeId: "nt-lab", name: "CO2 Volume Test", x: 16, y: 14, role: "Lab Technician", durationMin: 15, form: { id: "f-lab-co2", name: "CO2 Volume Test", fields: [
        { id: "co2_volume", label: "CO2 Volume", type: "number", required: true, min: 3.0, max: 4.5, unit: "vol" },
        { id: "temperature", label: "Test Temp", type: "number", required: true, min: 20, max: 25, unit: "°C" },
        { id: "result", label: "Result", type: "pass_fail", required: true },
      ]}},
      { id: "n13", typeId: "nt-process", name: "Case Packing", x: 12, y: 16, role: "Operator", durationMin: 45 },
      { id: "n14", typeId: "nt-qc", name: "Final QA", x: 12, y: 18, role: "QC Inspector", durationMin: 20, form: { id: "f-qa-final", name: "Final QA Release", fields: [
        { id: "appearance", label: "Appearance Check", type: "pass_fail", required: true },
        { id: "seal_integrity", label: "Seal Integrity", type: "pass_fail", required: true },
        { id: "batch_code", label: "Batch Code Verified", type: "checkbox", required: true },
        { id: "quantity", label: "Quantity Checked", type: "number", required: true, unit: "cases" },
        { id: "result", label: "Release Decision", type: "pass_fail", required: true },
        { id: "remarks", label: "Remarks", type: "textarea", required: false },
      ]}},
      { id: "n15", typeId: "nt-end", name: "Release to Warehouse", x: 12, y: 20 },
    ],
    edges: [
      { id: "e1", fromNodeId: "n1", toNodeId: "n2", label: "initiate" },
      { id: "e2", fromNodeId: "n2", toNodeId: "n3", label: "parallel" },
      { id: "e3", fromNodeId: "n2", toNodeId: "n4", label: "parallel" },
      { id: "e4", fromNodeId: "n3", toNodeId: "n5", label: "pass" },
      { id: "e5", fromNodeId: "n4", toNodeId: "n5", label: "join" },
      { id: "e6", fromNodeId: "n5", toNodeId: "n7", label: "approved" },
      { id: "e7", fromNodeId: "n5", toNodeId: "n6", label: "sample" },
      { id: "e8", fromNodeId: "n7", toNodeId: "n8", label: "parallel" },
      { id: "e9", fromNodeId: "n7", toNodeId: "n9", label: "parallel" },
      { id: "e10", fromNodeId: "n8", toNodeId: "n10", label: "join" },
      { id: "e11", fromNodeId: "n9", toNodeId: "n10", label: "join" },
      { id: "e12", fromNodeId: "n10", toNodeId: "n11", label: "parallel" },
      { id: "e13", fromNodeId: "n10", toNodeId: "n12", label: "parallel" },
      { id: "e14", fromNodeId: "n11", toNodeId: "n13", label: "join" },
      { id: "e15", fromNodeId: "n12", toNodeId: "n13", label: "join" },
      { id: "e16", fromNodeId: "n13", toNodeId: "n14", label: "verify" },
      { id: "e17", fromNodeId: "n14", toNodeId: "n15", label: "release" },
    ],
  },
  {
    id: "tpl-water-001",
    name: "Island Chill Water 1.5L Production",
    description: "Still water production with UV and ozonation",
    productFamily: "Island Chill Water",
    bomId: "BOM-IW-330",
    status: "published",
    createdAt: "2025-01-12T09:00:00Z",
    nodes: [
      { id: "w1", typeId: "nt-start", name: "Production Start", x: 12, y: 0 },
      { id: "w2", typeId: "nt-process", name: "Preform Load", x: 12, y: 2, role: "Operator", durationMin: 20 },
      { id: "w3", typeId: "nt-mix", name: "Ozonation", x: 8, y: 4, role: "Operator", durationMin: 30, parallelGroup: "treat" },
      { id: "w4", typeId: "nt-mix", name: "UV Sterilisation", x: 16, y: 4, role: "Operator", durationMin: 25, parallelGroup: "treat" },
      { id: "w5", typeId: "nt-lab", name: "TDS / pH Test", x: 8, y: 6, role: "Lab Technician", durationMin: 15, parallelGroup: "test" },
      { id: "w6", typeId: "nt-qc", name: "Clarity Check", x: 16, y: 6, role: "QC Inspector", durationMin: 10, parallelGroup: "test" },
      { id: "w7", typeId: "nt-fill", name: "Blow-Fill-Cap", x: 12, y: 8, role: "Operator", durationMin: 90 },
      { id: "w8", typeId: "nt-qc", name: "Leak Test", x: 8, y: 10, role: "QC Inspector", durationMin: 10 },
      { id: "w9", typeId: "nt-process", name: "Label & Shrink", x: 12, y: 12, role: "Operator", durationMin: 45 },
      { id: "w10", typeId: "nt-qc", name: "Final QA", x: 12, y: 14, role: "QC Inspector", durationMin: 15 },
      { id: "w11", typeId: "nt-end", name: "Release", x: 12, y: 16 },
    ],
    edges: [
      { id: "we1", fromNodeId: "w1", toNodeId: "w2" },
      { id: "we2", fromNodeId: "w2", toNodeId: "w3", label: "parallel" },
      { id: "we3", fromNodeId: "w2", toNodeId: "w4", label: "parallel" },
      { id: "we4", fromNodeId: "w3", toNodeId: "w5", label: "join" },
      { id: "we5", fromNodeId: "w4", toNodeId: "w6", label: "join" },
      { id: "we6", fromNodeId: "w5", toNodeId: "w7", label: "join" },
      { id: "we7", fromNodeId: "w6", toNodeId: "w7", label: "join" },
      { id: "we8", fromNodeId: "w7", toNodeId: "w8" },
      { id: "we9", fromNodeId: "w8", toNodeId: "w9" },
      { id: "we10", fromNodeId: "w9", toNodeId: "w10" },
      { id: "we11", fromNodeId: "w10", toNodeId: "w11" },
    ],
  },
  {
    id: "tpl-bourbon-001",
    name: "Bourbon Bluez RTD Production",
    description: "Ready-to-drink alcoholic beverage production",
    productFamily: "Bourbon Bluez",
    bomId: "BOM-BB-330",
    status: "draft",
    createdAt: "2025-01-14T11:00:00Z",
    nodes: [
      { id: "b1", typeId: "nt-start", name: "Start", x: 12, y: 0 },
      { id: "b2", typeId: "nt-process", name: "Spirit Receipt", x: 12, y: 2, role: "Warehouse", durationMin: 20 },
      { id: "b3", typeId: "nt-mix", name: "Blend", x: 12, y: 4, role: "Operator", durationMin: 40 },
      { id: "b4", typeId: "nt-lab", name: "Alcohol % Test", x: 16, y: 4, role: "Lab Technician", durationMin: 20 },
      { id: "b5", typeId: "nt-qc", name: "Taste Panel", x: 8, y: 6, role: "QC Inspector", durationMin: 30 },
      { id: "b6", typeId: "nt-fill", name: "Can Fill", x: 12, y: 8, role: "Operator", durationMin: 60 },
      { id: "b7", typeId: "nt-end", name: "Release", x: 12, y: 10 },
    ],
    edges: [
      { id: "be1", fromNodeId: "b1", toNodeId: "b2" },
      { id: "be2", fromNodeId: "b2", toNodeId: "b3" },
      { id: "be3", fromNodeId: "b3", toNodeId: "b4", label: "sample" },
      { id: "be4", fromNodeId: "b3", toNodeId: "b5", label: "sample" },
      { id: "be5", fromNodeId: "b4", toNodeId: "b6", label: "pass" },
      { id: "be6", fromNodeId: "b5", toNodeId: "b6", label: "pass" },
      { id: "be7", fromNodeId: "b6", toNodeId: "b7" },
    ],
  },
];

// ── DSS ACTIVE RUNS (Live Production Instances) ─────────────────────────────

export interface DSSNodeState {
  nodeId: string;
  status: "pending" | "ready" | "running" | "completed" | "failed" | "skipped" | "on_hold";
  startedAt?: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
  formData?: Record<string, string | number | boolean>; // submitted form values
  faultId?: string; // link to fault report if on_hold
}

export interface DSSActiveRun {
  id: string;
  templateId: string;
  name: string;
  workOrderId?: string;
  status: "setup" | "running" | "paused" | "completed" | "aborted";
  startedAt?: string;
  completedAt?: string;
  nodeStates: DSSNodeState[];
  faults: DSSFaultReport[];
}

export const dssActiveRuns: DSSActiveRun[] = [
  {
    id: "run-001",
    templateId: "tpl-cola-001",
    name: "WO-2025-005 — Crush Cola 2.5L",
    workOrderId: "wo5",
    status: "running",
    startedAt: "2025-01-15T06:00:00Z",
    nodeStates: [
      { nodeId: "n1", status: "completed", startedAt: "2025-01-15T06:00:00Z", completedAt: "2025-01-15T06:05:00Z", assignedTo: "Operator" },
      { nodeId: "n2", status: "completed", startedAt: "2025-01-15T06:05:00Z", completedAt: "2025-01-15T06:35:00Z", assignedTo: "Operator" },
      { nodeId: "n3", status: "completed", startedAt: "2025-01-15T06:05:00Z", completedAt: "2025-01-15T06:50:00Z", assignedTo: "Ingredient Mixer" },
      { nodeId: "n4", status: "completed", startedAt: "2025-01-15T06:05:00Z", completedAt: "2025-01-15T06:35:00Z", assignedTo: "Operator" },
      { nodeId: "n5", status: "completed", startedAt: "2025-01-15T06:50:00Z", completedAt: "2025-01-15T07:05:00Z", assignedTo: "QC Inspector", formData: { brix: 12.5, ph: 3.2, temperature: 21, result: true, notes: "Within spec" } },
      { nodeId: "n6", status: "completed", startedAt: "2025-01-15T06:50:00Z", completedAt: "2025-01-15T07:10:00Z", assignedTo: "Lab Technician", formData: { sample_id: "S-2025-015-A", tpc: 45, yeast: 8, coliforms: true, test_date: "2025-01-15" } },
      { nodeId: "n7", status: "running", startedAt: "2025-01-15T07:10:00Z", assignedTo: "Operator" },
      { nodeId: "n8", status: "pending", assignedTo: "QC Inspector" },
      { nodeId: "n9", status: "pending", assignedTo: "QC Inspector" },
      { nodeId: "n10", status: "pending", assignedTo: "Operator" },
      { nodeId: "n11", status: "pending", assignedTo: "QC Inspector" },
      { nodeId: "n12", status: "pending", assignedTo: "Lab Technician" },
      { nodeId: "n13", status: "pending", assignedTo: "Operator" },
      { nodeId: "n14", status: "pending", assignedTo: "QC Inspector" },
      { nodeId: "n15", status: "pending", assignedTo: "Operator" },
    ],
    faults: [
      { id: "fault-001", runId: "run-001", nodeId: "n7", lineId: "fl3", reportedBy: "John M.", reportedAt: "2025-01-15T07:45:00Z", severity: "major", category: "mechanical", description: "Filler head #3 jamming intermittently — bottles not seating properly", status: "repairing", repairNotes: "Technician en route" },
    ],
  },
  {
    id: "run-002",
    templateId: "tpl-water-001",
    name: "WO-2025-001 — Island Chill Water 330ml",
    workOrderId: "wo1",
    status: "running",
    startedAt: "2025-01-15T08:00:00Z",
    nodeStates: [
      { nodeId: "w1", status: "completed", startedAt: "2025-01-15T08:00:00Z", completedAt: "2025-01-15T08:05:00Z" },
      { nodeId: "w2", status: "completed", startedAt: "2025-01-15T08:05:00Z", completedAt: "2025-01-15T08:25:00Z" },
      { nodeId: "w3", status: "completed", startedAt: "2025-01-15T08:25:00Z", completedAt: "2025-01-15T08:55:00Z" },
      { nodeId: "w4", status: "completed", startedAt: "2025-01-15T08:25:00Z", completedAt: "2025-01-15T08:50:00Z" },
      { nodeId: "w5", status: "completed", startedAt: "2025-01-15T08:55:00Z", completedAt: "2025-01-15T09:10:00Z" },
      { nodeId: "w6", status: "completed", startedAt: "2025-01-15T08:50:00Z", completedAt: "2025-01-15T09:00:00Z" },
      { nodeId: "w7", status: "running", startedAt: "2025-01-15T09:10:00Z" },
      { nodeId: "w8", status: "pending" },
      { nodeId: "w9", status: "pending" },
      { nodeId: "w10", status: "pending" },
      { nodeId: "w11", status: "pending" },
    ],
    faults: [],
  },
];

// ── AI AGENT (Tinni) ────────────────────────────────────────────────────────

export type AgentIntent =
  | "navigate"
  | "create_wo"
  | "create_schedule"
  | "generate_report"
  | "query_status"
  | "set_alert"
  | "start_dss_run"
  | "erpnext_report"
  | "erpnext_query"
  | "erpnext_sync"
  | "kaizen"
  | "vision"
  | "labels"
  | "racks"
  | "gatepass"
  | "guidelines"
  | "quality"
  | "raw-materials"
  | "finished-goods"
  | "water-quality"
  | "help"
  | "unknown";

export interface AgentCommand {
  id: string;
  rawText: string;
  intent: AgentIntent;
  params: Record<string, string | number | boolean>;
  executedAt: string;
  success: boolean;
  response: string;
}

export interface AgentScheduledTask {
  id: string;
  name: string;
  description: string;
  cronExpr: string; // simple: "daily-9am", "weekly-mon", etc.
  command: string;
  active: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface AgentBehavior {
  pageVisits: Record<string, number>;
  commandPatterns: Record<string, number>;
  timeOfDayPrefs: Record<string, string[]>; // "morning" -> ["create_wo", "view_dashboard"]
  roleShortcuts: Record<string, string[]>; // role -> frequent intents
  lastSuggestions: string[];
}

// ── ERPNext Integration ─────────────────────────────────────────────────────

export interface ERPNextConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  company: string;
  defaultWarehouse: string;
  connectedAt?: string;
  lastSync?: string;
  status: "connected" | "disconnected" | "error";
}

export interface ERPNextDocType {
  name: string;
  label: string;
  module: string;
}

export interface ERPNextReportDef {
  id: string;
  name: string;
  docType: string;
  description: string;
  filters: { field: string; label: string; type: string; default?: string }[];
}

export const erpnextDefaultConfig: ERPNextConfig = {
  enabled: false,
  baseUrl: "https://erp.islandchill.com.fj",
  company: "Island Chill Manufacturing Ltd",
  defaultWarehouse: "Stores - ICM",
  status: "disconnected",
};

export const erpnextReportDefinitions: ERPNextReportDef[] = [
  {
    id: "rep-stock-balance",
    name: "Stock Balance",
    docType: "Stock Ledger Entry",
    description: "Current stock levels across all warehouses",
    filters: [
      { field: "warehouse", label: "Warehouse", type: "select", default: "All" },
      { field: "item_group", label: "Item Group", type: "select", default: "All" },
      { field: "from_date", label: "From Date", type: "date" },
      { field: "to_date", label: "To Date", type: "date" },
    ],
  },
  {
    id: "rep-production-plan",
    name: "Production Plan Summary",
    docType: "Production Plan",
    description: "Overview of planned vs actual production",
    filters: [
      { field: "from_date", label: "From Date", type: "date" },
      { field: "to_date", label: "To Date", type: "date" },
      { field: "status", label: "Status", type: "select", default: "All" },
    ],
  },
  {
    id: "rep-bom-explorer",
    name: "BOM Explorer",
    docType: "BOM",
    description: "Bill of Materials breakdown with costing",
    filters: [
      { field: "item", label: "Finished Good", type: "link" },
      { field: "include_scrap", label: "Include Scrap", type: "checkbox", default: "false" },
    ],
  },
  {
    id: "rep-sales-analytics",
    name: "Sales Analytics",
    docType: "Sales Invoice",
    description: "Sales trends by product, customer, and region",
    filters: [
      { field: "from_date", label: "From Date", type: "date" },
      { field: "to_date", label: "To Date", type: "date" },
      { field: "customer", label: "Customer", type: "link" },
      { field: "item_group", label: "Item Group", type: "select", default: "All" },
    ],
  },
  {
    id: "rep-purchase-order-tracker",
    name: "Purchase Order Tracker",
    docType: "Purchase Order",
    description: "Track PO status, receipts, and pending items",
    filters: [
      { field: "status", label: "Status", type: "select", default: "All" },
      { field: "supplier", label: "Supplier", type: "link" },
      { field: "from_date", label: "From Date", type: "date" },
    ],
  },
  {
    id: "rep-work-order-status",
    name: "Work Order Status",
    docType: "Work Order",
    description: "All work orders with status, progress, and completion",
    filters: [
      { field: "status", label: "Status", type: "select", default: "All" },
      { field: "production_item", label: "Product", type: "link" },
      { field: "from_date", label: "From Date", type: "date" },
    ],
  },
];

export const agentDefaultTasks: AgentScheduledTask[] = [
  { id: "task-1", name: "Morning Production Brief", description: "Summarize running lines, active WOs, and open faults", cronExpr: "daily-8am", command: "morning brief", active: true },
  { id: "task-2", name: "QC Report Auto-Gen", description: "Generate QC summary for all completed WOs today", cronExpr: "daily-5pm", command: "generate qc report today", active: true },
  { id: "task-3", name: "Weekly Maintenance Check", description: "List pending maintenance checks for the week", cronExpr: "weekly-mon-8am", command: "show pending maintenance", active: false },
  { id: "task-4", name: "Inventory Alert", description: "Alert if any BOM requisitions are still in approved status", cronExpr: "daily-10am", command: "check approved requisitions", active: true },
];

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


// ═══════════════════════════════════════════════════════════════════════════════
//  NEW MODULES: Profile, Shift Management, Facial Attendance, Mail, Comms
// ═══════════════════════════════════════════════════════════════════════════════

// ── Profile Picture ──────────────────────────────────────────────────────────
export interface UserProfile {
  userId: string;
  avatarUrl?: string; // base64 or object-storage URL
  phone?: string;
  department?: string;
  employeeId?: string;
  joinedDate?: string;
  bio?: string;
}

// ── Shift Management ─────────────────────────────────────────────────────────
export interface Shift {
  id: string;
  name: string;
  startTime: string; // "06:00"
  endTime: string;   // "14:00"
  breakMinutes: number;
  color: string;
  days: string[];    // ["Mon","Tue","Wed","Thu","Fri"]
}

export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  role: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isSystemUser: boolean; // false = non-system user (attendance only)
  systemUserId?: string; // link to AppUser if applicable
  faceDescriptor?: number[]; // facial recognition vector (mock)
  active: boolean;
  joinedDate: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface ClockRecord {
  id: string;
  employeeId: string;
  type: "in" | "out" | "break_start" | "break_end";
  timestamp: string;
  method: "facial" | "manual" | "card" | "mobile";
  verified: boolean;
  shiftId?: string;
  notes?: string;
  faceMatchScore?: number; // 0-1 for facial
  photoUrl?: string;       // snapshot for facial attendance
}

export const defaultShifts: Shift[] = [
  { id: "shift-1", name: "Morning Shift", startTime: "06:00", endTime: "14:00", breakMinutes: 30, color: "#10b981", days: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
  { id: "shift-2", name: "Afternoon Shift", startTime: "14:00", endTime: "22:00", breakMinutes: 30, color: "#f59e0b", days: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
  { id: "shift-3", name: "Night Shift", startTime: "22:00", endTime: "06:00", breakMinutes: 45, color: "#6366f1", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
  { id: "shift-4", name: "Admin Shift", startTime: "08:00", endTime: "17:00", breakMinutes: 60, color: "#3b82f6", days: ["Mon","Tue","Wed","Thu","Fri"] },
];

export const defaultEmployees: Employee[] = [
  { id: "e1", name: "Sarah K.", employeeId: "EMP-1001", department: "Production", role: "Factory Manager", email: "sarah@islandchill.com", isSystemUser: true, systemUserId: "u2", active: true, joinedDate: "2022-03-15" },
  { id: "e2", name: "Mike R.", employeeId: "EMP-1002", department: "Production", role: "Production Supervisor", email: "mike@islandchill.com", isSystemUser: true, systemUserId: "u3", active: true, joinedDate: "2021-06-01" },
  { id: "e3", name: "Priya N.", employeeId: "EMP-1003", department: "Quality", role: "QC Inspector", email: "priya@islandchill.com", isSystemUser: true, systemUserId: "u4", active: true, joinedDate: "2023-01-10" },
  { id: "e4", name: "Dave R.", employeeId: "EMP-1004", department: "Maintenance", role: "Maintenance Supervisor", email: "dave@islandchill.com", isSystemUser: true, systemUserId: "u5", active: true, joinedDate: "2020-11-20" },
  { id: "e5", name: "Carlos M.", employeeId: "EMP-1005", department: "Warehouse", role: "Warehouse Supervisor", email: "carlos@islandchill.com", isSystemUser: true, systemUserId: "u6", active: true, joinedDate: "2022-08-05" },
  { id: "e6", name: "John M.", employeeId: "EMP-1006", department: "Production", role: "Operator", email: "john@islandchill.com", isSystemUser: true, systemUserId: "u7", active: true, joinedDate: "2023-04-12" },
  { id: "e7", name: "Lisa T.", employeeId: "EMP-1007", department: "Planning", role: "Planner", email: "lisa@islandchill.com", isSystemUser: true, systemUserId: "u8", active: true, joinedDate: "2021-09-01" },
  { id: "e8", name: "Raj P.", employeeId: "EMP-1008", department: "Production", role: "Ingredient Mixer", email: "raj@islandchill.com", isSystemUser: true, systemUserId: "u10", active: true, joinedDate: "2022-02-28" },
  // Non-system users (attendance only, no login)
  { id: "e9", name: "Leo V.", employeeId: "EMP-1009", department: "Production", role: "Operator", isSystemUser: false, active: true, joinedDate: "2024-01-15" },
  { id: "e10", name: "Mia T.", employeeId: "EMP-1010", department: "Quality", role: "QC Assistant", isSystemUser: false, active: true, joinedDate: "2024-03-01" },
  { id: "e11", name: "Sam W.", employeeId: "EMP-1011", department: "Warehouse", role: "Forklift Driver", isSystemUser: false, active: true, joinedDate: "2024-05-20" },
  { id: "e12", name: "Ella B.", employeeId: "EMP-1012", department: "Production", role: "Packaging", isSystemUser: false, active: false, joinedDate: "2023-08-10" },
];

export const defaultShiftAssignments: ShiftAssignment[] = [
  { id: "sa-1", employeeId: "e1", shiftId: "shift-4", effectiveFrom: "2024-01-01" },
  { id: "sa-2", employeeId: "e2", shiftId: "shift-1", effectiveFrom: "2024-01-01" },
  { id: "sa-3", employeeId: "e3", shiftId: "shift-1", effectiveFrom: "2024-01-01" },
  { id: "sa-4", employeeId: "e4", shiftId: "shift-2", effectiveFrom: "2024-01-01" },
  { id: "sa-5", employeeId: "e5", shiftId: "shift-1", effectiveFrom: "2024-01-01" },
  { id: "sa-6", employeeId: "e6", shiftId: "shift-1", effectiveFrom: "2024-01-01" },
  { id: "sa-7", employeeId: "e7", shiftId: "shift-4", effectiveFrom: "2024-01-01" },
  { id: "sa-8", employeeId: "e8", shiftId: "shift-2", effectiveFrom: "2024-01-01" },
  { id: "sa-9", employeeId: "e9", shiftId: "shift-1", effectiveFrom: "2024-06-01" },
  { id: "sa-10", employeeId: "e10", shiftId: "shift-2", effectiveFrom: "2024-06-01" },
  { id: "sa-11", employeeId: "e11", shiftId: "shift-1", effectiveFrom: "2024-06-01" },
];

export const defaultClockRecords: ClockRecord[] = [
  { id: "cr-1", employeeId: "e2", type: "in", timestamp: "2025-01-15T06:00:00", method: "facial", verified: true, shiftId: "shift-1", faceMatchScore: 0.97 },
  { id: "cr-2", employeeId: "e6", type: "in", timestamp: "2025-01-15T06:02:00", method: "facial", verified: true, shiftId: "shift-1", faceMatchScore: 0.94 },
  { id: "cr-3", employeeId: "e2", type: "break_start", timestamp: "2025-01-15T09:30:00", method: "manual", verified: true, shiftId: "shift-1" },
  { id: "cr-4", employeeId: "e2", type: "break_end", timestamp: "2025-01-15T10:00:00", method: "manual", verified: true, shiftId: "shift-1" },
  { id: "cr-5", employeeId: "e2", type: "out", timestamp: "2025-01-15T14:05:00", method: "facial", verified: true, shiftId: "shift-1", faceMatchScore: 0.96 },
  { id: "cr-6", employeeId: "e4", type: "in", timestamp: "2025-01-15T14:00:00", method: "facial", verified: true, shiftId: "shift-2", faceMatchScore: 0.98 },
  { id: "cr-7", employeeId: "e8", type: "in", timestamp: "2025-01-15T14:01:00", method: "card", verified: true, shiftId: "shift-2" },
  { id: "cr-8", employeeId: "e9", type: "in", timestamp: "2025-01-15T06:05:00", method: "facial", verified: true, shiftId: "shift-1", faceMatchScore: 0.91 },
];

// ── Facial Attendance ────────────────────────────────────────────────────────
export interface FaceRegistration {
  employeeId: string;
  photoUrl: string;      // base64 snapshot
  descriptor: number[];  // 128-dim mock vector
  registeredAt: string;
}

export interface AttendanceSession {
  id: string;
  employeeId: string;
  date: string;
  shiftId: string;
  clockIn?: ClockRecord;
  clockOut?: ClockRecord;
  breaks: ClockRecord[];
  totalHours: number;
  status: "present" | "late" | "absent" | "half_day" | "on_leave";
}

export const defaultFaceRegistrations: FaceRegistration[] = [
  { employeeId: "e2", photoUrl: "", descriptor: Array.from({ length: 128 }, (_, i) => Math.sin(i) * 0.5 + 0.5), registeredAt: "2024-01-15T08:00:00" },
  { employeeId: "e4", photoUrl: "", descriptor: Array.from({ length: 128 }, (_, i) => Math.cos(i) * 0.5 + 0.5), registeredAt: "2024-01-15T08:00:00" },
  { employeeId: "e6", photoUrl: "", descriptor: Array.from({ length: 128 }, (_, i) => Math.sin(i + 1) * 0.5 + 0.5), registeredAt: "2024-02-01T08:00:00" },
  { employeeId: "e9", photoUrl: "", descriptor: Array.from({ length: 128 }, (_, i) => Math.cos(i + 2) * 0.5 + 0.5), registeredAt: "2024-06-15T08:00:00" },
];

// ── Mail Notification System ─────────────────────────────────────────────────
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string; // masked in UI
  fromName: string;
  fromAddress: string;
  enabled: boolean;
  status: "connected" | "disconnected" | "error";
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[]; // {{user_name}}, {{wo_id}}, etc.
  trigger: "manual" | "wo_created" | "qc_failed" | "incident_reported" | "dss_fault" | "shift_change" | "daily_summary";
  enabled: boolean;
}

export interface NotificationLog {
  id: string;
  templateId: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "pending";
  sentAt?: string;
  error?: string;
  channel: "email" | "whatsapp" | "viber" | "telegram";
}

export const defaultSMTPConfig: SMTPConfig = {
  host: "smtp.islandchill.com.fj",
  port: 587,
  secure: true,
  username: "notifications@islandchill.com.fj",
  password: "",
  fromName: "Island Chill MES",
  fromAddress: "notifications@islandchill.com.fj",
  enabled: false,
  status: "disconnected",
};

export const defaultNotificationTemplates: NotificationTemplate[] = [
  { id: "ntpl-1", name: "WO Created", subject: "New Work Order: {{wo_name}}", body: "A new work order has been created for {{product}}. Line: {{line}}.", variables: ["wo_name","product","line"], trigger: "wo_created", enabled: true },
  { id: "ntpl-2", name: "QC Failure Alert", subject: "QC Check Failed — {{wo_name}}", body: "Quality check {{check_name}} failed on {{wo_name}}. Immediate attention required.", variables: ["wo_name","check_name"], trigger: "qc_failed", enabled: true },
  { id: "ntpl-3", name: "Incident Reported", subject: "Incident: {{incident_title}}", body: "An incident has been reported on {{line}}. Severity: {{severity}}.", variables: ["incident_title","line","severity"], trigger: "incident_reported", enabled: true },
  { id: "ntpl-4", name: "DSS Fault", subject: "Process Halted — {{node_name}}", body: "A fault has stopped node {{node_name}} in run {{run_name}}. Fault: {{fault_category}}.", variables: ["node_name","run_name","fault_category"], trigger: "dss_fault", enabled: true },
  { id: "ntpl-5", name: "Daily Production Summary", subject: "Daily Summary — {{date}}", body: "Production summary for {{date}}:\nWOs completed: {{wo_completed}}\nBottles produced: {{bottles}}\nEfficiency: {{efficiency}}%", variables: ["date","wo_completed","bottles","efficiency"], trigger: "daily_summary", enabled: false },
  { id: "ntpl-6", name: "Shift Change Notice", subject: "Shift Change — {{employee_name}}", body: "Your shift has been changed to {{shift_name}} effective {{effective_date}}.", variables: ["employee_name","shift_name","effective_date"], trigger: "shift_change", enabled: true },
];

export const defaultNotificationLogs: NotificationLog[] = [
  { id: "nl-1", templateId: "ntpl-1", recipient: "sarah@islandchill.com", subject: "New Work Order: WO-2025-005", status: "sent", sentAt: "2025-01-15T08:05:00", channel: "email" },
  { id: "nl-2", templateId: "ntpl-2", recipient: "priya@islandchill.com", subject: "QC Check Failed — WO-2025-003", status: "sent", sentAt: "2025-01-14T16:30:00", channel: "email" },
  { id: "nl-3", templateId: "ntpl-3", recipient: "mike@islandchill.com", subject: "Incident: FL1 Conveyor Jam", status: "failed", sentAt: "2025-01-14T10:15:00", error: "Connection timeout", channel: "email" },
  { id: "nl-4", templateId: "ntpl-6", recipient: "john@islandchill.com", subject: "Shift Change — John M.", status: "pending", channel: "whatsapp" },
];

// ── Communication Platforms ──────────────────────────────────────────────────
export type CommsChannel = "whatsapp" | "viber" | "telegram";

export interface CommsConfig {
  channel: CommsChannel;
  enabled: boolean;
  apiKey?: string;
  webhookUrl?: string;
  phoneNumber?: string;
  botName?: string;
  status: "connected" | "disconnected" | "error";
}

export interface CommsMessage {
  id: string;
  channel: CommsChannel;
  sender: string;
  senderPhone?: string;
  content: string;
  timestamp: string;
  read: boolean;
  direction: "in" | "out";
  attachmentUrl?: string;
}

export const defaultCommsConfigs: CommsConfig[] = [
  { channel: "whatsapp", enabled: true, phoneNumber: "+679-999-8888", botName: "Island Chill Bot", status: "connected" },
  { channel: "viber", enabled: false, phoneNumber: "+679-999-8888", botName: "Island Chill", status: "disconnected" },
  { channel: "telegram", enabled: true, botName: "@islandchill_bot", status: "connected" },
];

export const defaultCommsMessages: CommsMessage[] = [
  { id: "cm-1", channel: "whatsapp", sender: "Mike R.", senderPhone: "+679-123-4567", content: "FL2 is back online after maintenance. Ready for next batch.", timestamp: "2025-01-15T09:15:00", read: false, direction: "in" },
  { id: "cm-2", channel: "whatsapp", sender: "Priya N.", senderPhone: "+679-234-5678", content: "QC passed for WO-2025-005. All parameters within spec.", timestamp: "2025-01-15T08:45:00", read: true, direction: "in" },
  { id: "cm-3", channel: "telegram", sender: "System", content: "Daily production target met at 94% efficiency.", timestamp: "2025-01-15T07:30:00", read: true, direction: "out" },
  { id: "cm-4", channel: "whatsapp", sender: "Dave R.", senderPhone: "+679-345-6789", content: "Conveyor belt on FL1 needs lubrication. Scheduling for next break.", timestamp: "2025-01-15T06:20:00", read: false, direction: "in" },
  { id: "cm-5", channel: "viber", sender: "Carlos M.", senderPhone: "+679-456-7890", content: "Raw sugar delivery delayed by 2 hours. ETA 11:00.", timestamp: "2025-01-15T05:45:00", read: true, direction: "in" },
  { id: "cm-6", channel: "telegram", sender: "System", content: "Shift handover note: Night shift completed 420 cases of Water 1.5L.", timestamp: "2025-01-15T05:00:00", read: true, direction: "out" },
];

// ── Kaizen / Continuous Improvement ──────────────────────────────────────────
export type KaizenCategory = "safety" | "quality" | "cost" | "delivery" | "morale" | "environment";
export type KaizenType = "daily" | "event" | "kaikaku";
export type KaizenStatus = "backlog" | "in_review" | "in_progress" | "completed" | "impact_verified";
export type PDCAStage = "plan" | "do" | "check" | "act";

export interface KaizenSuggestion {
  id: string;
  title: string;
  description: string;
  category: KaizenCategory;
  type: KaizenType;
  status: KaizenStatus;
  pdcaStage: PDCAStage;
  submittedBy: string;   // employee name
  submittedById: string; // employee id
  assignedTo?: string;   // employee name
  assignedToId?: string; // employee id
  lineId?: string;       // filling line id
  sourceIncidentId?: string;
  expectedBenefit: string;
  actualBenefit?: string;
  beforeMetric?: string;
  afterMetric?: string;
  createdAt: string;
  targetDate?: string;
  completedAt?: string;
}

export const defaultKaizenSuggestions: KaizenSuggestion[] = [
  {
    id: "kz-1",
    title: "Reduce changeover time on FL1",
    description: "Standardize pre-cleaning sequence and pre-stage labels. Current changeover takes 45 mins; target 25 mins.",
    category: "delivery",
    type: "daily",
    status: "in_progress",
    pdcaStage: "do",
    submittedBy: "Leo V.",
    submittedById: "e9",
    assignedTo: "Sam W.",
    assignedToId: "e11",
    lineId: "fl-1",
    expectedBenefit: "+20 cases/hr throughput during swing shifts",
    beforeMetric: "45 min",
    afterMetric: "32 min (pilot)",
    createdAt: "2025-01-10T08:00:00",
    targetDate: "2025-01-20",
  },
  {
    id: "kz-2",
    title: "5S shadow boards for hand-tools",
    description: "Install colour-coded foam cut-outs in maintenance bay so missing tools are spotted immediately.",
    category: "safety",
    type: "event",
    status: "completed",
    pdcaStage: "act",
    submittedBy: "Mia T.",
    submittedById: "e10",
    assignedTo: "Mia T.",
    assignedToId: "e10",
    lineId: "fl-2",
    expectedBenefit: "Eliminate 3 min/tool search time; reduce trip hazards",
    actualBenefit: "Avg search time down from 3.2 min to 0.4 min",
    beforeMetric: "3.2 min avg search",
    afterMetric: "0.4 min avg search",
    createdAt: "2025-01-05T09:00:00",
    completedAt: "2025-01-12T16:00:00",
  },
  {
    id: "kz-3",
    title: "Condensate recovery for CIP rinse",
    description: "Route steam condensate into CIP pre-rinse tank instead of drain. Estimated 800L/day water savings.",
    category: "environment",
    type: "kaikaku",
    status: "in_review",
    pdcaStage: "plan",
    submittedBy: "Priya N.",
    submittedById: "u3",
    assignedTo: "Dave R.",
    assignedToId: "u5",
    expectedBenefit: "Save 800L water/day; reduce effluent load",
    createdAt: "2025-01-14T07:30:00",
    targetDate: "2025-02-15",
  },
  {
    id: "kz-4",
    title: "Pre-weigh sugar in totes",
    description: "Shift from 25kg bag pours to pre-weighed 500kg totes with quick-connect couplings.",
    category: "cost",
    type: "daily",
    status: "backlog",
    pdcaStage: "plan",
    submittedBy: "Carlos M.",
    submittedById: "u6",
    expectedBenefit: "Reduce material handling labour by 1.5 FTE; less dust exposure",
    createdAt: "2025-01-13T14:00:00",
  },
  {
    id: "kz-5",
    title: "Visual FIFO lane for warehouse B-zone",
    description: "Paint floor lanes and add digital pick-lights so oldest stock is picked first.",
    category: "quality",
    type: "event",
    status: "impact_verified",
    pdcaStage: "act",
    submittedBy: "Ella B.",
    submittedById: "e12",
    assignedTo: "Ella B.",
    assignedToId: "e12",
    expectedBenefit: "Reduce expiry waste by 60%",
    actualBenefit: "Expiry waste down from 2.1% to 0.7% over 4 weeks",
    beforeMetric: "2.1% expiry waste",
    afterMetric: "0.7% expiry waste",
    createdAt: "2024-12-20T10:00:00",
    completedAt: "2025-01-08T12:00:00",
  },
  {
    id: "kz-6",
    title: "Break-room hydration station",
    description: "Install filtered water station to reduce single-use plastic bottles on floor.",
    category: "morale",
    type: "daily",
    status: "in_progress",
    pdcaStage: "do",
    submittedBy: "Ana S.",
    submittedById: "u2",
    assignedTo: "Ana S.",
    assignedToId: "u2",
    expectedBenefit: "Reduce plastic waste; improve hydration on hot shifts",
    createdAt: "2025-01-11T06:00:00",
    targetDate: "2025-01-25",
  },
];

// ── Carton Label ─────────────────────────────────────────────────────────────
export type CartonLabelStatus = "produced" | "in_warehouse" | "picked" | "dispatched" | "delivered";

export interface CartonLabel {
  id: string;
  labelCode: string;      // barcode / QR content
  workOrderId: string;
  product: string;
  variant: string;
  batchNumber: string;
  productionDate: string; // ISO date
  expiryDate: string;     // ISO date
  quantity: number;       // units in carton
  uom: string;
  status: CartonLabelStatus;
  warehouseBinId?: string;
  gatePassId?: string;
  createdAt: string;
  printedAt?: string;
}

export const defaultCartonLabels: CartonLabel[] = [
  {
    id: "cl-1", labelCode: "IC-2025-001-A", workOrderId: "wo-1", product: "Island Chill Water", variant: "1.5L",
    batchNumber: "B250115-FL1", productionDate: "2025-01-15", expiryDate: "2025-07-15",
    quantity: 12, uom: "bottles", status: "in_warehouse", warehouseBinId: "wb-a1-01",
    createdAt: "2025-01-15T08:00:00", printedAt: "2025-01-15T08:05:00",
  },
  {
    id: "cl-2", labelCode: "IC-2025-001-B", workOrderId: "wo-1", product: "Island Chill Water", variant: "1.5L",
    batchNumber: "B250115-FL1", productionDate: "2025-01-15", expiryDate: "2025-07-15",
    quantity: 12, uom: "bottles", status: "in_warehouse", warehouseBinId: "wb-a1-02",
    createdAt: "2025-01-15T08:10:00", printedAt: "2025-01-15T08:15:00",
  },
  {
    id: "cl-3", labelCode: "IC-2025-002-A", workOrderId: "wo-2", product: "Crush Cola", variant: "330ml",
    batchNumber: "B250115-FL2", productionDate: "2025-01-15", expiryDate: "2025-10-15",
    quantity: 24, uom: "cans", status: "picked", gatePassId: "gp-1",
    createdAt: "2025-01-15T09:00:00", printedAt: "2025-01-15T09:05:00",
  },
  {
    id: "cl-4", labelCode: "IC-2025-003-A", workOrderId: "wo-3", product: "Crush Orange", variant: "500ml",
    batchNumber: "B250115-FL1", productionDate: "2025-01-15", expiryDate: "2025-10-15",
    quantity: 24, uom: "bottles", status: "produced",
    createdAt: "2025-01-15T10:00:00", printedAt: "2025-01-15T10:05:00",
  },
  {
    id: "cl-5", labelCode: "IC-2025-004-A", workOrderId: "wo-4", product: "Bourbon Bluez", variant: "750ml",
    batchNumber: "B250114-FL2", productionDate: "2025-01-14", expiryDate: "2026-01-14",
    quantity: 12, uom: "bottles", status: "dispatched", warehouseBinId: "wb-b2-01", gatePassId: "gp-2",
    createdAt: "2025-01-14T14:00:00", printedAt: "2025-01-14T14:05:00",
  },
  {
    id: "cl-6", labelCode: "IC-2025-004-B", workOrderId: "wo-4", product: "Bourbon Bluez", variant: "750ml",
    batchNumber: "B250114-FL2", productionDate: "2025-01-14", expiryDate: "2026-01-14",
    quantity: 12, uom: "bottles", status: "delivered", gatePassId: "gp-2",
    createdAt: "2025-01-14T14:10:00", printedAt: "2025-01-14T14:15:00",
  },
];

// ── Warehouse Racks / Bins ───────────────────────────────────────────────────
export interface WarehouseRack {
  id: string;
  zoneId: string;
  name: string;
  code: string;
  location: string;
  capacity: number; // number of bins
}

export interface BinItem {
  cartonLabelId: string;
  labelCode: string;
  product: string;
  variant: string;
  batchNumber: string;
  quantity: number;
  uom: string;
  storedAt: string;
}

export interface WarehouseBin {
  id: string;
  rackId: string;
  name: string;
  code: string;
  capacity: number; // max cartons
  items: BinItem[];
  status: "empty" | "partial" | "full";
}

export const defaultWarehouseRacks: WarehouseRack[] = [
  { id: "wr-a1", zoneId: "z3", name: "Rack A1", code: "A1", location: "FG Zone — Row A", capacity: 10 },
  { id: "wr-a2", zoneId: "z3", name: "Rack A2", code: "A2", location: "FG Zone — Row A", capacity: 10 },
  { id: "wr-b1", zoneId: "z3", name: "Rack B1", code: "B1", location: "FG Zone — Row B", capacity: 8 },
  { id: "wr-b2", zoneId: "z3", name: "Rack B2", code: "B2", location: "FG Zone — Row B", capacity: 8 },
  { id: "wr-rm1", zoneId: "z6", name: "RM Rack 1", code: "RM1", location: "RM Zone — Sugar", capacity: 6 },
  { id: "wr-rm2", zoneId: "z6", name: "RM Rack 2", code: "RM2", location: "RM Zone — Flavours", capacity: 6 },
];

export const defaultWarehouseBins: WarehouseBin[] = [
  { id: "wb-a1-01", rackId: "wr-a1", name: "Bin 01", code: "A1-01", capacity: 20, items: [
    { cartonLabelId: "cl-1", labelCode: "IC-2025-001-A", product: "Island Chill Water", variant: "1.5L", batchNumber: "B250115-FL1", quantity: 12, uom: "bottles", storedAt: "2025-01-15T08:30:00" },
  ], status: "partial" },
  { id: "wb-a1-02", rackId: "wr-a1", name: "Bin 02", code: "A1-02", capacity: 20, items: [
    { cartonLabelId: "cl-2", labelCode: "IC-2025-001-B", product: "Island Chill Water", variant: "1.5L", batchNumber: "B250115-FL1", quantity: 12, uom: "bottles", storedAt: "2025-01-15T08:35:00" },
  ], status: "partial" },
  { id: "wb-a1-03", rackId: "wr-a1", name: "Bin 03", code: "A1-03", capacity: 20, items: [], status: "empty" },
  { id: "wb-a1-04", rackId: "wr-a1", name: "Bin 04", code: "A1-04", capacity: 20, items: [], status: "empty" },
  { id: "wb-a2-01", rackId: "wr-a2", name: "Bin 01", code: "A2-01", capacity: 20, items: [], status: "empty" },
  { id: "wb-a2-02", rackId: "wr-a2", name: "Bin 02", code: "A2-02", capacity: 20, items: [], status: "empty" },
  { id: "wb-b2-01", rackId: "wr-b2", name: "Bin 01", code: "B2-01", capacity: 15, items: [], status: "empty" }, // cl-5 was picked
  { id: "wb-rm1-01", rackId: "wr-rm1", name: "Bin 01", code: "RM1-01", capacity: 10, items: [
    { cartonLabelId: "raw-1", labelCode: "RAW-SUG-500", product: "Raw Sugar", variant: "Bulk", batchNumber: "SUG-2408", quantity: 500, uom: "kg", storedAt: "2024-08-15T10:00:00" },
  ], status: "partial" },
  { id: "wb-rm2-01", rackId: "wr-rm2", name: "Bin 01", code: "RM2-01", capacity: 10, items: [
    { cartonLabelId: "raw-2", labelCode: "RAW-FLV-COL", product: "Cola Flavouring", variant: "Concentrate", batchNumber: "FLV-2409", quantity: 50, uom: "L", storedAt: "2024-09-10T08:00:00" },
  ], status: "partial" },
];

// ── Gate Pass ────────────────────────────────────────────────────────────────
export type GatePassStatus = "draft" | "approved" | "loading" | "dispatched" | "delivered";

export interface GatePassItem {
  id: string;
  gatePassId: string;
  cartonLabelId: string;
  labelCode: string;
  product: string;
  variant: string;
  batchNumber: string;
  quantity: number;
  pickedFromBinId?: string;
  status: "pending" | "picked" | "loaded" | "delivered";
}

export interface GatePassAttachment {
  id: string;
  attachmentType: "Pickup Photo" | "Delivery Photo" | "Signature" | "Other";
  imageUrl: string;
  capturedAt?: string;
  notes?: string;
}

export interface GatePass {
  id: string;
  passNumber: string;
  vehicleNumber: string;
  driver: string;
  driverName: string;
  destination: string;
  status: GatePassStatus;
  items: GatePassItem[];
  pickupLocation?: string;
  pickupDatetime?: string;
  pickupNotes?: string;
  deliveryLocation?: string;
  deliveryDatetime?: string;
  receiverName?: string;
  receiverSignatureUrl?: string;
  deliveryNotes?: string;
  attachments?: GatePassAttachment[];
  createdAt: string;
  approvedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export const defaultGatePasses: GatePass[] = [
  {
    id: "gp-1", passNumber: "GP-2025-001", vehicleNumber: "FJ123-ABC", driverName: "John D.",
    destination: "Nadi Distribution Centre", status: "loading",
    items: [
      { id: "gpi-1", gatePassId: "gp-1", cartonLabelId: "cl-3", labelCode: "IC-2025-002-A", product: "Crush Cola", variant: "330ml", batchNumber: "B250115-FL2", quantity: 24, pickedFromBinId: "wb-a2-01", status: "picked" },
    ],
    createdAt: "2025-01-15T11:00:00", approvedAt: "2025-01-15T11:30:00",
    notes: "Urgent replenishment order",
  },
  {
    id: "gp-2", passNumber: "GP-2025-002", vehicleNumber: "FJ456-DEF", driverName: "Mike R.",
    destination: "Suva Retail Hub", status: "delivered",
    items: [
      { id: "gpi-2", gatePassId: "gp-2", cartonLabelId: "cl-5", labelCode: "IC-2025-004-A", product: "Bourbon Bluez", variant: "750ml", batchNumber: "B250114-FL2", quantity: 12, pickedFromBinId: "wb-b2-01", status: "delivered" },
      { id: "gpi-3", gatePassId: "gp-2", cartonLabelId: "cl-6", labelCode: "IC-2025-004-B", product: "Bourbon Bluez", variant: "750ml", batchNumber: "B250114-FL2", quantity: 12, status: "delivered" },
    ],
    createdAt: "2025-01-14T15:00:00", approvedAt: "2025-01-14T15:15:00", dispatchedAt: "2025-01-14T16:00:00", deliveredAt: "2025-01-15T09:00:00",
  },
  {
    id: "gp-3", passNumber: "GP-2025-003", vehicleNumber: "FJ789-GHI", driverName: "Carlos M.",
    destination: "Lautoka Supermarket Chain", status: "draft",
    items: [],
    createdAt: "2025-01-15T12:00:00",
    notes: "Scheduled for tomorrow morning",
  },
];

// ── Permission updates for new modules ───────────────────────────────────────
// These are added to role permissions in getRolePermissions above already
// via the admin module, but we add ops-level permissions here for reference.

// ── Compliance / Guidelines ──────────────────────────────────────────────────

export interface ComplianceCheckpoint {
  id: string;
  sectionId: string;
  sectionName: string;
  text: string;
  standard: "general" | "iso22000" | "iso9001";
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "per-batch" | "per-shift";
  responsible: string;
  completed: boolean;
  lastChecked?: string;
  notes?: string;
}

export interface ComplianceSection {
  id: string;
  title: string;
  description: string;
  standard: "general" | "iso22000" | "iso9001";
  order: number;
}

export const complianceSections: ComplianceSection[] = [
  // General Food Safety
  { id: "gmp", title: "Good Manufacturing Practices (GMP)", description: "Facility, equipment, and personnel hygiene standards", standard: "general", order: 1 },
  { id: "sanitation", title: "Sanitation & Cleaning", description: "SSOPs, cleaning schedules, and verification", standard: "general", order: 2 },
  { id: "pest", title: "Pest Control", description: "Pest prevention, monitoring, and corrective actions", standard: "general", order: 3 },
  { id: "water", title: "Water & Ice Quality", description: "Potability testing and treatment monitoring", standard: "general", order: 4 },
  { id: "allergen", title: "Allergen Control", description: "Segregation, labeling, and changeover procedures", standard: "general", order: 5 },
  { id: "traceability", title: "Traceability & Recall", description: "One-up/one-down traceability and mock recalls", standard: "general", order: 6 },
  { id: "calibration", title: "Equipment Calibration", description: "Thermometers, scales, pH meters, metal detectors", standard: "general", order: 7 },
  { id: "waste", title: "Waste Management", description: "Segregation, removal, and pest prevention", standard: "general", order: 8 },
  { id: "foreign", title: "Foreign Material Control", description: "Glass, brittle plastics, and metal detection", standard: "general", order: 9 },
  { id: "supplier", title: "Supplier Approval", description: "COAs, audits, and vendor questionnaires", standard: "general", order: 10 },
  // ISO 22000
  { id: "fsms-policy", title: "FSMS Policy & Leadership", description: "Top management commitment and food safety policy", standard: "iso22000", order: 11 },
  { id: "haccp-plan", title: "HACCP Plan", description: "Hazard analysis, CCPs, critical limits, and monitoring", standard: "iso22000", order: 12 },
  { id: "oprps", title: "Operational PRPs (oPRPs)", description: "Significant hazards controlled by operational measures", standard: "iso22000", order: 13 },
  { id: "ccp-monitor", title: "CCP Monitoring", description: "Continuous monitoring records and deviation control", standard: "iso22000", order: 14 },
  { id: "verification", title: "Verification & Validation", description: "System verification, validation of control measures", standard: "iso22000", order: 15 },
  { id: "doc-control", title: "Document Control", description: "Version control, approvals, and distribution", standard: "iso22000", order: 16 },
  { id: "internal-audit", title: "Internal Audits", description: "Planned audit schedule, findings, and CAPA", standard: "iso22000", order: 17 },
  { id: "management-review", title: "Management Review", description: "KPIs, audit results, and continuous improvement", standard: "iso22000", order: 18 },
  { id: "emergency", title: "Emergency Preparedness", description: "Recall procedures, withdrawal, and crisis management", standard: "iso22000", order: 19 },
  // ISO 9001
  { id: "qms-scope", title: "QMS Scope & Context", description: "Organizational context and interested parties", standard: "iso9001", order: 20 },
  { id: "quality-policy", title: "Quality Policy & Objectives", description: "Measurable quality objectives aligned with strategy", standard: "iso9001", order: 21 },
  { id: "risk-mgmt", title: "Risk & Opportunity Management", description: "SWOT, PESTLE, and action planning", standard: "iso9001", order: 22 },
  { id: "competence", title: "Competence & Training", description: "Employee competency records and awareness training", standard: "iso9001", order: 23 },
  { id: "nc-capa", title: "Nonconformity & CAPA", description: "NC logs, root cause analysis, and corrective actions", standard: "iso9001", order: 24 },
];

export const defaultComplianceCheckpoints: ComplianceCheckpoint[] = [
  // GMP
  { id: "cp-1", sectionId: "gmp", sectionName: "GMP", text: "All production staff wear hairnets, gloves, and clean uniforms", standard: "general", frequency: "per-shift", responsible: "Production Supervisor", completed: true, lastChecked: "2025-01-15T06:00:00" },
  { id: "cp-2", sectionId: "gmp", sectionName: "GMP", text: "Hand-washing stations are stocked with soap and sanitizer", standard: "general", frequency: "daily", responsible: "QC Inspector", completed: true, lastChecked: "2025-01-15T08:00:00" },
  { id: "cp-3", sectionId: "gmp", sectionName: "GMP", text: "No food, drink, or personal items in production areas", standard: "general", frequency: "per-shift", responsible: "Production Supervisor", completed: true, lastChecked: "2025-01-15T06:00:00" },
  { id: "cp-4", sectionId: "gmp", sectionName: "GMP", text: "Floors, walls, and drains are visually clean and dry", standard: "general", frequency: "daily", responsible: "Sanitation Lead", completed: true, lastChecked: "2025-01-15T07:00:00" },
  // Sanitation
  { id: "cp-5", sectionId: "sanitation", sectionName: "Sanitation", text: "CIP system run and verified for all product contact surfaces", standard: "general", frequency: "daily", responsible: "Sanitation Lead", completed: true, lastChecked: "2025-01-15T05:30:00" },
  { id: "cp-6", sectionId: "sanitation", sectionName: "Sanitation", text: "ATP swab tests pass (<100 RLU) on filler nozzles and conveyors", standard: "general", frequency: "daily", responsible: "QC Inspector", completed: true, lastChecked: "2025-01-15T07:30:00" },
  { id: "cp-7", sectionId: "sanitation", sectionName: "Sanitation", text: "Cleaning chemical concentrations verified and logged", standard: "general", frequency: "weekly", responsible: "Maintenance Supervisor", completed: false },
  // Pest Control
  { id: "cp-8", sectionId: "pest", sectionName: "Pest Control", text: "Pest monitoring stations inspected — no activity recorded", standard: "general", frequency: "weekly", responsible: "Warehouse Supervisor", completed: true, lastChecked: "2025-01-13T09:00:00" },
  { id: "cp-9", sectionId: "pest", sectionName: "Pest Control", text: "External bait stations intact and serviced", standard: "general", frequency: "monthly", responsible: "External Contractor", completed: false },
  // Water Quality
  { id: "cp-10", sectionId: "water", sectionName: "Water Quality", text: "Potability test results within limits (total coliforms absent)", standard: "general", frequency: "monthly", responsible: "QC Inspector", completed: true, lastChecked: "2025-01-01T10:00:00" },
  { id: "cp-11", sectionId: "water", sectionName: "Water Quality", text: "Water treatment (chlorination/UV) parameters logged", standard: "general", frequency: "daily", responsible: "Operator", completed: true, lastChecked: "2025-01-15T06:00:00" },
  // Allergen
  { id: "cp-12", sectionId: "allergen", sectionName: "Allergen Control", text: "Allergen-containing products scheduled last in production sequence", standard: "general", frequency: "per-batch", responsible: "Planner", completed: true, lastChecked: "2025-01-15T08:00:00" },
  { id: "cp-13", sectionId: "allergen", sectionName: "Allergen Control", text: "Validated cleaning between allergen and non-allergen runs", standard: "general", frequency: "per-batch", responsible: "QC Inspector", completed: true, lastChecked: "2025-01-15T10:00:00" },
  // Traceability
  { id: "cp-14", sectionId: "traceability", sectionName: "Traceability", text: "Batch numbers linked to raw materials, production, and dispatch", standard: "general", frequency: "per-batch", responsible: "Operator", completed: true, lastChecked: "2025-01-15T08:00:00" },
  { id: "cp-15", sectionId: "traceability", sectionName: "Traceability", text: "Mock recall completed and traced within 4 hours", standard: "general", frequency: "annual", responsible: "Factory Manager", completed: false },
  // Calibration
  { id: "cp-16", sectionId: "calibration", sectionName: "Calibration", text: "Line thermometers calibrated and certificates current", standard: "general", frequency: "quarterly", responsible: "Maintenance Supervisor", completed: true, lastChecked: "2025-01-01T09:00:00" },
  { id: "cp-17", sectionId: "calibration", sectionName: "Calibration", text: "Check-weigher and metal detector validated with test pieces", standard: "general", frequency: "daily", responsible: "QC Inspector", completed: true, lastChecked: "2025-01-15T06:30:00" },
  // Waste
  { id: "cp-18", sectionId: "waste", sectionName: "Waste Management", text: "Waste bins emptied and areas cleaned — no overflow", standard: "general", frequency: "daily", responsible: "Sanitation Lead", completed: true, lastChecked: "2025-01-15T16:00:00" },
  // Foreign Material
  { id: "cp-19", sectionId: "foreign", sectionName: "Foreign Material", text: "Glass and brittle plastics register reviewed — no breakage", standard: "general", frequency: "weekly", responsible: "QC Inspector", completed: true, lastChecked: "2025-01-13T11:00:00" },
  { id: "cp-20", sectionId: "foreign", sectionName: "Foreign Material", text: "Metal detector sensitivity check passed (Fe 1.5mm, Non-Fe 2.0mm, SS 2.5mm)", standard: "general", frequency: "daily", responsible: "QC Inspector", completed: true, lastChecked: "2025-01-15T06:45:00" },
  // Supplier
  { id: "cp-21", sectionId: "supplier", sectionName: "Supplier Approval", text: "All active raw material suppliers have valid COAs on file", standard: "general", frequency: "quarterly", responsible: "Warehouse Supervisor", completed: false },
  // ISO 22000 — dormant until enabled
  { id: "cp-22", sectionId: "fsms-policy", sectionName: "FSMS Policy", text: "Food safety policy signed by top management and communicated", standard: "iso22000", frequency: "annual", responsible: "Factory Manager", completed: false },
  { id: "cp-23", sectionId: "haccp-plan", sectionName: "HACCP Plan", text: "HACCP team assembled with multidisciplinary expertise", standard: "iso22000", frequency: "annual", responsible: "Factory Manager", completed: false },
  { id: "cp-24", sectionId: "haccp-plan", sectionName: "HACCP Plan", text: "Product description and intended use documented for all SKUs", standard: "iso22000", frequency: "annual", responsible: "QC Inspector", completed: false },
  { id: "cp-25", sectionId: "haccp-plan", sectionName: "HACCP Plan", text: "Process flow diagram verified as accurate (walk-the-line)", standard: "iso22000", frequency: "annual", responsible: "Production Supervisor", completed: false },
  { id: "cp-26", sectionId: "haccp-plan", sectionName: "HACCP Plan", text: "Hazard analysis completed (biological, chemical, physical) per process step", standard: "iso22000", frequency: "annual", responsible: "QC Inspector", completed: false },
  { id: "cp-27", sectionId: "haccp-plan", sectionName: "HACCP Plan", text: "CCPs identified with critical limits, monitoring, and corrective actions", standard: "iso22000", frequency: "annual", responsible: "QC Inspector", completed: false },
  { id: "cp-28", sectionId: "ccp-monitor", sectionName: "CCP Monitoring", text: "CCP monitoring records reviewed and signed off daily", standard: "iso22000", frequency: "daily", responsible: "Production Supervisor", completed: false },
  { id: "cp-29", sectionId: "ccp-monitor", sectionName: "CCP Monitoring", text: "Deviation log maintained with root cause and corrective action", standard: "iso22000", frequency: "daily", responsible: "QC Inspector", completed: false },
  { id: "cp-30", sectionId: "oprps", sectionName: "oPRPs", text: "Operational PRPs defined for significant hazards not at CCPs", standard: "iso22000", frequency: "annual", responsible: "QC Inspector", completed: false },
  { id: "cp-31", sectionId: "verification", sectionName: "Verification", text: "Verification schedule executed (micro testing, environmental monitoring)", standard: "iso22000", frequency: "quarterly", responsible: "QC Inspector", completed: false },
  { id: "cp-32", sectionId: "doc-control", sectionName: "Document Control", text: "All SOPs have version numbers, approval signatures, and distribution lists", standard: "iso22000", frequency: "quarterly", responsible: "Factory Manager", completed: false },
  { id: "cp-33", sectionId: "internal-audit", sectionName: "Internal Audits", text: "Internal audit schedule published and first round completed", standard: "iso22000", frequency: "annual", responsible: "Factory Manager", completed: false },
  { id: "cp-34", sectionId: "internal-audit", sectionName: "Internal Audits", text: "Audit findings logged with CAPA owners and due dates", standard: "iso22000", frequency: "annual", responsible: "Factory Manager", completed: false },
  { id: "cp-35", sectionId: "management-review", sectionName: "Management Review", text: "Management review meeting held with minutes and action items", standard: "iso22000", frequency: "annual", responsible: "Factory Manager", completed: false },
  { id: "cp-36", sectionId: "emergency", sectionName: "Emergency", text: "Recall procedure tested with mock recall (4-hour traceability)", standard: "iso22000", frequency: "annual", responsible: "Factory Manager", completed: false },
  // ISO 9001 — dormant until enabled
  { id: "cp-37", sectionId: "qms-scope", sectionName: "QMS Scope", text: "QMS scope documented with justifiable exclusions", standard: "iso9001", frequency: "annual", responsible: "Factory Manager", completed: false },
  { id: "cp-38", sectionId: "quality-policy", sectionName: "Quality Policy", text: "Quality objectives set and monitored (e.g. scrap reduction, OEE)", standard: "iso9001", frequency: "quarterly", responsible: "Factory Manager", completed: false },
  { id: "cp-39", sectionId: "risk-mgmt", sectionName: "Risk Management", text: "Risk and opportunity register maintained and reviewed", standard: "iso9001", frequency: "quarterly", responsible: "Factory Manager", completed: false },
  { id: "cp-40", sectionId: "competence", sectionName: "Competence", text: "Training matrix current for all production and QC roles", standard: "iso9001", frequency: "quarterly", responsible: "HR / Supervisor", completed: false },
  { id: "cp-41", sectionId: "nc-capa", sectionName: "NC & CAPA", text: "Nonconformity log with root cause analysis and closure evidence", standard: "iso9001", frequency: "monthly", responsible: "QC Inspector", completed: false },
];

export interface ComplianceSettings {
  iso22000Enabled: boolean;
  iso9001Enabled: boolean;
  targetCertDate?: string;
  auditorName?: string;
  lastGapAnalysis?: string;
}

export const defaultComplianceSettings: ComplianceSettings = {
  iso22000Enabled: false,
  iso9001Enabled: false,
};

// ── Water Filtration Quality ─────────────────────────────────────────────────

export interface WaterQualityReading {
  id: string;
  timestamp: string;
  shift: "morning" | "afternoon" | "night";
  testedBy: string;
  // Core parameters
  ph: number;               // 6.5 – 8.5
  turbidityNtu: number;     // < 1.0 NTU (ideally < 0.3)
  tdsPpm: number;           // < 500 ppm
  conductivityUs: number;   // µS/cm
  temperatureC: number;     // °C
  chlorineMgL: number;      // mg/L residual
  // Microbial (lab test)
  microbialCfuMl?: number;  // CFU/mL — action limit 100
  // Source / stage
  source: "raw_intake" | "post_sediment" | "post_carbon" | "post_uv" | "post_ro" | "finished";
  notes?: string;
}

export type FilterType = "sediment" | "carbon" | "uv" | "ro_membrane" | "ozone";

export interface FilterStatus {
  id: string;
  name: string;
  filterType: FilterType;
  location: string;          // e.g. "Line 1 Pre-treatment"
  installedAt: string;
  lastChangedAt: string;
  changeIntervalDays: number;
  nextChangeDue: string;
  status: "good" | "needs_change" | "overdue";
  currentFlowRate?: number;  // L/min
  pressureDrop?: number;     // psi or bar
}

export const waterQualitySources: Record<string, string> = {
  raw_intake: "Raw Intake",
  post_sediment: "Post-Sediment",
  post_carbon: "Post-Carbon",
  post_uv: "Post-UV",
  post_ro: "Post-RO",
  finished: "Finished Water",
};

export const filterTypeConfig: Record<FilterType, { label: string; icon: string; color: string }> = {
  sediment: { label: "Sediment Filter", icon: "🪨", color: "amber" },
  carbon: { label: "Activated Carbon", icon: "🧊", color: "emerald" },
  uv: { label: "UV Steriliser", icon: "☀️", color: "violet" },
  ro_membrane: { label: "RO Membrane", icon: "💧", color: "blue" },
  ozone: { label: "Ozone Generator", icon: "⚡", color: "cyan" },
};

// Thresholds per WHO/EPA bottled water standards
export const waterQualityThresholds = {
  ph: { min: 6.5, max: 8.5, unit: "pH" },
  turbidityNtu: { min: 0, max: 1.0, ideal: 0.3, unit: "NTU" },
  tdsPpm: { min: 0, max: 500, unit: "ppm" },
  conductivityUs: { min: 0, max: 1500, unit: "µS/cm" },
  temperatureC: { min: 4, max: 35, unit: "°C" },
  chlorineMgL: { min: 0.2, max: 4.0, unit: "mg/L" },
  microbialCfuMl: { min: 0, max: 100, unit: "CFU/mL" },
};

export const defaultWaterQualityReadings: WaterQualityReading[] = [
  { id: "wqr-1", timestamp: "2025-01-15T06:00:00", shift: "morning", testedBy: "John D.", ph: 7.2, turbidityNtu: 0.15, tdsPpm: 120, conductivityUs: 180, temperatureC: 22.5, chlorineMgL: 0.8, microbialCfuMl: 8, source: "finished", notes: "All parameters within spec" },
  { id: "wqr-2", timestamp: "2025-01-15T06:00:00", shift: "morning", testedBy: "John D.", ph: 7.4, turbidityNtu: 0.22, tdsPpm: 145, conductivityUs: 210, temperatureC: 23.1, chlorineMgL: 0.6, source: "post_carbon" },
  { id: "wqr-3", timestamp: "2025-01-15T06:00:00", shift: "morning", testedBy: "John D.", ph: 7.1, turbidityNtu: 0.45, tdsPpm: 380, conductivityUs: 520, temperatureC: 24.0, chlorineMgL: 1.2, source: "raw_intake" },
  { id: "wqr-4", timestamp: "2025-01-15T14:00:00", shift: "afternoon", testedBy: "Sarah M.", ph: 7.3, turbidityNtu: 0.12, tdsPpm: 115, conductivityUs: 175, temperatureC: 22.8, chlorineMgL: 0.7, microbialCfuMl: 5, source: "finished", notes: "Post-UV verified OK" },
  { id: "wqr-5", timestamp: "2025-01-15T14:00:00", shift: "afternoon", testedBy: "Sarah M.", ph: 7.5, turbidityNtu: 0.18, tdsPpm: 138, conductivityUs: 205, temperatureC: 23.3, chlorineMgL: 0.55, source: "post_ro" },
  { id: "wqr-6", timestamp: "2025-01-15T22:00:00", shift: "night", testedBy: "Carlos R.", ph: 7.0, turbidityNtu: 0.28, tdsPpm: 155, conductivityUs: 230, temperatureC: 23.5, chlorineMgL: 0.9, microbialCfuMl: 12, source: "finished" },
  { id: "wqr-7", timestamp: "2025-01-14T06:00:00", shift: "morning", testedBy: "John D.", ph: 7.1, turbidityNtu: 0.35, tdsPpm: 165, conductivityUs: 245, temperatureC: 23.0, chlorineMgL: 1.0, source: "finished", notes: "Turbidity slightly elevated — checked sediment filter" },
  { id: "wqr-8", timestamp: "2025-01-14T14:00:00", shift: "afternoon", testedBy: "Sarah M.", ph: 7.4, turbidityNtu: 0.14, tdsPpm: 110, conductivityUs: 170, temperatureC: 22.6, chlorineMgL: 0.75, microbialCfuMl: 6, source: "finished" },
];

export const defaultFilterStatuses: FilterStatus[] = [
  { id: "flt-1", name: "Sediment Filter #1", filterType: "sediment", location: "Line 1 Pre-treatment", installedAt: "2024-12-01", lastChangedAt: "2025-01-01", changeIntervalDays: 30, nextChangeDue: "2025-01-31", status: "good", currentFlowRate: 850, pressureDrop: 2.1 },
  { id: "flt-2", name: "Sediment Filter #2", filterType: "sediment", location: "Line 2 Pre-treatment", installedAt: "2024-12-15", lastChangedAt: "2025-01-10", changeIntervalDays: 30, nextChangeDue: "2025-02-09", status: "good", currentFlowRate: 820, pressureDrop: 2.3 },
  { id: "flt-3", name: "Activated Carbon #1", filterType: "carbon", location: "Line 1 Carbon Tower", installedAt: "2024-11-01", lastChangedAt: "2024-12-01", changeIntervalDays: 90, nextChangeDue: "2025-03-01", status: "good", currentFlowRate: 840, pressureDrop: 1.8 },
  { id: "flt-4", name: "UV Steriliser #1", filterType: "uv", location: "Line 1 Post-Carbon", installedAt: "2024-10-01", lastChangedAt: "2024-12-01", changeIntervalDays: 180, nextChangeDue: "2025-05-30", status: "needs_change", currentFlowRate: 830, pressureDrop: 0.5 },
  { id: "flt-5", name: "RO Membrane #1", filterType: "ro_membrane", location: "Line 1 RO Unit", installedAt: "2024-09-01", lastChangedAt: "2024-11-01", changeIntervalDays: 120, nextChangeDue: "2025-03-01", status: "good", currentFlowRate: 600, pressureDrop: 8.5 },
  { id: "flt-6", name: "Ozone Generator", filterType: "ozone", location: "Line 1 Final Treatment", installedAt: "2024-12-20", lastChangedAt: "2024-12-20", changeIntervalDays: 365, nextChangeDue: "2025-12-20", status: "good" },
];

// ── SPARE PARTS & LINE ZONES ────────────────────────────────────────────────

export type SpareDiscipline = "mechanical" | "electrical" | "electronic";
export type SpareCategory = SpareDiscipline | "pneumatic" | "consumable";

export interface SparePart {
  id: string;
  code: string;
  name: string;
  category: SpareCategory;
  qtyOnHand: number;
  minQty: number; // reorder point
  unitCost: number; // FJD
  uom: string;
  supplier: string;
  binLocation: string;
  compatibleLines: string[]; // filling line ids
  leadTimeDays: number;
  lastIssuedAt?: string;
  lastIssuedQty?: number;
}

export const spareParts: SparePart[] = [
  // Mechanical
  { id: "sp1", code: "M-1001", name: "Filler Valve Assembly", category: "mechanical", qtyOnHand: 12, minQty: 6, unitCost: 145, uom: "pc", supplier: "Krones Pacific", binLocation: "Store-A-R01", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6"], leadTimeDays: 21 },
  { id: "sp2", code: "M-1002", name: "Filler O-Ring Kit (Full Set)", category: "mechanical", qtyOnHand: 14, minQty: 20, unitCost: 12, uom: "kit", supplier: "Krones Pacific", binLocation: "Store-A-R02", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6"], leadTimeDays: 10, lastIssuedAt: "2025-01-14T09:20:00Z", lastIssuedQty: 2 },
  { id: "sp3", code: "M-1003", name: "Capper Magnetic Chuck", category: "mechanical", qtyOnHand: 8, minQty: 4, unitCost: 310, uom: "pc", supplier: "Sidel Fiji", binLocation: "Store-A-R03", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5"], leadTimeDays: 30 },
  { id: "sp4", code: "M-1004", name: "Bottle Gripper Pad (Silicone)", category: "mechanical", qtyOnHand: 120, minQty: 60, unitCost: 4.5, uom: "pc", supplier: "Sidel Fiji", binLocation: "Store-A-R04", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 7 },
  { id: "sp5", code: "M-1005", name: "Conveyor Drive Belt 3M", category: "mechanical", qtyOnHand: 10, minQty: 4, unitCost: 220, uom: "pc", supplier: "SEW Eurodrive", binLocation: "Store-A-R05", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 25 },
  { id: "sp6", code: "M-1006", name: "Conveyor Roller (Stainless)", category: "mechanical", qtyOnHand: 60, minQty: 24, unitCost: 18, uom: "pc", supplier: "SEW Eurodrive", binLocation: "Store-A-R06", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 14 },
  { id: "sp7", code: "M-1007", name: "Labeller Vacuum Drum Seal", category: "mechanical", qtyOnHand: 15, minQty: 6, unitCost: 38, uom: "pc", supplier: "Krones Pacific", binLocation: "Store-A-R07", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 14 },
  { id: "sp8", code: "M-1008", name: "Rinser Nozzle Assembly", category: "mechanical", qtyOnHand: 20, minQty: 8, unitCost: 62, uom: "pc", supplier: "Krones Pacific", binLocation: "Store-A-R08", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6"], leadTimeDays: 18 },
  { id: "sp9", code: "M-1009", name: "Gearbox Oil Seal Kit", category: "mechanical", qtyOnHand: 9, minQty: 5, unitCost: 54, uom: "kit", supplier: "SEW Eurodrive", binLocation: "Store-A-R09", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 21 },
  { id: "sp10", code: "M-1010", name: "Palletiser Gripper Finger", category: "mechanical", qtyOnHand: 14, minQty: 6, unitCost: 85, uom: "pc", supplier: "Fiji Mech Works", binLocation: "Store-A-R10", compatibleLines: ["fl7"], leadTimeDays: 28 },
  // Electrical
  { id: "sp11", code: "E-2001", name: "VFD Drive 7.5kW", category: "electrical", qtyOnHand: 4, minQty: 2, unitCost: 1250, uom: "pc", supplier: "Siemens", binLocation: "Store-B-R01", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 45 },
  { id: "sp12", code: "E-2002", name: "Motor Contactor 32A", category: "electrical", qtyOnHand: 12, minQty: 6, unitCost: 92, uom: "pc", supplier: "Siemens", binLocation: "Store-B-R02", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 21 },
  { id: "sp13", code: "E-2003", name: "Proximity Sensor M18", category: "electrical", qtyOnHand: 25, minQty: 12, unitCost: 48, uom: "pc", supplier: "Pepperl+Fuchs", binLocation: "Store-B-R03", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 14 },
  { id: "sp14", code: "E-2004", name: "Photoeye Sensor (Retro)", category: "electrical", qtyOnHand: 18, minQty: 8, unitCost: 76, uom: "pc", supplier: "Pepperl+Fuchs", binLocation: "Store-B-R04", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 14, lastIssuedAt: "2025-01-13T15:40:00Z", lastIssuedQty: 2 },
  { id: "sp15", code: "E-2005", name: "Overload Relay 9-16A", category: "electrical", qtyOnHand: 10, minQty: 5, unitCost: 66, uom: "pc", supplier: "Siemens", binLocation: "Store-B-R05", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 21 },
  { id: "sp16", code: "E-2006", name: "Panel Circuit Breaker 20A", category: "electrical", qtyOnHand: 16, minQty: 8, unitCost: 44, uom: "pc", supplier: "Schneider Electric", binLocation: "Store-B-R06", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 10 },
  { id: "sp17", code: "E-2007", name: "Heating Element 3kW", category: "electrical", qtyOnHand: 6, minQty: 3, unitCost: 158, uom: "pc", supplier: "Fiji Mech Works", binLocation: "Store-B-R07", compatibleLines: ["fl3", "fl4", "fl5"], leadTimeDays: 30 },
  // Electronic
  { id: "sp18", code: "C-3001", name: "PLC CPU Module", category: "electronic", qtyOnHand: 2, minQty: 1, unitCost: 3400, uom: "pc", supplier: "Siemens", binLocation: "Store-C-R01", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 60 },
  { id: "sp19", code: "C-3002", name: "PLC I/O Module 16DI", category: "electronic", qtyOnHand: 6, minQty: 3, unitCost: 620, uom: "pc", supplier: "Siemens", binLocation: "Store-C-R02", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 45 },
  { id: "sp20", code: "C-3003", name: "HMI Touchscreen Panel 10in", category: "electronic", qtyOnHand: 3, minQty: 1, unitCost: 1150, uom: "pc", supplier: "Siemens", binLocation: "Store-C-R03", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 45 },
  { id: "sp21", code: "C-3004", name: "Level Transmitter 4-20mA", category: "electronic", qtyOnHand: 1, minQty: 2, unitCost: 540, uom: "pc", supplier: "Endress+Hauser", binLocation: "Store-C-R04", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6"], leadTimeDays: 40 },
  { id: "sp22", code: "C-3005", name: "Temperature Probe PT100", category: "electronic", qtyOnHand: 10, minQty: 4, unitCost: 130, uom: "pc", supplier: "Endress+Hauser", binLocation: "Store-C-R05", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6"], leadTimeDays: 21 },
  { id: "sp23", code: "C-3006", name: "Pressure Transmitter 0-10bar", category: "electronic", qtyOnHand: 5, minQty: 2, unitCost: 480, uom: "pc", supplier: "Endress+Hauser", binLocation: "Store-C-R06", compatibleLines: ["fl3", "fl4", "fl5", "fl6"], leadTimeDays: 35 },
  { id: "sp24", code: "C-3007", name: "Vision Inspection Camera Module", category: "electronic", qtyOnHand: 2, minQty: 1, unitCost: 1850, uom: "pc", supplier: "Cognex", binLocation: "Store-C-R07", compatibleLines: ["fl1", "fl3", "fl4", "fl7"], leadTimeDays: 50 },
  // Pneumatic
  { id: "sp25", code: "P-4001", name: "Pneumatic Cylinder 63mm Bore", category: "pneumatic", qtyOnHand: 2, minQty: 4, unitCost: 210, uom: "pc", supplier: "Festo", binLocation: "Store-A-R11", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 25 },
  { id: "sp26", code: "P-4002", name: "Solenoid Valve 5/2", category: "pneumatic", qtyOnHand: 14, minQty: 6, unitCost: 96, uom: "pc", supplier: "Festo", binLocation: "Store-A-R12", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 18 },
  { id: "sp27", code: "P-4003", name: "Air Filter Regulator Kit", category: "pneumatic", qtyOnHand: 10, minQty: 5, unitCost: 68, uom: "kit", supplier: "Festo", binLocation: "Store-A-R13", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 14 },
  // Consumables
  { id: "sp28", code: "X-5001", name: "Food-grade Lubricant 400g", category: "consumable", qtyOnHand: 30, minQty: 12, unitCost: 28, uom: "tube", supplier: "Kluber", binLocation: "Store-D-R01", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 7, lastIssuedAt: "2025-01-15T06:45:00Z", lastIssuedQty: 4 },
  { id: "sp29", code: "X-5002", name: "Threadlocker 243 (50ml)", category: "consumable", qtyOnHand: 20, minQty: 10, unitCost: 22, uom: "pc", supplier: "Loctite", binLocation: "Store-D-R02", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 7 },
  { id: "sp30", code: "X-5003", name: "Bearing Grease Cartridge", category: "consumable", qtyOnHand: 15, minQty: 6, unitCost: 34, uom: "pc", supplier: "Shell Fiji", binLocation: "Store-D-R03", compatibleLines: ["fl1", "fl2", "fl3", "fl4", "fl5", "fl6", "fl7"], leadTimeDays: 7 },
];

// ── LINE ZONES ──────────────────────────────────────────────────────────────

export interface LineZonePart {
  sparePartId: string;
  qty: number; // installed quantity in this zone
  discipline: SpareDiscipline;
  critical: boolean;
}

export interface LineZone {
  id: string;
  lineId: string;
  name: string;
  description: string;
  parts: LineZonePart[];
}

const zp = (sparePartId: string, qty: number, discipline: SpareDiscipline, critical = false): LineZonePart => ({ sparePartId, qty, discipline, critical });

const commonControlZone = (lineId: string): LineZone => ({
  id: `${lineId}-z-ctrl`,
  lineId,
  name: "Control & Electrical Panel",
  description: "Main control cabinet, PLC rack, HMI, motor control centre",
  parts: [
    zp("sp18", 1, "electronic", true),
    zp("sp19", 2, "electronic", true),
    zp("sp20", 1, "electronic", true),
    zp("sp11", 3, "electrical", true),
    zp("sp12", 4, "electrical"),
    zp("sp15", 3, "electrical"),
    zp("sp16", 5, "electrical"),
    zp("sp13", 4, "electrical"),
    zp("sp14", 3, "electrical"),
  ],
});

const commonConveyorZone = (lineId: string): LineZone => ({
  id: `${lineId}-z-conv`,
  lineId,
  name: "Conveyor & Packaging Zone",
  description: "Accumulation conveyors, drive stations, palletiser interface",
  parts: [
    zp("sp5", 2, "mechanical", true),
    zp("sp6", 24, "mechanical"),
    zp("sp4", 16, "mechanical"),
    zp("sp9", 2, "mechanical"),
    zp("sp11", 2, "electrical"),
    zp("sp14", 2, "electrical"),
    zp("sp13", 3, "electrical"),
    zp("sp25", 2, "mechanical"),
    zp("sp26", 3, "mechanical"),
  ],
});

export const lineZones: LineZone[] = [
  // FL1 - Water Line A
  { id: "fl1-z-rinser", lineId: "fl1", name: "Rinser Zone", description: "Bottle infeed, air/water rinsing turret", parts: [zp("sp8", 24, "mechanical"), zp("sp4", 48, "mechanical"), zp("sp26", 4, "mechanical"), zp("sp13", 6, "electrical"), zp("sp27", 2, "mechanical")] },
  { id: "fl1-z-filler", lineId: "fl1", name: "Filler Zone", description: "Gravity filling turret, 24-head filler valve block", parts: [zp("sp1", 24, "mechanical", true), zp("sp2", 4, "mechanical", true), zp("sp21", 2, "electronic", true), zp("sp22", 4, "electronic"), zp("sp13", 4, "electrical"), zp("sp26", 2, "mechanical"), zp("sp28", 1, "mechanical")] },
  { id: "fl1-z-capper", lineId: "fl1", name: "Capper Zone", description: "Capping turret, cap chute and sorting bowl", parts: [zp("sp3", 6, "mechanical", true), zp("sp13", 4, "electrical"), zp("sp25", 1, "mechanical"), zp("sp26", 2, "mechanical"), zp("sp14", 2, "electrical")] },
  { id: "fl1-z-labeller", lineId: "fl1", name: "Labeller Zone", description: "Hot-melt labelling station, vacuum drum", parts: [zp("sp7", 2, "mechanical", true), zp("sp6", 6, "mechanical"), zp("sp17", 1, "electrical"), zp("sp14", 2, "electrical"), zp("sp13", 2, "electrical")] },
  { ...commonConveyorZone("fl1"), id: "fl1-z-conv" } as LineZone,
  commonControlZone("fl1"),
  // FL2 - Water Line B
  { id: "fl2-z-rinser", lineId: "fl2", name: "Rinser Zone", description: "Bottle infeed, air/water rinsing turret", parts: [zp("sp8", 18, "mechanical"), zp("sp4", 36, "mechanical"), zp("sp26", 3, "mechanical"), zp("sp13", 4, "electrical"), zp("sp27", 2, "mechanical")] },
  { id: "fl2-z-filler", lineId: "fl2", name: "Filler Zone", description: "Gravity filling turret, 18-head filler valve block", parts: [zp("sp1", 18, "mechanical", true), zp("sp2", 3, "mechanical", true), zp("sp21", 1, "electronic", true), zp("sp22", 3, "electronic"), zp("sp13", 3, "electrical"), zp("sp26", 2, "mechanical"), zp("sp28", 1, "mechanical")] },
  { id: "fl2-z-capper", lineId: "fl2", name: "Capper Zone", description: "Capping turret, cap chute and sorting bowl", parts: [zp("sp3", 5, "mechanical", true), zp("sp13", 3, "electrical"), zp("sp25", 1, "mechanical"), zp("sp26", 2, "mechanical"), zp("sp14", 2, "electrical")] },
  { id: "fl2-z-labeller", lineId: "fl2", name: "Labeller Zone", description: "Self-adhesive labelling station", parts: [zp("sp7", 2, "mechanical", true), zp("sp6", 5, "mechanical"), zp("sp14", 2, "electrical"), zp("sp13", 2, "electrical")] },
  { ...commonConveyorZone("fl2"), id: "fl2-z-conv" } as LineZone,
  commonControlZone("fl2"),
  // FL3 - CSD Line A (carbonated)
  { id: "fl3-z-mixer", lineId: "fl3", name: "Mixing & Carbonation Zone", description: "Syrup batching, carbonator unit, deaerator", parts: [zp("sp22", 6, "electronic"), zp("sp23", 3, "electronic", true), zp("sp21", 2, "electronic"), zp("sp17", 2, "electrical"), zp("sp1", 6, "mechanical", true), zp("sp26", 4, "mechanical"), zp("sp27", 2, "mechanical")] },
  { id: "fl3-z-filler", lineId: "fl3", name: "Counter-Pressure Filler Zone", description: "Isobaric filling turret, 36-head valve block", parts: [zp("sp1", 36, "mechanical", true), zp("sp2", 6, "mechanical", true), zp("sp21", 2, "electronic", true), zp("sp22", 4, "electronic"), zp("sp13", 6, "electrical"), zp("sp26", 4, "mechanical"), zp("sp28", 1, "mechanical")] },
  { id: "fl3-z-capper", lineId: "fl3", name: "Capper Zone", description: "Twist-off capping turret", parts: [zp("sp3", 8, "mechanical", true), zp("sp13", 4, "electrical"), zp("sp25", 2, "mechanical"), zp("sp26", 3, "mechanical"), zp("sp14", 3, "electrical")] },
  { id: "fl3-z-labeller", lineId: "fl3", name: "Labeller Zone", description: "Cold-glue labelling station", parts: [zp("sp7", 3, "mechanical", true), zp("sp6", 8, "mechanical"), zp("sp17", 1, "electrical"), zp("sp14", 2, "electrical"), zp("sp13", 3, "electrical")] },
  { ...commonConveyorZone("fl3"), id: "fl3-z-conv" } as LineZone,
  commonControlZone("fl3"),
  // FL4 - RTD Line
  { id: "fl4-z-mixer", lineId: "fl4", name: "Batching Zone", description: "RTD batching tanks, dosing skids", parts: [zp("sp22", 4, "electronic"), zp("sp21", 2, "electronic", true), zp("sp23", 2, "electronic"), zp("sp17", 1, "electrical"), zp("sp1", 4, "mechanical"), zp("sp26", 3, "mechanical")] },
  { id: "fl4-z-filler", lineId: "fl4", name: "Filler Zone", description: "Volumetric filling turret, 24-head valve block", parts: [zp("sp1", 24, "mechanical", true), zp("sp2", 4, "mechanical", true), zp("sp21", 2, "electronic", true), zp("sp22", 3, "electronic"), zp("sp13", 4, "electrical"), zp("sp26", 2, "mechanical"), zp("sp28", 1, "mechanical")] },
  { id: "fl4-z-capper", lineId: "fl4", name: "Capper Zone", description: "ROPP capping turret", parts: [zp("sp3", 6, "mechanical", true), zp("sp13", 4, "electrical"), zp("sp25", 1, "mechanical"), zp("sp26", 2, "mechanical"), zp("sp14", 2, "electrical")] },
  { id: "fl4-z-labeller", lineId: "fl4", name: "Labeller Zone", description: "Sleeve labelling station, shrink tunnel", parts: [zp("sp7", 2, "mechanical", true), zp("sp17", 2, "electrical"), zp("sp6", 6, "mechanical"), zp("sp14", 2, "electrical"), zp("sp13", 2, "electrical")] },
  { id: "fl4-z-vision", lineId: "fl4", name: "Vision Inspection Zone", description: "Fill-level, cap and label vision inspection", parts: [zp("sp24", 2, "electronic", true), zp("sp13", 2, "electrical"), zp("sp14", 2, "electrical")] },
  { ...commonConveyorZone("fl4"), id: "fl4-z-conv" } as LineZone,
  commonControlZone("fl4"),
  // FL5 - CSD Line B
  { id: "fl5-z-mixer", lineId: "fl5", name: "Mixing & Carbonation Zone", description: "Syrup batching, carbonator unit", parts: [zp("sp22", 4, "electronic"), zp("sp23", 2, "electronic", true), zp("sp17", 2, "electrical"), zp("sp1", 4, "mechanical", true), zp("sp26", 3, "mechanical"), zp("sp27", 1, "mechanical")] },
  { id: "fl5-z-filler", lineId: "fl5", name: "Counter-Pressure Filler Zone", description: "Isobaric filling turret, 30-head valve block", parts: [zp("sp1", 30, "mechanical", true), zp("sp2", 5, "mechanical", true), zp("sp21", 1, "electronic", true), zp("sp22", 3, "electronic"), zp("sp13", 5, "electrical"), zp("sp26", 3, "mechanical"), zp("sp28", 1, "mechanical")] },
  { id: "fl5-z-capper", lineId: "fl5", name: "Capper Zone", description: "Twist-off capping turret", parts: [zp("sp3", 6, "mechanical", true), zp("sp13", 3, "electrical"), zp("sp25", 1, "mechanical"), zp("sp26", 2, "mechanical"), zp("sp14", 2, "electrical")] },
  { id: "fl5-z-labeller", lineId: "fl5", name: "Labeller Zone", description: "Cold-glue labelling station", parts: [zp("sp7", 2, "mechanical", true), zp("sp6", 6, "mechanical"), zp("sp14", 2, "electrical"), zp("sp13", 2, "electrical")] },
  { ...commonConveyorZone("fl5"), id: "fl5-z-conv" } as LineZone,
  commonControlZone("fl5"),
  // FL6 - Soda Water Line
  { id: "fl6-z-carbonator", lineId: "fl6", name: "Carbonation Zone", description: "Water chilling, carbonator, saturator column", parts: [zp("sp23", 2, "electronic", true), zp("sp22", 3, "electronic"), zp("sp17", 2, "electrical"), zp("sp21", 1, "electronic"), zp("sp26", 3, "mechanical"), zp("sp27", 1, "mechanical")] },
  { id: "fl6-z-filler", lineId: "fl6", name: "Filler Zone", description: "Counter-pressure filling turret, 18-head valve block", parts: [zp("sp1", 18, "mechanical", true), zp("sp2", 3, "mechanical", true), zp("sp21", 1, "electronic", true), zp("sp22", 3, "electronic"), zp("sp13", 3, "electrical"), zp("sp26", 2, "mechanical"), zp("sp28", 1, "mechanical")] },
  { id: "fl6-z-capper", lineId: "fl6", name: "Capper Zone", description: "Crown cork capping turret", parts: [zp("sp3", 4, "mechanical", true), zp("sp13", 3, "electrical"), zp("sp25", 1, "mechanical"), zp("sp26", 2, "mechanical"), zp("sp14", 2, "electrical")] },
  { id: "fl6-z-labeller", lineId: "fl6", name: "Labeller Zone", description: "Self-adhesive labelling station", parts: [zp("sp7", 2, "mechanical", true), zp("sp6", 4, "mechanical"), zp("sp14", 2, "electrical"), zp("sp13", 2, "electrical")] },
  { ...commonConveyorZone("fl6"), id: "fl6-z-conv" } as LineZone,
  commonControlZone("fl6"),
  // FL7 - Canning Line
  { id: "fl7-z-depal", lineId: "fl7", name: "Depalletiser Zone", description: "Can depalletiser, infeed conveyors, twist rinser", parts: [zp("sp5", 1, "mechanical", true), zp("sp6", 12, "mechanical"), zp("sp4", 12, "mechanical"), zp("sp8", 6, "mechanical"), zp("sp11", 2, "electrical"), zp("sp13", 4, "electrical"), zp("sp14", 2, "electrical"), zp("sp25", 1, "mechanical")] },
  { id: "fl7-z-filler", lineId: "fl7", name: "Can Filler Zone", description: "Counter-pressure can filling turret, 40 valves", parts: [zp("sp1", 40, "mechanical", true), zp("sp2", 7, "mechanical", true), zp("sp21", 2, "electronic", true), zp("sp22", 4, "electronic"), zp("sp23", 2, "electronic"), zp("sp13", 5, "electrical"), zp("sp26", 4, "mechanical"), zp("sp28", 1, "mechanical")] },
  { id: "fl7-z-seamer", lineId: "fl7", name: "Seamer Zone", description: "Can seaming heads, lid feed system", parts: [zp("sp3", 4, "mechanical", true), zp("sp9", 2, "mechanical"), zp("sp13", 4, "electrical"), zp("sp25", 1, "mechanical"), zp("sp26", 2, "mechanical"), zp("sp14", 2, "electrical")] },
  { id: "fl7-z-vision", lineId: "fl7", name: "Vision Inspection Zone", description: "Seam inspection, fill-level and code verification", parts: [zp("sp24", 2, "electronic", true), zp("sp13", 2, "electrical"), zp("sp14", 2, "electrical")] },
  { id: "fl7-z-pack", lineId: "fl7", name: "Packing Zone", description: "Case packer, shrink wrapper, palletiser", parts: [zp("sp10", 6, "mechanical", true), zp("sp5", 2, "mechanical"), zp("sp6", 18, "mechanical"), zp("sp4", 10, "mechanical"), zp("sp11", 2, "electrical"), zp("sp14", 3, "electrical"), zp("sp13", 3, "electrical"), zp("sp25", 2, "mechanical"), zp("sp26", 3, "mechanical")] },
  commonControlZone("fl7"),
];

// ── STOCK ISSUES (maintenance issue log) ────────────────────────────────────

export interface StockIssue {
  id: string;
  sparePartId: string;
  qty: number;
  workOrderId?: string;
  lineId?: string;
  zoneId?: string;
  issuedBy: string;
  issuedAt: string;
  purpose: string;
}

export const stockIssues: StockIssue[] = [
  { id: "si1", sparePartId: "sp2", qty: 2, lineId: "fl1", zoneId: "fl1-z-filler", issuedBy: "Tom R.", issuedAt: "2025-01-14T09:20:00Z", purpose: "Weekly filler valve O-ring replacement" },
  { id: "si2", sparePartId: "sp14", qty: 2, lineId: "fl3", zoneId: "fl3-z-conv", issuedBy: "Tom R.", issuedAt: "2025-01-13T15:40:00Z", purpose: "Photoeye fault on accumulation conveyor" },
  { id: "si3", sparePartId: "sp28", qty: 4, lineId: "fl4", issuedBy: "Lisa P.", issuedAt: "2025-01-15T06:45:00Z", purpose: "Monthly lubrication round" },
];

// ── ERP STOCK (real-time mirror) ────────────────────────────────────────────

export type ERPStockCategory = "raw_material" | "packaging" | "consumable" | "spare_part" | "finished_good";

export interface ERPStockItem {
  id: string;
  itemCode: string;
  name: string;
  category: ERPStockCategory;
  qtyOnHand: number;
  qtyReserved: number;
  uom: string;
  warehouse: string; // warehouse zone name from warehouseZones
  bin: string;
  unitCost: number; // FJD
  safetyStock?: number;
  supplier?: string;
  lastMovementType: "receipt" | "issue" | "adjustment";
  lastMovementAt: string;
}

export const erpStockItems: ERPStockItem[] = [
  { id: "es1", itemCode: "RM-SUG-001", name: "Raw Sugar", category: "raw_material", qtyOnHand: 500, qtyReserved: 120, uom: "kg", warehouse: "RM Liquid Store", bin: "A-01", unitCost: 1.85, lastMovementType: "receipt", lastMovementAt: "2025-01-14T08:30:00Z" },
  { id: "es2", itemCode: "RM-FLV-COLA", name: "Cola Flavouring Concentrate", category: "raw_material", qtyOnHand: 180, qtyReserved: 40, uom: "L", warehouse: "RM Liquid Store", bin: "A-02", unitCost: 42.0, lastMovementType: "issue", lastMovementAt: "2025-01-15T07:15:00Z" },
  { id: "es3", itemCode: "RM-FLV-ORNG", name: "Orange Flavouring", category: "raw_material", qtyOnHand: 95, qtyReserved: 20, uom: "L", warehouse: "RM Liquid Store", bin: "A-03", unitCost: 38.5, lastMovementType: "issue", lastMovementAt: "2025-01-15T07:15:00Z" },
  { id: "es4", itemCode: "RM-ETH-040", name: "Ethanol (40% v/v)", category: "raw_material", qtyOnHand: 820, qtyReserved: 150, uom: "L", warehouse: "RM Liquid Store", bin: "A-04", unitCost: 6.2, lastMovementType: "receipt", lastMovementAt: "2025-01-13T11:00:00Z" },
  { id: "es5", itemCode: "RM-CA-001", name: "Citric Acid", category: "raw_material", qtyOnHand: 25, qtyReserved: 5, uom: "kg", warehouse: "RM Liquid Store", bin: "A-05", unitCost: 4.1, lastMovementType: "receipt", lastMovementAt: "2025-01-10T14:20:00Z" },
  { id: "es6", itemCode: "RM-SB-001", name: "Sodium Benzoate", category: "raw_material", qtyOnHand: 50, qtyReserved: 10, uom: "kg", warehouse: "RM Liquid Store", bin: "A-06", unitCost: 5.3, lastMovementType: "receipt", lastMovementAt: "2025-01-10T14:20:00Z" },
  { id: "es7", itemCode: "RM-CO2-001", name: "CO2 Gas", category: "raw_material", qtyOnHand: 420, qtyReserved: 80, uom: "kg", warehouse: "RM Liquid Store", bin: "A-07", unitCost: 1.2, lastMovementType: "issue", lastMovementAt: "2025-01-15T06:00:00Z" },
  { id: "es8", itemCode: "PK-PET-500", name: "PET Bottles 500ml", category: "packaging", qtyOnHand: 50000, qtyReserved: 15000, uom: "units", warehouse: "RM Packaging Store", bin: "B-01", unitCost: 0.14, lastMovementType: "issue", lastMovementAt: "2025-01-15T08:00:00Z" },
  { id: "es9", itemCode: "PK-PET-1500", name: "PET Bottles 1.5L", category: "packaging", qtyOnHand: 20000, qtyReserved: 0, uom: "units", warehouse: "RM Packaging Store", bin: "B-02", unitCost: 0.22, lastMovementType: "receipt", lastMovementAt: "2025-01-11T09:40:00Z" },
  { id: "es10", itemCode: "PK-CAN-330", name: "Aluminium Cans 330ml", category: "packaging", qtyOnHand: 100000, qtyReserved: 24000, uom: "units", warehouse: "RM Packaging Store", bin: "B-03", unitCost: 0.19, lastMovementType: "receipt", lastMovementAt: "2025-01-12T13:10:00Z" },
  { id: "es11", itemCode: "PK-CAP-001", name: "Caps & Closures", category: "packaging", qtyOnHand: 150000, qtyReserved: 39000, uom: "units", warehouse: "RM Packaging Store", bin: "B-04", unitCost: 0.03, lastMovementType: "issue", lastMovementAt: "2025-01-15T08:00:00Z" },
  { id: "es12", itemCode: "PK-LBL-IW500", name: "Island Water 500ml Label Roll", category: "packaging", qtyOnHand: 340, qtyReserved: 90, uom: "rolls", warehouse: "RM Packaging Store", bin: "B-05", unitCost: 8.9, lastMovementType: "issue", lastMovementAt: "2025-01-14T16:30:00Z" },
  { id: "es13", itemCode: "PK-LBL-BB330", name: "Bourbon Bluez 330ml Label Roll", category: "packaging", qtyOnHand: 210, qtyReserved: 60, uom: "rolls", warehouse: "RM Packaging Store", bin: "B-06", unitCost: 9.4, lastMovementType: "issue", lastMovementAt: "2025-01-14T16:30:00Z" },
  { id: "es14", itemCode: "PK-WRP-001", name: "Shrink Wrap Film", category: "packaging", qtyOnHand: 500, qtyReserved: 75, uom: "rolls", warehouse: "RM Packaging Store", bin: "B-07", unitCost: 31.0, lastMovementType: "receipt", lastMovementAt: "2025-01-09T10:00:00Z" },
  { id: "es15", itemCode: "PK-CRT-001", name: "Corrugated Cases 500ml", category: "packaging", qtyOnHand: 18000, qtyReserved: 4200, uom: "units", warehouse: "RM Packaging Store", bin: "B-08", unitCost: 0.62, lastMovementType: "issue", lastMovementAt: "2025-01-15T08:00:00Z" },
  { id: "es16", itemCode: "SP-M-1001", name: "Filler Valve Assembly", category: "spare_part", qtyOnHand: 12, qtyReserved: 0, uom: "pc", warehouse: "Spares Store", bin: "Store-A-R01", unitCost: 145, lastMovementType: "issue", lastMovementAt: "2025-01-14T09:20:00Z" },
  { id: "es17", itemCode: "SP-M-1002", name: "Filler O-Ring Kit (Full Set)", category: "spare_part", qtyOnHand: 14, qtyReserved: 0, uom: "kit", warehouse: "Spares Store", bin: "Store-A-R02", unitCost: 12, lastMovementType: "issue", lastMovementAt: "2025-01-14T09:20:00Z" },
  { id: "es18", itemCode: "SP-E-2001", name: "VFD Drive 7.5kW", category: "spare_part", qtyOnHand: 4, qtyReserved: 0, uom: "pc", warehouse: "Spares Store", bin: "Store-B-R01", unitCost: 1250, lastMovementType: "receipt", lastMovementAt: "2025-01-05T09:00:00Z" },
  { id: "es19", itemCode: "SP-C-3001", name: "PLC CPU Module", category: "spare_part", qtyOnHand: 2, qtyReserved: 0, uom: "pc", warehouse: "Spares Store", bin: "Store-C-R01", unitCost: 3400, lastMovementType: "receipt", lastMovementAt: "2024-12-18T10:30:00Z" },
  { id: "es20", itemCode: "SP-P-4001", name: "Pneumatic Cylinder 63mm Bore", category: "spare_part", qtyOnHand: 2, qtyReserved: 0, uom: "pc", warehouse: "Spares Store", bin: "Store-A-R11", unitCost: 210, lastMovementType: "adjustment", lastMovementAt: "2025-01-12T12:00:00Z" },
  { id: "es21", itemCode: "CS-LUB-400", name: "Food-grade Lubricant 400g", category: "consumable", qtyOnHand: 30, qtyReserved: 4, uom: "tube", warehouse: "Consumables Store", bin: "D-01", unitCost: 28, lastMovementType: "issue", lastMovementAt: "2025-01-15T06:45:00Z" },
  { id: "es22", itemCode: "CS-CLN-001", name: "CIP Caustic Soda 50%", category: "consumable", qtyOnHand: 640, qtyReserved: 100, uom: "L", warehouse: "Consumables Store", bin: "D-02", unitCost: 1.1, lastMovementType: "issue", lastMovementAt: "2025-01-14T22:00:00Z" },
  { id: "es23", itemCode: "CS-CLN-002", name: "Peracetic Acid Sanitiser", category: "consumable", qtyOnHand: 210, qtyReserved: 40, uom: "L", warehouse: "Consumables Store", bin: "D-03", unitCost: 3.8, lastMovementType: "receipt", lastMovementAt: "2025-01-08T08:45:00Z" },
  { id: "es24", itemCode: "FG-IW-500", name: "Island Water 500ml (Case)", category: "finished_good", qtyOnHand: 1600, qtyReserved: 400, uom: "Case", warehouse: "Cold Store A", bin: "FG-01", unitCost: 9.6, lastMovementType: "receipt", lastMovementAt: "2025-01-15T06:30:00Z" },
  { id: "es25", itemCode: "FG-IW-1500", name: "Island Water 1.5L (Case)", category: "finished_good", qtyOnHand: 600, qtyReserved: 0, uom: "Case", warehouse: "Cold Store B", bin: "FG-02", unitCost: 14.2, lastMovementType: "receipt", lastMovementAt: "2025-01-13T14:00:00Z" },
  { id: "es26", itemCode: "FG-IW-330", name: "Island Water 330ml (Case)", category: "finished_good", qtyOnHand: 2000, qtyReserved: 400, uom: "Case", warehouse: "Ambient FG Store", bin: "FG-03", unitCost: 8.1, lastMovementType: "issue", lastMovementAt: "2025-01-15T09:10:00Z" },
  { id: "es27", itemCode: "FG-BB-330", name: "Bourbon Bluez 330ml (Case)", category: "finished_good", qtyOnHand: 800, qtyReserved: 0, uom: "Case", warehouse: "Cold Store A", bin: "FG-04", unitCost: 22.4, lastMovementType: "receipt", lastMovementAt: "2025-01-14T18:00:00Z" },
  { id: "es28", itemCode: "FG-BB-275", name: "Bourbon Bluez 275ml (Case)", category: "finished_good", qtyOnHand: 1500, qtyReserved: 0, uom: "Case", warehouse: "Ambient FG Store", bin: "FG-05", unitCost: 20.8, lastMovementType: "issue", lastMovementAt: "2025-01-14T09:10:00Z" },
];
