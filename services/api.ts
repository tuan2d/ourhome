import { useAuth } from '@clerk/clerk-expo';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Call createApi(getToken) inside a component/hook that has access to useAuth
// e.g.: const api = createApi(useAuth().getToken)
export function createApi(getToken: () => Promise<string | null>) {
  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
  }

  return {
    // ── Families ──────────────────────────────────────────────────────────────
    family: {
      create: (name: string) =>
        apiFetch('/api/families', { method: 'POST', body: JSON.stringify({ name }) }),

      join: (inviteCode: string, role: 'parent' | 'child' = 'child') =>
        apiFetch('/api/families/join', { method: 'POST', body: JSON.stringify({ inviteCode, role }) }),

      members: (familyId: string) =>
        apiFetch<ApiMember[]>(`/api/families/${familyId}/members`),

      mine: () =>
        apiFetch<ApiFamily>('/api/families/mine'),
    },

    // ── Users ─────────────────────────────────────────────────────────────────
    user: {
      me: () => apiFetch<ApiUser>('/api/users/me'),

      updateMe: (patch: Partial<{ name: string; avatar: string; focusBadge: string }>) =>
        apiFetch<ApiUser>('/api/users/me', { method: 'PATCH', body: JSON.stringify(patch) }),

      savePushToken: (token: string) =>
        apiFetch('/api/users/me/push-token', { method: 'PATCH', body: JSON.stringify({ token }) }),
    },

    // ── Tasks ─────────────────────────────────────────────────────────────────
    task: {
      list: (params?: { assignee?: string; status?: 'pending' | 'done' | 'approved' }) => {
        const qs = params
          ? '?' + new URLSearchParams(params as Record<string, string>).toString()
          : '';
        return apiFetch<ApiTaskRow[]>(`/api/tasks${qs}`);
      },

      listAll: () => apiFetch<ApiTaskRow[]>('/api/tasks?all=true'),

      create: (data: {
        title: string;
        note?: string;
        points?: number;
        tags?: string[];
        dueDate?: string;
        assigneeIds: string[];
        repeat?: string | null;
      }) => apiFetch<ApiTask[]>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),

      update: (id: string, patch: Partial<{ title: string; note: string; tags: string[]; points: number; dueDate: string; assignedTo: string }>) =>
        apiFetch<ApiTask>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

      complete: (id: string) =>
        apiFetch<ApiTask>(`/api/tasks/${id}/complete`, { method: 'PATCH' }),

      approve: (id: string) =>
        apiFetch<ApiTask>(`/api/tasks/${id}/approve`, { method: 'PATCH' }),

      revert: (id: string) =>
        apiFetch<ApiTask>(`/api/tasks/${id}/revert`, { method: 'PATCH' }),

      approveAll: () =>
        apiFetch<{ approved: number }>('/api/tasks/approve-all', { method: 'POST' }),
    },

    // ── Timetable ─────────────────────────────────────────────────────────────
    timetable: {
      list: (userId?: string) =>
        apiFetch<ApiTimetableItem[]>(`/api/timetable${userId ? `?userId=${userId}` : ''}`),

      create: (data: { subject: string; dayOfWeek: string; startTime: string; teacher?: string; room?: string; userId?: string }) =>
        apiFetch('/api/timetable', { method: 'POST', body: JSON.stringify(data) }),
    },

    // ── Rewards ───────────────────────────────────────────────────────────────
    reward: {
      list: () => apiFetch<ApiReward[]>('/api/rewards'),

      create: (data: { title: string; costPoints: number; emoji?: string }) =>
        apiFetch('/api/rewards', { method: 'POST', body: JSON.stringify(data) }),

      redeem: (id: string) =>
        apiFetch<{ reward: ApiReward; remainingPoints: number }>(`/api/rewards/${id}/redeem`, { method: 'POST' }),
    },

    // ── Points ────────────────────────────────────────────────────────────────
    point: {
      get: (userId: string) =>
        apiFetch<{ totalPoints: number; weeklyPoints: number; history: ApiPointTransaction[] }>(`/api/points/${userId}`),
    },

  };
}

// Hook to use inside React components:
// const api = useApi();
// const data = await api.task.list();
export function useApi() {
  const { getToken } = useAuth();
  return createApi(getToken);
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiFamily {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export interface ApiUser {
  id: string;
  clerkId: string;
  familyId: string | null;
  name: string;
  avatar: string;
  role: 'parent' | 'child';
  totalPoints: number;
  weeklyPoints: number;
  focusBadge: string | null;
  pushToken: string | null;
}

export interface ApiMember extends ApiUser {}

export interface ApiTask {
  id: string;
  familyId: string;
  assignedTo: string;
  createdBy: string;
  title: string;
  note: string | null;
  tags: string[];
  points: number;
  status: 'pending' | 'done' | 'approved' | 'expired';
  dueDate: string | null;
  repeat: string | null;
  parentTaskId: string | null;
  createdAt: string;
}

export interface ApiTaskRow {
  task: ApiTask;
  assignee: { id: string; name: string; avatar: string } | null;
}

export interface ApiTimetableItem {
  id: string;
  familyId: string;
  userId: string;
  subject: string;
  teacher: string | null;
  room: string | null;
  dayOfWeek: string;
  startTime: string;
}

export interface ApiReward {
  id: string;
  familyId: string;
  title: string;
  costPoints: number;
  emoji: string;
}

export interface ApiPointTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend';
  note: string | null;
  taskId: string | null;
  rewardId: string | null;
  createdAt: string;
}

