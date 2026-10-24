import { useState, type ReactNode } from 'react';
import {
  LayoutGrid,
  FolderKanban,
  ListTodo,
  Archive,
  KeyRound,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../auth';
import { roleBadgeClass, roleLabel } from '../lib/format';
import type { Role } from '../types';

export type View =
  | 'dashboard'
  | 'projects'
  | 'tasks'
  | 'archived'
  | 'password';

interface NavItem {
  id: View;
  label: string;
  icon: typeof LayoutGrid;
  roles: Role[];
}

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['Admin', 'Project_Manager', 'Coordinator'] },
  { id: 'projects', label: 'Projects', icon: FolderKanban, roles: ['Admin', 'Project_Manager', 'Coordinator'] },
  { id: 'tasks', label: 'Tasks', icon: ListTodo, roles: ['Admin', 'Project_Manager', 'Coordinator'] },
  { id: 'archived', label: 'Archived', icon: Archive, roles: ['Admin'] },
  { id: 'password', label: 'Change Password', icon: KeyRound, roles: ['Admin', 'Project_Manager', 'Coordinator'] },
];

interface ShellProps {
  view: View;
  onView: (v: View) => void;
  children: ReactNode;
}

export function AppShell({ view, onView, children }: ShellProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return null;

  const items = NAV.filter((n) => n.roles.includes(user.role));

  const handleNav = (v: View) => {
    onView(v);
    setMobileOpen(false);
  };

  return (
    <div className="outer-golden-frame animate-fade-in">
      <div className="inner-white-viewport">
        {/* Top Navigation Bar */}
        <header className="w-full border-b border-border/70 bg-white sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden text-muted hover:text-charcoal cursor-pointer"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div>
              <span className="text-[10px] tracking-widest uppercase text-muted font-semibold block">
                Sevavardhini Platform
              </span>
              <h2 className="text-lg sm:text-xl font-heading font-semibold text-charcoal leading-tight">
                Project Workspace
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`badge ${roleBadgeClass(user.role)} hidden sm:inline`}>
              {roleLabel(user.role)}
            </span>
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium text-charcoal">{user.user_name}</span>
              <span className="text-xs text-muted">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-9 h-9 rounded-xl bg-cream hover:bg-saffron hover:text-white text-muted flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Body Area */}
        <div className="flex-1 flex relative">
          {/* Desktop Floating Pill Sidebar */}
          <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border/70 bg-cream/40 p-4">
            <nav className="flex flex-col gap-1">
              {items.map((n) => {
                const Icon = n.icon;
                const active = view === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNav(n.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-saffron text-white shadow-sm'
                        : 'text-muted hover:text-charcoal hover:bg-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{n.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-charcoal/50" onClick={() => setMobileOpen(false)}>
              <div
                className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-border p-4 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-heading font-semibold text-charcoal">Navigation</span>
                  <button type="button" onClick={() => setMobileOpen(false)} className="text-muted">
                    <X size={18} />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {items.map((n) => {
                    const Icon = n.icon;
                    const active = view === n.id;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNav(n.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                          active ? 'bg-saffron text-white' : 'text-muted hover:bg-cream'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{n.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}

          {/* Main View Area */}
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
        </div>

        {/* Footer */}
        <footer className="w-full px-6 sm:px-8 py-3 border-t border-border/60 bg-white flex items-center justify-between text-xs text-muted">
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            {roleLabel(user.role)}
          </span>
          <span className="text-[11px] text-muted/60">
            Sevavardhini Project Management Platform
          </span>
        </footer>
      </div>
    </div>
  );
}
