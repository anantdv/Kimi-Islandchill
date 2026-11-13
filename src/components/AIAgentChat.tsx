import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAIAgentStore, parseIntent } from "@/stores/aiAgentStore";
import { useAppStore } from "@/stores/appStore";
import { erpnextReportDefinitions } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Send, X, Sparkles, ChevronRight, Loader2,
  FileText, Factory, ClipboardCheck, CalendarDays, Route,
  BarChart3, AlertTriangle, Zap, Lightbulb,
} from "lucide-react";
import type { AgentCommand, WarehouseZone, ZoneItem } from "@/data/mockData";

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AIAgentChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, setOpen, addCommand, commands, getSuggestions, recordCommandPattern, runERPNextReport, queryERPNextDocType, erpnextConfig } = useAIAgentStore();
  const {
    workOrders, fillingLines, iotSensors, dssActiveRuns,
    user, incidents, maintenanceChecks, requisitions,
    kaizenSuggestions,
    cartonLabels, warehouseRacks, warehouseBins, warehouseZones, gatePasses,
    complianceCheckpoints, complianceSettings,
    waterQualityReadings, filterStatuses,
  } = useAppStore();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hour = new Date().getHours();
  const suggestions = getSuggestions(user?.role || "", hour);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commands, isTyping]);

  // Record page visits for learning
  useEffect(() => {
    const { recordPageVisit } = useAIAgentStore.getState();
    recordPageVisit(location.pathname);
  }, [location.pathname]);

  const executeCommand = async (rawText: string) => {
    setIsTyping(true);
    const { intent, params } = parseIntent(rawText);
    const cmdId = generateId("cmd");

    // Simulate AI processing delay
    await new Promise((r) => setTimeout(r, 600));

    let response = "";
    let success = true;

    switch (intent) {
      case "navigate": {
        const pathMap: Record<string, string> = {
          dashboard: "/", home: "/", "production floor": "/",
          "work orders": "/workorders", wo: "/workorders", "all work orders": "/workorders",
          "new work order": "/workorders/new", "direct work order": "/workorders/new", "create work order": "/workorders/new",
          incidents: "/incidents", warehouse: "/warehouse",
          "raw materials": "/warehouse/raw-materials", "raw material": "/warehouse/raw-materials",
          "finished goods": "/warehouse/finished-goods", "finished good": "/warehouse/finished-goods",

          "flow map": "/flowmap", "digital twin": "/twin", twin: "/twin",
          maintenance: "/maint-schedule", "maint schedule": "/maint-schedule",
          requisitions: "/requisitions", "bom requisitions": "/requisitions",
          "purchase orders": "/purchase-orders", po: "/purchase-orders",
          dss: "/dss", "dss board": "/dss", "flow builder": "/dss/builder",
          "carton labels": "/carton-labels", labels: "/carton-labels",
          racks: "/warehouse", bins: "/warehouse",
          "gate pass": "/gate-pass", gatepass: "/gate-pass", dispatch: "/gate-pass",
          quality: "/quality", "quality compliance": "/quality", "quality and compliance": "/quality",
          guidelines: "/quality", compliance: "/quality", "food safety": "/quality",
          "water quality": "/quality", filtration: "/quality", "water filter": "/quality",
          qc: "/quality", "quality control": "/quality",
          kaizen: "/kaizen", "kaizen board": "/kaizen",
          admin: "/admin", users: "/admin/users", reports: "/admin",
          boms: "/admin/boms", products: "/admin/products",
          mobile: "/mobile", guide: "/guide",
        };
        const target = Object.entries(pathMap).find(([k]) => rawText.toLowerCase().includes(k))?.[1];
        if (target) {
          navigate(target);
          response = `Opening ${Object.entries(pathMap).find(([, v]) => v === target)?.[0]}...`;
        } else {
          response = "I couldn't find that page. Try saying 'go to dashboard' or 'open work orders'.";
          success = false;
        }
        break;
      }

      case "create_wo": {
        const product = params.product || "Crush Cola";
        const size = params.packSize || "2.5L";
        response = `Initiating work order creation for ${product} ${size}. Taking you to the wizard...`;
        navigate("/workorders/new");
        break;
      }

      case "create_schedule": {
        response = "Opening maintenance schedule. You can add new checks from there.";
        navigate("/maint-schedule");
        break;
      }

      case "generate_report": {
        const activeWOs = workOrders.filter((w) => w.status === "in_process");
        const runningLines = fillingLines.filter((l) => l.status === "running");
        const pendingQC = workOrders.reduce((acc, w) => acc + w.qcChecks.filter((q) => q.status === "pending").length, 0);

        if (rawText.toLowerCase().includes("qc")) {
          response = `**QC Report Summary**\n\n- Pending QC checks: ${pendingQC}\n- Active work orders: ${activeWOs.length}\n- Running lines: ${runningLines.length} (${runningLines.map((l) => l.name).join(", ")})\n\nWould you like me to open the QC page for detailed checks?`;
        } else if (rawText.toLowerCase().includes("efficiency")) {
          const avgEff = fillingLines.reduce((acc, l) => acc + l.efficiency, 0) / fillingLines.filter((l) => l.efficiency > 0).length || 0;
          response = `**Efficiency Report**\n\n- Plant average OEE: ${avgEff.toFixed(1)}%\n- Lines running: ${runningLines.length}/${fillingLines.length}\n- Bottles/min total: ${runningLines.reduce((acc, l) => acc + l.speed, 0)}\n\nLine FL1 leads at ${fillingLines[0]?.efficiency}% OEE.`;
        } else {
          response = `**Production Report**\n\n- Active WOs: ${activeWOs.length}\n- Running lines: ${runningLines.length}\n- Open incidents: ${incidents.filter((i) => i.status === "open").length}\n- Pending maintenance: ${maintenanceChecks.filter((m) => m.status === "pending").length}\n- Approved requisitions: ${requisitions.filter((r) => r.status === "approved").length}\n\nI can export this as CSV if needed.`;
        }
        break;
      }

      case "query_status": {
        const running = fillingLines.filter((l) => l.status === "running");
        const idle = fillingLines.filter((l) => l.status === "idle");
        const down = fillingLines.filter((l) => l.status === "down");
        const alertCount = iotSensors.filter((s) => s.status !== "normal").length;
        const activeWOs = workOrders.filter((w) => w.status === "in_process");

        if (rawText.toLowerCase().includes("line") || rawText.toLowerCase().includes("running")) {
          response = `**Line Status**\n\n${running.map((l) => `✅ ${l.name}: ${l.speed} bpm, ${l.efficiency}% OEE`).join("\n")}\n${idle.length > 0 ? "\n⏸️ Idle: " + idle.map((l) => l.name).join(", ") : ""}\n${down.length > 0 ? "\n❌ Down: " + down.map((l) => l.name).join(", ") : ""}`;
        } else if (rawText.toLowerCase().includes("work order") || rawText.toLowerCase().includes("wo")) {
          response = `**Active Work Orders**\n\n${activeWOs.map((w) => `📋 ${w.name}: ${w.product} — ${w.progress}% on ${w.fillingLine}`).join("\n")}`;
        } else if (rawText.toLowerCase().includes("alert") || rawText.toLowerCase().includes("sensor")) {
          response = `**IoT Status**\n\n- Total sensors: ${iotSensors.length}\n- Active alerts: ${alertCount}\n${alertCount > 0 ? "\n⚠️ " + iotSensors.filter((s) => s.status !== "normal").slice(0, 3).map((s) => `${s.sensorName}: ${s.currentValue} ${s.unit}`).join("\n") : "\n✅ All sensors normal"}`;
        } else if (params.workOrder) {
          const wo = workOrders.find((w) => w.name.includes(params.workOrder as string) || w.id.includes(params.workOrder as string));
          if (wo) {
            response = `**WO Details: ${wo.name}**\n\n- Product: ${wo.product} ${wo.variant}\n- Status: ${wo.status}\n- Progress: ${wo.progress}%\n- Line: ${wo.fillingLine}\n- Quantity: ${wo.qty} ${wo.uom}\n- QC checks: ${wo.qcChecks.filter((q) => q.status === "passed").length}/${wo.qcChecks.length} done`;
          } else {
            response = `I couldn't find work order ${params.workOrder}.`;
            success = false;
          }
        } else {
          response = `**Production Floor Overview**\n\n🟢 Running: ${running.length} lines\n⏸️ Idle: ${idle.length} lines\n📋 Active WOs: ${activeWOs.length}\n⚠️ IoT Alerts: ${alertCount}\n🔧 Open Incidents: ${incidents.filter((i) => i.status === "open").length}`;
        }
        break;
      }

      case "start_dss_run": {
        if (dssActiveRuns.length > 0) {
          const run = dssActiveRuns[0];
          response = `DSS Board has ${dssActiveRuns.length} active run(s). Opening the board for ${run.name}...`;
        } else {
          response = "No active DSS runs. Let me take you to the Flow Builder to start one.";
        }
        navigate("/dss");
        break;
      }

      case "set_alert": {
        response = "Alert configured. I'll monitor the condition and notify you when triggered. (Mock — alerts run in simulation mode.)";
        break;
      }

      case "help": {
        response = `**Tinni — Commands I understand:**

**Navigation**
- "Go to dashboard" / "Open work orders" / "Show QC"

**Production**
- "Create work order for Crush Cola 2.5L"
- "What lines are running?"
- "Status of WO-2025-001"
- "Start DSS run"

**Reports**
- "Generate QC report"
- "Production report"
- "Efficiency report"

**ERPNext**
- "Get stock report from ERPNext"
- "ERPNext BOM report"
- "Query Work Order in ERPNext"
- "Sync with ERPNext"

**Scheduling**
- "Create maintenance schedule"
- "Show pending maintenance"

**Alerts**
- "Alert me when FL1 goes down"
- "Watch for high temperature"

I also learn from your behavior and suggest actions based on your role and time of day.`;
        break;
      }

      case "erpnext_report": {
        if (!erpnextConfig.enabled) {
          response = "ERPNext is not connected. Please configure it in Tinni Settings > ERPNext.";
          success = false;
          break;
        }
        const lower = rawText.toLowerCase();
        const reportAliases: Record<string, string> = {
          "stock": "rep-stock-balance",
          "production plan": "rep-production-plan",
          "production": "rep-production-plan",
          "bom": "rep-bom-explorer",
          "sales": "rep-sales-analytics",
          "purchase": "rep-purchase-order-tracker",
          "po tracker": "rep-purchase-order-tracker",
          "work order": "rep-work-order-status",
          "wo status": "rep-work-order-status",
        };
        const aliasHit = Object.entries(reportAliases).find(([kw]) => lower.includes(kw));
        const report = erpnextReportDefinitions.find((r) =>
          r.id === aliasHit?.[1] ||
          lower.includes(r.name.toLowerCase()) ||
          lower.includes(r.docType.toLowerCase())
        ) || erpnextReportDefinitions[0];

        const result = await runERPNextReport(report.id, {});
        if (result.success && result.data) {
          const data = result.data as any;
          response = `**${data.report}** (from ERPNext)\n\n`;
          if (data.rows) {
            response += data.rows.slice(0, 5).map((row: any) =>
              Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(" | ")
            ).join("\n");
            if (data.rows.length > 5) response += `\n...and ${data.rows.length - 5} more rows`;
          }
          if (data.total_value) response += `\n\nTotal Value: $${data.total_value.toLocaleString()}`;
          if (data.total_revenue) response += `\n\nTotal Revenue: $${data.total_revenue.toLocaleString()}`;
          if (data.total_cost) response += `\n\nTotal Cost: $${data.total_cost.toLocaleString()}`;
          response += `\n\nOpen the Tinni dashboard for full report export.`;
        } else {
          response = result.error || "Failed to fetch report from ERPNext.";
          success = false;
        }
        break;
      }

      case "erpnext_query": {
        if (!erpnextConfig.enabled) {
          response = "ERPNext is not connected. Please configure it in Tinni Settings > ERPNext.";
          success = false;
          break;
        }
        const lower = rawText.toLowerCase();
        const docTypeMatch = lower.match(/(?:work order|bom|item|stock ledger|purchase order|sales invoice)/i);
        const docType = docTypeMatch ? docTypeMatch[0].replace(/\s+/g, " ").trim() : "Item";
        const result = await queryERPNextDocType(docType);
        if (result.success && result.data) {
          const data = result.data as any;
          response = `**ERPNext ${data.doctype}**\n\nTotal records: ${data.count}\n`;
          if (data.items) {
            response += data.items.slice(0, 3).map((i: any) => `- ${i.name} (${i.item_group || ""})`).join("\n");
          }
          if (data.boms) {
            response += data.boms.slice(0, 3).map((b: any) => `- ${b.name} for ${b.item}`).join("\n");
          }
          if (data.work_orders) {
            response += data.work_orders.slice(0, 3).map((w: any) => `- ${w.name}: ${w.production_item} (${w.status})`).join("\n");
          }
        } else {
          response = result.error || "ERPNext query failed.";
          success = false;
        }
        break;
      }

      case "erpnext_sync": {
        if (!erpnextConfig.enabled) {
          response = "ERPNext is not connected. Please configure it in Tinni Settings > ERPNext.";
          success = false;
          break;
        }
        response = "Syncing with ERPNext...\n\n✅ Work Orders synced: 6\n✅ BOMs synced: 49\n✅ Stock balances synced\n✅ Production plans synced\n\nAll local data is now aligned with ERPNext.";
        break;
      }

      case "water-quality": {
        const latest = waterQualityReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        const fltDue = filterStatuses.filter((f) => f.status !== "good").length;
        response = `💧 **Water Filtration Quality**\n\n`;
        if (latest) {
          response += `Latest finished water reading (${new Date(latest.timestamp).toLocaleDateString()}):\n` +
            `• pH: ${latest.ph}\n` +
            `• Turbidity: ${latest.turbidityNtu} NTU\n` +
            `• TDS: ${latest.tdsPpm} ppm\n` +
            `• Conductivity: ${latest.conductivityUs} µS/cm\n` +
            `• Chlorine: ${latest.chlorineMgL} mg/L\n`;
          if (latest.microbialCfuMl !== undefined) response += `• Microbial: ${latest.microbialCfuMl} CFU/mL\n`;
        }
        response += `\nFilters requiring attention: ${fltDue}\n` +
          `Total readings logged: ${waterQualityReadings.length}\n\n` +
          `Open **Water Quality** from the sidebar to log readings, view trends, and manage filter change schedules.`;
        break;
      }

      case "raw-materials": {
        const rmZones = warehouseZones.filter((z: WarehouseZone) => z.category === "raw_material");
        const rmItems = rmZones.flatMap((z: WarehouseZone) => z.items);
        response = `📦 **Raw Materials Warehouse**\n\n` +
          rmZones.map((z: WarehouseZone) => `• ${z.name}: ${z.items.length} items, ${z.temp}°C`).join("\n") +
          `\n\nTotal RM stock: ${rmItems.reduce((a: number, it: ZoneItem) => a + it.qty, 0).toLocaleString()} units\n\n` +
          `Open **Raw Materials** from the Warehouse sidebar to view zones, racks, bins, and inventory.`;
        break;
      }

      case "finished-goods": {
        const fgZones = warehouseZones.filter((z: WarehouseZone) => z.category === "finished_good");
        const fgItems = fgZones.flatMap((z: WarehouseZone) => z.items);
        const alertZones = fgZones.filter((z: WarehouseZone) => z.items.some((it: ZoneItem) => z.temp < it.storageTemp.min || z.temp > it.storageTemp.max));
        response = `📦 **Finished Goods Warehouse**\n\n` +
          fgZones.map((z: WarehouseZone) => `• ${z.name}: ${z.items.length} items, ${z.temp}°C ${alertZones.some((az: WarehouseZone) => az.id === z.id) ? "⚠️ Temp Alert" : "✓ OK"}`).join("\n") +
          `\n\nTotal FG stock: ${fgItems.reduce((a: number, it: ZoneItem) => a + it.qty, 0).toLocaleString()} units\n\n` +
          `Open **Finished Goods** from the Warehouse sidebar to view zones, racks, bins, carton labels, and gate passes.`;
        break;
      }

      case "guidelines": {
        const relevant = complianceCheckpoints.filter((cp) => {
          if (cp.standard !== "general" && !complianceSettings.iso22000Enabled && !complianceSettings.iso9001Enabled) return false;
          return true;
        });
        const done = relevant.filter((cp) => cp.completed).length;
        response = `🛡️ **Compliance & Guidelines**\n\n` +
          `Active checkpoints: ${done}/${relevant.length} completed\n\n` +
          `**General (always active):** GMP, sanitation, pest control, water quality, allergen control, traceability, calibration, waste, foreign material, supplier approval\n\n` +
          `**ISO 22000:** ${complianceSettings.iso22000Enabled ? "Enabled" : "Disabled — toggle in Guidelines to activate HACCP, CCP monitoring, oPRPs, internal audits, and management review checkpoints"}\n` +
          `**ISO 9001:** ${complianceSettings.iso9001Enabled ? "Enabled" : "Disabled — toggle in Guidelines to activate QMS scope, quality objectives, risk management, and CAPA checkpoints"}\n\n` +
          `Open **Guidelines** from the sidebar to manage checkpoints and track readiness.`;
        break;
      }

      case "quality": {
        const allChecks = workOrders.flatMap((wo) => wo.qcChecks.map((qc) => ({ ...qc, woName: wo.name })));
        const pending = allChecks.filter((c) => c.status === "pending").length;
        const latest = waterQualityReadings[0];
        const waterParams = latest
          ? `pH ${latest.ph}, ${latest.turbidityNtu} NTU, ${latest.tdsPpm} ppm, ${latest.conductivityUs} µS/cm, ${latest.temperatureC}°C, ${latest.chlorineMgL} mg/L Cl`
          : "no readings yet";
        const filtersDue = filterStatuses.filter((f) => f.status !== "good").length;
        const visibleCp = complianceCheckpoints.filter((cp) => {
          if (cp.standard === "general") return true;
          if (cp.standard === "iso22000") return complianceSettings.iso22000Enabled;
          if (cp.standard === "iso9001") return complianceSettings.iso9001Enabled;
          return false;
        });
        const cpDone = visibleCp.filter((cp) => cp.completed).length;
        response = `🛡️ **Quality & Compliance — Unified Module**\n\n` +
          `**QC Checks:** ${pending} pending / ${allChecks.length} total\n\n` +
          `**Water Quality:** Latest — ${waterParams}\n` +
          `Filters due for change: ${filtersDue}/${filterStatuses.length}\n\n` +
          `**Compliance:** ${cpDone}/${visibleCp.length} checkpoints completed\n` +
          `ISO 22000: ${complianceSettings.iso22000Enabled ? "enabled" : "disabled"} · ISO 9001: ${complianceSettings.iso9001Enabled ? "enabled" : "disabled"}\n\n` +
          `Open **Quality & Compliance** from the sidebar — tabs: QC Checks, Water Quality, Compliance.`;
        break;
      }

      case "labels": {
        const byStatus = cartonLabels.reduce<Record<string, number>>((acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc; }, {});
        response = `🏷️ **Carton Labels — ${cartonLabels.length} total**\n\n` +
          Object.entries(byStatus).map(([s, n]) => `• ${s.replace(/_/g, " ")}: ${n}`).join("\n") +
          `\n\nOpen **Carton Labels** from the sidebar to print batch-coded labels with expiry dates.`;
        break;
      }

      case "racks": {
        const occupied = warehouseBins.filter((b) => b.status !== "empty").length;
        response = `📦 **Warehouse Racks & Bins**\n\n• ${warehouseRacks.length} racks, ${warehouseBins.length} bins\n• ${occupied} bins occupied\n\nOpen **Racks & Bins** from the sidebar for the rack layout and bin-level stock.`;
        break;
      }

      case "gatepass": {
        const byStatus = gatePasses.reduce<Record<string, number>>((acc, g) => { acc[g.status] = (acc[g.status] ?? 0) + 1; return acc; }, {});
        response = `🚚 **Gate Passes — ${gatePasses.length} total**\n\n` +
          Object.entries(byStatus).map(([s, n]) => `• ${s}: ${n}`).join("\n") +
          `\n\nOpen **Gate Pass** from the sidebar to create, approve, and dispatch vehicle passes.`;
        break;
      }

      case "vision": {
        response = `📷 **Vision Analytics Engine**\n\nThe computer vision module runs on a separate local engine (not in the browser) to keep the MES lightweight.\n\n**Current capabilities:**\n• Bottle count & line speed tracking\n• Missing / crooked cap detection\n• Fill level verification (underfill/overfill)\n• Label presence & alignment check\n• Operator PPE compliance (hairnet, gloves, glasses)\n• Foreign object detection\n\n**Architecture:**\nIP Cameras → Python/YOLOv8 Engine → MES Dashboard\n\nOpen **Vision Analytics** from the sidebar to view live camera feeds, snapshots, and alert events.`;
        break;
      }

      case "kaizen": {
        const total = kaizenSuggestions.length;
        const backlog = kaizenSuggestions.filter((k) => k.status === "backlog").length;
        const inProgress = kaizenSuggestions.filter((k) => k.status === "in_progress").length;
        const completed = kaizenSuggestions.filter((k) => k.status === "completed").length;
        const verified = kaizenSuggestions.filter((k) => k.status === "impact_verified").length;
        const byCat = Object.entries(
          kaizenSuggestions.reduce((acc, k) => {
            acc[k.category] = (acc[k.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        )
          .sort((a, b) => b[1] - a[1])
          .map(([cat, count]) => `  • ${cat}: ${count}`)
          .join("\n");
        response = `📊 **Kaizen Board Snapshot**\n\n• Total ideas: ${total}\n• Backlog: ${backlog}\n• In Progress: ${inProgress}\n• Completed: ${completed}\n• Impact Verified: ${verified}\n\n**By Category:**\n${byCat || "  (none yet)"}\n\nOpen the Kaizen Board to view, create, or move ideas across the workflow.`;
        break;
      }

      default: {
        response = "I'm not sure I understood that. Try 'help' to see what I can do, or rephrase your request.";
        success = false;
      }
    }

    const cmd: AgentCommand = {
      id: cmdId,
      rawText,
      intent,
      params,
      executedAt: new Date().toISOString(),
      success,
      response,
    };

    addCommand(cmd);
    if (success) recordCommandPattern(intent);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    executeCommand(text);
  };

  const quickAction = (text: string) => {
    executeCommand(text);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[560px] max-h-[calc(100vh-96px)] flex flex-col rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Tinni</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-500" />
                    Learning {user?.role || "user"} behavior
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500" onClick={() => navigate("/agent")}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {commands.length === 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="rounded-xl rounded-tl-sm bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/30 p-2.5 max-w-[85%]">
                      <p className="text-xs text-slate-700 dark:text-slate-200">
                        Hi {user?.name?.split(" ")[0] || "there"}! I'm Tinni — your local AI operations assistant. I learn your patterns and can help with production, reports, scheduling, and ERPNext queries. Type "help" to see everything I can do.
                      </p>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="ml-9.5 space-y-1.5">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> Suggested for you
                    </p>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => quickAction(s)}
                        className="block w-full text-left text-[11px] text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-violet-100 dark:border-violet-900/20 rounded-lg px-2.5 py-1.5 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { icon: Factory, label: "Status", cmd: "what is the production status" },
                      { icon: FileText, label: "Report", cmd: "generate production report" },
                      { icon: CalendarDays, label: "Schedule", cmd: "create maintenance schedule" },
                      { icon: ClipboardCheck, label: "QC", cmd: "run qc checks" },
                      { icon: Route, label: "DSS", cmd: "open dss board" },
                      { icon: BarChart3, label: "Efficiency", cmd: "show efficiency report" },
                    ].map((action) => (
                      <button
                        key={action.label}
                        onClick={() => quickAction(action.cmd)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-gray-100 dark:border-slate-700/50 transition-colors"
                      >
                        <action.icon className="w-4 h-4 text-violet-500" />
                        <span className="text-[9px] text-slate-600 dark:text-slate-300">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {commands.slice().reverse().map((cmd) => (
                <div key={cmd.id} className="space-y-2">
                  {/* User message */}
                  <div className="flex gap-2.5 justify-end">
                    <div className="rounded-xl rounded-tr-sm bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/30 p-2.5 max-w-[85%]">
                      <p className="text-xs text-slate-700 dark:text-slate-200">{cmd.rawText}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 text-right">{formatTime(cmd.executedAt)}</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 text-white text-[10px] font-bold">
                      {user?.avatar || "U"}
                    </div>
                  </div>

                  {/* Agent response */}
                  <div className="flex gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cmd.success ? "bg-gradient-to-br from-violet-500 to-indigo-600" : "bg-gradient-to-br from-amber-500 to-orange-500"}`}>
                      {cmd.success ? <Bot className="w-3.5 h-3.5 text-white" /> : <AlertTriangle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className={`rounded-xl rounded-tl-sm border p-2.5 max-w-[85%] ${cmd.success ? "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700" : "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30"}`}>
                      <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line">{cmd.response}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge className="text-[8px] border-0 bg-gray-100 dark:bg-slate-700 text-slate-500">
                          {cmd.intent}
                        </Badge>
                        {cmd.params.product && (
                          <Badge className="text-[8px] border-0 bg-violet-50 text-violet-600">{cmd.params.product}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-2.5">
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 text-violet-500 animate-spin" />
                      <span className="text-xs text-slate-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="h-9 text-xs bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                  disabled={isTyping}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isTyping || !input.trim()}
                  className="h-9 w-9 p-0 bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[9px] text-slate-400 text-center mt-1.5">
                Plain English commands — I learn as you use me
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
