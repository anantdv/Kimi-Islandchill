app_name = "islandchill_mes"
app_title = "Island Chill MES"
app_publisher = "Island Chill"
app_description = "Manufacturing Execution System for Island Chill Beverages"
app_email = "dev@islandchill.com.fj"
app_license = "GPL-3.0"
app_version = "0.1.0"

# ------------------------------------------------------------------
# DocType Class Overrides (ported from fork patches)
# ------------------------------------------------------------------
override_doctype_class = {
    "Work Order": "islandchill_mes.overrides.work_order.CustomWorkOrder",
}

# ------------------------------------------------------------------
# Scheduled Jobs
# ------------------------------------------------------------------
scheduler_events = {
    "cron": {
        "*/5 * * * *": [
            "islandchill_mes.services.sampling_engine.generate_due_samples",
            "islandchill_mes.services.sampling_engine.escalate_overdue",
        ],
        "0 */4 * * *": [
            "islandchill_mes.services.storage_engine.generate_reading_prompts",
        ],
        "0 * * * *": [
            "islandchill_mes.services.incident_engine.escalate_unacknowledged",
        ],
    },
    "daily": [
        "islandchill_mes.services.performance_engine.aggregate_daily",
    ],
    "hourly": [
        "islandchill_mes.services.workflow_engine.process_sla_escalations",
    ],
}

# ------------------------------------------------------------------
# Document Events
# ------------------------------------------------------------------
doc_events = {
    "Stock Entry": {
        "on_submit": "islandchill_mes.events.stock_entry.on_submit",
        "on_cancel": "islandchill_mes.events.stock_entry.on_cancel",
    },
    "Job Card": {
        "on_update": "islandchill_mes.events.job_card.on_update",
    },
    "Work Order": {
        "on_update": "islandchill_mes.events.work_order.on_update",
        "on_submit": "islandchill_mes.events.work_order.on_submit",
    },
    "Purchase Receipt": {
        "on_submit": "islandchill_mes.events.purchase_receipt.on_submit",
    },
    "Delivery Note": {
        "on_submit": "islandchill_mes.events.delivery_note.on_submit",
    },
}

# ------------------------------------------------------------------
# Website Routes (React PWA embedded)
# ------------------------------------------------------------------
website_route_rules = [
    {"from_route": "/islandchill/<path:app_path>", "to_route": "islandchill"},
]

# ------------------------------------------------------------------
# Fixtures exported on migrate
# ------------------------------------------------------------------
fixtures = [
    {"dt": "Role", "filters": [["name", "like", "MES %"]]},
    {"dt": "Custom Field", "filters": [["dt", "in", ["Work Order", "Stock Entry", "Job Card"]]]},
    {"dt": "MES Settings"},
    {"dt": "Filling Line"},
    {"dt": "Product Family"},
    {"dt": "Process Route"},
    {"dt": "MES Warehouse Zone"},
    {"dt": "MES Put Away Rule"},
    {"dt": "Counter Check Item"},
    {"dt": "Label Template"},
    {"dt": "QC Sampling Plan"},
    {"dt": "MES Form Registration"},
    {"dt": "MES Workflow Definition"},
]

# ------------------------------------------------------------------
# Assets
# ------------------------------------------------------------------
app_include_css = "/assets/islandchill_mes/css/mes.css"
app_include_js = "/assets/islandchill_mes/js/mes.js"

# ------------------------------------------------------------------
# Boot session data
# ------------------------------------------------------------------
on_session_creation = "islandchill_mes.api.auth.on_session_creation"
