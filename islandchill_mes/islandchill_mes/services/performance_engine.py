"""Performance event capture + nightly aggregation.

Every operational action emits a Performance Event.
Daily job rolls these into Operator Performance Log rows.
"""
import frappe
from frappe.utils import today, flt


def log_event(event_type, user, work_order=None, job_card=None, equipment=None,
              filling_line=None, qty_good=0, qty_extra=0, qty_loss=0):
    """Emit a performance event."""
    frappe.get_doc({
        "doctype": "Performance Event",
        "event_type": event_type,
        "user": user,
        "work_order": work_order,
        "job_card": job_card,
        "equipment": equipment,
        "filling_line": filling_line,
        "qty_good": flt(qty_good),
        "qty_extra": flt(qty_extra),
        "qty_loss": flt(qty_loss),
        "timestamp": frappe.utils.now_datetime(),
    }).insert(ignore_permissions=True)


def aggregate_daily():
    """Daily: roll Performance Events into Operator Performance Log."""
    log_date = today()

    # Get all users with events today
    users = frappe.db.sql("""
        SELECT DISTINCT user FROM `tabPerformance Event`
        WHERE DATE(timestamp) = %s
    """, (log_date,), as_dict=True)

    for row in users:
        user = row.user
        _aggregate_user(user, log_date)


def _aggregate_user(user, log_date):
    """Aggregate one user's events for the day."""
    events = frappe.get_all(
        "Performance Event",
        filters={"user": user, "date": ["=", log_date]},
        fields=["filling_line", "qty_good", "qty_extra", "qty_loss", "event_type"],
    )

    lines = {}
    for ev in events:
        fl = ev.filling_line or "ALL"
        if fl not in lines:
            lines[fl] = {
                "units_good": 0, "units_extra": 0, "units_loss": 0,
                "machine_hours": 0, "checklist_count": 0, "qc_count": 0,
            }
        lines[fl]["units_good"] += flt(ev.qty_good)
        lines[fl]["units_extra"] += flt(ev.qty_extra)
        lines[fl]["units_loss"] += flt(ev.qty_loss)

    for fl, vals in lines.items():
        total = vals["units_good"] + vals["units_extra"] + vals["units_loss"]
        good_ratio = round(vals["units_good"] / total, 4) if total else 0
        loss_rate = round(vals["units_loss"] / total, 4) if total else 0

        # Upsert performance log
        existing = frappe.get_all(
            "Operator Performance Log",
            filters={"user": user, "log_date": log_date, "filling_line": fl},
            limit=1,
        )
        if existing:
            doc = frappe.get_doc("Operator Performance Log", existing[0].name)
        else:
            doc = frappe.new_doc("Operator Performance Log")
            doc.user = user
            doc.log_date = log_date
            doc.filling_line = fl if fl != "ALL" else None

        doc.units_good = vals["units_good"]
        doc.units_extra = vals["units_extra"]
        doc.units_loss = vals["units_loss"]
        doc.good_qty_ratio = good_ratio
        doc.loss_rate = loss_rate
        doc.save(ignore_permissions=True)
