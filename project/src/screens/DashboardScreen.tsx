import { useMemo } from 'react';
import { FolderKanban, ListChecks, Clock, CircleDot } from 'lucide-react';
import { useAuth } from '../auth';
import { usePortfolio, progressForProject } from '../usePortfolio';
import { InlineLoader, ErrorState, EmptyState } from '../components/Feedback';
import { projectStatusBadgeClass, formatDate, roleLabel } from '../lib/format';
import type { View } from './AppShell';

interface Props {
  onView: (v: View) => void;
}

export function DashboardScreen({ onView }: Props) {
  const { user } = useAuth();
  const { projects, tasks, loading, error, reload } = usePortfolio();

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.pro_status !== 'Completed').length;
    const done = tasks.filter((t) => t.task_status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.task_status === 'In_Progress').length;
    const pending = tasks.filter((t) => t.task_status === 'Pending').length;
    return { active, done, inProgress, pending, totalTasks: tasks.length };
  }, [projects, tasks]);

  if (loading) return <InlineLoader label="Loading your workspace…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const cards = [
    {
      label: 'Active Projects',
      value: stats.active,
      sub: 'Under delivery',
      icon: FolderKanban,
      accent: 'text-saffron',
      bg: 'bg-cream',
    },
    {
      label: 'Tasks Completed',
      value: `${stats.done}/${stats.totalTasks}`,
      sub: 'Milestones met',
      icon: ListChecks,
      accent: 'text-golden',
      bg: 'bg-cream',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      sub: 'Being worked on',
      icon: CircleDot,
      accent: 'text-saffron',
      bg: 'bg-cream',
    },
    {
      label: 'Pending',
      value: stats.pending,
      sub: 'Not yet started',
      icon: Clock,
      accent: 'text-muted',
      bg: 'bg-inputbg',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-charcoal">
            {roleLabel(user!.role)} Overview
          </h1>
          <p className="text-sm text-muted mt-0.5">Live snapshot of your projects and tasks.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <article key={c.label} className="card-hover p-6 group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-heading font-medium text-muted">{c.label}</h3>
                <span
                  className={`w-10 h-10 rounded-xl ${c.bg} ${c.accent} flex items-center justify-center group-hover:scale-105 transition-transform`}
                >
                  <Icon size={20} />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold font-body text-charcoal">{c.value}</span>
                <span className="text-xs font-semibold text-saffron uppercase tracking-wider">{c.sub}</span>
              </div>
            </article>
          );
        })}
      </section>

      {/* Project Pulse */}
      <section className="card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-heading font-semibold text-charcoal">Project Pulse</h2>
            <p className="text-sm text-muted mt-0.5">Delivery progress from completed tasks.</p>
          </div>
          <button
            type="button"
            onClick={() => onView('projects')}
            className="text-xs font-semibold text-saffron hover:underline cursor-pointer"
          >
            View all →
          </button>
        </div>

        {projects.length === 0 ? (
          <EmptyState title="No projects yet" subtitle="Projects you manage will appear here." icon={<FolderKanban size={24} />} />
        ) : (
          <div className="space-y-5">
            {projects.slice(0, 5).map((p) => {
              const pct = progressForProject(p.pro_id, tasks);
              return (
                <div key={p.pro_id} className="bg-cream/60 rounded-xl border border-border/70 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold font-heading text-charcoal">{p.pro_title}</h3>
                      <span className={`badge ${projectStatusBadgeClass(p.pro_status)}`}>
                        {p.pro_status}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-charcoal">{pct}%</span>
                  </div>
                  <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? '#F47B20' : '#F9B233',
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>Lead: <strong className="text-charcoal">{p.manager_name}</strong></span>
                    <span>Due {formatDate(p.end_date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
