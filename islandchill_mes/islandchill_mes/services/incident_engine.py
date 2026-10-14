"""Line incident management + escalation.

SLA timers, wastage capture, Pareto feed.
"""
import frappe
from frappe.utils import now_datetime, time_diff_in_seconds


def raise_incident(filling_line, incident_type, severity, description,
                   work_order=None, equipment=None, photo=None, user=None):
    """Raise a new line incident."""
    doc = frappe.get_doc({
        "doctype": "Line Incident",
        "filling_line": filling_line,
        "work_order": work_order,
        "equipment": equipment,
        "incident_type": incident_type,
        "severity": severity,
        "status": "Raised",
        "raised_by": user or frappe.session.user,
        "raised_time": now_datetime(),
        "description": description,
    })
    if photo:
        doc.photo = photo
    doc.insert(ignore_permissions=True)

    # Update machine status if equipment linked
    if equipment:
        _set_machine_down(equipment, filling_line, work_order, doc.name)

    return doc.name


def acknowledge(incident_name, user=None):
    """Acknowledge an incident."""
    doc = frappe.get_doc("Line Incident", incident_name)
    if doc.status != "Raised":
        frappe.throw("Incident already acknowledged or resolved")
    doc.status = "Acknowledged"
    doc.acknowledged_by = user or frappe.session.user
    doc.acknowledged_time = now_datetime()
    doc.save(ignore_permissions=True)
    return doc.name


def resolve(incident_name, corrective_actions=None, root_cause=None,
            wastage_qty=0, wastage_uom=None, wastage_reason=None, user=None):
    """Resolve an incident."""
    doc = frappe.get_doc("Line Incident", incident_name)
    if doc.status in ("Resolved", "Closed"):
        frappe.throw("Incident already resolved")

    # Calculate downtime
    if doc.acknowledged_time:
        downtime = time_diff_in_seconds(now_datetime(), doc.acknowledged_time) / 60
    else:
        downtime = time_diff_in_seconds(now_datetime(), doc.raised_time) / 60
    doc.downtime_minutes = int(downtime)

    doc.status = "Resolved"
    doc.resolved_by = user or frappe.session.user
    doc.resolved_time = now_datetime()
    doc.root_cause = root_cause

    if wastage_qty:
        doc.wastage_qty = wastage_qty
        doc.wastage_uom = wastage_uom
        doc.wastage_reason = wastage_reason

    if corrective_actions:
        for action in corrective_actions:
            doc.append("corrective_actions", {
                "action": action,
                "taken_by": user or frappe.session.user,
                "taken_time": now_datetime(),
            })

    doc.save(ignore_permissions=True)

    # Restore machine status
    if doc.equipment:
        _set_machine_idle(doc.equipment, doc.filling_line)

    return doc.name


def escalate_unacknowledged():
    """Hourly: escalate incidents past SLA."""
    sla = {
        "Critical": 5,   # minutes
        "High": 15,
        "Medium": 30,
        "Low": 60,
    }

    for severity, minutes in sla.items():
        cutoff = frappe.utils.add_to_date(now_datetime(), minutes=-minutes)
        incidents = frappe.get_all(
            "Line Incident",
            filters={
                "severity": severity,
                "status": "Raised",
                "raised_time": ["<=", cutoff],
            },
            fields=["name", "filling_line", "raised_time"],
        )
        for inc in incidents:
            # Notify supervisor
            pass  # TODO: notification


def _set_machine_down(equipment, filling_line, work_order, incident):
    """Set machine status to Down."""
    frappe.get_doc({
        "doctype": "Machine Status Log",
        "equipment": equipment,
        "filling_line": filling_line,
        "status": "Down",
        "work_order": work_order,
        "incident": incident,
        "from_time": now_datetime(),
        "reported_by": frappe.session.user,
    }).insert(ignore_permissions=True)


def _set_machine_idle(equipment, filling_line):
    """Set machine status to Idle."""
    # Close the open Down record
    open_down = frappe.get_all(
        "Machine Status Log",
        filters={"equipment": equipment, "status": "Down", "to_time": ["is", "not set"]},
        limit=1,
    )
    if open_down:
        doc = frappe.get_doc("Machine Status Log", open_down[0].name)
        doc.to_time = now_datetime()
        doc.save(ignore_permissions=True)

    # Create new Idle record
    frappe.get_doc({
        "doctype": "Machine Status Log",
        "equipment": equipment,
        "filling_line": filling_line,
        "status": "Idle",
        "from_time": now_datetime(),
        "reported_by": frappe.session.user,
    }).insert(ignore_permissions=True)
