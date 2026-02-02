'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { TaskHeader } from '@/components/features/tasks/task-header';
import { TaskList } from '@/components/features/tasks/task-list';
import { useTasks, useUpdateTaskStatus, useDeleteTask } from '@/hooks/use-tasks';
import { useSearchParamsState } from '@/hooks/use-search-params';

type TaskFilters = { search?: string; status?: string; priority?: string };

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

/**
 * タスク一覧ページ（useSearchParams 利用のため Suspense 内で表示）
 */
function TasksPageContent() {
  const { get, setOne, clear } = useSearchParamsState<TaskFilters>();

  const params = useMemo<TaskFilters>(() => ({
    search: get('search'),
    status: get('status'),
    priority: get('priority'),
  }), [get]);

  const activeFilterCount = [get('status'), get('priority')].filter(Boolean).length;

  // タスクデータを取得
  const { data, isLoading, error, refetch } = useTasks(params);
  const updateStatusMutation = useUpdateTaskStatus();
  const deleteMutation = useDeleteTask();

  const tasks = data?.data || [];

  // 統計を計算
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      overdue: tasks.filter((t) => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < today;
      }).length,
    };
  }, [tasks]);

  // ステータス変更ハンドラー
  const handleStatusChange = useCallback(async (taskId: string, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ taskId, status });
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [updateStatusMutation, refetch]);

  // 削除ハンドラー
  const handleDelete = useCallback(async (taskId: string) => {
    if (!confirm('このタスクを削除してもよろしいですか？')) return;
    
    try {
      await deleteMutation.mutateAsync(taskId);
      refetch();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, [deleteMutation, refetch]);

  // フィルター変更ハンドラー（URL更新）
  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    setOne(key as keyof TaskFilters, value);
  }, [setOne]);

  if (error) {
    return (
      <div className="space-y-6">
        <TaskHeader 
          stats={stats} 
          searchValue={get('search') ?? ''}
          onSearchChange={(v) => setOne('search', v || undefined)}
          status={get('status') ?? ''}
          priority={get('priority') ?? ''}
          onFilterChange={handleFilterChange}
          onClearFilters={clear}
          activeFilterCount={activeFilterCount}
        />
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          データの取得に失敗しました
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaskHeader 
        stats={stats} 
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        status={get('status') ?? ''}
        priority={get('priority') ?? ''}
        onFilterChange={handleFilterChange}
        onClearFilters={clear}
        activeFilterCount={activeFilterCount}
      />

      <TaskList 
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}

/**
 * タスク一覧ページ
 * 検索・フィルターはURL連携
 */
export default function TasksPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <TasksPageContent />
    </Suspense>
  );
}
