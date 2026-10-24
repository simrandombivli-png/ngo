import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../auth';
import { api, ApiRequestError } from '../api';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Feedback';

export function PasswordScreen() {
  const { notify } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError('');

    if (next.length < 8 || next.length > 72) {
      setErrors((p) => ({ ...p, new_password: 'New password must be 8 to 72 characters.' }));
      return;
    }
    if (next === current) {
      setErrors((p) => ({ ...p, new_password: 'New password must differ from the current one.' }));
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.changePassword(current, next);
      notify(res.message || 'Password changed successfully.');
      setCurrent('');
      setNext('');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
        if (err.errors && !Array.isArray(err.errors)) setErrors(err.errors as Record<string, string>);
      } else {
        setFormError('Cannot reach the server, please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-lg">
      <div className="pb-4 border-b border-border/70">
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-charcoal">Change Password</h1>
        <p className="text-sm text-muted mt-0.5">Update your account security passkey.</p>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="w-12 h-12 rounded-2xl bg-cream text-saffron flex items-center justify-center mb-6">
          <KeyRound size={22} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="field-label">Current Password</label>
            <input
              type="password"
              className="field-input"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
            />
            {errors.current_password && <p className="field-error">{errors.current_password}</p>}
          </div>
          <div>
            <label className="field-label">New Password</label>
            <input
              type="password"
              className="field-input"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
            />
            <p className="text-xs text-muted mt-1">8 to 72 characters, must differ from current.</p>
            {errors.new_password && <p className="field-error">{errors.new_password}</p>}
          </div>

          {formError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Spinner size={16} className="border-white border-t-transparent" /> : <KeyRound size={16} />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
