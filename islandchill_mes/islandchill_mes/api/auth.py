"""Auth + bootstrap API."""
import frappe
from frappe import _


@frappe.whitelist()
def on_session_creation():
    """Hook called on new Frappe session — can preload MES data."""
    pass


@frappe.whitelist()
def bootstrap():
    """Single-call bootstrap after login (spec Section 14.9).
    
    Returns: settings, filling_lines, warehouse_zones, product_families,
    equipment_summary, counter_check_items, user_roles.
    """
    user = frappe.session.user
    roles = frappe.get_roles(user)

    settings = frappe.get_doc("MES Settings", "MES Settings")
    settings_dict = {
        "gate_mode": settings.gate_mode,
        "default_gate_blocking": settings.default_gate_blocking,
        "allow_future_work_orders": settings.allow_future_work_orders,
    }

    lines = frappe.get_all(
        "Filling Line",
        filters={"is_active": 1},
        fields=["name", "line_name", "line_code", "product_type", "sort_order"],
        order_by="sort_order",
    )

    zones = frappe.get_all(
        "MES Warehouse Zone",
        fields=["name", "zone_code", "zone_type", "warehouse"],
    )

    families = frappe.get_all(
        "Product Family",
        filters={"is_active": 1},
        fields=["name", "family_name", "description", "image", "route"],
    )
    for fam in families:
        fam["variants"] = frappe.get_all(
            "Family Variant",
            filters={"parent": fam.name},
            fields=["variant_label", "item", "image", "pack_config"],
        )

    equipment = frappe.get_all(
        "Equipment List",
        filters={"show_on_app": 1},
        fields=["name", "equipments", "machine_class", "filling_line_1", "filling_line_2", "twin_node_id"],
    )

    counter_items = frappe.get_all(
        "Counter Check Item",
        fields=["name", "item", "check_category", "tolerance_pct", "photo_required_on"],
    )

    return {
        "ok": True,
        "user": user,
        "roles": roles,
        "settings": settings_dict,
        "filling_lines": lines,
        "warehouse_zones": zones,
        "product_families": families,
        "equipment": equipment,
        "counter_check_items": counter_items,
    }
