"""Delivery Note event handlers."""
import frappe


def on_submit(doc, method=None):
    """On dispatch submit: create dispatch loading record."""
    pass  # Optional: auto-create Dispatch Loading
