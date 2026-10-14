"""Dynamic workflow engine (spec Section 7).

Condition-driven approval chains. Declarative JSON rules.
Blocking mode: halts document progression until approved.
Advisory mode: notifies but doesn't block.

Delegation resolution order:
1. Active delegation record for the approver
2. Original approver if no delegation
"""
import frappe
from frappe import _
from frappe.utils import now_datetime

OPS = ("==", "!=", ">", ">=", "<", "<=", "in", "not_in", "is_set", "is_not_set")


def evaluate(workflow_name, doc):
    """Start a workflow instance for a document. Returns instance name or None."""
    wf = frappe.get_doc("MES Workflow Definition", workflow_name)
    if not wf or not wf.steps:
        return None

    instance = frappe.get_doc({
        "doctype": "Workflow Instance",
        "workflow": workflow_name,
        "reference_doctype": doc.doctype,
        "reference_name": doc.name,
        "status": "Pending",
        "current_step": 1,
        "requester": frappe.session.user,
    })
    instance.insert(ignore_permissions=True)
    _advance_step(instance)
    return instance.name


def act(instance_name, action, comment=None):
    """Approve, reject, or review a workflow step."""
    instance = frappe.get_doc("Workflow Instance", instance_name)
    if instance.status != "Pending":
        frappe.throw(_("Workflow is already {0}").format(instance.status))

    wf = frappe.get_doc("MES Workflow Definition", instance.workflow)
    step_def = wf.steps[instance.current_step - 1] if instance.current_step <= len(wf.steps) else None
    if not step_def:
        frappe.throw(_("Invalid workflow step"))

    # Record history
    instance.append("history", {
        "step": instance.current_step,
        "step_name": step_def.step_name,
        "action": action,
        "actor": frappe.session.user,
        "comment": comment,
        "timestamp": now_datetime(),
    })

    if action == "Rejected":
        instance.status = "Rejected"
        if wf.on_reject == "Cancel Document":
            _cancel_document(instance.reference_doctype, instance.reference_name)
        instance.save(ignore_permissions=True)
        return {"status": "Rejected"}

    if action in ("Approved", "Reviewed"):
        if instance.current_step >= len(wf.steps):
            instance.status = "Approved"
            instance.pending_with = None
        else:
            instance.current_step += 1
            _advance_step(instance)

    instance.save(ignore_permissions=True)
    return {"status": instance.status, "current_step": instance.current_step}


def _advance_step(instance):
    """Resolve approver for current step and set pending_with."""
    wf = frappe.get_doc("MES Workflow Definition", instance.workflow)
    if instance.current_step > len(wf.steps):
        instance.status = "Approved"
        instance.pending_with = None
        return

    step = wf.steps[instance.current_step - 1]
    approver = _resolve_approver(step)
    instance.pending_with = approver


def _resolve_approver(step):
    """Resolve the actual user who should act on this step."""
    approver_type = step.approver_type

    if approver_type == "Role":
        users = frappe.get_all("Has Role", filters={"role": step.approver_role, "parenttype": "User"},
                                fields=["parent"], limit=1)
        user = users[0].parent if users else None
    elif approver_type == "User":
        user = step.approver_user
    elif approver_type == "Supervisor of Requester":
        user = frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "reports_to")
        if user:
            user = frappe.db.get_value("Employee", user, "user_id")
    elif approver_type == "Field on Document":
        user = None  # Would need document context
    else:
        user = None

    # Check delegation
    if user:
        delegated = frappe.get_all(
            "Approver Delegation",
            filters={
                "delegate_from": user,
                "is_active": 1,
                "from_date": ["<=", frappe.utils.today()],
                "to_date": [">=", frappe.utils.today()],
            },
            fields=["delegate_to"],
            limit=1,
        )
        if delegated:
            user = delegated[0].delegate_to

    return user


def process_sla_escalations():
    """Hourly: escalate workflows past SLA."""
    overdue = frappe.get_all(
        "Workflow Instance",
        filters={"status": "Pending"},
        fields=["name", "workflow", "current_step", "modified"],
    )
    for inst in overdue:
        wf = frappe.get_doc("MES Workflow Definition", inst.workflow)
        step = wf.steps[inst.current_step - 1] if inst.current_step <= len(wf.steps) else None
        if not step or not step.sla_hours:
            continue
        hours_elapsed = (now_datetime() - inst.modified).total_seconds() / 3600
        if hours_elapsed > step.sla_hours:
            # Notify escalation role
            if step.escalation_role:
                _notify_role(step.escalation_role, inst)


def _notify_role(role, instance):
    """Send notification to users with given role."""
    users = frappe.get_all("Has Role", filters={"role": role, "parenttype": "User"}, fields=["parent"])
    for u in users:
        frappe.msgprint(
            _("Workflow escalation: {0} step {1} overdue").format(instance.name, instance.current_step),
            user=u.parent,
        )


def _cancel_document(doctype, name):
    """Cancel the referenced document."""
    doc = frappe.get_doc(doctype, name)
    if hasattr(doc, "cancel"):
        doc.cancel()
