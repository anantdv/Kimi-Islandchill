import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye, ArrowLeft, Activity, AlertTriangle, Camera, RefreshCw,
  CheckCircle2, BarChart3, Clock, Zap, Server, Wifi, WifiOff,
  Image, TrendingUp, Filter,
} from "lucide-react";

const VISION_API = import.meta.env.VITE_VISION_API_URL || "http://localhost:8001";

interface CameraStatus {
  camera_id: string;
  camera_name: string;
  enabled: boolean;
  connected: boolean;
  fps_actual: number;
  resolution: number[];
  active_analytics: string[];
  last_frame_time: string | null;
  total_frames_processed: number;
  total_alerts: number;
}

interface VisionEvent {
  id: number;
  camera_id: string;
  analytics_type: string;
  timestamp: string;
  detections_count: number;
  metrics: Record<string, unknown>;
  alert_triggered: boolean;
  alert_reason: string | null;
  image_path: string | null;
  processing_time_ms: number;
}

interface HealthCheck {
  status: string;
  version: string;
  gpu_available: boolean;
  gpu_name: string | null;
  cameras_active: number;
  total_cameras: number;
  models_loaded: string[];
  uptime_seconds: number;
}

const analyticsLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  bottle_count: { label: "Bottle Count", color: "text-cyan-600", icon: BarChart3 },
  missing_cap: { label: "Missing Cap", color: "text-red-600", icon: AlertTriangle },
  fill_level: { label: "Fill Level", color: "text-blue-600", icon: Activity },
  label_check: { label: "Label Check", color: "text-amber-600", icon: CheckCircle2 },
  operator_ppe: { label: "PPE Compliance", color: "text-emerald-600", icon: Eye },
  case_count: { label: "Case Count", color: "text-purple-600", icon: TrendingUp },
};

function useVisionEngine() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [events, setEvents] = useState<VisionEvent[]>([]);
  const [alerts, setAlerts] = useState<{ camera_id: string; analytics_type: string; alert_count: number }[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${VISION_API}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error("Health check failed");
      const data = await res.json();
      setHealth(data);
      setConnected(true);
    } catch {
      setConnected(false);
      setHealth(null);
    }
  }, []);

  const fetchCameras = useCallback(async () => {
    try {
      const res = await fetch(`${VISION_API}/cameras`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return;
      const data = await res.json();
      setCameras(data);
    } catch { /* ignore */ }
  }, []);

  const fetchEvents = useCallback(async (alertOnly = false) => {
    try {
      const url = `${VISION_API}/events?limit=50${alertOnly ? "&alert_only=true" : ""}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data);
    } catch { /* ignore */ }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(`${VISION_API}/events/alerts/summary?hours=24`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return;
      const data = await res.json();
      setAlerts(data);
    } catch { /* ignore */ }
  }, []);

  // Polling fallback when WebSocket unavailable
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchHealth();
      await fetchCameras();
      await fetchEvents();
      await fetchAlerts();
      setLoading(false);
    };
    load();

    const iv = setInterval(() => {
      fetchHealth();
      fetchCameras();
      fetchEvents(true);
      fetchAlerts();
    }, 5000);

    return () => clearInterval(iv);
  }, [fetchHealth, fetchCameras, fetchEvents, fetchAlerts]);

  // WebSocket for real-time alerts
  useEffect(() => {
    const wsUrl = VISION_API.replace("http://", "ws://").replace("https://", "wss://") + "/ws";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Subscribe to all cameras
      cameras.forEach((c) => {
        ws.send(JSON.stringify({ action: "subscribe_camera", camera_id: c.camera_id }));
      });
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "alert") {
          setEvents((prev) => [msg.data, ...prev].slice(0, 100));
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => ws.close();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { health, cameras, events, alerts, connected, loading, refresh: () => { fetchHealth(); fetchCameras(); fetchEvents(); fetchAlerts(); } };
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function VisionAnalytics() {
  const navigate = useNavigate();
  const { health, cameras, events, alerts, connected, loading, refresh } = useVisionEngine();
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [snapUrl, setSnapUrl] = useState<string | null>(null);
  const [snapLoading, setSnapLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const takeSnapshot = async (cameraId: string) => {
    setSnapLoading(true);
    setSelectedCamera(cameraId);
    try {
      const res = await fetch(`${VISION_API}/cameras/${cameraId}/snapshot/analytics`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      setSnapUrl(URL.createObjectURL(blob));
    } catch {
      setSnapUrl(null);
    } finally {
      setSnapLoading(false);
    }
  };

  const filteredEvents = filterType === "all"
    ? events
    : events.filter((e) => e.analytics_type === filterType);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Vision Analytics</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI-powered camera analytics engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${connected ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800 text-emerald-600" : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800 text-red-600"}`}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? "Engine Connected" : "Engine Offline"}
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Engine Health Bar */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${health.gpu_available ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-amber-50 dark:bg-amber-500/10"}`}>
                <Zap className={`w-4 h-4 ${health.gpu_available ? "text-emerald-600" : "text-amber-600"}`} />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">GPU</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-white">{health.gpu_name || "CPU Only"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
                <Camera className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Cameras</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-white">{health.cameras_active}/{health.total_cameras} Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Server className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Models</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-white">{health.models_loaded.length} Loaded</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Uptime</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-white">{formatDuration(health.uptime_seconds)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Camera Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Camera className="w-4 h-4 text-violet-600" /> Camera Feeds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cameras.map((cam) => (
              <motion.div key={cam.camera_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
                  <div className="relative h-36 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center group cursor-pointer"
                    onClick={() => takeSnapshot(cam.camera_id)}>
                    {selectedCamera === cam.camera_id && snapUrl ? (
                      <img src={snapUrl} alt="snapshot" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                        <div className="relative text-center">
                          <Camera className={`w-8 h-8 mx-auto mb-1 ${cam.connected ? "text-emerald-400" : "text-slate-500"}`} />
                          <p className="text-[10px] text-slate-400">{cam.connected ? "Live" : "Offline"}</p>
                        </div>
                        {snapLoading && selectedCamera === cam.camera_id && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-1">
                            <Image className="w-3 h-3" /> Snap
                          </span>
                        </div>
                      </>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className={`text-[9px] border-0 ${cam.connected ? "bg-emerald-500/90 text-white" : "bg-slate-600/90 text-white"}`}>
                        {cam.connected ? "● Live" : "○ Offline"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-slate-800 dark:text-white">{cam.camera_name}</p>
                      <span className="text-[10px] text-slate-400">{cam.resolution[0]}×{cam.resolution[1]}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {cam.active_analytics.map((at) => {
                        const cfg = analyticsLabels[at] || { label: at, color: "text-slate-500", icon: Activity };
                        const Icon = cfg.icon;
                        return (
                          <span key={at} className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 ${cfg.color}`}>
                            <Icon className="w-3 h-3" /> {cfg.label}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{cam.total_frames_processed.toLocaleString()} frames</span>
                      <span className={cam.total_alerts > 0 ? "text-red-500 font-medium" : ""}>
                        {cam.total_alerts} alerts
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {cameras.length === 0 && (
              <div className="col-span-2 text-center py-10 text-slate-400">
                <Camera className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No cameras connected to the vision engine.</p>
                <p className="text-xs mt-1">Start the analytics engine and check the connection.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Alerts + Events */}
        <div className="space-y-4">
          {/* Alert Summary */}
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> 24h Alert Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No alerts in the last 24 hours.</p>
              ) : (
                alerts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200">{a.analytics_type.replace("_", " ")}</p>
                        <p className="text-[10px] text-slate-400">{a.camera_id}</p>
                      </div>
                    </div>
                    <Badge className="bg-red-50 dark:bg-red-500/10 text-red-600 text-[10px] border-0">{a.alert_count}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-600" /> Recent Events
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-[10px] h-6 rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 text-slate-600 dark:text-slate-300"
                  >
                    <option value="all">All</option>
                    {Object.keys(analyticsLabels).map((k) => (
                      <option key={k} value={k}>{analyticsLabels[k].label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
              <AnimatePresence>
                {filteredEvents.map((ev) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-2.5 rounded-lg border ${ev.alert_triggered ? "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-900/20" : "bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                        {ev.analytics_type.replace("_", " ")}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {ev.alert_triggered && ev.alert_reason && (
                      <p className="text-[10px] text-red-600 dark:text-red-400 mb-1">{ev.alert_reason}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(ev.metrics).map(([k, v]) => (
                        <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-slate-500">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-slate-400">{ev.detections_count} detections</span>
                      <span className="text-[9px] text-slate-400">{ev.processing_time_ms.toFixed(1)}ms</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredEvents.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No events yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
