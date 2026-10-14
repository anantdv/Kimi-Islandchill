# Island Chill MES

Manufacturing Execution System for Island Chill Beverages — custom Frappe app on ERPNext v16 stable.

## Architecture

- **Backend**: Frappe custom app with 45 DocTypes, service engines, REST API layer
- **Frontend**: React 19 PWA embedded via Frappe www routes at `/islandchill`
- **State**: TanStack Query for server state, Zustand for UI state
- **Communication**: Idempotent REST API with `client_request_id` deduplication

## Key Features

- Product Family with pack-shot image cards
- Work Order wizard (4 steps: Product → BOM → Line → Review)
- Gate engine (Permissive/Enforcing modes, config-only)
- Dynamic workflow engine (condition-driven approval chains)
- QC sampling with auto-escalation
- Line incidents with SLA tracking and wastage capture
- Warehouse zones, put-away engine, container verification
- Gate entry/pass management
- Machine status logging and digital twin ready

## Install

```bash
bench get-app /path/to/islandchill_mes
bench --site <site> install-app islandchill_mes
bench --site <site> migrate
```

## Development

```bash
cd frontend
npm install
npm run dev        # Vite dev server with proxy to Frappe
npm run build      # Build to islandchill_mes/public/frontend
```

## DocTypes (45)

Configuration: MES Settings, Filling Line, Equipment List, Product Family, Process Route
Operations: Maintenance Checklist, Gate Violation Log, Line Incident, Machine Status Log
QC: QC Sampling Plan, Sampling Due
Warehouse: MES Warehouse Zone, Container, Container Verification, Storage Condition Log
Logistics: Gate Entry, Gate Pass, Receipt Checklist, Dispatch Loading, Label Template
Workflow: MES Workflow Definition, Workflow Instance, Approver Delegation
Performance: Performance Event, Operator Performance Log
Supporting: Family Variant, Route Stage, Checklist Item, Checklist Response, etc.

## API Endpoints

- `islandchill_mes.api.auth.bootstrap` — Post-login config
- `islandchill_mes.api.work_order.create/launch/get_state/finish`
- `islandchill_mes.api.checklist.get_templates/submit`
- `islandchill_mes.api.incident.raise_incident/acknowledge/resolve/list_open`
- `islandchill_mes.api.qc.get_due/fulfill`
- `islandchill_mes.api.warehouse.suggest_putaway/confirm_putaway/record_storage_reading/get_container_state/verify_container`
- `islandchill_mes.api.gate.create_entry/exit_entry/create_pass`

## License

GPL-3.0
