"""Shared API helpers: idempotency, pagination, auth, validation."""
import functools
import frappe
from frappe import _


def idempotent(fn):
    """Decorator: reject duplicate writes with same client_request_id.
    
    Stores keys in a hidden DocType 'MES Idempotency Key' with 7-day TTL.
    """

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        key = kwargs.get("client_request_id") or frappe.form_dict.get("client_request_id")
        if key:
            if frappe.db.exists("MES Idempotency Key", {"key": key}):
                frappe.throw(_("Duplicate request: {0}").format(key), frappe.ValidationError)
            try:
                frappe.get_doc({
                    "doctype": "MES Idempotency Key",
                    "key": key,
                    "created_by": frappe.session.user,
                    "created_at": frappe.utils.now(),
                }).insert(ignore_permissions=True)
            except Exception:
                pass  # race: another request already inserted
        return fn(*args, **kwargs)

    return wrapper


def require_roles(*roles):
    """Decorator: ensure user has at least one of the required roles."""

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            user_roles = frappe.get_roles(frappe.session.user)
            if not any(r in user_roles for r in roles):
                frappe.throw(
                    _("Access denied: requires one of {0}").format(", ".join(roles)),
                    frappe.PermissionError,
                )
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def paginate(query, start=0, page_length=20):
    """Apply pagination to a frappe.qb or frappe.db query."""
    return query.limit(page_length).offset(start)


def get_mes_settings():
    """Cached singleton fetch for MES Settings."""
    if not frappe.db.exists("MES Settings", "MES Settings"):
        doc = frappe.new_doc("MES Settings")
        doc.name = "MES Settings"
        doc.gate_mode = "Permissive"
        doc.default_gate_blocking = 0
        doc.allow_future_work_orders = 0
        doc.performance_aggregation_hour = 23
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    return frappe.get_doc("MES Settings", "MES Settings")


def sanitize_for_json(obj):
    """Remove non-serializable values before JSON response."""
    import datetime
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(i) for i in obj]
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    if isinstance(obj, datetime.date):
        return obj.isoformat()
    return obj
