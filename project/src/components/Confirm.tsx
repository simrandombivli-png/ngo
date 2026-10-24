import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

let openHandler: ((opts: ConfirmOptions, resolve: (v: boolean) => void) => void) | null = null;

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (openHandler) openHandler(opts, resolve);
    else resolve(false);
  });
}

export function ConfirmHost() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  useEffect(() => {
    openHandler = (o, r) => {
      setOpts(o);
      setResolver(() => r);
    };
    return () => {
      openHandler = null;
    };
  }, []);

  const close = (val: boolean) => {
    if (resolver) resolver(val);
    setOpts(null);
    setResolver(null);
  };

  return (
    <Modal
      open={!!opts}
      title={opts?.title ?? ''}
      onClose={() => close(false)}
      size="sm"
    >
      <div className="space-y-5">
        <div className="flex gap-3">
          {opts?.danger && (
            <span className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </span>
          )}
          <p className="text-sm text-muted leading-relaxed">{opts?.message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => close(false)} className="btn-secondary">
            {opts?.cancelLabel ?? 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={opts?.danger ? 'btn-danger' : 'btn-primary'}
          >
            {opts?.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
