'use client';

import { useCallback, useMemo } from 'react';
import { InteractionHeader } from '@/components/features/interactions/interaction-header';
import { InteractionList } from '@/components/features/interactions/interaction-list';
import { useInteractions, useDeleteInteraction } from '@/hooks/use-interactions';
import { useSearchParamsState } from '@/hooks/use-search-params';

type ActivityFilters = { search?: string; type?: string };

/**
 * 活動履歴ページ
 * 検索・フィルターはURL連携
 */
export default function ActivitiesPage() {
  const { get, setOne, clear } = useSearchParamsState<ActivityFilters>();

  const params = useMemo<ActivityFilters>(() => ({
    search: get('search'),
    type: get('type'),
  }), [get]);

  const activeFilterCount = [get('type')].filter(Boolean).length;

  // インタラクションデータを取得
  const { data, isLoading, error, refetch } = useInteractions(params);
  const deleteMutation = useDeleteInteraction();

  const interactions = data?.data || [];

  // 統計を計算
  const stats = useMemo(() => {
    return {
      total: interactions.length,
      calls: interactions.filter((i) => i.type === 'call').length,
      emails: interactions.filter((i) => i.type === 'email').length,
      meetings: interactions.filter((i) => i.type === 'meeting').length,
      notes: interactions.filter((i) => i.type === 'note' || i.type === 'task').length,
    };
  }, [interactions]);

  // 削除ハンドラー
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('この活動記録を削除してもよろしいですか？')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Failed to delete interaction:', error);
    }
  }, [deleteMutation, refetch]);

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    setOne(key as keyof ActivityFilters, value);
  }, [setOne]);

  if (error) {
    return (
      <div className="space-y-6">
        <InteractionHeader 
          stats={stats} 
          searchValue={get('search') ?? ''}
          onSearchChange={(v) => setOne('search', v || undefined)}
          type={get('type') ?? ''}
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
      <InteractionHeader 
        stats={stats} 
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        type={get('type') ?? ''}
        onFilterChange={handleFilterChange}
        onClearFilters={clear}
        activeFilterCount={activeFilterCount}
      />

      <InteractionList 
        interactions={interactions}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
