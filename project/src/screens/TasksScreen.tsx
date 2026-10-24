import { useMemo, useState } from 'react';
import { Plus, Search, ListTodo, Pencil, Trash2, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../auth';
import { api, ApiRequestError } from '../api';
import { usePortfolio } from '../usePortfolio';
import { useToast } from '../components/Toast';
import { confirm } from '../components/Confirm';
import { InlineLoader, ErrorState, EmptyState } from '../components/Feedback';
import { TaskFormModal } from '../components/TaskFormModal';
import {
  taskStatusBadgeClass,
  taskStatusDisplay,
  priorityBadgeClass,
  formatDate,
} from '../lib/format';
import type { Task, TaskStatus, TaskPriority } from '../types';

const STATUS_FILTERS: ('All' | TaskStatus)[] = ['All', 'Pending', 'In_Progress', 'Completed'];
const PRIORITY_FILTERS: ('All' | TaskPriority)[] = ['All', 'Low', 'Medium', 'High'];

export function TasksScreen() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { tasks, projects, loading, error, reload } = usePortfolio();
  const isAdmin = user?.role === 'Admin';
  const isPM = user?.role === 'Project_Manager';
  const canManage = isAdmin || isPM;

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>('All');
  const [projectFilter, setProjectFilter] = useState<'All' | number>('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'All' && t.task_status !== statusFilter) return false;
      if (priorityFilter !== 'All' && t.task_priority !== priorityFilter) return false;
      if (projectFilter !== 'All' && t.project_id !== projectFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          t.task_title.toLowerCase().includes(q) ||
          t.task_description.toLowerCase().includes(q) ||
          (t.pro_title ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, projectFilter, query]);

  async function cycleStatus(task: Task) {
    const next: TaskStatus =
      task.task_status === 'Pending' ? 'In_Progress' : task.task_status === 'In_Progress' ? 'Completed' : 'Pending';
    setToggling(task.task_id);
    try {
      await api.tasks.updateStatus(task.task_id, next);
      await reload();
      notify(`Task marked ${taskStatusDisplay(next)}.`);
    } catch (err) {
      notify(err instanceof ApiRequestError ? err.message : 'Cannot reach the server, please try again', 'error');
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(task: Task) {
    const ok = await confirm({
      title: 'Delete Task',
      message: `Delete "${task.task_title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.tasks.remove(task.task_id);
      notify('Task deleted.');
      await reload();
    } catch (err) {
      notify(err instanceof ApiRequestError ? err.message : 'Cannot reach the server, please try again', 'error');
    }
  }

  function openEdit(t: Task) {
    setEditing(t);
    setFormOpen(true);
  }
  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  if (loading) return <InlineLoader label="Loading tasks…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-charcoal">Tasks Board</h1>
          <p className="text-sm text-muted mt-0.5">Track and manage tasks across your projects.</p>
        </div>
        {canManage && (
          <button type="button" onClick={openCreate} className="btn-primary self-start sm:self-auto">
            <Plus size={18} /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            className="field-input pl-9"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={projectFilter}
            onChange={(e) =>
              setProjectFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))
            }
            className="field-select w-auto"
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.pro_id} value={p.pro_id}>
                {p.pro_title}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'All' | TaskPriority)}
            className="field-select w-auto"
          >
            {PRIORITY_FILTERS.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All Priorities' : p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === s ? 'bg-charcoal text-white' : 'bg-white text-muted border border-border'
            }`}
          >
            {s === 'In_Progress' ? 'In Progress' : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No tasks found" subtitle="Try adjusting your filters." icon={<ListTodo size={24} />} />
      ) : (
        <div className="card divide-y divide-border/60 overflow-hidden">
          {filtered.map((t) => {
            const isCompleted = t.task_status === 'Completed';
            const isCoord = user?.role === 'Coordinator';
            const canToggle = canManage || (isCoord && t.task_assigned_to === user?.user_id);
            const busy = toggling === t.task_id;
            return (
              <div
                key={t.task_id}
                className={`p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-cream/50 transition-colors ${
                  isCompleted ? 'bg-cream/30' : ''
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  {canToggle ? (
                    <button
                      type="button"
                      onClick={() => cycleStatus(t)}
                      disabled={busy}
                      className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-saffron border-saffron text-white'
                          : 'border-border hover:border-saffron bg-white'
                      }`}
                      aria-label="Toggle task status"
                      title="Cycle status: Pending → In Progress → Completed"
                    >
                      {busy ? <Spinner size={14} /> : isCompleted ? <Check size={14} /> : null}
                    </button>
                  ) : (
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                        isCompleted ? 'bg-saffron border-saffron text-white' : 'border-border bg-white'
                      }`}
                    >
                      {isCompleted && <Check size={14} />}
                    </span>
                  )}

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4
                        className={`text-sm font-semibold text-charcoal ${
                          isCompleted ? 'line-through text-muted' : ''
                        }`}
                      >
                        {t.task_title}
                      </h4>
                      <span className={`badge ${priorityBadgeClass(t.task_priority)}`}>{t.task_priority}</span>
                    </div>
                    {t.task_description && (
                      <p className="text-xs text-muted mb-1.5 line-clamp-1">{t.task_description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="font-medium text-charcoal">{t.pro_title}</span>
                      <span>•</span>
                      <span>Assignee: {t.assigned_to_name ?? 'Unassigned'}</span>
                      <span>•</span>
                      <span>Due {formatDate(t.deadline)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-center">
                  <span className={`badge ${taskStatusBadgeClass(t.task_status)}`}>
                    {taskStatusDisplay(t.task_status)}
                  </span>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="w-8 h-8 rounded-lg text-muted hover:text-saffron hover:bg-cream flex items-center justify-center cursor-pointer"
                        title="Edit task"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        className="w-8 h-8 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
    </div>
  );
}
