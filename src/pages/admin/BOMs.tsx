import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList } from "lucide-react";

export default function BOMAdmin() {
  const navigate = useNavigate();
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Bill of Materials
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage product BOMs</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
        <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Bill of Materials</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Define the exact ingredient composition for each product variant.
          BOMs feed directly into the requisition workflow for the Ingredient Mixer.
        </p>
        <div className="mt-6 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <p>Planned features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Create/edit BOMs per product variant</li>
            <li>Ingredient list with quantities and UoM</li>
            <li>Yield and wastage factors</li>
            <li>BOM versioning and approval workflow</li>
            <li>Link BOM to requisition generation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
