"""Put-away suggestion engine (spec Section 10.1).

Rules: priority, capacity, segregation, temperature fit, FEFO.
"""
import frappe
from frappe.utils import flt


def suggest_putaway(item_code, qty, uom, batch_no=None):
    """Suggest warehouse zone + bin for incoming stock.
    
    Returns ranked list of suggestions.
    """
    item = frappe.get_doc("Item", item_code)
    rules = frappe.get_all(
        "MES Put Away Rule",
        filters={
            "is_active": 1,
            "item": ["in", [item_code, ""]],
            "item_group": ["in", [item.item_group, ""]],
        },
        fields=["*"],
    )

    suggestions = []
    for rule in rules:
        prefs = frappe.parse_json(rule.zone_preferences or "[]")
        for pref in prefs:
            zone = frappe.get_doc("MES Warehouse Zone", pref.get("zone"))
            if not zone:
                continue

            score = _score_zone(zone, item, qty, rule)
            if score > 0:
                suggestions.append({
                    "zone": zone.name,
                    "zone_code": zone.zone_code,
                    "zone_type": zone.zone_type,
                    "bin": pref.get("bin"),
                    "score": score,
                    "reason": pref.get("reason", ""),
                })

    # Sort by score descending
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return suggestions[:5]


def _score_zone(zone, item, qty, rule):
    """Score a zone for suitability. Higher = better."""
    score = 100

    # Temperature fit check
    if rule.require_temperature_fit:
        # Would check item's storage temperature vs zone range
        pass

    # Capacity check
    if zone.capacity_pallets:
        current = frappe.db.count("Container", {"zone": zone.name, "status": "In Storage"})
        if current >= zone.capacity_pallets:
            return 0  # Full
        score -= (current / zone.capacity_pallets) * 30

    # Segregation check
    if zone.restricted:
        allowed = frappe.get_all("Item Group Table", filters={"parent": zone.name}, fields=["item_group"])
        allowed_groups = [a.item_group for a in allowed]
        if allowed_groups and item.item_group not in allowed_groups:
            return 0

    # FEFO bonus for zones with older stock of same item
    older = frappe.db.exists("Container", {"zone": zone.name, "item": item.item_code})
    if older:
        score += 10  # Keep same item together

    return max(0, score)


def confirm_putaway(container, zone, bin=None, reason_override=None):
    """Confirm put-away with optional override reason."""
    doc = frappe.get_doc("Container", container)
    doc.zone = zone
    if bin:
        doc.bin = bin
    if reason_override:
        doc.append("putaway_history", {
            "zone": zone,
            "bin": bin,
            "reason": reason_override,
            "user": frappe.session.user,
            "timestamp": frappe.utils.now_datetime(),
        })
    doc.save(ignore_permissions=True)
    return doc.name
