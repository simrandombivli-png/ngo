export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full border-saffron border-t-transparent animate-spin ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size / 8)),
      }}
      aria-label="Loading"
    />
  );
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 gap-4">
      <Spinner size={48} />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function InlineLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner size={36} />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-cream border border-border flex items-center justify-center text-saffron">
        <span className="text-xl">!</span>
      </div>
      <p className="text-sm text-charcoal max-w-md">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-1">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      {icon && <div className="w-14 h-14 rounded-2xl bg-cream border border-border flex items-center justify-center text-muted mb-1">{icon}</div>}
      <h3 className="text-base font-heading font-semibold text-charcoal">{title}</h3>
      {subtitle && <p className="text-sm text-muted max-w-sm">{subtitle}</p>}
    </div>
  );
}
