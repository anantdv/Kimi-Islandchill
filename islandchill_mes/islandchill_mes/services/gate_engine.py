"""Gate engine (spec Section 6.3).

Permissive mode: logs violations, warns, allows through.
Enforcing mode: blocks on any violation.

Gate mode is config-only — flip MES Settings.gate_mode to change behavior
without touching code.
"""
import frappe
from frappe import _
from frappe.utils import now_datetime

STAGES = ("Pre-Start", "Pre-Finish", "On-Demand")


def evaluate(work_order, stage, context=None):
    """Evaluate gate for a work_order at given stage.
    
    Returns dict: {passed: bool, gate_mode: str, violations: [...], action: str}
    """
    settings = frappe.get_doc("MES Settings", "MES Settings")
    mode = settings.gate_mode or "Permissive"

    registrations = frappe.get_all(
        "MES Form Registration",
        filters={"required_stage": stage},
        fields=["name", "form_type", "form_label", "category", "blocking", "scope"],
    )

    violations = []
    for reg in registrations:
        missing = _count_missing(work_order, reg, context)
        if missing > 0:
            violations.append({
                "form": reg.form_type,
                "label": reg.form_label,
                "category": reg.category,
                "scope": reg.scope,
                "blocking": reg.blocking,
                "missing_count": missing,
            })

    blocking_violations = [v for v in violations if v["blocking"]]
    passed = len(blocking_violations) == 0

    action = "Allowed"
    if violations:
        if mode == "Enforcing" and blocking_violations:
            action = "Blocked"
        else:
            action = "Allowed with Warnings"

    # Log every evaluation
    frappe.get_doc({
        "doctype": "Gate Violation Log",
        "work_order": work_order,
        "stage": stage,
        "gate_mode": mode,
        "violations": frappe.as_json(violations),
        "acted_by": frappe.session.user,
        "action": action,
        "timestamp": now_datetime(),
    }).insert(ignore_permissions=True)

    if mode == "Enforcing" and blocking_violations:
        labels = ", ".join(v["label"] for v in blocking_violations)
        frappe.throw(
            _("Gate blocked at {0}: missing {1}").format(stage, labels),
            frappe.ValidationError,
        )

    return {
        "passed": passed,
        "gate_mode": mode,
        "violations": violations,
        "action": action,
    }


def _count_missing(work_order, reg, context):
    """Count how many instances of this form are missing for the WO.
    
    scope: Work Order -> check once per WO
    scope: Batch -> check once per batch_no on WO
    scope: Shift -> check per shift
    """
    scope = reg.scope or "Work Order"
    wo = frappe.get_doc("Work Order", work_order) if isinstance(work_order, str) else work_order

    filters = {
        "docstatus": 1,
        "form_type": reg.form_type,
    }

    if scope == "Work Order":
        filters["work_order"] = wo.name
        count = frappe.db.count("Maintenance Checklist Submission", filters=filters)
        return 0 if count > 0 else 1

    if scope == "Batch":
        batch_no = getattr(wo, "batch_no", None)
        if not batch_no:
            return 1
        filters["batch_no"] = batch_no
        count = frappe.db.count("Maintenance Checklist Submission", filters=filters)
        return 0 if count > 0 else 1

    if scope == "Shift":
        shift = context.get("shift") if context else None
        if not shift:
            return 1
        filters["shift"] = shift
        count = frappe.db.count("Maintenance Checklist Submission", filters=filters)
        return 0 if count > 0 else 1

    return 0
