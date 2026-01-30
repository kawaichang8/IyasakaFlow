import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TeamFormData, CreateUserFormData, UpdateUserFormData } from '@/lib/validations/team';

/**
 * チーム・ユーザー関連のカスタムフック
 */

const TEAMS_QUERY_KEY = 'teams';
const USERS_QUERY_KEY = 'users';

interface Team {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  emailVerified: boolean;
  team?: { id: string; name: string } | null;
  stats: {
    accounts: number;
    contacts: number;
    deals: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// チーム関連
// ============================================

/**
 * チーム一覧を取得
 */
export function useTeams(search?: string) {
  return useQuery<{ data: Team[] }>({
    queryKey: [TEAMS_QUERY_KEY, search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/teams${params}`);
      
      if (!response.ok) {
        throw new Error('チームの取得に失敗しました');
      }
      
      return response.json();
    },
  });
}

/**
 * 単一のチームを取得
 */
export function useTeam(id: string) {
  return useQuery<{ data: Team & { members: User[] } }>({
    queryKey: [TEAMS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${id}`);
      
      if (!response.ok) {
        throw new Error('チームの取得に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * チームを作成
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: TeamFormData) => {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'チームの作成に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] });
    },
  });
}

/**
 * チームを更新
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeamFormData> }) => {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'チームの更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY, id] });
    },
  });
}

/**
 * チームを削除
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'チームの削除に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] });
    },
  });
}

// ============================================
// ユーザー関連
// ============================================

interface UsersFilters {
  search?: string;
  role?: string;
  teamId?: string;
  page?: number;
  limit?: number;
}

interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * ユーザー一覧を取得
 */
export function useUsers(filters?: UsersFilters) {
  return useQuery<UsersResponse>({
    queryKey: [USERS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.set('search', filters.search);
      if (filters?.role) params.set('role', filters.role);
      if (filters?.teamId) params.set('teamId', filters.teamId);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit));
      
      const response = await fetch(`/api/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('ユーザーの取得に失敗しました');
      }
      
      return response.json();
    },
  });
}

/**
 * 単一のユーザーを取得
 */
export function useUser(id: string) {
  return useQuery<{ data: User }>({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}`);
      
      if (!response.ok) {
        throw new Error('ユーザーの取得に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * ユーザーを作成
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'ユーザーの作成に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] });
    },
  });
}

/**
 * ユーザーを更新
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserFormData }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'ユーザーの更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] });
    },
  });
}

/**
 * ユーザーを削除
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'ユーザーの削除に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] });
    },
  });
}
