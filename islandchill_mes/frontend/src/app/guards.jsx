import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../stores/session";

export function RequireAuth() {
  const user = useSession((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
