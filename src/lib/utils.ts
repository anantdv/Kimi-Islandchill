import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a random ID with the given prefix. */
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Format an ISO date string as "date time". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Format an ISO date string as time only. Returns "—" for undefined. */
export function formatTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Format an ISO date string as date only. */
export function formatDateOnly(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

/** Return days remaining until a date (negative = overdue). */
export function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

/** Unified status color map used across all modules. */
export const STATUS_COLORS: Record<string, string> = {
  // Production / line
  running: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  idle: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  down: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  maintenance: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
  // Work order
  in_process: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  draft: "bg-gray-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  completed: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  // QC
  passed: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  failed: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  pending: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  overdue: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  // DSS
  setup: "bg-slate-100 text-slate-600",
  paused: "bg-amber-100 text-amber-600",
  aborted: "bg-red-100 text-red-600",
  // Incidents
  open: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  investigating: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  resolved: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  closed: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  // Requisitions
  requested: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  approved: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  issued: "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
  rejected: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
  // Filter
  good: "bg-emerald-50 text-emerald-600",
  needs_change: "bg-amber-50 text-amber-600",
  // Generic
  active: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  inactive: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

/** Get the Tailwind color classes for a given status string. */
export function statusColor(status: string): string {
  return STATUS_COLORS[status] || STATUS_COLORS.idle;
}

/** Human-readable status labels. */
export const STATUS_LABELS: Record<string, string> = {
  in_process: "In Process",
  needs_change: "Change Soon",
  investigating: "Investigating",
  impact_verified: "Impact Verified",
};

/** Convert a status key to a human-readable label. */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}
