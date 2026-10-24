import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Spinner } from './Feedback';
import { useToast } from './Toast';
import { api, ApiRequestError } from '../api';
import { usePortfolio } from '../usePortfolio';
import type { Project, ProjectInput, ProjectStatus, Coordinator } from '../types';
import { useAuth } from '../auth';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Project | null;
}

const STATUSES: ProjectStatus[] = ['Planning', 'Ongoing', 'Completed'];

export function ProjectFormModal({ open, onClose, editing }: Props) {
  const { user } = useAuth();
  const { notify } = useToast();
  const { reload } = usePortfolio();
  const isAdmin = user?.role === 'Admin';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [managedBy, setManagedBy] = useState<number | ''>('');
  const [coordinatorIds, setCoordinatorIds] = useState<number[]>([]);
  const [managers, setManagers] = useState<Coordinator[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.pro_title);
      setDescription(editing.pro_description);
      setDomain(editing.pro_domain);
      setStatus(editing.pro_status);
      setStartDate(editing.start_date);
      setEndDate(editing.end_date);
      setManagedBy(editing.pro_managed_by);
      setCoordinatorIds(editing.coordinators?.map((c) => c.user_id) ?? []);
    } else {
      setTitle('');
      setDescription('');
      setDomain('');
      setStatus('Planning');
      setStartDate('');
      setEndDate('');
      setManagedBy('');
      setCoordinatorIds([]);
    }
    setErrors({});
    setFormError('');
  }, [open, editing]);

  useEffect(() => {
    if (!open || !isAdmin) return;
    let active = true;
    setLoadingOpts(true);
    (async () => {
      try {
        const [m, c] = await Promise.all([api.projects.managers(), api.projects.coordinators()]);
        if (!active) return;
        setManagers(m.managers ?? []);
        setCoordinators(c.coordinators ?? []);
      } catch {
        // non-fatal
      } finally {
        if (active) setLoadingOpts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, isAdmin]);

  const toggleCoordinator = (id: number) => {
    setCoordinatorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError('');

    if (endDate && startDate && endDate < startDate) {
      setErrors((p) => ({ ...p, end_date: 'End date cannot be before start date.' }));
      return;
    }

    const isEdit = !!editing;
    const body: ProjectInput = {
      pro_title: title.trim(),
      pro_description: description.trim(),
      pro_domain: domain.trim(),
      pro_status: status,
      start_date: startDate,
      end_date: endDate,
    };

    if (isAdmin) {
      if (managedBy !== '') body.pro_managed_by = Number(managedBy);
      if (!isEdit) body.coordinator_ids = coordinatorIds;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.projects.update(editing!.pro_id, body);
        notify('Project updated.');
      } else {
        await api.projects.create(body);
        notify('Project created.');
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
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Project' : 'Create New Project'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="field-label">Title</label>
          <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          {errors.pro_title && <p className="field-error">{errors.pro_title}</p>}
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            className="field-input min-h-[90px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          {errors.pro_description && <p className="field-error">{errors.pro_description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Domain</label>
            <input className="field-input" value={domain} onChange={(e) => setDomain(e.target.value)} required />
            {errors.pro_domain && <p className="field-error">{errors.pro_domain}</p>}
          </div>
          <div>
            <label className="field-label">Status</label>
            <select className="field-select" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Start Date</label>
            <input type="date" className="field-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            {errors.start_date && <p className="field-error">{errors.start_date}</p>}
          </div>
          <div>
            <label className="field-label">End Date</label>
            <input type="date" className="field-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            {errors.end_date && <p className="field-error">{errors.end_date}</p>}
          </div>
        </div>

        {isAdmin && (
          <>
            <div>
              <label className="field-label">Project Manager</label>
              {loadingOpts ? (
                <div className="flex items-center gap-2 text-sm text-muted py-2">
                  <Spinner size={16} /> Loading managers…
                </div>
              ) : (
                <select
                  className="field-select"
                  value={managedBy}
                  onChange={(e) => setManagedBy(e.target.value ? Number(e.target.value) : '')}
                  required={!editing}
                >
                  <option value="">Select a manager…</option>
                  {managers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user_name}
                    </option>
                  ))}
                </select>
              )}
              {errors.pro_managed_by && <p className="field-error">{errors.pro_managed_by}</p>}
            </div>

            {!editing && (
              <div>
                <label className="field-label">Coordinators</label>
                {loadingOpts ? (
                  <div className="flex items-center gap-2 text-sm text-muted py-2">
                    <Spinner size={16} /> Loading coordinators…
                  </div>
                ) : coordinators.length === 0 ? (
                  <p className="text-sm text-muted">No coordinators available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {coordinators.map((c) => {
                      const active = coordinatorIds.includes(c.user_id);
                      return (
                        <button
                          key={c.user_id}
                          type="button"
                          onClick={() => toggleCoordinator(c.user_id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            active
                              ? 'bg-saffron text-white border-saffron'
                              : 'bg-white text-muted border-border hover:border-saffron'
                          }`}
                        >
                          {c.user_name}
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.coordinator_ids && <p className="field-error">{errors.coordinator_ids}</p>}
              </div>
            )}
          </>
        )}

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
            {editing ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
