"""Warehouse & logistics APIs (spec Section 14.7)."""
import frappe
from frappe import _
from frappe.utils import flt

from islandchill_mes.api.util import idempotent
from islandchill_mes.services.putaway_engine import suggest_putaway, confirm_putaway
from islandchill_mes.services.storage_engine import validate_reading


@frappe.whitelist()
def suggest_putaway(item, qty, uom, batch_no=None):
    """Get put-away suggestions for incoming stock."""
    suggestions = suggest_putaway(item, flt(qty), uom, batch_no)
    return {"suggestions": suggestions}


@frappe.whitelist(methods=["POST"])
@idempotent
def confirm_putaway(container, zone, bin=None, reason_override=None,
                    client_request_id=None):
    """Confirm put-away with optional override."""
    name = confirm_putaway(container, zone, bin, reason_override)
    return {"container": name, "zone": zone, "bin": bin}


@frappe.whitelist(methods=["POST"])
@idempotent
def record_storage_reading(zone, temperature, humidity=None, device_id=None,
                           client_request_id=None):
    """Record a storage condition reading."""
    valid = validate_reading(zone, flt(temperature), flt(humidity) if humidity else None)
    doc = frappe.get_doc({
        "doctype": "Storage Condition Log",
        "zone": zone,
        "temperature": flt(temperature),
        "humidity": flt(humidity) if humidity else None,
        "source": "IoT" if device_id else "Manual",
        "device_id": device_id,
        "recorded_by": frappe.session.user,
        "timestamp": frappe.utils.now_datetime(),
    })
    doc.insert(ignore_permissions=True)
    return {"reading": doc.name, "valid": valid}


@frappe.whitelist()
def get_container_state(container_no):
    """Get current state of a container."""
    containers = frappe.get_all(
        "Container",
        filters={"container_no": container_no},
        fields=["name", "container_no", "item", "current_qty", "status", "zone", "bin"],
    )
    if not containers:
        return {"container": None}
    return {"container": containers[0]}


@frappe.whitelist(methods=["POST"])
@idempotent
def verify_container(container, expected_qty, marker_reading, photo,
                       trigger_type="BOM Release", work_order=None,
                       client_request_id=None):
    """Verify container quantity against marker reading."""
    cont = frappe.get_doc("Container", container)
    expected = flt(expected_qty)
    actual = flt(marker_reading)
    variance = actual - expected
    variance_pct = (variance / expected * 100) if expected else 0

    # Check tolerance
    counter_item = frappe.get_all(
        "Counter Check Item",
        filters={"item": cont.item},
        fields=["tolerance_pct", "blocks_next_release"],
        limit=1,
    )
    tolerance = counter_item[0].tolerance_pct if counter_item else 2
    within = abs(variance_pct) <= tolerance

    doc = frappe.get_doc({
        "doctype": "Container Verification",
        "container": container,
        "trigger_type": trigger_type,
        "work_order": work_order,
        "expected_qty": expected,
        "marker_reading": str(marker_reading),
        "photo": photo,
        "variance_qty": variance,
        "variance_pct": variance_pct,
        "within_tolerance": within,
        "resolution": "OK" if within else "Incident Raised",
    })
    doc.insert(ignore_permissions=True)

    if not within and counter_item and counter_item[0].blocks_next_release:
        # Block next release
        from islandchill_mes.services.incident_engine import raise_incident
        raise_incident(
            filling_line=None,
            incident_type="Material Shortage",
            severity="High",
            description=f"Container {cont.container_no} variance {variance_pct:.1f}% exceeds tolerance {tolerance}%",
        )

    return {
        "verification": doc.name,
        "within_tolerance": within,
        "variance_pct": variance_pct,
    }
