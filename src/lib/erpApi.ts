const API_BASE = import.meta.env.VITE_ERP_API_URL || "";

function buildQuery(params?: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  if (!params) return "";
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  return search.toString() ? `?${search.toString()}` : "";
}

class ERPApi {
  private baseUrl: string;
  private cookie: string | null = null;

  constructor() {
    this.baseUrl = API_BASE.replace(/\/$/, "");
  }

  private url(method: string) {
    return `${this.baseUrl}/api/method/${method}`;
  }

  private async request(method: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (this.cookie) {
      headers["Cookie"] = this.cookie;
    }
    const res = await fetch(this.url(method), {
      ...options,
      headers,
      credentials: "include",
    });
    // Capture set-cookie for non-browser environments / testing
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      this.cookie = setCookie.split(";")[0];
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      let msg = data.message;
      if (!msg && data._server_messages) {
        try {
          const messages = JSON.parse(data._server_messages);
          if (Array.isArray(messages) && messages.length > 0) {
            const first = typeof messages[0] === "string" ? JSON.parse(messages[0]) : messages[0];
            msg = first?.message || messages[0];
          }
        } catch {
          msg = data._server_messages;
        }
      }
      throw new Error(msg || `HTTP ${res.status}`);
    }
    return data.message ?? data;
  }

  async login(usr: string, pwd: string) {
    const data = await this.request("login", {
      method: "POST",
      body: JSON.stringify({ usr, pwd }),
    });
    return data;
  }

  async logout() {
    return this.request("logout", { method: "POST" });
  }

  async getEmployees() {
    return this.request("islandchill_backend.island_chill_backend.api.master_data.get_active_employees");
  }

  async getDrivers() {
    return this.request("islandchill_backend.island_chill_backend.api.master_data.get_drivers");
  }

  async getUserInfo(email: string) {
    const res = await fetch(`${this.baseUrl}/api/resource/User/${encodeURIComponent(email)}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }
    return data.data;
  }

  async getProductFamilies() {
    return this.request("islandchill_backend.island_chill_backend.api.master_data.get_product_families");
  }

  async getFillingLines() {
    return this.request("islandchill_backend.island_chill_backend.api.master_data.get_filling_lines");
  }

  async getQCParameters() {
    return this.request("islandchill_backend.island_chill_backend.api.master_data.get_qc_parameters");
  }

  async getFormsLibrary() {
    return this.request("islandchill_backend.island_chill_backend.api.master_data.get_forms_library");
  }

  async getFormSchema(formName: string) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.master_data.get_form_schema${buildQuery({ form_name: formName })}`
    );
  }

  async submitForm(documentType: string, values: Record<string, any>) {
    return this.request("islandchill_backend.island_chill_backend.api.master_data.submit_form", {
      method: "POST",
      body: JSON.stringify({ document_type: documentType, values }),
    });
  }

  async listFormSubmissions(documentType: string, limit: number = 50) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.master_data.list_form_submissions${buildQuery({ document_type: documentType, limit })}`
    );
  }

  async getFormSubmission(documentType: string, name: string) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.master_data.get_form_submission${buildQuery({ document_type: documentType, name })}`
    );
  }

  // Shift management
  async getShifts() {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.get_shifts");
  }

  async createShift(payload: {
    name: string;
    start_time: string;
    end_time: string;
    break_minutes?: number;
    color?: string;
    days?: string[];
  }) {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.create_shift", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateShift(
    shift_id: string,
    payload: {
      name?: string;
      start_time?: string;
      end_time?: string;
      break_minutes?: number;
      color?: string;
      days?: string[];
    }
  ) {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.update_shift", {
      method: "POST",
      body: JSON.stringify({ shift_id, ...payload }),
    });
  }

  async deleteShift(shift_id: string) {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.delete_shift", {
      method: "POST",
      body: JSON.stringify({ shift_id }),
    });
  }

  async getShiftEmployees(active_only: boolean = true) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.shift_management.get_employees${buildQuery({ active_only })}`
    );
  }

  async createShiftEmployee(payload: {
    name: string;
    employee_id?: string;
    department?: string;
    role?: string;
    joined_date?: string;
    is_system_user?: boolean;
  }) {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.create_employee", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateEmployee(
    employee_id: string,
    payload: {
      name?: string;
      department?: string;
      role?: string;
      active?: boolean;
    }
  ) {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.update_employee", {
      method: "POST",
      body: JSON.stringify({ employee_id, ...payload }),
    });
  }

  async deleteEmployee(employee_id: string) {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.delete_employee", {
      method: "POST",
      body: JSON.stringify({ employee_id }),
    });
  }

  async getShiftAssignments() {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.get_shift_assignments");
  }

  async assignShift(payload: { employee_id: string; shift_id: string; effective_from?: string }) {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.assign_shift", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async removeShiftAssignment(assignment_id: string) {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.remove_shift_assignment", {
      method: "POST",
      body: JSON.stringify({ assignment_id }),
    });
  }

  async getClockRecords(date?: string, limit: number = 100) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.shift_management.get_clock_records${buildQuery({ date, limit })}`
    );
  }

  async createClockRecord(payload: {
    employee_id: string;
    type: string;
    timestamp?: string;
    method?: string;
    shift_id?: string;
  }) {
    return this.request("islandchill_backend.island_chill_backend.api.shift_management.create_clock_record", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async listWorkOrders(params?: { status?: string; search?: string }) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.work_order.list_work_orders${buildQuery(params)}`
    );
  }

  async getWorkOrder(workOrder: string) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.work_order.get_work_order${buildQuery({ work_order: workOrder })}`
    );
  }

  async createWorkOrder(payload: {
    item: string;
    qty: number;
    uom?: string;
    filling_line: string;
    product_family?: string;
    family_variant?: string;
  }) {
    return this.request("islandchill_backend.island_chill_backend.api.work_order.create_work_order", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async launchWorkOrder(workOrder: string) {
    return this.request("islandchill_backend.island_chill_backend.api.work_order.launch_work_order", {
      method: "POST",
      body: JSON.stringify({ work_order: workOrder }),
    });
  }

  async finishWorkOrder(payload: {
    work_order: string;
    actual_qty: number;
    process_loss_qty?: number;
    extra_goods_qty?: number;
  }) {
    return this.request("islandchill_backend.island_chill_backend.api.work_order.finish_work_order", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateJobCard(payload: { job_card: string; status?: string; operator?: string }) {
    return this.request("islandchill_backend.island_chill_backend.api.work_order.update_job_card", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getJobCardsForWorkOrder(workOrder: string) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.job_card.get_job_cards_for_work_order${buildQuery({ work_order: workOrder })}`
    );
  }

  async startJobCard(payload: { job_card: string; employee?: string; remarks?: string; actual_start_time?: string }) {
    return this.request("islandchill_backend.island_chill_backend.api.job_card.start_job_card", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async pauseJobCard(payload: { job_card: string; remarks?: string; actual_end_time?: string }) {
    return this.request("islandchill_backend.island_chill_backend.api.job_card.pause_job_card", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async resumeJobCard(payload: { job_card: string; remarks?: string; actual_start_time?: string }) {
    return this.request("islandchill_backend.island_chill_backend.api.job_card.resume_job_card", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async submitJobCard(payload: {
    job_card: string;
    remarks?: string;
    actual_end_time?: string;
    qty?: number;
    for_quantity?: number;
    loose_qty?: number;
    process_loss_qty?: number;
  }) {
    return this.request("islandchill_backend.island_chill_backend.api.job_card.submit_job_card", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getQCForm(jobCard: string, formDoctype: string, formName: string) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.job_card.get_qc_form${buildQuery({
        job_card: jobCard,
        form_doctype: formDoctype,
        form_name: formName,
      })}`
    );
  }

  async submitQCForm(payload: { job_card: string; form_doctype: string; form_name: string; values?: Record<string, any> }) {
    return this.request("islandchill_backend.island_chill_backend.api.job_card.submit_qc_form", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async addJobCardComment(payload: { job_card: string; content: string; operator?: string }) {
    return this.request("islandchill_backend.island_chill_backend.api.job_card.add_job_card_comment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getStockOnHand(params?: { warehouse?: string; category?: string; search?: string }) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.stock.get_stock_on_hand${buildQuery(params)}`
    );
  }

  async getStockMovements(params?: { item_code?: string; warehouse?: string; limit?: number }) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.stock.get_stock_movements${buildQuery(params)}`
    );
  }

  async getWarehouses() {
    return this.request("islandchill_backend.island_chill_backend.api.stock.get_warehouses");
  }

  async listIncidents(params?: { status?: string; search?: string; work_order?: string }) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.incident.list_incidents${buildQuery(params)}`
    );
  }

  async getIncident(name: string) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.incident.get_incident${buildQuery({ name })}`
    );
  }

  async createIncident(payload: {
    id?: string;
    title?: string;
    type: string;
    severity: string;
    description: string;
    line?: string;
    status?: string;
    downtime?: number;
    wastageQty?: number;
    raisedAt?: string;
    work_order?: string;
  }) {
    return this.request("islandchill_backend.island_chill_backend.api.incident.create_incident", {
      method: "POST",
      body: JSON.stringify({ payload }),
    });
  }

  async updateIncident(name: string, payload: Partial<{
    status: string;
    severity: string;
    description: string;
    line: string;
    downtime: number;
    wastageQty: number;
  }>) {
    return this.request("islandchill_backend.island_chill_backend.api.incident.update_incident", {
      method: "POST",
      body: JSON.stringify({ name, payload }),
    });
  }

  async saveInvestigation(payload: {
    incidentName: string;
    incidentId?: string;
    checklist: any[];
    rootCauseCategory: string;
    rootCauseDetail: string;
    actionTaken: string;
    photos: string[];
    resolutionStatus: "resolved" | "pending";
    pendingReason?: string;
    reviewedBy?: string;
    reviewedAt?: string;
  }) {
    return this.request("islandchill_backend.island_chill_backend.api.incident.save_investigation", {
      method: "POST",
      body: JSON.stringify({ payload }),
    });
  }

  // ── Carton Labels ──────────────────────────────────────────────────────────
  async listCartonLabels(params?: { status?: string; search?: string; eligible_only?: boolean }) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.carton_label.list_carton_labels${buildQuery(params)}`
    );
  }

  async createCartonLabel(payload: Partial<{
    labelCode: string;
    workOrderId: string;
    product: string;
    variant: string;
    batchNumber: string;
    productionDate: string;
    expiryDate: string;
    quantity: number;
    uom: string;
    status: string;
    warehouse: string;
    warehouseBinId: string;
  }>) {
    return this.request("islandchill_backend.island_chill_backend.api.carton_label.create_carton_label", {
      method: "POST",
      body: JSON.stringify({ payload }),
    });
  }

  async updateCartonLabel(name: string, payload: Partial<{
    labelCode: string;
    workOrderId: string;
    product: string;
    variant: string;
    batchNumber: string;
    productionDate: string;
    expiryDate: string;
    quantity: number;
    uom: string;
    status: string;
    warehouse: string;
    warehouseBinId: string;
    gatePassId: string;
  }>) {
    return this.request("islandchill_backend.island_chill_backend.api.carton_label.update_carton_label", {
      method: "POST",
      body: JSON.stringify({ name, payload }),
    });
  }

  async deleteCartonLabel(name: string) {
    return this.request("islandchill_backend.island_chill_backend.api.carton_label.delete_carton_label", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  // ── Gate Pass ──────────────────────────────────────────────────────────────
  async listGatePasses(params?: { status?: string; search?: string }) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.gate_pass.list_gate_passes${buildQuery(params)}`
    );
  }

  async getGatePass(name: string) {
    return this.request(
      `islandchill_backend.island_chill_backend.api.gate_pass.get_gate_pass${buildQuery({ name })}`
    );
  }

  async createGatePass(payload: {
    vehicleNumber: string;
    driver: string;
    destination: string;
    notes?: string;
    items: any[];
  }) {
    return this.request("islandchill_backend.island_chill_backend.api.gate_pass.create_gate_pass", {
      method: "POST",
      body: JSON.stringify({ payload }),
    });
  }

  async updateGatePass(name: string, payload: Partial<{
    vehicleNumber: string;
    driver: string;
    destination: string;
    notes: string;
  }>) {
    return this.request("islandchill_backend.island_chill_backend.api.gate_pass.update_gate_pass", {
      method: "POST",
      body: JSON.stringify({ name, payload }),
    });
  }

  async deleteGatePass(name: string) {
    return this.request("islandchill_backend.island_chill_backend.api.gate_pass.delete_gate_pass", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async transitionGatePass(name: string, action: "approve" | "start_loading" | "dispatch" | "deliver", payload?: Record<string, any>) {
    return this.request("islandchill_backend.island_chill_backend.api.gate_pass.transition_gate_pass", {
      method: "POST",
      body: JSON.stringify({ name, action, payload }),
    });
  }

  async addGatePassAttachment(name: string, attachmentType: string, image: string, notes?: string) {
    return this.request("islandchill_backend.island_chill_backend.api.gate_pass.add_attachment", {
      method: "POST",
      body: JSON.stringify({ name, attachment_type: attachmentType, image, notes }),
    });
  }

  async uploadFile(file: File, opts?: { folder?: string; isPrivate?: boolean }) {
    const form = new FormData();
    form.append("file", file);
    if (opts?.folder) form.append("folder", opts.folder);
    form.append("is_private", opts?.isPrivate ? "1" : "0");

    const res = await fetch(`${this.baseUrl}/api/method/upload_file`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }
    return data.message ?? data;
  }
}

export const erpApi = new ERPApi();
