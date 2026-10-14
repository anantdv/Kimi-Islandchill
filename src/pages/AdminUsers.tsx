import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Plus, User, Shield, Wrench, ClipboardCheck,
  Warehouse, Edit2, Search, CheckCircle2, XCircle,
  Crown, LayoutDashboard, Settings, FileText, ListChecks,
  Workflow, BarChart3, Cpu, Route, Smartphone, AlertTriangle,
  Droplets, Factory, Trash2, Users, ToggleLeft, ToggleRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppUser, RoleDefinition } from "@/data/mockData";
import { permissionModules, getRolePermissions, getRoleColor } from "@/data/mockData";

const roleIcons: Record<string, React.ElementType> = {
  "Administrator": Crown,
  "Factory Manager": Shield,
  "Production Supervisor": LayoutDashboard,
  "QC Inspector": ClipboardCheck,
  "Maintenance Supervisor": Wrench,
  "Warehouse Supervisor": Warehouse,
  "Operator": User,
  "Planner": Route,
};

const submoduleIcons: Record<string, React.ElementType> = {
  "ops-dashboard": LayoutDashboard,
  "ops-wo": FileText,
  "ops-wo-create": Plus,
  "ops-incidents": AlertTriangle,
  "ops-warehouse": Warehouse,
  "ops-qc": ClipboardCheck,
  "ops-flowmap": Route,
  "ops-twin": Cpu,
  "ops-mobile": Smartphone,
  "admin-dashboard": Shield,
  "admin-lines": Factory,
  "admin-products": Droplets,
  "admin-boms": FileText,
  "admin-forms": ListChecks,
  "admin-workflow": Workflow,
  "admin-users": User,
  "admin-reports": BarChart3,
  "admin-settings": Settings,
};

const roleColorOptions = [
  "bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/30",
  "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
  "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
  "bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
  "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
  "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30",
  "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30",
  "bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30",
  "bg-pink-50 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/30",
  "bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/30",
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const { appUsers, roles, updateUserPermissions, toggleUserActive, addRole, updateRole, deleteRole } = useAppStore();
  const [tab, setTab] = useState<"users" | "roles">("users");
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleForm, setRoleForm] = useState<Partial<RoleDefinition>>({ name: "", description: "", permissions: [], color: roleColorOptions[0] });
  const [roleSearch, setRoleSearch] = useState("");

  const filteredUsers = appUsers.filter((u: AppUser) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRoles = roles.filter((r: RoleDefinition) =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
    r.description.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const openUserEdit = (u: AppUser) => {
    setEditingUser(u);
    setEditPerms([...(u.permissions.length > 0 ? u.permissions : getRolePermissions(u.role))]);
  };

  const togglePerm = (subId: string) => {
    setEditPerms((prev) =>
      prev.includes(subId) ? prev.filter((p) => p !== subId) : [...prev, subId]
    );
  };

  const saveUserPerms = () => {
    if (editingUser) {
      updateUserPermissions(editingUser.id, editPerms);
      setEditingUser(null);
    }
  };

  const resetToDefault = () => {
    if (editingUser) {
      setEditPerms([...getRolePermissions(editingUser.role)]);
    }
  };

  const openRoleEdit = (r: RoleDefinition) => {
    setEditingRole(r);
    setRoleForm({ ...r });
    setRoleModalOpen(true);
  };

  const openNewRole = () => {
    setEditingRole(null);
    setRoleForm({ name: "", description: "", permissions: [], color: roleColorOptions[0] });
    setRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setRoleModalOpen(false);
    setEditingRole(null);
  };

  const saveRole = () => {
    if (!roleForm.name?.trim()) return;
    if (editingRole) {
      updateRole(editingRole.id, {
        name: roleForm.name,
        description: roleForm.description || "",
        permissions: roleForm.permissions || [],
        color: roleForm.color || roleColorOptions[0],
      });
    } else {
      const newRole: RoleDefinition = {
        id: `role-${Date.now()}`,
        name: roleForm.name.trim(),
        description: roleForm.description || "",
        permissions: roleForm.permissions || [],
        color: roleForm.color || roleColorOptions[0],
        builtIn: false,
      };
      addRole(newRole);
    }
    setRoleForm({ name: "", description: "", permissions: [], color: roleColorOptions[0] });
    setRoleModalOpen(false);
    setEditingRole(null);
  };

  const toggleRolePerm = (subId: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: (prev.permissions || []).includes(subId)
        ? (prev.permissions || []).filter((p) => p !== subId)
        : [...(prev.permissions || []), subId],
    }));
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Users & Privileges</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage users, roles, and access control</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "users"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          onClick={() => setTab("users")}
        >
          <Users className="w-4 h-4 inline mr-1.5" />
          Users ({appUsers.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "roles"
              ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
          onClick={() => setTab("roles")}
        >
          <Shield className="w-4 h-4 inline mr-1.5" />
          Roles ({roles.length})
        </button>
      </div>

      {/* ── USERS TAB ── */}
      {tab === "users" && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-300" />
              <Input
                placeholder="Search users by name, role or email..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-500"
              />
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add User
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{appUsers.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total Users</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{appUsers.filter((u) => u.active).length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{appUsers.filter((u) => !u.active).length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Inactive</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{new Set(appUsers.map((u) => u.role)).size}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Roles Assigned</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            {filteredUsers.map((u: AppUser) => {
              const Icon = roleIcons[u.role] || User;
              const permCount = (u.permissions.length > 0 ? u.permissions : getRolePermissions(u.role)).length;
              return (
                <Card key={u.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{u.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleUserActive(u.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                          title={u.active ? "Click to withdraw access" : "Click to extend access"}
                        >
                          {u.active ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <span className="text-slate-400 dark:text-slate-500">Inactive</span>
                            </>
                          )}
                        </button>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {permCount} modules
                        </span>
                        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white h-8 w-8 p-0" onClick={() => openUserEdit(u)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className={`text-[10px] border-gray-200 dark:border-slate-800 ${getRoleColor(u.role)}`}>{u.role}</Badge>
                      {u.lastLogin && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-auto">Last login: {u.lastLogin}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* ── ROLES TAB ── */}
      {tab === "roles" && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-300" />
              <Input
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoleSearch(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-500"
              />
            </div>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" onClick={openNewRole}>
              <Plus className="w-4 h-4 mr-1" /> New Role
            </Button>
          </div>

          <div className="space-y-2">
            {filteredRoles.map((r: RoleDefinition) => (
              <Card key={r.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${r.color}`}>
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{r.name}</p>
                          {r.builtIn && (
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-0 text-[9px]">Built-in</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{r.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {r.permissions.length} permissions
                      </span>
                      <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white h-8 w-8 p-0" onClick={() => openRoleEdit(r)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {!r.builtIn && (
                        <Button variant="ghost" size="sm" className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 h-8 w-8 p-0" onClick={() => deleteRole(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.permissions.slice(0, 6).map((pid) => {
                      const sub = permissionModules.flatMap((m) => m.submodules).find((s) => s.id === pid);
                      return sub ? (
                        <Badge key={pid} variant="outline" className="text-[9px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                          {sub.name}
                        </Badge>
                      ) : null;
                    })}
                    {r.permissions.length > 6 && (
                      <Badge variant="outline" className="text-[9px] border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        +{r.permissions.length - 6} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── USER PRIVILEGE EDIT MODAL ── */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-white">Edit Privileges</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{editingUser.name} — {editingUser.role}</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {permissionModules.map((mod) => (
                  <div key={mod.id} className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-slate-800/50 px-3 py-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{mod.name}</p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{mod.submodules.length} submodules</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
                      {mod.submodules.map((sub) => {
                        const SubIcon = submoduleIcons[sub.id] || Settings;
                        const isChecked = editPerms.includes(sub.id);
                        return (
                          <div key={sub.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <SubIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{sub.name}</span>
                            </div>
                            <button
                              onClick={() => togglePerm(sub.id)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                isChecked
                                  ? "bg-cyan-500 border-cyan-500"
                                  : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                              }`}
                            >
                              {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <Button variant="outline" size="sm" className="text-xs border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400" onClick={resetToDefault}>
                  Reset to Role Default
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white" onClick={saveUserPerms}>
                    Save Privileges ({editPerms.length})
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ROLE CREATE/EDIT MODAL ── */}
      <AnimatePresence>
        {roleModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={closeRoleModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-white">{editingRole ? "Edit Role" : "Create Role"}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{editingRole ? editingRole.name : "Define a new role with custom permissions"}</p>
                </div>
                <button onClick={closeRoleModal} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Role Name</label>
                    <Input
                      value={roleForm.name || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Senior Operator"
                      className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Description</label>
                    <Input
                      value={roleForm.description || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description of this role..."
                      className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">Color Theme</label>
                    <div className="flex flex-wrap gap-2">
                      {roleColorOptions.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setRoleForm((p) => ({ ...p, color: c }))}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${c.split(" ")[0]} ${roleForm.color === c ? "border-cyan-500 scale-110" : "border-transparent"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Permissions</p>
                  {permissionModules.map((mod) => (
                    <div key={mod.id} className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden mb-3">
                      <div className="bg-gray-50 dark:bg-slate-800/50 px-3 py-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{mod.name}</p>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
                        {mod.submodules.map((sub) => {
                          const SubIcon = submoduleIcons[sub.id] || Settings;
                          const isChecked = (roleForm.permissions || []).includes(sub.id);
                          return (
                            <div key={sub.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <SubIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{sub.name}</span>
                              </div>
                              <button
                                onClick={() => toggleRolePerm(sub.id)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? "bg-cyan-500 border-cyan-500"
                                    : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                }`}
                              >
                                {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={closeRoleModal}>
                  Cancel
                </Button>
                <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white" onClick={saveRole} disabled={!roleForm.name?.trim()}>
                  {editingRole ? "Save Changes" : "Create Role"} ({(roleForm.permissions || []).length} perms)
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
