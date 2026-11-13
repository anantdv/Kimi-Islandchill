"""QC sampling APIs (spec Section 14.6)."""
import frappe
from frappe import _
from frappe.utils import flt, now_datetime

from islandchill_mes.api.util import idempotent


@frappe.whitelist()
def get_due(work_order=None, filling_line=None):
    """Get pending/overdue QC samples."""
    filters = {"status": ["in", ["Pending", "Overdue"]]}
    if work_order:
        filters["work_order"] = work_order
    if filling_line:
        filters["filling_line"] = filling_line

    due = frappe.get_all(
        "Sampling Due",
        filters=filters,
        fields=["name", "work_order", "filling_line", "parameter", "due_time", "status"],
        order_by="due_time",
    )
    return {"due": due}


@frappe.whitelist(methods=["POST"])
@idempotent
def fulfill(sampling_due, reading_value, unit, photo=None, comment=None,
            client_request_id=None):
    """Fulfill a sampling due with measured value.
    
    Validates against QC Sampling Plan spec bands.
    """
    sd = frappe.get_doc("Sampling Due", sampling_due)
    if sd.status == "Completed":
        frappe.throw(_("Sampling already completed"))

    # Find plan for validation
    plan = frappe.get_all(
        "QC Sampling Plan",
        filters={"parameter": sd.parameter, "is_active": 1},
        fields=["spec_min", "spec_max", "control_min", "control_max"],
        limit=1,
    )

    val = flt(reading_value)
    within_spec = True
    within_control = True
    if plan:
        p = plan[0]
        if p.spec_min is not None and val < p.spec_min:
            within_spec = False
        if p.spec_max is not None and val > p.spec_max:
            within_spec = False
        if p.control_min is not None and val < p.control_min:
            within_control = False
        if p.control_max is not None and val > p.control_max:
            within_control = False

    sd.status = "Completed"
    sd.fulfilled_by = frappe.session.user
    sd.fulfilled_time = now_datetime()
    sd.save(ignore_permissions=True)

    # Create a linked lab form (simplified — would create actual form doc)
    result = {
        "sampling_due": sd.name,
        "status": "Completed",
        "value": val,
        "unit": unit,
        "within_spec": within_spec,
        "within_control": within_control,
    }

    if not within_spec:
        # Raise quality incident
        from islandchill_mes.services.incident_engine import raise_incident
        raise_incident(
            filling_line=sd.filling_line,
            incident_type="Quality Fault",
            severity="Critical",
            description=f"QC out of spec: {sd.parameter} = {val} {unit}",
            work_order=sd.work_order,
        )

    return result
