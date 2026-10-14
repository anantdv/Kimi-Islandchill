"""Work Order event handlers."""
import frappe
from islandchill_mes.services.state_engine import publish as state_publish


def on_update(doc, method=None):
    """On WO update: refresh state engine."""
    state_publish("work_order_updated", {
        "work_order": doc.name,
        "status": doc.status,
        "filling_line": doc.filling_line,
        "produced_qty": doc.produced_qty,
    })


def on_submit(doc, method=None):
    """On WO submit."""
    state_publish("work_order_submitted", {
        "work_order": doc.name,
        "filling_line": doc.filling_line,
    })
