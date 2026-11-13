"""Purchase Receipt event handlers."""
import frappe


def on_submit(doc, method=None):
    """On receipt submit: create receipt checklist if not exists."""
    if not frappe.db.exists("Receipt Checklist", {"receipt": doc.name}):
        frappe.get_doc({
            "doctype": "Receipt Checklist",
            "receipt": doc.name,
            "checked_by": frappe.session.user,
        }).insert(ignore_permissions=True)
