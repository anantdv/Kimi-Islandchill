"""State engine — single source of truth for operational state.

All operational events (WO state change, job card, stock entry, incident,
QC, machine status) are normalized into Line State rows.

Dashboard, digital twin, and flow map are read-only renderers of this state.
"""
import frappe
from frappe.utils import now_datetime


def publish(event_type, payload):
    """Append an event to the state log and refresh derived views."""
    doc = frappe.get_doc({
        "doctype": "MES State Event",
        "event_type": event_type,
        "payload": frappe.as_json(payload),
        "timestamp": now_datetime(),
        "source": payload.get("source", "Manual"),
    })
    doc.insert(ignore_permissions=True)
    _refresh_derived_views(payload)
    return doc.name


def get_line_state(filling_line=None):
    """Return current state for a filling line or all lines."""
    filters = {}
    if filling_line:
        filters["filling_line"] = filling_line

    # Get latest WO per line
    latest_wos = frappe.db.sql("""
        SELECT filling_line, name, status, production_item, qty, produced_qty,
               process_loss_qty, planned_start_date, actual_start_date
        FROM `tabWork Order`
        WHERE docstatus = 1 AND filling_line IS NOT NULL
        ORDER BY modified DESC
    """, as_dict=True)

    lines = {}
    for wo in latest_wos:
        fl = wo.filling_line
        if fl not in lines:
            lines[fl] = {
                "filling_line": fl,
                "active_work_order": None,
                "status": "Idle",
                "product": None,
                "progress_pct": 0,
                "job_cards": [],
                "checklists": {"pending": 0, "completed": 0},
                "incidents": {"open": 0, "acknowledged": 0},
                "qc_due": 0,
                "machine_status": {},
            }
        if not lines[fl]["active_work_order"]:
            lines[fl]["active_work_order"] = wo.name
            lines[fl]["status"] = wo.status
            lines[fl]["product"] = wo.production_item
            lines[fl]["progress_pct"] = round(
                (flt(wo.produced_qty) / flt(wo.qty)) * 100, 1
            ) if flt(wo.qty) else 0

    # Enrich with incidents
    open_incidents = frappe.get_all(
        "Line Incident",
        filters={"status": ["in", ["Raised", "Acknowledged", "In Progress"]]},
        fields=["filling_line", "status"],
    )
    for inc in open_incidents:
        fl = inc.filling_line
        if fl in lines:
            if inc.status == "Raised":
                lines[fl]["incidents"]["open"] += 1
            else:
                lines[fl]["incidents"]["acknowledged"] += 1

    # Enrich with QC due count
    qc_due = frappe.get_all(
        "Sampling Due",
        filters={"status": "Pending"},
        fields=["filling_line", "count(name) as cnt"],
        group_by="filling_line",
    )
    for row in qc_due:
        fl = row.filling_line
        if fl in lines:
            lines[fl]["qc_due"] = row.cnt

    return list(lines.values()) if not filling_line else lines.get(filling_line, {})


def _refresh_derived_views(payload):
    """Trigger updates to materialized views (twin, dashboard, flow map)."""
    # TODO: websocket push for live dashboard updates
    pass


def flt(v):
    from frappe.utils import flt as _flt
    return _flt(v)
