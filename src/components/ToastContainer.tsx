import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="no-print fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#16A34A]" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <Info className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-300" />
          );

        return (
          <div
            key={toast.id}
            role="status"
            className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-[#1A2333]"
          >
            {icon}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#111827] dark:text-white">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-slate-300">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Fechar notificação"
              title="Fechar notificação"
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
