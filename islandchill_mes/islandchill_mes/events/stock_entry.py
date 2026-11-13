"""Stock Entry event handlers."""
import frappe
from islandchill_mes.services.state_engine import publish as state_publish


def on_submit(doc, method=None):
    """On stock entry submit: trigger container verification for controlled items."""
    if doc.purpose == "Material Transfer for Manufacture":
        # Check for counter-check items
        for item in doc.items:
            counter = frappe.get_all(
                "Counter Check Item",
                filters={"item": item.item_code},
                fields=["name", "photo_required_on"],
                limit=1,
            )
            if counter:
                # Create container verification task
                pass  # UI will prompt operator

    state_publish("stock_entry_submitted", {
        "stock_entry": doc.name,
        "purpose": doc.purpose,
        "work_order": doc.work_order,
    })


def on_cancel(doc, method=None):
    """On stock entry cancel."""
    state_publish("stock_entry_cancelled", {
        "stock_entry": doc.name,
        "work_order": doc.work_order,
    })
