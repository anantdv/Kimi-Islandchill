import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconBg?: string;
  children?: ReactNode;
  backTo?: string;
}

/**
 * Shared page header used across all modules.
 * Provides consistent back-button + icon + title + subtitle layout.
 */
export default function PageHeader({ title, subtitle, icon: Icon, iconBg = "from-emerald-500 to-teal-600", children, backTo }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500 dark:text-slate-400"
          onClick={() => navigate(backTo || "/")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} text-white flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
