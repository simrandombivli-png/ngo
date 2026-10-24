import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertTriangle : Info;
          const accent =
            t.type === 'success'
              ? 'text-saffron'
              : t.type === 'error'
                ? 'text-red-400'
                : 'text-golden';
          return (
            <div
              key={t.id}
              className="bg-charcoal text-cream px-4 py-3 rounded-xl shadow-xl border border-golden/50 text-xs flex items-start gap-2 animate-slide-up"
            >
              <span className={accent + ' mt-0.5'}>
                <Icon size={16} />
              </span>
              <span className="flex-1 leading-relaxed">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-cream/60 hover:text-cream"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
