import { useCallback, useEffect, useState } from 'react';
import { Archive, RotateCcw } from 'lucide-react';
import { api, ApiRequestError } from '../api';
import { useToast } from '../components/Toast';
import { InlineLoader, ErrorState, EmptyState } from '../components/Feedback';
import { projectStatusBadgeClass, formatDate } from '../lib/format';
import type { Project } from '../types';

export function ArchivedScreen() {
  const { notify } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoring, setRestoring] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.projects.archived();
      setProjects(res.projects ?? []);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Cannot reach the server, please try again');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRestore(p: Project) {
    setRestoring(p.pro_id);
    try {
      await api.projects.restore(p.pro_id);
      notify(`"${p.pro_title}" restored.`);
      await load();
    } catch (err) {
      notify(err instanceof ApiRequestError ? err.message : 'Cannot reach the server, please try again', 'error');
    } finally {
      setRestoring(null);
    }
  }

  if (loading) return <InlineLoader label="Loading archived projects…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-border/70">
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-charcoal">Archived Projects</h1>
        <p className="text-sm text-muted mt-0.5">Restore archived projects back to active status.</p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No archived projects"
          subtitle="Archived projects will appear here for restoration."
          icon={<Archive size={24} />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div key={p.pro_id} className="card-hover p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`badge ${projectStatusBadgeClass(p.pro_status)}`}>{p.pro_status}</span>
                  <span className="text-xs text-muted">{p.pro_domain}</span>
                </div>
                <h3 className="text-xl font-heading font-semibold text-charcoal mb-2">{p.pro_title}</h3>
                <p className="text-xs text-muted leading-relaxed mb-4 line-clamp-3">{p.pro_description}</p>
                <div className="space-y-2 text-xs text-muted mb-4">
                  <div>Lead: <strong className="text-charcoal">{p.manager_name}</strong></div>
                  <div>{formatDate(p.start_date)} → {formatDate(p.end_date)}</div>
                </div>
              </div>
              <div className="pt-4 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => handleRestore(p)}
                  disabled={restoring === p.pro_id}
                  className="btn-primary w-full"
                >
                  <RotateCcw size={16} />
                  {restoring === p.pro_id ? 'Restoring…' : 'Restore Project'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
