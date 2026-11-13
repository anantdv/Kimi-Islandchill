import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import { motion } from "framer-motion";
import type { FillingLine, IoTSensor } from "@/data/mockData";
import {
  PlusCircle, AlertTriangle, ClipboardCheck, Wrench,
  Package, CheckCircle2, Truck, FlaskConical,
  Zap, Activity, BarChart3, Factory, Video,
  Thermometer, Gauge, Droplets, Wind, Waves, Eye, Bell, ChevronRight,
  ScanEye, AlertOctagon, Radio, CircleDot, PauseCircle, PlayCircle,
  XCircle, Beaker, MessageCircle, Phone, Send, TrendingUp,
} from "lucide-react";

const fadeIn = (delay = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay } });

const gradients: Record<string, string> = {
  cyan: "from-cyan-500/10 to-cyan-600/5 border-cyan-200/50 dark:border-cyan-800/30",
  emerald: "from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/30",
  amber: "from-amber-500/10 to-amber-600/5 border-amber-200/50 dark:border-amber-800/30",
  red: "from-red-500/10 to-red-600/5 border-red-200/50 dark:border-red-800/30",
  purple: "from-purple-500/10 to-purple-600/5 border-purple-200/50 dark:border-amber-800/30",
  blue: "from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/30",
  orange: "from-orange-500/10 to-orange-600/5 border-orange-200/50 dark:border-orange-800/30",
  pink: "from-pink-500/10 to-pink-600/5 border-pink-200/50 dark:border-pink-800/30",
};

const iconGradients: Record<string, string> = {
  cyan: "bg-gradient-to-br from-cyan-500 to-cyan-600",
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600",
  amber: "bg-gradient-to-br from-amber-500 to-amber-600",
  red: "bg-gradient-to-br from-red-500 to-red-600",
  purple: "bg-gradient-to-br from-purple-500 to-purple-600",
  blue: "bg-gradient-to-br from-blue-500 to-blue-600",
  orange: "bg-gradient-to-br from-orange-500 to-orange-600",
  pink: "bg-gradient-to-br from-pink-500 to-pink-600",
};

const statusConfig = {
  running: { label: "Running", color: "emerald", icon: PlayCircle, bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900/30", pulse: true },
  idle: { label: "Idle", color: "amber", icon: PauseCircle, bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/30", pulse: false },
  down: { label: "Down", color: "red", icon: XCircle, bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-900/30", pulse: false },
  maintenance: { label: "Maint.", color: "purple", icon: Wrench, bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-900/30", pulse: false },
};

const sensorIcons: Record<string, React.ElementType> = {
  temperature: Thermometer, pressure: Gauge, flow_rate: Waves,
  vibration: Wind, humidity: Droplets, co2: Droplets,
  ph: Beaker, tds: ScanEye, turbidity: Eye, conductivity: Zap,
};

/* ═══════════════════════════════════════════════════════════════════════════════
   EXTRACTED MEMOIZED COMPONENTS — each manages its own live refresh so the
   parent Dashboard never re-renders on the 2-second simulation tick.
   ═══════════════════════════════════════════════════════════════════════════════ */

const LineStatusBadge = memo(({ status }: { status: string }) => {
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
});

const Sparkline = memo(({ data, color }: { data: number[]; color: string }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / range) * 26 - 2}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-8 mt-1">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx="100" cy={30 - ((data[data.length - 1] - min) / range) * 26 - 2} r="2" fill={color} />
    </svg>
  );
});

const CameraCard = memo(({ line, delay }: { line: FillingLine; delay: number }) => {
  const navigate = useNavigate();
  const { workOrders, productionAnalytics, iotSensors, iotAlerts } = useAppStore();
  const [liveClock, setLiveClock] = useState(new Date());
  const [liveSpeed, setLiveSpeed] = useState(line.speed);
  const [liveBottles, setLiveBottles] = useState(line.speed * 60 * 3);
  const [liveThroughput, setLiveThroughput] = useState(() => {
    const a = productionAnalytics.filter((x) => x.lineId === line.id)[0];
    return (a?.throughput || 0) / 60;
  });

  const analytics = productionAnalytics.filter((a) => a.lineId === line.id).slice(0, 1)[0];
  const lineSensors = iotSensors.filter((s) => s.lineId === line.id && s.status !== "normal");
  const lineAlerts = iotAlerts.filter((a) => a.lineId === line.id && !a.acknowledged);
  const runningWO = workOrders.find((w) => w.name === line.currentWo)
    || workOrders.find((w) => w.fillingLine === line.name && w.status === "in_process");

  useEffect(() => {
    const iv = setInterval(() => {
      setLiveClock(new Date());
      if (line.status === "running") {
        setLiveSpeed((prev) => {
          const jitter = (Math.random() - 0.5) * line.speed * 0.05;
          return Math.max(0, Math.round(prev + jitter));
        });
        setLiveBottles((prev) => prev + Math.round(line.speed * 2));
        setLiveThroughput((prev) => Math.max(0, prev + (Math.random() - 0.5) * 8));
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [line.id, line.status, line.speed]);

  return (
    <motion.div {...fadeIn(delay)}>
      <Card
        onClick={() => navigate(runningWO ? `/workorders/${runningWO.id}` : "/twin")}
        className={`overflow-hidden border cursor-pointer group/card transition-all duration-300 hover:shadow-xl hover:scale-[1.015] ${line.status === "running" ? "border-emerald-200/60 dark:border-emerald-800/30" : "border-gray-200 dark:border-slate-800"} bg-white dark:bg-slate-900/50`}
      >
        {/* Camera placeholder */}
        <div className="relative h-40 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center overflow-hidden group">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          {line.status === "running" && (
            <motion.div
              className="absolute left-0 right-0 h-[1px] bg-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          )}
          <div className="relative text-center">
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center ${line.status === "running" ? "bg-emerald-500/20 ring-1 ring-emerald-500/30" : "bg-slate-700/50"}`}>
              <Video className={`w-7 h-7 ${line.status === "running" ? "text-emerald-400" : "text-slate-500"}`} />
            </div>
            <p className="text-xs font-mono text-slate-400">{line.cameraId || "CAM-OFFLINE"}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Live Feed — {line.status === "running" ? "Active" : "Offline"}</p>
          </div>
          <div className="absolute top-3 left-3">
            <LineStatusBadge status={line.status} />
          </div>
          {line.status === "running" && (
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-mono text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                REC
              </span>
              <span className="px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-mono text-emerald-400">
                {liveClock.toLocaleTimeString()}
              </span>
            </div>
          )}
          {line.status === "running" && analytics && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-[10px] text-emerald-400 font-medium">{liveThroughput.toFixed(0)}/min</p>
                  <p className="text-[9px] text-slate-400">Throughput</p>
                </div>
                <div className="w-px h-6 bg-slate-600" />
                <div className="text-center">
                  <p className="text-[10px] text-emerald-400 font-medium">{analytics.defectRate}%</p>
                  <p className="text-[9px] text-slate-400">Defect</p>
                </div>
                <div className="w-px h-6 bg-slate-600" />
                <div className="text-center">
                  <p className="text-[10px] text-emerald-400 font-medium">{analytics.labelPlacementAccuracy}%</p>
                  <p className="text-[9px] text-slate-400">Label</p>
                </div>
              </div>
            </div>
          )}
          {(lineSensors.length > 0 || lineAlerts.length > 0) && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-red-500/90 text-white border-0 text-[10px]">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {lineSensors.length + lineAlerts.length}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{line.name}</p>
            {line.currentWo && (
              <Badge variant="outline" className="text-[9px] border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400">
                {line.currentWo}
              </Badge>
            )}
          </div>
          {line.status === "running" ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-1.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <p className="text-xs font-bold text-slate-800 dark:text-white tabular-nums">{liveSpeed}</p>
                <p className="text-[9px] text-slate-500">bpm</p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{line.efficiency}%</p>
                <p className="text-[9px] text-slate-500">OEE</p>
              </div>
              <div className="text-center p-1.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <p className="text-xs font-bold text-slate-800 dark:text-white tabular-nums">{liveBottles.toLocaleString()}</p>
                <p className="text-[9px] text-slate-500">Bottles</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2">
              <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Line ready for next work order</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

const SensorTile = memo(({ sensor, delay }: { sensor: IoTSensor; delay: number }) => {
  const { fillingLines } = useAppStore();
  const navigate = useNavigate();
  const Icon = sensorIcons[sensor.sensorType] || Activity;

  const [liveValue, setLiveValue] = useState(sensor.currentValue);
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: 20 }, () => sensor.currentValue + (Math.random() - 0.5) * (sensor.maxSafe - sensor.minSafe) * 0.05)
  );
  const [liveClock, setLiveClock] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => {
      setLiveClock(new Date());
      const span = (sensor.maxSafe - sensor.minSafe) * 0.04;
      setLiveValue((prev) => {
        let v = prev + (Math.random() - 0.5) * 2 * span;
        if (sensor.status === "warning") v += span * 0.35;
        v = Math.min(sensor.maxSafe + span * 1.5, Math.max(sensor.minSafe - span * 1.5, v));
        return v;
      });
    }, 2000);
    return () => clearInterval(iv);
  }, [sensor.id, sensor.status, sensor.minSafe, sensor.maxSafe]);

  useEffect(() => {
    setHistory((prev) => {
      const next = [...prev, liveValue];
      return next.slice(-20);
    });
  }, [liveValue]);

  const status = (() => {
    if (liveValue > sensor.maxSafe || liveValue < sensor.minSafe) return "critical";
    const span = sensor.maxSafe - sensor.minSafe;
    if (liveValue > sensor.maxSafe - span * 0.08 || liveValue < sensor.minSafe + span * 0.08) return "warning";
    return "normal";
  })();

  const sparkColor = status === "normal" ? "#34d399" : status === "warning" ? "#fbbf24" : "#f87171";
  const statusColors = {
    normal: "border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-500/5",
    warning: "border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-500/5",
    critical: "border-red-200/50 dark:border-red-800/30 bg-red-50/30 dark:bg-red-500/5",
  };
  const valueColors = {
    normal: "text-slate-800 dark:text-white",
    warning: "text-amber-700 dark:text-amber-400",
    critical: "text-red-700 dark:text-red-400",
  };

  return (
    <motion.div {...fadeIn(delay)}>
      <div
        onClick={() => navigate("/twin")}
        className={`rounded-xl border p-3 cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-[1.02] ${statusColors[status]}`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${status === "normal" ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600" : status === "warning" ? "bg-amber-100 dark:bg-amber-500/15 text-amber-600" : "bg-red-100 dark:bg-red-500/15 text-red-600"}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200">{sensor.sensorName}</p>
              <p className="text-[9px] text-slate-400">{fillingLines.find((l) => l.id === sensor.lineId)?.name}</p>
            </div>
          </div>
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${status === "normal" ? "bg-emerald-400" : status === "warning" ? "bg-amber-400 animate-pulse" : "bg-red-500 animate-pulse"}`} />
            <span className="text-[8px] font-mono text-slate-400">{liveClock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className={`text-lg font-bold tabular-nums ${valueColors[status]}`}>
            {liveValue.toFixed(liveValue % 1 === 0 ? 0 : 1)}
          </p>
          <p className="text-[10px] text-slate-400">{sensor.unit}</p>
        </div>
        <Sparkline data={history} color={sparkColor} />
        <div className="w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${status === "normal" ? "bg-emerald-400" : status === "warning" ? "bg-amber-400" : "bg-red-400"}`}
            style={{ width: `${Math.min(100, Math.max(0, ((liveValue - sensor.minSafe) / (sensor.maxSafe - sensor.minSafe)) * 100))}%` }}
          />
        </div>
        <p className="text-[9px] text-slate-400 mt-1">Safe: {sensor.minSafe}–{sensor.maxSafe} {sensor.unit}</p>
      </div>
    </motion.div>
  );
});

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    workOrders, incidents, maintenanceChecks, requisitions,
    fillingLines, iotSensors, iotAlerts,
    user, hasPermission, kaizenSuggestions,
  } = useAppStore();

  const userRole = user?.role || "";
  const canCreateWO = hasPermission("ops-wo-create");

  // ── DERIVED DATA ──
  const activeWOs = workOrders.filter((w) => w.status === "in_process");
  const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "acknowledged");
  const pendingMaint = maintenanceChecks.filter((m) => m.status === "pending");
  const approvedReqs = requisitions.filter((r) => r.status === "approved");
  const preparedReqs = requisitions.filter((r) => r.status === "prepared");
  const efficiency = Math.round(
    (workOrders.reduce((acc, w) => acc + Math.round(w.qty * w.progress / 100), 0) /
      workOrders.reduce((acc, w) => acc + w.qty, 0)) * 100
  ) || 0;
  const unackAlerts = iotAlerts.filter((a) => !a.acknowledged);
  const pendingQc = workOrders
    .filter((w) => w.status === "in_process")
    .reduce((acc, w) => acc + w.qcChecks.filter((q) => q.status === "pending").length, 0);

  const runningLines = fillingLines.filter((l) => l.status === "running");
  const idleLines = fillingLines.filter((l) => l.status === "idle");
  const downLines = fillingLines.filter((l) => l.status === "down");

  // ── CLICKABLE NAV CARD ──
  const NavCard = ({ icon: Icon, label, value, sub, color, to, delay = 0 }: any) => (
    <motion.button
      {...fadeIn(delay)}
      onClick={() => navigate(to)}
      className={`relative w-full text-left rounded-2xl border bg-gradient-to-br ${gradients[color]} p-4 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 ${iconGradients[color]}`} />
      <div className="relative flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconGradients[color]} text-white flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
      </div>
      <div className="relative mt-3">
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
    </motion.button>
  );

  // ── Communication Widgets Component ────────────────────────────────────────
  const CommsWidgets = () => {
    const { commsMessages, commsConfigs, markCommsRead } = useAppStore();
    const unreadWhatsapp = commsMessages.filter((m) => m.channel === "whatsapp" && !m.read && m.direction === "in").length;
    const unreadViber = commsMessages.filter((m) => m.channel === "viber" && !m.read && m.direction === "in").length;
    const unreadTelegram = commsMessages.filter((m) => m.channel === "telegram" && !m.read && m.direction === "in").length;

    const channelConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; url: string }> = {
      whatsapp: { label: "WhatsApp", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: MessageCircle, url: "https://web.whatsapp.com" },
      viber: { label: "Viber", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-500/10", icon: Phone, url: "https://www.viber.com" },
      telegram: { label: "Telegram", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-500/10", icon: Send, url: "https://web.telegram.org" },
    };

    return (
      <motion.div {...fadeIn(0.5)}>
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-500 text-white flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-4 h-4" />
                </div>
                Communications Hub
                <Badge className="bg-gray-50 dark:bg-slate-800 text-slate-500 border-0 text-[10px]">
                  {unreadWhatsapp + unreadViber + unreadTelegram} unread
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["whatsapp", "viber", "telegram"] as const).map((channel) => {
                const cfg = channelConfig[channel];
                const config = commsConfigs.find((c) => c.channel === channel);
                const messages = commsMessages.filter((m) => m.channel === channel).slice(0, 4);
                const unread = messages.filter((m) => !m.read && m.direction === "in").length;
                const Icon = cfg.icon;
                return (
                  <div key={channel} className={`rounded-xl border p-3 ${cfg.bg} border-gray-100 dark:border-slate-800`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color} bg-white/60 dark:bg-white/10`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{cfg.label}</p>
                          <p className="text-[9px] text-slate-400">{config?.status === "connected" ? "Connected" : "Disconnected"}</p>
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {messages.map((msg) => (
                        <button
                          key={msg.id}
                          onClick={() => markCommsRead(msg.id)}
                          className={`w-full text-left p-2 rounded-lg text-[10px] transition-colors ${
                            msg.read
                              ? "bg-white/40 dark:bg-white/5 text-slate-500"
                              : "bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {!msg.read && msg.direction === "in" && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
                            <span className="truncate">{msg.sender}: {msg.content}</span>
                          </div>
                          <p className="text-[8px] text-slate-400 mt-0.5">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                        </button>
                      ))}
                    </div>
                    <a
                      href={cfg.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block w-full text-center py-1.5 rounded-lg text-[10px] font-medium bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors ${cfg.color}`}
                    >
                      Open {cfg.label}
                    </a>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1440px] mx-auto space-y-6">
      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Production Floor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {userRole} view — {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unackAlerts.length > 0 && (
            <Button variant="outline" size="sm" className="h-9 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" onClick={() => {}}>
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              {unackAlerts.length} Alert{unackAlerts.length > 1 ? "s" : ""}
            </Button>
          )}
          {canCreateWO && (
            <Button className="h-9 text-xs bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white shadow-lg shadow-cyan-500/20" onClick={() => navigate("/workorders/new")}>
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> New WO
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── CLICKABLE NAV CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <NavCard icon={ClipboardCheck} label="Work Orders" value={workOrders.length} sub={`${activeWOs.length} active`} color="cyan" to="/workorders" delay={0} />
        <NavCard icon={AlertTriangle} label="Incidents" value={openIncidents.length} sub={`${incidents.filter((i) => i.severity === "critical").length} critical`} color="red" to="/incidents" delay={0.05} />
        <NavCard icon={Package} label="Requisitions" value={requisitions.length} sub={`${approvedReqs.length} to pick`} color="blue" to="/requisitions" delay={0.1} />
        <NavCard icon={Truck} label="Deliveries" value={preparedReqs.length} sub="ready" color="purple" to="/requisitions" delay={0.15} />
        <NavCard icon={FlaskConical} label="QC Checks" value={pendingQc} sub="pending" color="amber" to="/qc" delay={0.2} />
        <NavCard icon={Wrench} label="Maintenance" value={pendingMaint.length} sub="pending" color="orange" to="/maint-schedule" delay={0.25} />
        <NavCard icon={BarChart3} label="Efficiency" value={`${efficiency}%`} sub="plant OEE" color="emerald" to="/admin" delay={0.3} />
        <NavCard icon={Radio} label="IoT Sensors" value={iotSensors.length} sub={`${iotSensors.filter((s) => s.status !== "normal").length} alerts`} color="pink" to="/twin" delay={0.35} />
        <NavCard icon={TrendingUp} label="Kaizen" value={kaizenSuggestions.length} sub={`${kaizenSuggestions.filter((k) => k.status === "impact_verified").length} verified`} color="emerald" to="/kaizen" delay={0.4} />
      </div>

      {/* ── LIVE PRODUCTION FLOOR ── */}
      <motion.div {...fadeIn(0.2)}>
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
                  <Video className="w-4 h-4" />
                </div>
                Live Production Floor
                <Badge className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">
                  <CircleDot className="w-3 h-3 mr-1 animate-pulse" />
                  {runningLines.length} Running
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {runningLines.length} Run
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {idleLines.length} Idle
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  {downLines.length} Down
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {fillingLines.map((line, i) => (
                <CameraCard key={line.id} line={line} delay={i * 0.06} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── IOT SENSOR GRID ── */}
      <motion.div {...fadeIn(0.3)}>
        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg">
                  <Radio className="w-4 h-4" />
                </div>
                IoT Sensor Network
                {iotSensors.filter((s) => s.status !== "normal").length > 0 && (
                  <Badge className="bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[10px]">
                    <AlertOctagon className="w-3 h-3 mr-1" />
                    {iotSensors.filter((s) => s.status !== "normal").length} Warning
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-pink-600" onClick={() => navigate("/twin")}>
                Digital Twin <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {iotSensors.map((sensor, i) => (
                <SensorTile key={sensor.id} sensor={sensor} delay={i * 0.03} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── BOTTOM ROW: ALERTS + ACTIVE WOs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Alerts */}
        <motion.div {...fadeIn(0.4)} className="lg:col-span-1">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden h-full">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800/60">
              <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center shadow-lg">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {unackAlerts.length > 0 ? unackAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-500/5 border border-red-100/50 dark:border-red-900/20">
                    <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-red-700 dark:text-red-400">{alert.message}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{fillingLines.find((l) => l.id === alert.lineId)?.name} • {new Date(alert.triggeredAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex items-center justify-center gap-2 py-6 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-medium">All sensors within normal range</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Work Orders */}
        <motion.div {...fadeIn(0.45)} className="lg:col-span-2">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden h-full">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-white flex items-center justify-center shadow-lg">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                </div>
                Active Work Orders
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-cyan-600" onClick={() => navigate(activeWOs[0] ? `/workorders/${activeWOs[0].id}` : "/workorders/new")}>
                Open Active <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {activeWOs.length > 0 ? activeWOs.map((wo) => {
                  return (
                    <button
                      key={wo.id}
                      onClick={() => navigate(`/wo/${wo.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-50/40 to-transparent dark:from-cyan-500/5 border border-cyan-100/40 dark:border-cyan-900/20 hover:shadow-sm transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 flex items-center justify-center shrink-0">
                        <Factory className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-800 dark:text-white">{wo.name}</p>
                          <Badge className="bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-0 text-[9px]">{wo.progress}%</Badge>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{wo.product} — {wo.variant} • {wo.fillingLine}</p>
                        <div className="w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${wo.progress}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500"
                          />
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 transition-colors shrink-0" />
                    </button>
                  );
                }) : (
                  <div className="flex items-center justify-center gap-2 py-6 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-medium">No active work orders</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── COMMUNICATION PLATFORMS ── */}
      <CommsWidgets />
    </div>
  );
}


