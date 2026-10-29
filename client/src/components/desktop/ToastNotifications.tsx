import React from 'react';
import { useGameStore, ToastItem } from '../../stores/useGameStore.js';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastNotifications: React.FC = () => {
  const { toasts, removeToast } = useGameStore();

  if (toasts.length === 0) return null;

  const getStyle = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return {
          card: 'bg-[#0f1f14] border-2 border-emerald-500 shadow-2xl shadow-emerald-950/60',
          iconWrap: 'bg-emerald-500/20 text-emerald-400',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          title: 'text-emerald-300',
        };
      case 'warning':
        return {
          card: 'bg-[#291b0d] border-2 border-amber-500 shadow-2xl shadow-amber-950/60',
          iconWrap: 'bg-amber-500/20 text-amber-400',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          title: 'text-amber-300',
        };
      case 'danger':
        return {
          card: 'bg-[#2b1014] border-2 border-red-500 shadow-2xl shadow-red-950/60',
          iconWrap: 'bg-red-500/20 text-red-400',
          icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
          title: 'text-red-300',
        };
      default:
        return {
          card: 'bg-[#111c2e] border-2 border-blue-500 shadow-2xl shadow-blue-950/60',
          iconWrap: 'bg-blue-500/20 text-blue-400',
          icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
          title: 'text-blue-300',
        };
    }
  };

  return (
    <div className="fixed top-16 sm:top-20 right-3 sm:right-5 left-3 sm:left-auto z-50 flex flex-col space-y-2 sm:space-y-3 max-w-sm w-auto sm:w-full pointer-events-none select-none">
      {toasts.map(toast => {
        const style = getStyle(toast.type);

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-2xl border transition-all duration-300 transform translate-y-0 opacity-100 ${style.card}`}
          >
            <div className={`p-1.5 rounded-xl shrink-0 ${style.iconWrap}`}>
              {style.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className={`font-bold text-xs tracking-wide uppercase font-mono ${style.title}`}>
                {toast.title}
              </div>
              <div className="text-xs text-white font-medium mt-1 leading-relaxed break-words">
                {toast.message}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition shrink-0"
              title="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
