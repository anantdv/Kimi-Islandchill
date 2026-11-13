import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

/**
 * Shared modal shell used across all modules.
 * Consistent overlay, animation, header, and close behavior.
 */
export default function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = "max-w-md" }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
                  {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="p-4 overflow-y-auto flex-1">{children}</div>
            {footer && (
              <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex gap-2 shrink-0">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
