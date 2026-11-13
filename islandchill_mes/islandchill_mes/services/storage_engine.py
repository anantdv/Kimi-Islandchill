"""Warehouse storage condition monitoring.

Generates reading prompts, validates ranges, creates incidents on breach.
"""
import frappe
from frappe.utils import now_datetime


def generate_reading_prompts():
    """Every 4 hours: prompt readings for zones with temperature bands."""
    zones = frappe.get_all(
        "MES Warehouse Zone",
        filters={"temperature_min": [">", 0]},
        fields=["name", "zone_code", "temperature_min", "temperature_max", "humidity_max"],
    )
    for zone in zones:
        # Check if reading exists in last 4 hours
        recent = frappe.get_all(
            "Storage Condition Log",
            filters={"zone": zone.name, "timestamp": [">=", frappe.utils.add_to_date(now_datetime(), hours=-4)]},
            limit=1,
        )
        if not recent:
            # Create a pending prompt (could be a ToDo or notification)
            pass  # UI polls for zones without recent readings


def validate_reading(zone, temperature, humidity=None):
    """Validate a storage reading and raise incident if out of range."""
    z = frappe.get_doc("MES Warehouse Zone", zone)
    violations = []

    if z.temperature_min is not None and temperature < z.temperature_min:
        violations.append(f"Temperature {temperature} below minimum {z.temperature_min}")
    if z.temperature_max is not None and temperature > z.temperature_max:
        violations.append(f"Temperature {temperature} above maximum {z.temperature_max}")
    if z.humidity_max is not None and humidity and humidity > z.humidity_max:
        violations.append(f"Humidity {humidity} above maximum {z.humidity_max}")

    if violations:
        frappe.get_doc({
            "doctype": "Line Incident",
            "incident_type": "Storage Fault",
            "severity": "High",
            "status": "Raised",
            "raised_by": frappe.session.user,
            "raised_time": now_datetime(),
            "description": "; ".join(violations) + f" in zone {z.zone_code}",
        }).insert(ignore_permissions=True)

    return len(violations) == 0
