import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowLeft, Touchpad, Camera, Bell, QrCode,
  Wifi, Battery, Signal, CheckCircle2, AlertTriangle,
  Factory, ClipboardCheck, FlaskConical, Warehouse, Settings,
} from "lucide-react";

const mobileFeatures = [
  {
    icon: Touchpad,
    title: "Touch-Optimized UI",
    desc: "Large tap targets (44px min), swipe gestures, and haptic feedback-ready components.",
  },
  {
    icon: Camera,
    title: "Photo Capture",
    desc: "Native camera integration for QC evidence, maintenance checks, and incident reporting.",
  },
  {
    icon: QrCode,
    title: "Barcode / QR Scan",
    desc: "Scan batch codes, SKUs, and equipment tags for instant lookup and validation.",
  },
  {
    icon: Bell,
    title: "Push Notifications",
    desc: "Real-time alerts for job assignments, QC escalations, and maintenance reminders.",
  },
  {
    icon: Wifi,
    title: "Offline-First Sync",
    desc: "Work offline with local SQLite storage. Auto-sync when connection restores.",
  },
  {
    icon: Battery,
    title: "Low-Power Mode",
    desc: "Reduced polling and dark theme by default to extend battery life on the floor.",
  },
];

const mobileScreens = [
  { label: "Dashboard", desc: "KPIs, line status, active WOs" },
  { label: "My Jobs", desc: "Assigned job cards with tap-to-start" },
  { label: "QC Forms", desc: "Stage-relevant forms with photo fields" },
  { label: "Maintenance", desc: "Pre-start checklist with photo attach" },
  { label: "Incidents", desc: "Quick raise with severity + photo" },
  { label: "Warehouse", desc: "Stock lookup, GRN, dispatch scan" },
];

export default function Mobile() {
  const navigate = useNavigate();

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Mobile App Plan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Responsive design and mobile feature roadmap</p>
        </div>
      </div>

      {/* Phone Mockup */}
      <div className="flex justify-center">
        <div className="relative w-72 h-[500px] bg-sky-50 dark:bg-slate-950 rounded-[2.5rem] border-4 border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-sky-50 dark:bg-slate-950 rounded-b-xl z-20" />
          {/* Status Bar */}
          <div className="absolute top-1 left-4 right-4 flex justify-between text-[10px] text-slate-800 dark:text-white z-10">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3 h-3" />
            </div>
          </div>
          {/* Screen Content */}
          <div className="h-full pt-8 pb-4 px-3 overflow-y-auto bg-white dark:bg-slate-900/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Island Chill MES</p>
            {/* Mini Dashboard */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "Active WO", val: "2", color: "text-cyan-600 dark:text-cyan-400" },
                { label: "OEE", val: "94.2%", color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Open Inc.", val: "1", color: "text-red-600 dark:text-red-400" },
                { label: "Lines", val: "2/4", color: "text-blue-600 dark:text-blue-400" },
              ].map((k) => (
                <div key={k.label} className="bg-gray-100 dark:bg-slate-800 rounded-xl p-2 text-center">
                  <p className={`text-lg font-bold ${k.color}`}>{k.val}</p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400">{k.label}</p>
                </div>
              ))}
            </div>
            {/* Mini Job Card */}
            <div className="bg-gray-100 dark:bg-slate-800 rounded-xl p-3 mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-800 dark:text-white">WO-2025-001</span>
                <Badge className="bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-0 text-[8px]">Active</Badge>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: "65%" }} />
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400">Island Water 500ml — FL1</p>
            </div>
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: ClipboardCheck, label: "My Jobs" },
                { icon: FlaskConical, label: "QC" },
                { icon: AlertTriangle, label: "Incident" },
                { icon: Factory, label: "Lines" },
                { icon: Warehouse, label: "Stock" },
                { icon: Settings, label: "More" },
              ].map((a) => (
                <div key={a.label} className="bg-gray-100 dark:bg-slate-800 rounded-xl p-2 flex flex-col items-center gap-1">
                  <a.icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-[9px] text-slate-500 dark:text-slate-400">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Home Indicator */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>

      {/* Mobile Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {mobileFeatures.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 h-full">
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{f.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mobile Screens Roadmap */}
      <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Mobile Screen Roadmap</h3>
          <div className="space-y-2">
            {mobileScreens.map((s, i) => (
              <div key={s.label} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm text-slate-800 dark:text-white">{s.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.desc}</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Recommended Mobile Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: "Framework", val: "React Native / Capacitor" },
              { label: "Offline DB", val: "SQLite + WatermelonDB" },
              { label: "State", val: "Zustand + MMKV" },
              { label: "Camera", val: "Capacitor Camera Plugin" },
              { label: "Push", val: "Firebase Cloud Messaging" },
              { label: "Barcode", val: "Capacitor Barcode Scanner" },
              { label: "Sync", val: "TanStack Query + Retry" },
              { label: "Auth", val: "Biometric + JWT" },
            ].map((t) => (
              <div key={t.label} className="p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400 mb-0.5">{t.label}</p>
                <p className="text-white font-medium">{t.val}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
