import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Spinner } from './Feedback';
import { useToast } from './Toast';
import { api, ApiRequestError } from '../api';
import { usePortfolio } from '../usePortfolio';
import type { Task, TaskInput, TaskPriority, TaskStatus, Coordinator } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Task | null;
}

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
const STATUSES: TaskStatus[] = ['Pending', 'In_Progress', 'Completed'];

export function TaskFormModal({ open, onClose, editing }: Props) {
  const { notify } = useToast();
  const { reload, projects } = usePortfolio();

  const [projectId, setProjectId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loadingCoord, setLoadingCoord] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setProjectId(editing.project_id);
      setTitle(editing.task_title);
      setDescription(editing.task_description);
      setAssignedTo(editing.task_assigned_to ?? '');
      setPriority(editing.task_priority);
      setDeadline(editing.deadline ?? '');
      setStatus(editing.task_status);
    } else {
      setProjectId('');
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setPriority('Medium');
      setDeadline('');
      setStatus('Pending');
    }
    setErrors({});
    setFormError('');
  }, [open, editing]);

  // When a project is selected, load its coordinators for the assign-to dropdown.
  useEffect(() => {
    if (!open || projectId === '') {
      setCoordinators([]);
      return;
    }
    let active = true;
    setLoadingCoord(true);
    (async () => {
      try {
        const res = await api.tasks.projectCoordinators(projectId);
        if (!active) return;
        setCoordinators(res.coordinators ?? []);
      } catch {
        if (!active) return;
        setCoordinators([]);
      } finally {
        if (active) setLoadingCoord(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setSaving(true);

    const isEdit = !!editing;
    const body: TaskInput = {
      task_title: title.trim(),
      task_description: description.trim(),
      task_priority: priority,
      deadline: deadline || null,
    };

    if (!isEdit) {
      if (projectId === '') {
        setErrors((p) => ({ ...p, project_id: 'Select a project.' }));
        setSaving(false);
        return;
      }
      body.project_id = Number(projectId);
      body.task_assigned_to = assignedTo === '' ? null : Number(assignedTo);
    } else {
      body.task_status = status;
      body.task_assigned_to = assignedTo === '' ? null : Number(assignedTo);
    }

    try {
      if (isEdit) {
        await api.tasks.update(editing!.task_id, body);
        notify('Task updated.');
      } else {
        await api.tasks.create(body);
        notify('Task created.');
      }
      await reload();
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
        if (err.errors && !Array.isArray(err.errors)) setErrors(err.errors as Record<string, string>);
      } else {
        setFormError('Cannot reach the server, please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Task' : 'Create New Task'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {!editing && (
          <div>
            <label className="field-label">Project</label>
            <select
              className="field-select"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value ? Number(e.target.value) : '');
                setAssignedTo('');
              }}
              required
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.pro_id} value={p.pro_id}>
                  {p.pro_title}
                </option>
              ))}
            </select>
            {errors.project_id && <p className="field-error">{errors.project_id}</p>}
          </div>
        )}

        <div>
          <label className="field-label">Task Title</label>
          <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          {errors.task_title && <p className="field-error">{errors.task_title}</p>}
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            className="field-input min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.task_description && <p className="field-error">{errors.task_description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Assign To</label>
            {loadingCoord ? (
              <div className="flex items-center gap-2 text-sm text-muted py-2">
                <Spinner size={16} /> Loading…
              </div>
            ) : (
              <select
                className="field-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Unassigned</option>
                {coordinators.map((c) => (
                  <option key={c.user_id} value={c.user_id}>
                    {c.user_name}
                  </option>
                ))}
              </select>
            )}
            {errors.task_assigned_to && <p className="field-error">{errors.task_assigned_to}</p>}
          </div>
          <div>
            <label className="field-label">Priority</label>
            <select className="field-select" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Deadline</label>
            <input type="date" className="field-input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            {errors.deadline && <p className="field-error">{errors.deadline}</p>}
          </div>
          {editing && (
            <div>
              <label className="field-label">Status</label>
              <select className="field-select" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'In_Progress' ? 'In Progress' : s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {formError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner size={16} className="border-white border-t-transparent" /> : null}
            {editing ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
