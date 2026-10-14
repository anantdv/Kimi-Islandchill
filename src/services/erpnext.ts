// ERPNext/Frappe integration service for Island Chill MES
// Ported from the legacy islandchill app frappe.js service

const STORAGE_KEY = "island-mes-erpnext-connection";

export interface ErpnextConnection {
  isLive: boolean;
  url: string;
  apiKey: string;
  apiSecret: string;
  username: string;
  password: string;
  connected: boolean;
  user?: string;
  role?: string;
}

export interface FetchOptions {
  filters?: unknown[];
  fields?: string[];
  limit?: number;
  start?: number;
  order_by?: string;
}

export interface BOMSummary {
  id: string;
  name: string;
  productName: string;
  active: number;
}

export interface BOMMaterial {
  code: string;
  name: string;
  qty: number;
  unit: string;
}

function getDefaultConnection(): ErpnextConnection {
  return {
    isLive: false,
    url: "https://vms.advtinni.com",
    apiKey: "",
    apiSecret: "",
    username: "",
    password: "",
    connected: false,
  };
}

export function getConnection(): ErpnextConnection {
  if (typeof window === "undefined") return getDefaultConnection();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultConnection();
  try {
    return { ...getDefaultConnection(), ...JSON.parse(raw) };
  } catch {
    return getDefaultConnection();
  }
}

export function setConnection(settings: ErpnextConnection): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearConnection(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function resolveUrl(_url: string): string {
  // Always use same-origin /api paths.
  // In dev, Vite proxies /api to the ERPNext server.
  // In production, the app should be served from the ERPNext domain or behind a reverse proxy.
  return "";
}

function getAuthHeader(conn: ErpnextConnection): string {
  if (conn.apiKey && conn.apiSecret) {
    return `token ${conn.apiKey}:${conn.apiSecret}`;
  }
  return "";
}

async function makeRequest(
  conn: ErpnextConnection,
  method: string,
  doctype: string,
  docname = "",
  body: unknown = null
): Promise<unknown> {
  const baseUrl = resolveUrl(conn.url);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const auth = getAuthHeader(conn);
  if (auth) headers.Authorization = auth;

  const fetchUrl = docname
    ? `${baseUrl}/api/resource/${doctype}/${encodeURIComponent(docname)}`
    : `${baseUrl}/api/resource/${doctype}`;

  const res = await fetch(fetchUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.exception || `ERPNext ${method} failed: ${res.statusText}`);
  }

  return res.json();
}

async function fetchList(
  conn: ErpnextConnection,
  doctype: string,
  options: FetchOptions = {}
): Promise<unknown[]> {
  const baseUrl = resolveUrl(conn.url);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const auth = getAuthHeader(conn);
  if (auth) headers.Authorization = auth;

  const params = new URLSearchParams();
  if (options.fields) params.append("fields", JSON.stringify(options.fields));
  if (options.filters) params.append("filters", JSON.stringify(options.filters));
  if (options.limit) params.append("limit_page_length", String(options.limit));
  if (options.start !== undefined) params.append("limit_start", String(options.start));
  if (options.order_by) params.append("order_by", options.order_by);

  const query = params.toString();
  const fetchUrl = `${baseUrl}/api/resource/${doctype}${query ? `?${query}` : ""}`;

  const res = await fetch(fetchUrl, { method: "GET", headers });
  if (!res.ok) {
    throw new Error(`ERPNext list failed: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data || [];
}

export async function login(
  url: string,
  username: string,
  password: string
): Promise<{ success: boolean; user?: string; role?: string; message?: string }> {
  const baseUrl = resolveUrl(url);

  try {
    const loginRes = await fetch(`${baseUrl}/api/method/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ usr: username, pwd: password }),
    });

    if (!loginRes.ok) {
      throw new Error("Invalid credentials or URL unreachable");
    }

    const userRes = await fetch(`${baseUrl}/api/method/frappe.auth.get_logged_user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!userRes.ok) {
      throw new Error("Failed to retrieve user session");
    }

    const userData = await userRes.json();
    const userEmail = userData.message as string;

    let fullName = userEmail;
    try {
      const profileRes = await fetch(`${baseUrl}/api/resource/User/${encodeURIComponent(userEmail)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        fullName = profileData.data?.full_name || userEmail;
      }
    } catch {
      // ignore profile fetch failure
    }

    const settings: ErpnextConnection = {
      isLive: true,
      url,
      username,
      password,
      apiKey: "",
      apiSecret: "",
      connected: true,
      user: fullName,
      role: "ERPNext User",
    };
    setConnection(settings);

    return { success: true, user: fullName, role: settings.role };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export function logout(): void {
  clearConnection();
}

export async function getBOMs(
  limit = 20,
  start = 0
): Promise<BOMSummary[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }

  const rows = (await fetchList(conn, "BOM", {
    fields: ["name", "item", "is_active"],
    limit,
    start,
    order_by: "creation desc",
  })) as Array<{ name: string; item: string; is_active: number }>;

  return rows.map((bom) => ({
    id: bom.name,
    name: bom.name,
    productName: bom.item,
    active: bom.is_active || 1,
  }));
}

export async function getBOMDetails(bomId: string): Promise<BOMMaterial[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }

  const res = (await makeRequest(conn, "GET", "BOM", bomId)) as { data?: { items?: Array<{ item_code: string; item_name: string; qty: number; uom: string }> } };
  const items = res.data?.items || [];

  return items.map((item) => ({
    code: item.item_code,
    name: item.item_name,
    qty: Number(item.qty || 0),
    unit: item.uom || "Qty",
  }));
}

export async function getBOMsForItem(itemCode: string, limit = 50): Promise<BOMSummary[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }

  const rows = (await fetchList(conn, "BOM", {
    fields: ["name", "item", "is_active"],
    filters: [["item", "=", itemCode], ["is_active", "=", 1]],
    limit,
  })) as Array<{ name: string; item: string; is_active: number }>;

  return rows.map((bom) => ({
    id: bom.name,
    name: bom.name,
    productName: bom.item,
    active: bom.is_active || 1,
  }));
}

// ── CHECKLIST / FORMS ───────────────────────────────────────────────────────

export interface ChecklistItem {
  name: string;
  item_description: string;
  expected_condition?: string;
  capture_method: string;
  value_min?: number;
  value_max?: number;
  unit?: string;
  requires_photo: number;
  source: string;
}

export interface ChecklistTemplate {
  name: string;
  checklist_name: string;
  equipment: string;
  filling_line: string;
  frequency: string;
  is_active: number;
  items: ChecklistItem[];
}

export interface ChecklistResponseInput {
  item: string;
  result: "Pass" | "Fail" | "N/A";
  reading_value?: number;
  reading_unit?: string;
  observation?: string;
  photo?: string;
  source?: string;
}

export interface ChecklistSubmissionInput {
  work_order: string;
  filling_line: string;
  equipment: string;
  checklist_template: string;
  shift?: string;
  remarks?: string;
  items: ChecklistResponseInput[];
}

export async function getChecklistTemplates(limit = 100): Promise<ChecklistTemplate[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }

  const rows = (await fetchList(conn, "Maintenance Checklist Template", {
    fields: ["name", "checklist_name", "equipment", "filling_line", "frequency", "is_active"],
    filters: [["is_active", "=", 1]],
    limit,
    order_by: "creation desc",
  })) as Array<{ name: string; checklist_name: string; equipment: string; filling_line: string; frequency: string; is_active: number }>;

  return rows.map((t) => ({
    ...t,
    items: [],
  }));
}

export async function getChecklistTemplate(name: string): Promise<ChecklistTemplate> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }

  const res = (await makeRequest(conn, "GET", "Maintenance Checklist Template", name)) as {
    data?: {
      name: string;
      checklist_name: string;
      equipment: string;
      filling_line: string;
      frequency: string;
      is_active: number;
      items?: ChecklistItem[];
    };
  };

  const data = res.data;
  if (!data) {
    throw new Error(`Checklist template ${name} not found`);
  }

  return {
    name: data.name,
    checklist_name: data.checklist_name,
    equipment: data.equipment,
    filling_line: data.filling_line,
    frequency: data.frequency,
    is_active: data.is_active,
    items: data.items || [],
  };
}

export async function submitChecklist(payload: ChecklistSubmissionInput): Promise<{ name: string }> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }

  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const body = {
    doctype: "Maintenance Checklist Submission",
    work_order: payload.work_order,
    filling_line: payload.filling_line,
    equipment: payload.equipment,
    checklist_template: payload.checklist_template,
    submitted_by: conn.user || conn.username,
    shift: payload.shift || undefined,
    start_time: now,
    submit_time: now,
    status: "Submitted",
    remarks: payload.remarks || "",
    items: payload.items.map((it) => ({
      item: it.item,
      result: it.result,
      reading_value: it.reading_value,
      reading_unit: it.reading_unit,
      observation: it.observation,
      photo: it.photo,
      source: it.source || "Manual",
    })),
  };

  const res = (await makeRequest(conn, "POST", "Maintenance Checklist Submission", "", body)) as { data?: { name: string } };
  if (!res.data?.name) {
    throw new Error("Submission failed: no document name returned");
  }
  return { name: res.data.name };
}

// ── MAINTENANCE SCHEDULE FORMS (restored islandchill DB schema) ─────────────

export interface MaintenanceFormItem {
  name: string;
  description: string;
  standard_time_mins: number;
  pass__fail: string;
  remarks: string;
  date?: string;
}

export interface MaintenanceForm {
  name: string;
  equipment: string;
  area: string;
  work_order?: string;
  overall_remarks?: string;
  items: MaintenanceFormItem[];
}

export interface MaintenanceFormResponseInput {
  item: string;
  result: "Pass" | "Fail" | "N/A";
  reading_value?: number;
  observation?: string;
}

export interface MaintenanceFormSubmissionInput {
  equipment: string;
  area: string;
  work_order?: string;
  overall_remarks?: string;
  items: MaintenanceFormResponseInput[];
}

export async function getMaintenanceForms(limit = 100): Promise<MaintenanceForm[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }

  const rows = (await fetchList(conn, "Daily Preventative Maintenance Schedule", {
    fields: ["name", "equipment", "area", "work_order", "overall_remarks"],
    limit,
    order_by: "creation desc",
  })) as Array<{ name: string; equipment: string; area: string; work_order?: string; overall_remarks?: string }>;

  return rows.map((r) => ({ ...r, items: [] }));
}

export async function getMaintenanceForm(name: string): Promise<MaintenanceForm> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }

  const res = (await makeRequest(conn, "GET", "Daily Preventative Maintenance Schedule", name)) as {
    data?: {
      name: string;
      equipment: string;
      area: string;
      work_order?: string;
      overall_remarks?: string;
      maintenance_details?: MaintenanceFormItem[];
    };
  };

  const data = res.data;
  if (!data) {
    throw new Error(`Maintenance form ${name} not found`);
  }

  return {
    name: data.name,
    equipment: data.equipment,
    area: data.area,
    work_order: data.work_order,
    overall_remarks: data.overall_remarks,
    items: data.maintenance_details || [],
  };
}

export async function submitMaintenanceForm(payload: MaintenanceFormSubmissionInput): Promise<{ name: string }> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }

  const body = {
    doctype: "Daily Preventative Maintenance Schedule",
    equipment: payload.equipment,
    area: payload.area,
    work_order: payload.work_order || undefined,
    overall_remarks: payload.overall_remarks || "",
    maintenance_details: payload.items.map((it) => ({
      description: it.item,
      pass__fail: it.result,
      remarks: it.observation || "",
      standard_time_mins: it.reading_value || 0,
    })),
  };

  const res = (await makeRequest(conn, "POST", "Daily Preventative Maintenance Schedule", "", body)) as {
    data?: { name: string };
  };
  if (!res.data?.name) {
    throw new Error("Submission failed: no document name returned");
  }
  return { name: res.data.name };
}

// ── ADMIN DASHBOARD ─────────────────────────────────────────────────────────

export interface DashboardStats {
  total_work_orders: number;
  completed_work_orders: number;
  open_incidents: number;
  lines_running: string;
}

export interface ThroughputDataPoint {
  day: string;
  planned: number;
  actual: number;
}

export interface IncidentBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface SystemSummary {
  product_families: number;
  total_variants: number;
  filling_lines: number;
  boms: number;
  forms: number;
  warehouse_zones: number;
  mes_version: string;
}

async function callMethod<T>(
  conn: ErpnextConnection,
  method: string,
  params?: Record<string, string>,
  module = "api"
): Promise<T> {
  const baseUrl = resolveUrl(conn.url);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const auth = getAuthHeader(conn);
  if (auth) headers.Authorization = auth;

  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const res = await fetch(`${baseUrl}/api/method/islandchill.${module}.${method}${query}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.exception || `ERPNext method ${method} failed: ${res.statusText}`);
  }

  const data = (await res.json()) as { message?: T };
  return data.message as T;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }
  return callMethod<DashboardStats>(conn, "get_dashboard_stats");
}

export async function getWeeklyThroughput(): Promise<ThroughputDataPoint[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }
  return callMethod<ThroughputDataPoint[]>(conn, "get_weekly_throughput");
}

export async function getIncidentBreakdown(): Promise<IncidentBreakdownItem[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }
  return callMethod<IncidentBreakdownItem[]>(conn, "get_incident_breakdown");
}

export async function getSystemSummary(): Promise<SystemSummary> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }
  return callMethod<SystemSummary>(conn, "get_system_summary");
}

// ── PRODUCTS / FINISHED ITEMS ───────────────────────────────────────────────

export interface FinishedItem {
  id: string;
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  has_variants: 0 | 1;
  variant_of: string | null;
  description?: string;
  image?: string;
}

export interface FinishedItemDetail extends FinishedItem {
  is_stock_item: 0 | 1;
  disabled: 0 | 1;
}

export interface ItemBOM {
  id: string;
  name: string;
  item: string;
  uom: string;
  quantity: number;
  is_default: 0 | 1;
  rm_cost_as_per?: string;
}

export async function getFinishedItems(): Promise<FinishedItem[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }
  return callMethod<FinishedItem[]>(conn, "get_finished_items", undefined, "products");
}

export async function getFinishedItem(itemCode: string): Promise<FinishedItemDetail> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }
  return callMethod<FinishedItemDetail>(conn, "get_finished_item", { item_code: itemCode }, "products");
}

export async function getItemBOMs(itemCode: string): Promise<ItemBOM[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }
  return callMethod<ItemBOM[]>(conn, "get_item_boms", { item_code: itemCode }, "products");
}

// ── WORK ORDERS ─────────────────────────────────────────────────────────────

export interface CreateWorkOrderInput {
  production_item: string;
  qty: number;
  bom_no?: string;
  planned_start_date?: string;
  production_line?: string;
}

export interface CreateWorkOrderResult {
  name: string;
  status: string;
  production_item: string;
  item_name?: string;
  qty: number;
  stock_uom?: string;
  bom_no?: string;
}

export interface WorkOrderSummary {
  id: string;
  name: string;
  production_item: string;
  item_name?: string;
  status: string;
  qty: number;
  stock_uom?: string;
  planned_start_date?: string;
  bom_no?: string;
}

export async function createWorkOrder(
  payload: CreateWorkOrderInput
): Promise<CreateWorkOrderResult> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }
  const params: Record<string, string> = {
    production_item: payload.production_item,
    qty: String(payload.qty),
  };
  if (payload.bom_no) params.bom_no = payload.bom_no;
  if (payload.planned_start_date) params.planned_start_date = payload.planned_start_date;
  if (payload.production_line) params.production_line = payload.production_line;
  return callMethod<CreateWorkOrderResult>(conn, "create_work_order", params, "work_order");
}

export async function getWorkOrders(status?: string, limit = 50): Promise<WorkOrderSummary[]> {
  const conn = getConnection();
  if (!conn.isLive || !conn.connected) {
    throw new Error("Not connected to ERPNext");
  }
  const params: Record<string, string> = { limit: String(limit) };
  if (status) params.status = status;
  return callMethod<WorkOrderSummary[]>(conn, "get_work_orders", params, "work_order");
}
