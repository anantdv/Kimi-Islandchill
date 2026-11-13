"""Incident APIs (spec Section 14.5)."""
import frappe
from frappe import _

from islandchill_mes.api.util import idempotent
from islandchill_mes.services.incident_engine import (
    raise_incident as _raise,
    acknowledge as _ack,
    resolve as _resolve,
)


@frappe.whitelist(methods=["POST"])
@idempotent
def raise_incident(filling_line, incident_type, severity, description,
                   work_order=None, equipment=None, photo=None,
                   client_request_id=None):
    """Raise a line incident."""
    name = _raise(
        filling_line=filling_line,
        incident_type=incident_type,
        severity=severity,
        description=description,
        work_order=work_order,
        equipment=equipment,
        photo=photo,
    )
    return {"incident": name, "status": "Raised"}


@frappe.whitelist(methods=["POST"])
def acknowledge(incident_name):
    """Acknowledge an incident."""
    _ack(incident_name)
    return {"incident": incident_name, "status": "Acknowledged"}


@frappe.whitelist(methods=["POST"])
def resolve(incident_name, corrective_actions=None, root_cause=None,
            wastage_qty=0, wastage_uom=None, wastage_reason=None):
    """Resolve an incident."""
    _resolve(
        incident_name=incident_name,
        corrective_actions=corrective_actions or [],
        root_cause=root_cause,
        wastage_qty=wastage_qty,
        wastage_uom=wastage_uom,
        wastage_reason=wastage_reason,
    )
    return {"incident": incident_name, "status": "Resolved"}


@frappe.whitelist()
def list_open(filling_line=None):
    """List open incidents."""
    filters = {"status": ["in", ["Raised", "Acknowledged", "In Progress"]]}
    if filling_line:
        filters["filling_line"] = filling_line
    incidents = frappe.get_all(
        "Line Incident",
        filters=filters,
        fields=["name", "filling_line", "incident_type", "severity", "status",
                "raised_time", "description", "work_order"],
        order_by="raised_time desc",
    )
    return {"incidents": incidents}
