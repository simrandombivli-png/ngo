import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiRequestError } from './api';
import type { Project, Task } from './types';

interface PortfolioData {
  projects: Project[];
  tasks: Task[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}

const initial: PortfolioData = {
  projects: [],
  tasks: [],
  loading: true,
  error: '',
  reload: async () => {},
};

export function usePortfolio(): PortfolioData {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, tRes] = await Promise.all([api.projects.list(), api.tasks.list()]);
      if (!mounted.current) return;
      setProjects(pRes.projects ?? []);
      setTasks(tRes.tasks ?? []);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof ApiRequestError ? err.message : 'Cannot reach the server, please try again');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  return { projects, tasks, loading, error, reload };
}

export function progressForProject(projectId: number, tasks: Task[]): number {
  const relevant = tasks.filter((t) => t.project_id === projectId);
  if (relevant.length === 0) return 0;
  const done = relevant.filter((t) => t.task_status === 'Completed').length;
  return Math.round((done / relevant.length) * 100);
}
