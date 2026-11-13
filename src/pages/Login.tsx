import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Factory, Lock, User, AlertCircle } from "lucide-react";
import { erpApi } from "@/lib/erpApi";
import { appUsers, getRolePermissions } from "@/data/mockData";
import { defaultRouteByRole } from "@/data/mockData";

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore((s: { login: (userId: string) => void }) => s.login);
  const [email, setEmail] = useState("mes.test@islandchill.com.fj");
  const [password, setPassword] = useState("Test@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const data = await erpApi.login(email, password);
      const userInfo = await erpApi.getUserInfo(email).catch(() => null);

      // Determine local role from ERPNext roles
      const erpRoles = (userInfo?.roles || []).map((r: { role: string }) => r.role);
      let localRole = "MES User";
      if (erpRoles.includes("System Manager") || erpRoles.includes("Administrator")) {
        localRole = "Administrator";
      } else if (erpRoles.includes("MES User")) {
        localRole = "MES User";
      }

      const permissions = getRolePermissions(localRole);
      const avatar = (data.full_name || email).split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

      useAppStore.setState({
        user: {
          id: email,
          name: data.full_name || email,
          email,
          role: localRole,
          avatar,
          permissions,
        },
        isAuthenticated: true,
      });
      navigate(defaultRouteByRole[localRole] || "/");
    } catch (e: any) {
      // Fallback to mockData users for offline/demo mode
      const mockUser = appUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.active);
      if (mockUser) {
        login(mockUser.id);
        navigate(defaultRouteByRole[mockUser.role] || "/");
      } else {
        setError(e.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Island Chill</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manufacturing Execution System</p>
        </div>

        <Card className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 shadow-xl">
          <CardContent className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">ERPNext Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-800"
                  placeholder="username@islandchill.com.fj"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In to ERPNext"}
            </Button>

            <p className="text-center text-[10px] text-slate-400">
              Test users:<br />
              MES User — mes.test@islandchill.com.fj / Test@123<br />
              Admin — mes.admin@islandchill.local / Admin@123
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 dark:text-slate-300 mt-6">MES v1.0 | Island Chill Beverages</p>
      </motion.div>
    </div>
  );
}
