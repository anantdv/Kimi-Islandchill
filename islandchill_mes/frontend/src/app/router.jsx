import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth } from "./guards";
import { Login } from "../features/auth/Login";
import { Home } from "../features/home/Home";
import { Wizard } from "../features/workorders/Wizard";
import { Execution } from "../features/workorders/Execution";
import { Incidents } from "../features/incidents/Incidents";
import { Warehouse } from "../features/warehouse/Warehouse";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/workorders/new", element: <Wizard /> },
      { path: "/workorders/:woId", element: <Execution /> },
      { path: "/incidents", element: <Incidents /> },
      { path: "/warehouse", element: <Warehouse /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
