import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/stores/appStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera, ScanFace, UserCheck, UserX, Clock, RotateCcw,
  CheckCircle2, AlertCircle, Fingerprint, ArrowRight,
} from "lucide-react";
import type { ClockRecord } from "@/data/mockData";
import { generateId } from "@/lib/utils";


function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export default function FacialAttendance() {
  const {
    employees, shifts, shiftAssignments, clockRecords, faceRegistrations,
    clockInOut, registerFace,
  } = useAppStore();

  const [mode, setMode] = useState<"kiosk" | "register" | "history">("kiosk");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    employeeName?: string;
    matchScore?: number;
    message: string;
    record?: ClockRecord;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  // Registration form
  const [regEmpId, setRegEmpId] = useState("");
  const [regStep, setRegStep] = useState<"select" | "capture" | "done">("select");

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStream(s);
      setCameraError("");
    } catch (e) {
      setCameraError("Camera access denied or not available. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

  // Auto-start camera in kiosk/register mode
  useEffect(() => {
    if ((mode === "kiosk" || mode === "register") && !stream && !cameraError) {
      startCamera();
    }
    if (mode === "history") {
      stopCamera();
    }
  }, [mode]);

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  };

  const generateMockDescriptor = () => {
    // Generate a deterministic-ish descriptor from current time
    const seed = Date.now();
    return Array.from({ length: 128 }, (_, i) => Math.abs(Math.sin(seed + i * 0.1)));
  };

  const handleClockInOut = () => {
    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const snapshot = captureSnapshot();
      const descriptor = generateMockDescriptor();

      // Try to match against registered faces
      let bestMatch: { employeeId: string; score: number } | null = null;
      for (const reg of faceRegistrations) {
        const score = cosineSimilarity(descriptor, reg.descriptor);
        if (score > 0.85 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { employeeId: reg.employeeId, score };
        }
      }

      if (!bestMatch) {
        setScanning(false);
        setScanResult({ success: false, message: "Face not recognized. Please register first or try again." });
        return;
      }

      const emp = employees.find((e) => e.id === bestMatch!.employeeId);
      if (!emp) {
        setScanning(false);
        setScanResult({ success: false, message: "Employee not found." });
        return;
      }

      const sa = shiftAssignments.find((a) => a.employeeId === emp.id && !a.effectiveTo);
      const shift = sa ? shifts.find((s) => s.id === sa.shiftId) : null;

      // Determine if clock-in or clock-out
      const today = new Date().toISOString().slice(0, 10);
      const todayRecords = clockRecords.filter(
        (r) => r.employeeId === emp.id && r.timestamp.startsWith(today) && r.type === "in"
      );
      const hasClockedIn = todayRecords.length > 0;
      const hasClockedOut = clockRecords.some(
        (r) => r.employeeId === emp.id && r.timestamp.startsWith(today) && r.type === "out"
      );

      let type: ClockRecord["type"] = "in";
      let message = "";
      if (!hasClockedIn) {
        type = "in";
        message = `Welcome ${emp.name}! Clock-in recorded.`;
      } else if (hasClockedIn && !hasClockedOut) {
        type = "out";
        message = `Goodbye ${emp.name}! Clock-out recorded.`;
      } else {
        type = "in";
        message = `Welcome back ${emp.name}! New session started.`;
      }

      const record: ClockRecord = {
        id: generateId("cr"),
        employeeId: emp.id,
        type,
        timestamp: new Date().toISOString(),
        method: "facial",
        verified: true,
        shiftId: shift?.id,
        faceMatchScore: bestMatch.score,
        photoUrl: snapshot || undefined,
      };

      clockInOut(record);
      setScanning(false);
      setScanResult({
        success: true,
        employeeName: emp.name,
        matchScore: bestMatch.score,
        message,
        record,
      });
    }, 2000);
  };

  const handleRegisterFace = () => {
    if (!regEmpId) return;
    setScanning(true);

    setTimeout(() => {
      const snapshot = captureSnapshot();
      const descriptor = generateMockDescriptor();

      registerFace({
        employeeId: regEmpId,
        photoUrl: snapshot || "",
        descriptor,
        registeredAt: new Date().toISOString(),
      });

      setScanning(false);
      setRegStep("done");
    }, 2000);
  };

  const todayRecords = clockRecords.filter((r) =>
    r.timestamp.startsWith(new Date().toISOString().slice(0, 10))
  );

  const getEmployeeShift = (empId: string) => {
    const sa = shiftAssignments.find((a) => a.employeeId === empId && !a.effectiveTo);
    return sa ? shifts.find((s) => s.id === sa.shiftId) : null;
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
            <ScanFace className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Facial Attendance</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Clock in/out with face recognition • Register new faces</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[
            { id: "kiosk" as const, label: "Kiosk", icon: Camera },
            { id: "register" as const, label: "Register Face", icon: Fingerprint },
            { id: "history" as const, label: "History", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setMode(tab.id); setScanResult(null); setRegStep("select"); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === tab.id
                  ? "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Kiosk Mode */}
      {mode === "kiosk" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Camera */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
              <CardContent className="p-0 relative">
                {cameraError ? (
                  <div className="h-[400px] flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <div className="text-center p-6">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 dark:text-slate-300">{cameraError}</p>
                      <Button size="sm" className="mt-3 h-8 text-xs" onClick={startCamera}>
                        <RotateCcw className="w-3 h-3 mr-1" /> Retry Camera
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-[400px] object-cover bg-black"
                    />
                    {/* Face overlay guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`w-48 h-48 rounded-full border-2 border-dashed ${scanning ? "border-violet-400 animate-pulse" : "border-white/40"}`} />
                    </div>
                    {/* Scanning overlay */}
                    {scanning && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center">
                          <ScanFace className="w-12 h-12 text-violet-400 animate-bounce mx-auto mb-2" />
                          <p className="text-white text-sm font-medium">Scanning face...</p>
                        </div>
                      </div>
                    )}
                    {/* Result overlay */}
                    {scanResult && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`text-center p-6 rounded-2xl ${scanResult.success ? "bg-emerald-500" : "bg-red-500"} text-white max-w-sm mx-4`}
                        >
                          {scanResult.success ? (
                            <UserCheck className="w-12 h-12 mx-auto mb-2" />
                          ) : (
                            <UserX className="w-12 h-12 mx-auto mb-2" />
                          )}
                          <p className="text-lg font-bold">{scanResult.employeeName || "Unknown"}</p>
                          <p className="text-sm opacity-90">{scanResult.message}</p>
                          {scanResult.matchScore && (
                            <p className="text-xs opacity-75 mt-1">Match confidence: {(scanResult.matchScore * 100).toFixed(1)}%</p>
                          )}
                          <Button
                            size="sm"
                            className="mt-4 h-8 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                            onClick={() => setScanResult(null)}
                          >
                            Dismiss
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center mt-4">
              <Button
                size="lg"
                className="h-14 px-8 text-base bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 transition-all"
                onClick={handleClockInOut}
                disabled={scanning || !!scanResult || cameraError !== ""}
              >
                <ScanFace className="w-5 h-5 mr-2" />
                {scanning ? "Scanning..." : "Clock In / Out"}
              </Button>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="space-y-4">
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  Today's Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2 max-h-[350px] overflow-y-auto">
                {todayRecords.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No records yet today.</p>
                ) : (
                  todayRecords.map((r) => {
                    const emp = employees.find((e) => e.id === r.employeeId);
                    const shift = getEmployeeShift(r.employeeId);
                    return (
                      <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${r.type === "in" ? "bg-emerald-100 text-emerald-600" : r.type === "out" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                          {r.type === "in" ? <ArrowRight className="w-3 h-3" /> : r.type === "out" ? <ArrowRight className="w-3 h-3 rotate-180" /> : <Clock className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200">{emp?.name}</p>
                          <p className="text-[9px] text-slate-400">
                            {new Date(r.timestamp).toLocaleTimeString()} • {shift?.name || "No shift"}
                          </p>
                        </div>
                        <Badge className={`text-[8px] border-0 ${r.type === "in" ? "bg-emerald-50 text-emerald-600" : r.type === "out" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                          {r.type}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  Registered Faces
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {faceRegistrations.map((reg) => {
                  const emp = employees.find((e) => e.id === reg.employeeId);
                  return (
                    <div key={reg.employeeId} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-900/20">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-600">
                        {emp?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200">{emp?.name || "Unknown"}</p>
                        <p className="text-[9px] text-slate-400">Registered {new Date(reg.registeredAt).toLocaleDateString()}</p>
                      </div>
                      <Badge className="text-[8px] border-0 bg-emerald-50 text-emerald-600">Active</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Register Mode */}
      {mode === "register" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 overflow-hidden">
              <CardContent className="p-0 relative">
                {cameraError ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-sm text-slate-400">{cameraError}</p>
                  </div>
                ) : (
                  <div className="relative">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-[400px] object-cover bg-black" />
                    <canvas ref={canvasRef} className="hidden" />
                    {scanning && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center">
                          <Fingerprint className="w-12 h-12 text-violet-400 animate-pulse mx-auto mb-2" />
                          <p className="text-white text-sm font-medium">Capturing face data...</p>
                        </div>
                      </div>
                    )}
                    {regStep === "done" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="text-center p-6 rounded-2xl bg-emerald-500 text-white"
                        >
                          <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-lg font-bold">Face Registered!</p>
                          <p className="text-sm opacity-90">Employee can now use facial attendance.</p>
                          <Button
                            size="sm"
                            className="mt-4 h-8 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
                            onClick={() => { setRegStep("select"); setRegEmpId(""); }}
                          >
                            Register Another
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold">Registration Steps</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-slate-500">Select Employee</label>
                  <select
                    className="w-full h-9 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2"
                    value={regEmpId}
                    onChange={(e) => setRegEmpId(e.target.value)}
                    disabled={regStep !== "select"}
                  >
                    <option value="">Choose employee...</option>
                    {employees.filter((e) => e.active).map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employeeId})</option>
                    ))}
                  </select>
                </div>

                {regEmpId && regStep === "select" && (
                  <Button
                    size="sm"
                    className="w-full h-9 text-xs bg-violet-600 text-white"
                    onClick={() => setRegStep("capture")}
                  >
                    <Camera className="w-3 h-3 mr-1" /> Start Capture
                  </Button>
                )}

                {regStep === "capture" && (
                  <>
                    <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/20">
                      <p className="text-[11px] text-violet-700 dark:text-violet-300">
                        Position your face in the center circle. Ensure good lighting and remove glasses if possible.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full h-9 text-xs bg-violet-600 text-white"
                      onClick={handleRegisterFace}
                      disabled={scanning}
                    >
                      <Fingerprint className="w-3 h-3 mr-1" />
                      {scanning ? "Processing..." : "Capture & Register"}
                    </Button>
                  </>
                )}

                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-slate-500">Instructions</p>
                  <div className="space-y-1">
                    {[
                      "Face the camera directly",
                      "Ensure even lighting (avoid backlight)",
                      "Keep a neutral expression",
                      "Remove hats, masks, or dark glasses",
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-500">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* History Mode */}
      {mode === "history" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { label: "Total Records", value: clockRecords.length, icon: Clock, color: "blue" },
              { label: "Facial Verifications", value: clockRecords.filter((r) => r.method === "facial").length, icon: ScanFace, color: "violet" },
              { label: "Present Today", value: new Set(todayRecords.filter((r) => r.type === "in").map((r) => r.employeeId)).size, icon: UserCheck, color: "emerald" },
              { label: "Registered Faces", value: faceRegistrations.length, icon: Fingerprint, color: "amber" },
            ].map((stat) => (
              <Card key={stat.label} className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 flex items-center justify-center`}>
                    <stat.icon className={`w-4 h-4 text-${stat.color}-500`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.value}</p>
                    <p className="text-[10px] text-slate-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">All Clock Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                {clockRecords.map((r) => {
                  const emp = employees.find((e) => e.id === r.employeeId);
                  const shift = getEmployeeShift(r.employeeId);
                  const typeColor = r.type === "in" ? "emerald" : r.type === "out" ? "red" : "amber";
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800/30">
                      <div className={`w-8 h-8 rounded-full bg-${typeColor}-50 dark:bg-${typeColor}-500/10 flex items-center justify-center shrink-0`}>
                        <Clock className={`w-3.5 h-3.5 text-${typeColor}-500`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-slate-800 dark:text-white">{emp?.name || "Unknown"}</p>
                          <Badge className={`text-[8px] border-0 bg-${typeColor}-50 text-${typeColor}-600`}>{r.type}</Badge>
                          {r.verified && <Badge className="text-[8px] border-0 bg-emerald-50 text-emerald-600">Verified</Badge>}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {new Date(r.timestamp).toLocaleString()} • {r.method}
                          {shift ? ` • ${shift.name}` : ""}
                          {r.faceMatchScore ? ` • Match: ${(r.faceMatchScore * 100).toFixed(0)}%` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
