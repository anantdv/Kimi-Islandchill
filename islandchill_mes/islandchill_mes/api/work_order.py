"""Work Order orchestration APIs (spec Section 14.1)."""
import frappe
from frappe import _
from frappe.utils import flt, now_datetime

from islandchill_mes.api.util import idempotent, get_mes_settings
from islandchill_mes.services.gate_engine import evaluate as gate_evaluate
from islandchill_mes.services.state_engine import publish as state_publish


@frappe.whitelist(methods=["POST"])
@idempotent
def create(item, qty, uom, filling_line, source_warehouse=None,
           target_warehouse=None, planned_start=None, client_request_id=None):
    """Create a Work Order with MES context.
    
    Args:
        item: Item code (from Family Variant selection)
        qty: Planned quantity
        uom: Unit of measure
        filling_line: Filling Line name
        source_warehouse: Optional override
        target_warehouse: Optional override
        planned_start: Optional datetime string
    
    Returns:
        {work_order: <name>, status: "Draft"}
    """
    settings = get_mes_settings()

    # Validate filling line
    fl = frappe.get_doc("Filling Line", filling_line)
    if not fl or not fl.is_active:
        frappe.throw(_("Filling line {0} not found or inactive").format(filling_line))

    # Validate future date if not allowed
    if planned_start and not settings.allow_future_work_orders:
        from frappe.utils import getdate
        if getdate(planned_start) > getdate():
            frappe.throw(_("Future work orders not allowed"))

    # Create WO via ERPNext
    wo = frappe.new_doc("Work Order")
    wo.production_item = item
    wo.qty = flt(qty)
    wo.uom = uom
    wo.filling_line = filling_line
    wo.source_warehouse = source_warehouse or settings.source_warehouse
    wo.wip_warehouse = settings.wip_warehouse
    wo.fg_warehouse = target_warehouse or settings.fg_warehouse
    if planned_start:
        wo.planned_start_date = planned_start

    # Auto-fetch BOM if single BOM exists
    boms = frappe.get_all("BOM", filters={"item": item, "is_active": 1, "is_default": 1}, limit=1)
    if boms:
        wo.bom_no = boms[0].name
    else:
        # Try any active BOM
        boms = frappe.get_all("BOM", filters={"item": item, "is_active": 1}, limit=1)
        if boms:
            wo.bom_no = boms[0].name

    wo.insert(ignore_permissions=True)

    state_publish("work_order_created", {
        "work_order": wo.name,
        "filling_line": filling_line,
        "item": item,
        "qty": qty,
    })

    return {"work_order": wo.name, "status": wo.status}


@frappe.whitelist(methods=["POST"])
@idempotent
def launch(work_order, client_request_id=None):
    """Launch a Work Order — runs Pre-Start gate, then submits WO.
    
    Returns:
        {work_order: <name>, status: "In Process", gate: <gate_result>}
    """
    wo = frappe.get_doc("Work Order", work_order)
    if wo.docstatus != 0:
        frappe.throw(_("Work Order must be in Draft state to launch"))

    # Run Pre-Start gate
    gate_result = gate_evaluate(wo.name, "Pre-Start")

    # Submit WO (this triggers ERPNext's submit logic)
    wo.submit()

    # Create initial job cards from BOM operations
    _create_job_cards(wo)

    state_publish("work_order_launched", {
        "work_order": wo.name,
        "filling_line": wo.filling_line,
        "gate": gate_result,
    })

    return {
        "work_order": wo.name,
        "status": wo.status,
        "gate": gate_result,
    }


@frappe.whitelist()
def get_state(work_order):
    """Single-call execution payload (spec Section 14.1).
    
    Returns complete state for the WO execution screen:
    - WO details
    - Gate status
    - Checklists (pending/completed)
    - Stock entries (draft/submitted)
    - Job cards with status
    - Incidents
    - QC sampling due
    - Container verifications
    """
    wo = frappe.get_doc("Work Order", work_order)

    # Checklists
    checklists = frappe.get_all(
        "Maintenance Checklist Submission",
        filters={"work_order": work_order},
        fields=["name", "equipment", "status", "submit_time"],
    )

    # Stock entries
    stock_entries = frappe.get_all(
        "Stock Entry",
        filters={"work_order": work_order},
        fields=["name", "purpose", "docstatus", "posting_date"],
    )

    # Job cards
    job_cards = frappe.get_all(
        "Job Card",
        filters={"work_order": work_order},
        fields=["name", "operation", "status", "for_quantity", "total_completed_qty",
                "started_time", "completed_time"],
        order_by="creation",
    )

    # Incidents
    incidents = frappe.get_all(
        "Line Incident",
        filters={"work_order": work_order},
        fields=["name", "incident_type", "severity", "status", "raised_time"],
    )

    # QC due
    qc_due = frappe.get_all(
        "Sampling Due",
        filters={"work_order": work_order},
        fields=["name", "parameter", "due_time", "status"],
    )

    # Container verifications
    containers = frappe.get_all(
        "Container Verification",
        filters={"work_order": work_order},
        fields=["name", "container", "status", "within_tolerance"],
    )

    return {
        "work_order": {
            "name": wo.name,
            "item": wo.production_item,
            "qty": flt(wo.qty),
            "produced_qty": flt(wo.produced_qty),
            "status": wo.status,
            "filling_line": wo.filling_line,
            "batch_no": wo.batch_no,
        },
        "checklists": checklists,
        "stock_entries": stock_entries,
        "job_cards": job_cards,
        "incidents": incidents,
        "qc_due": qc_due,
        "container_verifications": containers,
    }


@frappe.whitelist(methods=["POST"])
@idempotent
def finish(work_order, actual_qty, process_loss_qty=0, extra_goods_qty=0,
           client_request_id=None):
    """Finish a Work Order.
    
    Runs Pre-Finish gate, then completes the WO.
    """
    wo = frappe.get_doc("Work Order", work_order)
    if wo.status not in ("In Process", "Not Started"):
        frappe.throw(_("Work Order must be In Process to finish"))

    # Run Pre-Finish gate
    gate_result = gate_evaluate(wo.name, "Pre-Finish")

    # Update process loss
    wo.process_loss_qty = flt(process_loss_qty)
    wo.save(ignore_permissions=True)

    # Create manufacture stock entry
    se = wo.make_stock_entry()
    if se:
        se.fg_completed_qty = flt(actual_qty)
        se.save(ignore_permissions=True)
        se.submit()

    # Mark WO as completed
    frappe.db.set_value("Work Order", work_order, "status", "Completed")

    state_publish("work_order_finished", {
        "work_order": wo.name,
        "actual_qty": actual_qty,
        "process_loss": process_loss_qty,
        "extra_goods": extra_goods_qty,
    })

    return {
        "work_order": wo.name,
        "status": "Completed",
        "gate": gate_result,
    }


def _create_job_cards(wo):
    """Create job cards from BOM operations."""
    if not wo.bom_no:
        return
    bom = frappe.get_doc("BOM", wo.bom_no)
    for op in bom.operations:
        jc = frappe.new_doc("Job Card")
        jc.work_order = wo.name
        jc.operation = op.operation
        jc.workstation = op.workstation
        jc.for_quantity = flt(wo.qty)
        jc.wip_warehouse = wo.wip_warehouse
        jc.insert(ignore_permissions=True)
