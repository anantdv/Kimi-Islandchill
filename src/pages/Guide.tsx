import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import {
  ArrowLeft, BookOpen, PlayCircle,
  LayoutDashboard, ClipboardList, AlertTriangle, FlaskConical,
  Beaker, Wrench, Shield,
  LogIn, ChevronRight, Lightbulb, Zap,
} from "lucide-react";

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  content: React.ReactNode;
  relatedPage?: string;
}

const roleGuides: Record<string, string[]> = {
  "Operator": ["login", "dashboard", "workorders", "incidents-report"],
  "QC Inspector": ["login", "dashboard", "qc", "incidents"],
  "Maintenance Supervisor": ["login", "dashboard", "maint", "incidents"],
  "Warehouse Supervisor": ["login", "dashboard", "warehouse", "requisitions"],
  "Ingredient Mixer": ["login", "dashboard", "requisitions"],
  "Production Supervisor": ["login", "dashboard", "workorders", "qc", "incidents", "maint"],
  "Factory Manager": ["login", "dashboard", "workorders", "qc", "warehouse", "incidents", "maint", "admin"],
  "Planner": ["login", "dashboard", "workorders", "admin-boms"],
  "Administrator": ["login", "dashboard", "admin-users", "admin"],
};

export default function Guide() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [activeSection, setActiveSection] = useState<string>("overview");

  const userRole = user?.role || "Operator";
  const recommendedSteps = roleGuides[userRole] || roleGuides["Operator"];

  const sections: GuideStep[] = [
    {
      id: "overview",
      title: "Getting Started",
      description: "Overview of the Island Chill MES",
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-200 dark:border-cyan-900/20">
            <h4 className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 mb-2">Welcome to Island Chill MES</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The Manufacturing Execution System (MES) helps you manage production operations
              from work order creation through quality control, maintenance, and incident management.
              Each role sees only the functions relevant to their job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Role-Based Access", desc: "Your dashboard and menu are tailored to your job function. No clutter, only what you need." },
              { title: "Work Orders", desc: "View, execute, and track production jobs from start to finish." },
              { title: "Quality Control", desc: "Perform QC checks, record measurements, and approve or reject batches." },
              { title: "Incident Management", desc: "Report incidents, investigate root causes, and track resolutions." },
              { title: "Maintenance", desc: "Pre-start and scheduled maintenance checks with clearance workflows." },
              { title: "BOM Requisitions", desc: "Ingredient Mixer fetches raw materials per approved BOM and delivers to production." },
            ].map((item) => (
              <div key={item.title} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-800 dark:text-white">{item.title}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "login",
      title: "Logging In",
      description: "How to sign in to the system",
      icon: LogIn,
      relatedPage: "/login",
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            {[
              { step: 1, text: "On the login screen, you will see a list of users grouped by role." },
              { step: 2, text: "Find your name in the list. Active users are shown with a green indicator." },
              { step: 3, text: "Click on your name to select it." },
              { step: 4, text: "Click the Sign In button to enter the system." },
              { step: 5, text: "You will be taken to your role-specific dashboard automatically." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{s.step}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/20">
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              <Lightbulb className="w-3 h-3 inline mr-1" />
              Tip: If your account is inactive, contact your administrator to reactivate it.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "dashboard",
      title: "Your Dashboard",
      description: "Understanding your role-specific view",
      icon: LayoutDashboard,
      relatedPage: "/",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Your dashboard shows only the information relevant to your role. Here's what each role sees:
          </p>
          <div className="space-y-2">
            {[
              { role: "Operator", view: "My assigned WOs, line incidents, efficiency, hours worked" },
              { role: "QC Inspector", view: "Pending checks, active WOs, incident count, checks completed today" },
              { role: "Maintenance Supervisor", view: "Pending clearances, overdue tasks, completed today, active WOs" },
              { role: "Warehouse Supervisor", view: "Low stock alerts, pending deliveries, active WOs, pick requests" },
              { role: "Ingredient Mixer", view: "Approved requisitions, in-picking, prepared, delivered counts" },
              { role: "Production Supervisor", view: "Active WOs, open incidents, maintenance status, efficiency" },
              { role: "Factory Manager", view: "Factory-wide KPIs: WOs, efficiency, OEE, quality rate, incidents" },
            ].map((r) => (
              <div key={r.role} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <Badge className={`text-[10px] border-0 shrink-0 ${
                  r.role === userRole ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" : "bg-gray-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}>{r.role}</Badge>
                <p className="text-[10px] text-slate-600 dark:text-slate-300">{r.view}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "workorders",
      title: "Work Orders",
      description: "Managing production jobs",
      icon: ClipboardList,
      relatedPage: "/workorders",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Work Orders (WOs) are the core of production. Each WO defines what to produce, how much, and by when.
          </p>
          <div className="space-y-3">
            {[
              { step: 1, title: "View WOs", text: "The Work Orders page lists all production jobs. Filter by status: Pending, In Progress, Completed, or Cancelled." },
              { step: 2, title: "Create a WO", text: "Click 'New WO' (Planners and Factory Managers only). Fill in product, variant, quantity, line, and schedule." },
              { step: 3, title: "Execute a WO", text: "Click on a WO to open the execution page. Track progress, update produced quantity, and mark stages complete." },
              { step: 4, title: "Maintenance Clearance", text: "Before starting, complete the pre-start maintenance checklist. Pass all checks to clear the WO for production." },
              { step: 5, title: "Complete", text: "When production finishes, mark the WO as complete. The system updates inventory and quality records." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{s.step}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{s.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "qc",
      title: "Quality Control",
      description: "Performing checks and recording results",
      icon: FlaskConical,
      relatedPage: "/qc",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            QC ensures every batch meets quality standards. Checks are defined per product and performed at scheduled intervals.
          </p>
          <div className="space-y-3">
            {[
              { step: 1, title: "Pending Checks", text: "Open the QC page to see checks waiting for your review. Each check shows the parameter, acceptance range, and due time." },
              { step: 2, title: "Perform Check", text: "Click 'Check' on a pending item. Enter the measured value, select Pass or Fail, and add optional notes." },
              { step: 3, title: "Submit Result", text: "Click Submit Result to record your decision. The system logs who performed the check and when." },
              { step: 4, title: "Forms Library", text: "Access standardized QC forms for consistent documentation across all checks." },
              { step: 5, title: "History", text: "View completed checks in the History tab. Filter by pass/fail status and date range." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{s.step}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{s.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "incidents",
      title: "Incidents",
      description: "Reporting and investigation",
      icon: AlertTriangle,
      relatedPage: "/incidents",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Incidents capture any deviation from normal operations. The system supports three permission levels:
            View, Report, and Investigate.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { role: "View Only", can: "See incident list and details" },
              { role: "Report", can: "Raise new incidents on their line" },
              { role: "Investigate", can: "Full investigation with checklist, root cause, and resolution" },
            ].map((r) => (
              <div key={r.role} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-800 dark:text-white">{r.role}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{r.can}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-800 dark:text-white">Investigation Workflow:</p>
            {[
              "1. Open an incident and click 'Investigate'",
              "2. Complete the 10-step investigation checklist",
              "3. Select root cause category from 9 predefined options",
              "4. Document detailed cause and action taken",
              "5. Upload photos as evidence",
              "6. Mark as Resolved or Pending (with reason)",
            ].map((text, i) => (
              <p key={i} className="text-[10px] text-slate-500 dark:text-slate-400">{text}</p>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "maint",
      title: "Maintenance",
      description: "Scheduled and pre-start maintenance",
      icon: Wrench,
      relatedPage: "/maint-schedule",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Maintenance is split into two areas: scheduled maintenance tasks and per-WO pre-start clearance.
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-800 dark:text-white">Scheduled Maintenance</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Access via the Maintenance Schedule page. Tasks are categorized as:
                Pre-start, Post-production, Weekly, Monthly, or Breakdown.
                Each task has a checklist of items to verify.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-800 dark:text-white">Pre-Start Clearance (WO)</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Before a WO can start, the maintenance supervisor must clear it.
                This involves a checklist check. If all items pass, the WO is cleared.
                If any item fails, the WO is held pending resolution.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "requisitions",
      title: "BOM Requisitions",
      description: "Ingredient picking and delivery workflow",
      icon: Beaker,
      relatedPage: "/requisitions",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            The Ingredient Mixer role manages the flow of raw materials from the store to production,
            based on approved Bills of Materials (BOMs).
          </p>
          <div className="space-y-3">
            {[
              { step: 1, title: "Approved BOM", text: "Once a Planner approves a BOM, a requisition slip is automatically generated." },
              { step: 2, title: "Start Picking", text: "The Ingredient Mixer views approved requisitions and clicks 'Start Picking' to begin." },
              { step: 3, title: "Fetch Ingredients", text: "Using the pick list, fetch each ingredient from its store location. Verify lot numbers and expiry dates." },
              { step: 4, title: "Mark Prepared", text: "After all ingredients are fetched and verified, click 'Mark Prepared'. This records who prepared the batch and when." },
              { step: 5, title: "Deliver to Production", text: "Hand over the prepared ingredients to production. Click 'Deliver to Production' to complete the workflow." },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">{s.step}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{s.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "admin",
      title: "Administration",
      description: "System management (Admin only)",
      icon: Shield,
      relatedPage: "/admin",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            The Administration module is available to Administrators and Factory Managers.
            It provides system-wide configuration and management capabilities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { title: "Lines & Equipment", desc: "Register production lines and equipment" },
              { title: "Products", desc: "Manage product catalog and variants" },
              { title: "BOMs", desc: "Create and manage Bills of Materials" },
              { title: "Forms", desc: "QC and operational form templates" },
              { title: "Workflow", desc: "Production workflow configuration" },
              { title: "Users", desc: "User accounts, roles, and permissions" },
              { title: "Reports", desc: "System analytics and reporting" },
              { title: "Settings", desc: "System preferences and integrations" },
            ].map((item) => (
              <div key={item.title} className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-800 dark:text-white">{item.title}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const activeGuide = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> Self-Learning Guide
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Learn how to use Island Chill MES — personalized for {userRole}
          </p>
        </div>
      </div>

      {/* Recommended badge */}
      <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-200 dark:border-cyan-900/20 flex items-center gap-2">
        <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        <p className="text-xs text-cyan-700 dark:text-cyan-400">
          Recommended for your role: {recommendedSteps.map((s) => sections.find((sec) => sec.id === s)?.title).filter(Boolean).join(" → ")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sidebar navigation */}
        <div className="space-y-1">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const isRec = recommendedSteps.includes(section.id);
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                  isActive
                    ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <section.icon className={`w-4 h-4 ${isActive ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${isActive ? "text-cyan-700 dark:text-cyan-300" : "text-slate-700 dark:text-slate-300"}`}>{section.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{section.description}</p>
                </div>
                {isRec && !isActive && (
                  <Badge className="text-[9px] bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-0 shrink-0">Rec</Badge>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center">
                        <activeGuide.icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{activeGuide.title}</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{activeGuide.description}</p>
                      </div>
                    </div>
                    {activeGuide.relatedPage && (
                      <Button size="sm" className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => navigate(activeGuide.relatedPage!)}>
                        <PlayCircle className="w-3 h-3 mr-1" /> Try It
                      </Button>
                    )}
                  </div>
                  {activeGuide.content}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
