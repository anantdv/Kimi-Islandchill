"""Gate management APIs (spec Section 14.8)."""
import frappe
from frappe import _

from islandchill_mes.api.util import idempotent


@frappe.whitelist(methods=["POST"])
@idempotent
def create_entry(direction, movement_type, vehicle_no, driver_name=None,
                 transporter=None, linked_doctype=None, linked_name=None,
                 photo=None, client_request_id=None):
    """Create a gate entry."""
    doc = frappe.get_doc({
        "doctype": "Gate Entry",
        "direction": direction,
        "movement_type": movement_type,
        "vehicle_no": vehicle_no,
        "driver_name": driver_name,
        "transporter": transporter,
        "linked_doctype": linked_doctype,
        "linked_name": linked_name,
        "photo": photo,
        "entry_time": frappe.utils.now_datetime(),
        "gate_officer": frappe.session.user,
    })
    doc.insert(ignore_permissions=True)
    return {"gate_entry": doc.name}


@frappe.whitelist(methods=["POST"])
def exit_entry(gate_entry, documents_verified=False):
    """Mark gate exit."""
    doc = frappe.get_doc("Gate Entry", gate_entry)
    doc.exit_time = frappe.utils.now_datetime()
    doc.documents_verified = documents_verified
    doc.save(ignore_permissions=True)
    return {"gate_entry": doc.name, "status": "Exited"}


@frappe.whitelist(methods=["POST"])
@idempotent
def create_pass(gate_entry, valid_until, returnables=None,
                client_request_id=None):
    """Create a gate pass."""
    doc = frappe.get_doc({
        "doctype": "Gate Pass",
        "gate_entry": gate_entry,
        "authorized_by": frappe.session.user,
        "valid_until": valid_until,
        "returnables": frappe.as_json(returnables or []),
    })
    doc.insert(ignore_permissions=True)
    return {"gate_pass": doc.name}
