import { useState, type FormEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../auth';
import { useToast } from '../components/Toast';
import { Spinner } from '../components/Feedback';
import { ApiRequestError } from '../api';

export function LoginScreen() {
  const { login } = useAuth();
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setErrors({});
    setLoading(true);
    try {
      await login(email.trim(), password);
      notify('Welcome back. Session active.');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
        if (err.errors && !Array.isArray(err.errors)) {
          setErrors(err.errors as Record<string, string>);
        }
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-golden/40 overflow-hidden flex flex-col md:flex-row min-h-[640px]">
        {/* Left Panel (White 60%) */}
        <section className="w-full md:w-[60%] bg-white p-8 sm:p-12 md:p-16 flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <span className="text-xs uppercase tracking-widest text-muted font-semibold">
                Sevavardhini Workspace
              </span>
              <h1 className="text-4xl sm:text-5xl font-semibold font-heading text-charcoal mt-2 mb-2">
                Namaste
              </h1>
              <p className="text-sm text-muted">
                Sign in with your organizational credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="field-label">
                  Login:
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.ngo"
                  className="field-input"
                  autoComplete="email"
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="field-label">
                  Password:
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security passkey"
                  className="field-input"
                  autoComplete="current-password"
                />
                {errors.password && <p className="field-error">{errors.password}</p>}
              </div>

              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-saffron hover:bg-saffronDark active:scale-[0.99] text-white font-medium rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Spinner size={18} className="border-white border-t-transparent" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <span className="transition-transform group-hover:translate-x-1">
                        <ChevronRight size={18} />
                      </span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-muted text-center pt-1">
                Your role is detected automatically after sign-in.
              </p>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-border/70 flex items-center justify-between text-xs text-muted">
            <span>Need an access invite? Contact your system administrator.</span>
          </div>
        </section>

        {/* Right Panel (Golden 40% Accent) */}
        <section className="w-full md:w-[40%] bg-golden p-8 sm:p-12 flex flex-col justify-between text-white relative">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wider uppercase text-white mb-6">
              Our Shared Mission
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading text-white font-semibold leading-tight mb-4">
              Make every effort count.
            </h2>
            <p className="text-base text-white/95 leading-relaxed font-body">
              A clear, shared workspace for the people turning good intentions into measurable
              change.
            </p>
          </div>

          <div className="pt-8 border-t border-white/25">
            <span className="text-xs text-white/80">Sevavardhini Project Workspace</span>
          </div>
        </section>
      </div>
    </div>
  );
}
