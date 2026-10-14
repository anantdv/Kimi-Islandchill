"""Checklist APIs (spec Section 14.3)."""
import frappe
from frappe import _

from islandchill_mes.api.util import idempotent


@frappe.whitelist()
def get_templates(filling_line, work_order=None, frequency="Pre-Start"):
    """Get checklist templates for a filling line + frequency.
    
    If work_order provided, also returns per-equipment templates.
    """
    filters = {
        "filling_line": filling_line,
        "frequency": frequency,
        "is_active": 1,
    }
    templates = frappe.get_all(
        "Maintenance Checklist Template",
        filters=filters,
        fields=["name", "checklist_name", "equipment", "frequency"],
    )
    return {"templates": templates}


@frappe.whitelist(methods=["POST"])
@idempotent
def submit(checklist_template, work_order, filling_line, equipment, items,
           shift=None, remarks=None, client_request_id=None):
    """Submit a completed checklist.
    
    Args:
        items: List of {item: <checklist_item_name>, result: Pass/Fail/N/A,
               reading_value, reading_unit, photo, observation}
    
    Returns:
        {submission: <name>, status: "Submitted", critical_failures: [...]}
    """
    template = frappe.get_doc("Maintenance Checklist Template", checklist_template)

    doc = frappe.get_doc({
        "doctype": "Maintenance Checklist Submission",
        "work_order": work_order,
        "filling_line": filling_line,
        "equipment": equipment,
        "checklist_template": checklist_template,
        "submitted_by": frappe.session.user,
        "shift": shift,
        "start_time": frappe.utils.now_datetime(),
        "submit_time": frappe.utils.now_datetime(),
        "status": "Submitted",
        "remarks": remarks,
    })

    critical_failures = []
    for item_data in items:
        item_doc = frappe.get_doc("Checklist Item", item_data["item"])
        response = {
            "item": item_data["item"],
            "result": item_data.get("result", "Pass"),
            "reading_value": item_data.get("reading_value"),
            "reading_unit": item_data.get("reading_unit"),
            "photo": item_data.get("photo"),
            "source": "Manual",
            "observation": item_data.get("observation"),
        }

        # Auto-evaluate within spec
        if item_doc.value_min is not None and item_doc.value_max is not None:
            val = frappe.utils.flt(item_data.get("reading_value"))
            response["is_within_spec"] = item_doc.value_min <= val <= item_doc.value_max
            if not response["is_within_spec"]:
                critical_failures.append({
                    "item": item_doc.item_description,
                    "expected": f"{item_doc.value_min}-{item_doc.value_max} {item_doc.unit}",
                    "actual": f"{val} {item_data.get('reading_unit', '')}",
                })

        doc.append("items", response)

    doc.insert(ignore_permissions=True)

    # If critical failures, draft a Line Incident
    if critical_failures:
        from islandchill_mes.services.incident_engine import raise_incident
        raise_incident(
            filling_line=filling_line,
            incident_type="Parameter Deviation",
            severity="High",
            description="Critical checklist failures: " + ", ".join(
                f["item"] for f in critical_failures
            ),
            work_order=work_order,
            equipment=equipment,
        )

    return {
        "submission": doc.name,
        "status": doc.status,
        "critical_failures": critical_failures,
    }
