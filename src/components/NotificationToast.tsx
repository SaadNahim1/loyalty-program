import React from 'react';
import { X, CheckCircle2, Gift, Info } from 'lucide-react';
import { useLoyalty } from '../context/LoyaltyContext';

export const NotificationToast: React.FC = () => {
  const { toast, dismissToast } = useLoyalty();

  if (!toast) return null;

  return (
    <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {toast.type === 'reward' ? (
            <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          ) : toast.type === 'info' ? (
            <div className="w-8 h-8 rounded-full bg-stone-800 text-amber-300 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-0.5">
          <h4 className="font-bold text-sm text-amber-100">{toast.title}</h4>
          <p className="text-xs text-stone-300 leading-relaxed">{toast.message}</p>
        </div>

        <button
          onClick={dismissToast}
          className="text-stone-400 hover:text-stone-200 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
