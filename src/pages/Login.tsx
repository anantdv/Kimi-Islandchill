import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Factory, Shield, User, Wrench, ClipboardCheck, Warehouse,
  Users, LayoutDashboard, Search, Crown,
} from "lucide-react";
import type { AppUser } from "@/data/mockData";
import { appUsers, defaultRouteByRole, getRoleColor } from "@/data/mockData";

const roleIcons: Record<string, React.ElementType> = {
  "Administrator": Crown,
  "Factory Manager": Shield,
  "Production Supervisor": Users,
  "QC Inspector": ClipboardCheck,
  "Maintenance Supervisor": Wrench,
  "Warehouse Supervisor": Warehouse,
  "Operator": User,
  "Planner": LayoutDashboard,
};



export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((s: { login: (userId: string) => void }) => s.login);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const activeUsers = appUsers.filter((u) => u.active);
  const filteredUsers = search.trim()
    ? activeUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.role.toLowerCase().includes(search.toLowerCase())
      )
    : activeUsers;

  const grouped = filteredUsers.reduce<Record<string, AppUser[]>>((acc, u) => {
    if (!acc[u.role]) acc[u.role] = [];
    acc[u.role].push(u);
    return acc;
  }, {});

  const handleLogin = () => {
    if (!selectedUser) return;
    setLoading(true);
    setTimeout(() => {
      login(selectedUser.id);
      setLoading(false);
      navigate(defaultRouteByRole[selectedUser.role]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Island Chill</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manufacturing Execution System</p>
        </div>

        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-xl">
          <CardContent className="p-6 space-y-5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Search user or role..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-500/30"
              />
            </div>

            {/* Users by Role */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {Object.entries(grouped).map(([role, users]) => {
                const RoleIcon = roleIcons[role] || User;
                return (
                  <div key={role}>
                    <div className="flex items-center gap-2 mb-2">
                      <RoleIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{role}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">({users.length})</span>
                    </div>
                    <div className="space-y-2">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            selectedUser?.id === u.id
                              ? "border-cyan-500/50 bg-cyan-50 dark:bg-cyan-500/10"
                              : "border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800"
                          }`}
                          onClick={() => setSelectedUser(u)}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            selectedUser?.id === u.id
                              ? "bg-cyan-500 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          }`}>
                            {u.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${selectedUser?.id === u.id ? "text-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                              {u.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getRoleColor(u.role)}`}>
                            {u.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
              onClick={handleLogin}
              disabled={!selectedUser || loading}
            >
              {loading ? "Signing in..." : selectedUser ? `Sign In as ${selectedUser.name}` : "Select a User"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 dark:text-slate-300 mt-6">MES v1.0 | Island Chill Beverages</p>
      </motion.div>
    </div>
  );
}
