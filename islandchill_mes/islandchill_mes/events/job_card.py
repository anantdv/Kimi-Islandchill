"""Job Card event handlers."""
import frappe
from islandchill_mes.services.performance_engine import log_event
from islandchill_mes.services.state_engine import publish as state_publish


def on_update(doc, method=None):
    """On job card update: log performance events."""
    if doc.status == "Completed":
        log_event(
            event_type="job_card_completed",
            user=frappe.session.user,
            work_order=doc.work_order,
            job_card=doc.name,
            equipment=None,
            filling_line=frappe.db.get_value("Work Order", doc.work_order, "filling_line"),
            qty_good=doc.total_completed_qty,
        )

    state_publish("job_card_updated", {
        "job_card": doc.name,
        "work_order": doc.work_order,
        "status": doc.status,
        "operation": doc.operation,
    })
