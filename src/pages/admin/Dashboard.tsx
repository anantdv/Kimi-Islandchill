import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Settings, FileText, BarChart3, Factory, Boxes, GitBranch, ClipboardList, Shield, Download } from "lucide-react";

const adminCards = [
  { title: "Lines & Equipment", icon: Factory, path: "/admin/lines", desc: "Production lines, machines, and equipment registry" },
  { title: "Products", icon: Boxes, path: "/admin/products", desc: "Product catalog, variants, and SKUs" },
  { title: "BOMs", icon: ClipboardList, path: "/admin/boms", desc: "Bill of Materials management" },
  { title: "Forms", icon: FileText, path: "/admin/forms", desc: "MES forms library and templates" },
  { title: "Workflow", icon: GitBranch, path: "/admin/workflow", desc: "Production workflow configuration" },
  { title: "Users & Privileges", icon: Users, path: "/admin/users", desc: "User accounts, roles, and permissions" },
  { title: "Reports", icon: BarChart3, path: "/admin/reports", desc: "System reports and analytics" },
  { title: "Settings", icon: Settings, path: "/admin/settings", desc: "System configuration and preferences" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Administration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">System configuration and management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminCards.map((card) => (
          <Card key={card.title} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-colors cursor-pointer" onClick={() => navigate(card.path)}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/15 flex items-center justify-center shrink-0">
                  <card.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{card.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">System Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">Functions & Processes</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">System modules, workflows, and role definitions</p>
                  </div>
                </div>
                <a href="/IslandChill_MES_Functions_and_Processes.pdf" download>
                  <Button size="sm" className="h-7 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Download className="w-3 h-3 mr-1" /> PDF
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center">
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">Installation Guide</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Deployment steps for production environment</p>
                  </div>
                </div>
                <a href="/IslandChill_MES_Installation_Guide.pdf" download>
                  <Button size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Download className="w-3 h-3 mr-1" /> PDF
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
