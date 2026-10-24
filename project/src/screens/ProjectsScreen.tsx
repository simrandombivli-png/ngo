import { useMemo, useState } from 'react';
import { Plus, Search, FolderKanban, ArrowLeft, Pencil, Archive, Trash2, Users2 } from 'lucide-react';
import { useAuth } from '../auth';
import { api, ApiRequestError } from '../api';
import { usePortfolio, progressForProject } from '../usePortfolio';
import { useToast } from '../components/Toast';
import { confirm } from '../components/Confirm';
import { InlineLoader, ErrorState, EmptyState } from '../components/Feedback';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { Modal } from '../components/Modal';
import { projectStatusBadgeClass, formatDate } from '../lib/format';
import type { Project, ProjectStatus } from '../types';

const STATUS_FILTERS: ('All' | ProjectStatus)[] = ['All', 'Planning', 'Ongoing', 'Completed'];

export function ProjectsScreen() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { projects, tasks, loading, error, reload } = usePortfolio();
  const isAdmin = user?.role === 'Admin';

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [detail, setDetail] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== 'All' && p.pro_status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          p.pro_title.toLowerCase().includes(q) ||
          p.pro_description.toLowerCase().includes(q) ||
          p.pro_domain.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, statusFilter, query]);

  async function handleArchive(p: Project) {
    const ok = await confirm({
      title: 'Archive Project',
      message: `Archive "${p.pro_title}"? It can be restored later from the Archived page.`,
      confirmLabel: 'Archive',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.projects.remove(p.pro_id);
      notify('Project archived.');
      await reload();
    } catch (err) {
      notify(err instanceof ApiRequestError ? err.message : 'Cannot reach the server, please try again', 'error');
    }
  }

  function openEdit(p: Project) {
    setEditing(p);
    setFormOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  if (loading) return <InlineLoader label="Loading projects…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-charcoal">Projects Directory</h1>
          <p className="text-sm text-muted mt-0.5">Explore projects, delivery progress, and assignments.</p>
        </div>
        {isAdmin && (
          <button type="button" onClick={openCreate} className="btn-primary self-start sm:self-auto">
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="field-input pl-9"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-charcoal text-white'
                  : 'bg-white text-muted border border-border'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No projects found"
          subtitle="Try adjusting your search or filters."
          icon={<FolderKanban size={24} />}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filtered.map((p) => {
            const pct = progressForProject(p.pro_id, tasks);
            return (
              <div key={p.pro_id} className="card-hover p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`badge ${projectStatusBadgeClass(p.pro_status)}`}>{p.pro_status}</span>
                    <span className="text-xs text-muted">{p.pro_domain}</span>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-charcoal mb-2">{p.pro_title}</h3>
                  <p className="text-xs text-muted leading-relaxed mb-4 line-clamp-3">{p.pro_description}</p>
                  <div className="space-y-2 text-xs text-muted mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-saffron"><Users2 size={14} /></span>
                      <span>Lead: <strong className="text-charcoal">{p.manager_name}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-saffron"><FolderKanban size={14} /></span>
                      <span>Coordinators: {p.coordinators?.length ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/70">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-charcoal">{pct}% Delivery</span>
                    <span className="text-muted">
                      {formatDate(p.start_date)} → {formatDate(p.end_date)}
                    </span>
                  </div>
                  <div className="w-full bg-cream h-2.5 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#F47B20' : '#F9B233' }}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetail(p)}
                      className="text-xs font-semibold text-saffron hover:underline cursor-pointer"
                    >
                      View details →
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                      {(isAdmin || user?.role === 'Project_Manager') && (
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="w-8 h-8 rounded-lg text-muted hover:text-saffron hover:bg-cream flex items-center justify-center cursor-pointer"
                          title="Edit project"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleArchive(p)}
                          className="w-8 h-8 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                          title="Archive project"
                        >
                          <Archive size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <ProjectDetailModal
        project={detail}
        onClose={() => setDetail(null)}
        onEdit={(p) => {
          setDetail(null);
          openEdit(p);
        }}
      />
    </div>
  );
}

function ProjectDetailModal({
  project,
  onClose,
  onEdit,
}: {
  project: Project | null;
  onClose: () => void;
  onEdit: (p: Project) => void;
}) {
  const { user } = useAuth();
  const { tasks } = usePortfolio();
  if (!project) return null;
  const pct = progressForProject(project.pro_id, tasks);
  const canEdit = user?.role === 'Admin' || (user?.role === 'Project_Manager' && project.pro_managed_by === user.user_id);

  return (
    <Modal open={!!project} onClose={onClose} title={project.pro_title} size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${projectStatusBadgeClass(project.pro_status)}`}>{project.pro_status}</span>
          <span className="text-xs text-muted">{project.pro_domain}</span>
        </div>

        <p className="text-sm text-muted leading-relaxed">{project.pro_description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="card p-4">
            <p className="text-xs text-muted mb-1">Project Manager</p>
            <p className="font-medium text-charcoal">{project.manager_name}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-muted mb-1">Timeline</p>
            <p className="font-medium text-charcoal">
              {formatDate(project.start_date)} → {formatDate(project.end_date)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted mb-2">Delivery Progress ({pct}%)</p>
          <div className="w-full bg-cream h-3 rounded-full overflow-hidden border border-border">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#F47B20' : '#F9B233' }}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted mb-2">Coordinators</p>
          {project.coordinators && project.coordinators.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.coordinators.map((c) => (
                <span key={c.user_id} className="px-3 py-1.5 rounded-lg bg-cream border border-border text-xs font-medium text-charcoal">
                  {c.user_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No coordinators assigned.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border/70">
          <button type="button" onClick={onClose} className="btn-secondary">
            <ArrowLeft size={16} /> Close
          </button>
          {canEdit && (
            <button type="button" onClick={() => onEdit(project)} className="btn-primary">
              <Pencil size={16} /> Edit Project
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
