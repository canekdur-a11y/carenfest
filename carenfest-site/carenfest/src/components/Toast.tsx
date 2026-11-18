import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

export const ToastContainer: React.FC<{ toasts: ToastMessage[] }> = ({ toasts }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[92%] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium shadow-2xl border backdrop-blur-md transition-all ${
            t.type === 'error'
              ? 'bg-[#2A1412]/95 border-[#F25C4D]/50 text-white'
              : 'bg-[#1D1614]/95 border-white/15 text-white'
          }`}
        >
          {t.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#F25C4D] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#F25C4D] shrink-0" />
          )}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
};
