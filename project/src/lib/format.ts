import type { ProjectStatus, TaskStatus, TaskPriority, Role } from './types';

export function roleLabel(role: Role): string {
  if (role === 'Project_Manager') return 'Project Manager';
  return role;
}

export function roleBadgeClass(role: Role): string {
  if (role === 'Admin') return 'bg-charcoal text-cream border border-golden/40';
  if (role === 'Project_Manager') return 'bg-saffron text-white';
  return 'bg-golden text-charcoal';
}

export function projectStatusBadgeClass(status: ProjectStatus): string {
  if (status === 'Completed') return 'bg-charcoal text-white';
  if (status === 'Ongoing') return 'bg-cream text-saffron border border-saffron/40';
  return 'bg-cream text-golden border border-golden/40';
}

export function taskStatusBadgeClass(status: TaskStatus): string {
  if (status === 'Completed') return 'bg-charcoal text-white';
  if (status === 'In_Progress') return 'bg-saffron text-white';
  return 'bg-cream text-muted border border-border';
}

export function taskStatusDisplay(status: TaskStatus): string {
  return status === 'In_Progress' ? 'In Progress' : status;
}

export function priorityBadgeClass(priority: TaskPriority): string {
  if (priority === 'High') return 'bg-cream text-saffron border border-saffron/40';
  if (priority === 'Medium') return 'bg-cream text-golden border border-golden/40';
  return 'bg-inputbg text-muted';
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function progressPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}
