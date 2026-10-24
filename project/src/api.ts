import type {
  User,
  Project,
  ProjectInput,
  Task,
  TaskInput,
  Coordinator,
  ApiError,
} from './types';

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'https://sevavardhini-backend.onrender.com';

const TOKEN_KEY = 'ngo_token';
const USER_KEY = 'ngo_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export class ApiRequestError extends Error {
  status: number;
  errors?: Record<string, string> | string[];
  constructor(message: string, status: number, errors?: Record<string, string> | string[]) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errors = errors;
  }
}

let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: () => void): void {
  onUnauthorized = fn;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  // When true, do not send Authorization header (used by login).
  noAuth?: boolean;
  // When true, a 401 is not treated as session-expiry (used by /auth/me restore).
  tolerate401?: boolean;
  query?: Record<string, string | number | undefined>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, noAuth = false, tolerate401 = false, query } = opts;

  let url = `${API_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        params.append(k, String(v));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!noAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError('Cannot reach the server, please try again', 0);
  }

  let data: Record<string, unknown> | null = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      // non-JSON body
    }
  }

  if (!res.ok) {
    const message =
      (data && (data.message as string)) ||
      (res.status === 403
        ? 'You do not have permission'
        : res.status === 429
          ? 'Too many login attempts, please wait 15 minutes'
          : `Request failed (${res.status})`);
    const errors = data && (data.errors as Record<string, string> | string[] | undefined);

    if (res.status === 401 && !tolerate401 && onUnauthorized) {
      clearToken();
      onUnauthorized();
    }

    throw new ApiRequestError(message, res.status, errors);
  }

  return (data ?? {}) as T;
}

// ---------- Auth ----------

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

interface MeResponse {
  success: boolean;
  user: User;
}

interface MessageResponse {
  success: boolean;
  message: string;
}

export const api = {
  auth: {
    login(email: string, password: string): Promise<LoginResponse> {
      return request<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        noAuth: true,
      });
    },
    me(): Promise<MeResponse> {
      return request<MeResponse>('/api/auth/me', { tolerate401: true });
    },
    changePassword(current_password: string, new_password: string): Promise<MessageResponse> {
      return request<MessageResponse>('/api/auth/change-password', {
        method: 'PATCH',
        body: { current_password, new_password },
      });
    },
  },

  projects: {
    list(params?: { status?: string; q?: string }): Promise<{ success: boolean; projects: Project[] }> {
      return request('/api/projects', { query: params });
    },
    get(id: number | string): Promise<{ success: boolean; project: Project }> {
      return request(`/api/projects/${id}`);
    },
    managers(): Promise<{ success: boolean; managers: Coordinator[] }> {
      return request('/api/projects/managers');
    },
    coordinators(): Promise<{ success: boolean; coordinators: Coordinator[] }> {
      return request('/api/projects/coordinators');
    },
    create(input: ProjectInput): Promise<{ success: boolean; project: Project }> {
      return request('/api/projects', { method: 'POST', body: input });
    },
    update(id: number | string, input: ProjectInput): Promise<{ success: boolean; project: Project }> {
      return request(`/api/projects/${id}`, { method: 'PATCH', body: input });
    },
    remove(id: number | string): Promise<MessageResponse> {
      return request(`/api/projects/${id}`, { method: 'DELETE' });
    },
    archived(): Promise<{ success: boolean; projects: Project[] }> {
      return request('/api/projects/archived');
    },
    restore(id: number | string): Promise<MessageResponse> {
      return request(`/api/projects/${id}/restore`, { method: 'POST' });
    },
  },

  tasks: {
    list(params?: {
      project_id?: number;
      status?: string;
      priority?: string;
      assigned_to?: number;
      q?: string;
    }): Promise<{ success: boolean; tasks: Task[] }> {
      return request('/api/tasks', { query: params as Record<string, string | number | undefined> });
    },
    get(id: number | string): Promise<{ success: boolean; task: Task }> {
      return request(`/api/tasks/${id}`);
    },
    projectCoordinators(projectId: number | string): Promise<{ success: boolean; coordinators: Coordinator[] }> {
      return request(`/api/tasks/project/${projectId}/coordinators`);
    },
    create(input: TaskInput): Promise<{ success: boolean; task: Task }> {
      return request('/api/tasks', { method: 'POST', body: input });
    },
    update(id: number | string, input: TaskInput): Promise<{ success: boolean; task: Task }> {
      return request(`/api/tasks/${id}`, { method: 'PATCH', body: input });
    },
    updateStatus(id: number | string, task_status: string): Promise<{ success: boolean; task: Task }> {
      return request(`/api/tasks/${id}/status`, { method: 'PATCH', body: { task_status } });
    },
    remove(id: number | string): Promise<MessageResponse> {
      return request(`/api/tasks/${id}`, { method: 'DELETE' });
    },
  },
};

export type { ApiError };
