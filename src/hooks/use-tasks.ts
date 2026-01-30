import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TaskFormData } from '@/lib/validations/task';

/**
 * タスク関連のカスタムフック
 */

const TASKS_QUERY_KEY = 'tasks';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  account?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  deal?: { id: string; name: string } | null;
  assignee?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface TasksResponse {
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  accountId?: string;
  dealId?: string;
  page?: number;
  limit?: number;
}

/**
 * タスク一覧を取得
 */
export function useTasks(params?: TaskFilters) {
  return useQuery<TasksResponse>({
    queryKey: [TASKS_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.priority) searchParams.set('priority', params.priority);
      if (params?.assigneeId) searchParams.set('assigneeId', params.assigneeId);
      if (params?.accountId) searchParams.set('accountId', params.accountId);
      if (params?.dealId) searchParams.set('dealId', params.dealId);
      
      const response = await fetch(`/api/tasks?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('タスクの取得に失敗しました');
      }
      
      return response.json();
    },
  });
}

/**
 * 単一のタスクを取得
 */
export function useTask(id: string) {
  return useQuery<{ data: Task }>({
    queryKey: [TASKS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${id}`);
      
      if (!response.ok) {
        throw new Error('タスクの取得に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * タスクを作成
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'タスクの作成に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * タスクを更新
 */
export function useUpdateTask(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<TaskFormData>) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'タスクの更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, id] });
    },
  });
}

/**
 * タスクのステータスを更新（クイック完了用）
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'ステータスの更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * タスクを削除
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'タスクの削除に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * 今日のタスクを取得
 */
export function useTodayTasks() {
  return useQuery<TasksResponse>({
    queryKey: [TASKS_QUERY_KEY, 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/tasks?dueDate=${today}&status=pending,in_progress`);
      
      if (!response.ok) {
        throw new Error('タスクの取得に失敗しました');
      }
      
      return response.json();
    },
  });
}

/**
 * 期限切れタスクを取得
 */
export function useOverdueTasks() {
  return useQuery<TasksResponse>({
    queryKey: [TASKS_QUERY_KEY, 'overdue'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/tasks?dueBefore=${today}&status=pending,in_progress`);
      
      if (!response.ok) {
        throw new Error('タスクの取得に失敗しました');
      }
      
      return response.json();
    },
  });
}
