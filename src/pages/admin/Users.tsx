import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import { ArrowLeft, Users, UserCheck, UserX, Shield } from "lucide-react";

export default function UsersAdmin() {
  const navigate = useNavigate();
  const { appUsers, roles } = useAppStore();
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = appUsers.filter((u) => {
    if (filter === "active") return u.active;
    if (filter === "inactive") return !u.active;
    return true;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Users & Privileges
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage user accounts, roles, and permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", val: appUsers.length, color: "text-cyan-600 dark:text-cyan-400" },
          { label: "Active", val: appUsers.filter((u) => u.active).length, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Inactive", val: appUsers.filter((u) => !u.active).length, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-1">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400" : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <Card key={u.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    u.active ? "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" : "bg-gray-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                  }`}>
                    {u.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{u.name}</p>
                      {u.active ? (
                        <Badge className="text-[10px] bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                          <UserCheck className="w-3 h-3 mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-gray-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0">
                          <UserX className="w-3 h-3 mr-1" /> Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{u.email} — {u.role}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Permissions: {u.permissions.length} granted
                    </p>
                  </div>
                </div>
                <Shield className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Built-in Roles</h3>
        {roles.filter((r) => r.builtIn).map((r) => (
          <Card key={r.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{r.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{r.description}</p>
                </div>
                <Badge className="text-[10px] border-0 bg-gray-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {r.permissions.length} perms
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
