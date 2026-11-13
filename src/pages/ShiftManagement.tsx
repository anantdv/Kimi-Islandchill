import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Clock, Users, CalendarDays, Plus, Trash2, Edit2, CheckCircle2,
  AlertCircle, Sunrise, Sun, Moon, ArrowRight, UserCheck, Loader2,
} from "lucide-react";
import type { Shift, Employee, ShiftAssignment, ClockRecord } from "@/data/mockData";
import { erpApi } from "@/lib/erpApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DEFAULT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function ShiftManagement() {
  const [activeTab, setActiveTab] = useState<"shifts" | "employees" | "assignments" | "records">("shifts");

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [clockRecords, setClockRecords] = useState<ClockRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [shiftForm, setShiftForm] = useState<Partial<Shift>>({
    name: "", startTime: "08:00", endTime: "17:00", breakMinutes: 30, color: "#3b82f6", days: DEFAULT_DAYS,
  });

  const [empForm, setEmpForm] = useState<Partial<Employee>>({
    name: "", employeeId: "", department: "Production", role: "Operator", isSystemUser: false, active: true, joinedDate: new Date().toISOString().slice(0, 10),
  });

  const [assignEmpId, setAssignEmpId] = useState("");
  const [assignShiftId, setAssignShiftId] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [shiftsData, employeesData, assignmentsData, recordsData] = await Promise.all([
        erpApi.getShifts(),
        erpApi.getShiftEmployees(true),
        erpApi.getShiftAssignments(),
        erpApi.getClockRecords(),
      ]);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setShiftAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setClockRecords(Array.isArray(recordsData) ? recordsData : []);
    } catch (e: any) {
      setError(e.message || "Failed to load shift data from ERPNext");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayRecords = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return clockRecords.filter((r) => r.timestamp.startsWith(today));
  }, [clockRecords]);

  const presentToday = useMemo(() => {
    const ids = new Set(todayRecords.filter((r) => r.type === "in").map((r) => r.employeeId));
    return Array.from(ids);
  }, [todayRecords]);

  const handleSaveShift = async () => {
    if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) return;
    setLoading(true);
    try {
      if (editingShift) {
        await erpApi.updateShift(editingShift.id, {
          name: shiftForm.name,
          start_time: shiftForm.startTime,
          end_time: shiftForm.endTime,
          break_minutes: shiftForm.breakMinutes,
          color: shiftForm.color,
          days: shiftForm.days,
        });
      } else {
        await erpApi.createShift({
          name: shiftForm.name || "",
          start_time: shiftForm.startTime || "08:00",
          end_time: shiftForm.endTime || "17:00",
          break_minutes: shiftForm.breakMinutes || 30,
          color: shiftForm.color || "#3b82f6",
          days: shiftForm.days || DEFAULT_DAYS,
        });
      }
      await loadData();
      setShowShiftForm(false);
      setEditingShift(null);
      setShiftForm({ name: "", startTime: "08:00", endTime: "17:00", breakMinutes: 30, color: "#3b82f6", days: DEFAULT_DAYS });
    } catch (e: any) {
      setError(e.message || "Failed to save shift");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    setLoading(true);
    try {
      await erpApi.deleteShift(id);
      await loadData();
    } catch (e: any) {
      setError(e.message || "Failed to delete shift");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmp = async () => {
    if (!empForm.name) return;
    setLoading(true);
    try {
      if (editingEmp) {
        await erpApi.updateEmployee(editingEmp.id, {
          name: empForm.name,
          department: empForm.department,
          role: empForm.role,
          active: empForm.active,
        });
      } else {
        await erpApi.createShiftEmployee({
          name: empForm.name || "",
          department: empForm.department || "Production",
          role: empForm.role || "Operator",
          joined_date: empForm.joinedDate,
        });
      }
      await loadData();
      setShowEmpForm(false);
      setEditingEmp(null);
      setEmpForm({ name: "", employeeId: "", department: "Production", role: "Operator", isSystemUser: false, active: true, joinedDate: new Date().toISOString().slice(0, 10) });
    } catch (e: any) {
      setError(e.message || "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmp = async (id: string) => {
    setLoading(true);
    try {
      await erpApi.deleteEmployee(id);
      await loadData();
    } catch (e: any) {
      setError(e.message || "Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignEmpId || !assignShiftId) return;
    setLoading(true);
    try {
      await erpApi.assignShift({
        employee_id: assignEmpId,
        shift_id: assignShiftId,
        effective_from: new Date().toISOString().slice(0, 10),
      });
      await loadData();
      setAssignEmpId("");
      setAssignShiftId("");
    } catch (e: any) {
      setError(e.message || "Failed to assign shift");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    setLoading(true);
    try {
      await erpApi.removeShiftAssignment(id);
      await loadData();
    } catch (e: any) {
      setError(e.message || "Failed to remove assignment");
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeShift = (empId: string) => {
    const sa = shiftAssignments.find((a) => a.employeeId === empId && !a.effectiveTo);
    return sa ? shifts.find((s) => s.id === sa.shiftId) : null;
  };

  const getShiftIcon = (name: string) => {
    if (name.toLowerCase().includes("night")) return <Moon className="w-4 h-4" />;
    if (name.toLowerCase().includes("morning")) return <Sunrise className="w-4 h-4" />;
    if (name.toLowerCase().includes("afternoon")) return <Sun className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Shift Management</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Shifts, employees, assignments & attendance records</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-medium text-emerald-600">{presentToday.length}</span> present today
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-blue-600">{employees.filter((e) => e.active).length}</span> active employees
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {[
          { id: "shifts" as const, label: "Shifts", icon: CalendarDays },
          { id: "employees" as const, label: "Employees", icon: Users },
          { id: "assignments" as const, label: "Assignments", icon: ArrowRight },
          { id: "records" as const, label: "Clock Records", icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading && !showShiftForm && !showEmpForm && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading from ERPNext...
        </div>
      )}

      {/* Shifts Tab */}
      {activeTab === "shifts" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="h-8 text-xs bg-emerald-600 text-white" onClick={() => { setEditingShift(null); setShowShiftForm(true); }} disabled={loading}>
              <Plus className="w-3 h-3 mr-1" /> Add Shift
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {shifts.map((shift) => (
              <Card key={shift.id} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: shift.color }}>
                        {getShiftIcon(shift.name)}
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{shift.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditingShift(shift); setShiftForm(shift); setShowShiftForm(true); }} disabled={loading}>
                        <Edit2 className="w-3 h-3 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteShift(shift.id)} disabled={loading}>
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Time</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{shift.startTime} – {shift.endTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Break</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{shift.breakMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {shiftAssignments.filter((a) => a.shiftId === shift.id && !a.effectiveTo).length} employees
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(shift.days || DEFAULT_DAYS).map((d) => (
                        <Badge key={d} className="text-[8px] border-0 bg-gray-100 dark:bg-slate-800 text-slate-500">{d}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {showShiftForm && (
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">
                  {editingShift ? "Edit Shift" : "New Shift"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Input className="h-8 text-xs" placeholder="Shift name" value={shiftForm.name} onChange={(e) => setShiftForm((f) => ({ ...f, name: e.target.value }))} />
                  <Input className="h-8 text-xs" type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm((f) => ({ ...f, startTime: e.target.value }))} />
                  <Input className="h-8 text-xs" type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm((f) => ({ ...f, endTime: e.target.value }))} />
                  <Input className="h-8 text-xs" type="number" placeholder="Break (min)" value={shiftForm.breakMinutes} onChange={(e) => setShiftForm((f) => ({ ...f, breakMinutes: Number(e.target.value) }))} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8 text-xs bg-emerald-600 text-white" onClick={handleSaveShift} disabled={loading}>
                    {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />} Save
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowShiftForm(false)} disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Employees Tab */}
      {activeTab === "employees" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] border-0 bg-blue-50 text-blue-600">System Users: {employees.filter((e) => e.isSystemUser).length}</Badge>
              <Badge className="text-[10px] border-0 bg-gray-100 text-gray-500">Non-System: {employees.filter((e) => !e.isSystemUser).length}</Badge>
            </div>
            <Button size="sm" className="h-8 text-xs bg-blue-600 text-white" onClick={() => { setEditingEmp(null); setShowEmpForm(true); }} disabled={loading}>
              <Plus className="w-3 h-3 mr-1" /> Add Employee
            </Button>
          </div>

          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                {employees.map((emp) => {
                  const shift = getEmployeeShift(emp.id);
                  const isPresent = presentToday.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/30 cursor-pointer ${!emp.active ? "opacity-50" : ""}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                        {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-slate-800 dark:text-white truncate">{emp.name}</p>
                          {!emp.isSystemUser && <Badge className="text-[8px] border-0 bg-amber-50 text-amber-600">Non-System</Badge>}
                          {isPresent && <Badge className="text-[8px] border-0 bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-2 h-2 mr-0.5" /> Present</Badge>}
                        </div>
                        <p className="text-[10px] text-slate-500">{emp.employeeId} • {emp.department} • {emp.role}</p>
                      </div>
                      {shift && (
                        <Badge className="text-[9px] border-0 shrink-0" style={{ backgroundColor: shift.color + "20", color: shift.color }}>
                          {shift.name}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {showEmpForm && (
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold">{editingEmp ? "Edit Employee" : "New Employee"}</CardTitle></CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input className="h-8 text-xs" placeholder="Full name" value={empForm.name} onChange={(e) => setEmpForm((f) => ({ ...f, name: e.target.value }))} />
                  <Input className="h-8 text-xs" placeholder="Department" value={empForm.department} onChange={(e) => setEmpForm((f) => ({ ...f, department: e.target.value }))} />
                  <Input className="h-8 text-xs" placeholder="Role" value={empForm.role} onChange={(e) => setEmpForm((f) => ({ ...f, role: e.target.value }))} />
                  <Input className="h-8 text-xs" type="date" value={empForm.joinedDate} onChange={(e) => setEmpForm((f) => ({ ...f, joinedDate: e.target.value }))} />
                  <div className="flex items-center gap-2">
                    <Switch checked={empForm.active} onCheckedChange={(v) => setEmpForm((f) => ({ ...f, active: v }))} />
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8 text-xs bg-blue-600 text-white" onClick={handleSaveEmp} disabled={loading}>
                    {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />} Save
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowEmpForm(false)} disabled={loading}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                Assign Shift
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select className="h-8 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2" value={assignEmpId} onChange={(e) => setAssignEmpId(e.target.value)}>
                  <option value="">Select employee...</option>
                  {employees.filter((e) => e.active).map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
                  ))}
                </select>
                <select className="h-8 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2" value={assignShiftId} onChange={(e) => setAssignShiftId(e.target.value)}>
                  <option value="">Select shift...</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime}-{s.endTime})</option>
                  ))}
                </select>
                <Button size="sm" className="h-8 text-xs bg-emerald-600 text-white" onClick={handleAssign} disabled={loading}>
                  {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ArrowRight className="w-3 h-3 mr-1" />} Assign
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Current Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                {shiftAssignments.filter((a) => !a.effectiveTo).map((sa) => {
                  const emp = employees.find((e) => e.id === sa.employeeId);
                  const shift = shifts.find((s) => s.id === sa.shiftId);
                  if (!emp || !shift) return null;
                  return (
                    <div key={sa.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                        {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-white">{emp.name}</p>
                        <p className="text-[10px] text-slate-500">{emp.employeeId}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <Badge className="text-[9px] border-0 shrink-0" style={{ backgroundColor: shift.color + "20", color: shift.color }}>
                        {shift.name}
                      </Badge>
                      <span className="text-[10px] text-slate-400 shrink-0">from {sa.effectiveFrom}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRemoveAssignment(sa.id)} disabled={loading}>
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Clock Records Tab */}
      {activeTab === "records" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">Today's Clock Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                {todayRecords.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No clock records for today yet.</p>
                  </div>
                ) : (
                  todayRecords.map((record) => {
                    const emp = employees.find((e) => e.id === record.employeeId);
                    const shift = shifts.find((s) => s.id === record.shiftId);
                    const typeLabels: Record<string, { label: string; color: string }> = {
                      in: { label: "Clock In", color: "emerald" },
                      out: { label: "Clock Out", color: "red" },
                      break_start: { label: "Break Start", color: "amber" },
                      break_end: { label: "Break End", color: "blue" },
                    };
                    const tl = typeLabels[record.type];
                    return (
                      <div key={record.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                        <div className={`w-8 h-8 rounded-full bg-${tl.color}-50 dark:bg-${tl.color}-500/10 flex items-center justify-center shrink-0`}>
                          <Clock className={`w-3.5 h-3.5 text-${tl.color}-500`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-slate-800 dark:text-white">{emp?.name || "Unknown"}</p>
                            <Badge className={`text-[8px] border-0 bg-${tl.color}-50 text-${tl.color}-600`}>{tl.label}</Badge>
                            {record.verified && <Badge className="text-[8px] border-0 bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-2 h-2 mr-0.5" /> Verified</Badge>}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {new Date(record.timestamp).toLocaleTimeString()} • {record.method}
                            {shift ? ` • ${shift.name}` : ""}
                            {record.faceMatchScore ? ` • Match: ${(record.faceMatchScore * 100).toFixed(0)}%` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Employee Detail Modal */}
      <Dialog open={!!selectedEmployee} onOpenChange={(open) => { if (!open) setSelectedEmployee(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.name}</DialogTitle>
            <DialogDescription>Employee details from ERPNext</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Employee ID</span>
                <span className="col-span-2 font-medium text-slate-800 dark:text-slate-100">{selectedEmployee.employeeId}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Department</span>
                <span className="col-span-2 font-medium text-slate-800 dark:text-slate-100">{selectedEmployee.department || "—"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Role</span>
                <span className="col-span-2 font-medium text-slate-800 dark:text-slate-100">{selectedEmployee.role}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Joined</span>
                <span className="col-span-2 font-medium text-slate-800 dark:text-slate-100">{selectedEmployee.joinedDate}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Status</span>
                <span className="col-span-2">
                  {selectedEmployee.active ? (
                    <Badge className="text-[10px] border-0 bg-emerald-50 text-emerald-600">Active</Badge>
                  ) : (
                    <Badge className="text-[10px] border-0 bg-red-50 text-red-600">Inactive</Badge>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">System User</span>
                <span className="col-span-2">
                  {selectedEmployee.isSystemUser ? (
                    <Badge className="text-[10px] border-0 bg-blue-50 text-blue-600">Yes</Badge>
                  ) : (
                    <Badge className="text-[10px] border-0 bg-amber-50 text-amber-600">No</Badge>
                  )}
                </span>
              </div>
              {(() => {
                const sa = shiftAssignments.find((a) => a.employeeId === selectedEmployee.id && !a.effectiveTo);
                const shift = sa ? shifts.find((s) => s.id === sa.shiftId) : null;
                return shift ? (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500">Assigned Shift</span>
                    <span className="col-span-2">
                      <Badge className="text-[10px] border-0" style={{ backgroundColor: shift.color + "20", color: shift.color }}>
                        {shift.name}
                      </Badge>
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
