import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearToken, getStoredUser, getToken, saveUser, setToken, setOnUnauthorized } from './api';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => !!getToken());

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      clearToken();
      setUser(null);
    });
    return () => setOnUnauthorized(() => {});
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await api.auth.me();
        if (!active) return;
        setUser(res.user);
        saveUser(res.user);
      } catch {
        if (!active) return;
        clearToken();
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setToken(res.token);
    saveUser(res.user);
    setUser(res.user);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.auth.me();
    setUser(res.user);
    saveUser(res.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
