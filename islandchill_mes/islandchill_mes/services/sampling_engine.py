"""QC Sampling engine — generates due samples and handles escalation.

Runs every 5 minutes via scheduler. Creates Sampling Due rows from
active Work Orders x QC Sampling Plans.
"""
import frappe
from frappe.utils import now_datetime, add_to_date


def generate_due_samples():
    """Create Sampling Due rows for active WOs that have elapsed their frequency."""
    active_wos = frappe.get_all(
        "Work Order",
        filters={"docstatus": 1, "status": ["in", ["In Process", "Not Started"]]},
        fields=["name", "production_item", "filling_line", "batch_no", "actual_start_date", "qty"],
    )

    for wo in active_wos:
        family = _get_product_family(wo.production_item)
        if not family:
            continue

        plans = frappe.get_all(
            "QC Sampling Plan",
            filters={
                "product_family": family,
                "is_active": 1,
                "filling_line": ["in", [wo.filling_line, ""]],
            },
            fields=["*"],
        )

        for plan in plans:
            _ensure_due_row(wo, plan)


def _ensure_due_row(wo, plan):
    """Create a Sampling Due if one doesn't exist for this interval."""
    freq_type = plan.frequency_type
    freq_val = plan.frequency_value

    # Calculate due time based on frequency
    if freq_type == "Per Units":
        produced = flt(wo.qty)  # simplified; should track cumulative
        due_time = now_datetime()
    elif freq_type == "Every Minutes":
        due_time = add_to_date(now_datetime(), minutes=freq_val)
    else:  # Per Batch
        due_time = now_datetime()

    # Check if pending already exists for this WO + parameter
    existing = frappe.db.exists("Sampling Due", {
        "work_order": wo.name,
        "parameter": plan.parameter,
        "status": "Pending",
    })
    if existing:
        return

    frappe.get_doc({
        "doctype": "Sampling Due",
        "work_order": wo.name,
        "batch_no": wo.batch_no,
        "filling_line": wo.filling_line,
        "parameter": plan.parameter,
        "due_time": due_time,
        "status": "Pending",
    }).insert(ignore_permissions=True)


def escalate_overdue():
    """Mark grace-expired samples as Overdue and notify supervisors."""
    overdue = frappe.get_all(
        "Sampling Due",
        filters={"status": "Pending", "due_time": ["<", now_datetime()]},
        fields=["name", "work_order", "filling_line", "parameter", "due_time"],
    )

    for row in overdue:
        doc = frappe.get_doc("Sampling Due", row.name)
        doc.status = "Overdue"
        doc.save(ignore_permissions=True)

        # Create incident for unattended overdue QC
        frappe.get_doc({
            "doctype": "Line Incident",
            "work_order": row.work_order,
            "filling_line": row.filling_line,
            "incident_type": "Quality Fault",
            "severity": "High",
            "status": "Raised",
            "raised_by": "System",
            "raised_time": now_datetime(),
            "description": f"QC sampling overdue: {row.parameter} (due {row.due_time})",
        }).insert(ignore_permissions=True)


def _get_product_family(item_code):
    """Lookup product family for an item code."""
    family = frappe.db.get_value("Family Variant", {"item": item_code}, "parent")
    return family


def flt(v):
    from frappe.utils import flt as _flt
    return _flt(v)
