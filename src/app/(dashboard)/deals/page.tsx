'use client';

import { Suspense, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DealHeader } from '@/components/features/deals/deal-header';
import { PipelineBoard } from '@/components/features/deals/pipeline-board';
import { DealList } from '@/components/features/deals/deal-list';
import { useDeals, useUpdateDealStage } from '@/hooks/use-deals';
import { useSearchParamsState } from '@/hooks/use-search-params';

type DealFilters = { search?: string; stage?: string; accountId?: string };

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

/**
 * 取引（パイプライン）一覧ページ（useSearchParams 利用のため Suspense 内で表示）
 */
function DealsPageContent() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const { get, setOne, clear } = useSearchParamsState<DealFilters>();

  const params = useMemo<DealFilters>(() => ({
    search: get('search'),
    stage: get('stage'),
    accountId: get('accountId'),
  }), [get]);

  const activeFilterCount = [get('stage'), get('accountId')].filter(Boolean).length;

  // 取引データを取得
  const { data, isLoading, error, refetch } = useDeals(params);
  const updateStageMutation = useUpdateDealStage();

  const deals = data?.data || [];
  
  // パイプライン統計を計算（成約/失注を除く）
  const activeDeals = deals.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  );
  const totalValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);

  // ステージ変更ハンドラー
  const handleStageChange = useCallback(async (dealId: string, newStage: string) => {
    try {
      await updateStageMutation.mutateAsync({ dealId, stage: newStage });
      refetch();
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  }, [updateStageMutation, refetch]);

  // 取引クリックハンドラー
  const handleDealClick = useCallback((dealId: string) => {
    router.push(`/deals/${dealId}`);
  }, [router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DealHeader 
          viewMode={viewMode} 
          onViewModeChange={setViewMode}
          searchValue={get('search') ?? ''}
          onSearchChange={(v) => setOne('search', v || undefined)}
          stage={get('stage') ?? ''}
          onFilterChange={(key, value) => setOne(key as keyof DealFilters, value)}
          onClearFilters={clear}
          activeFilterCount={activeFilterCount}
        />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DealHeader 
          viewMode={viewMode} 
          onViewModeChange={setViewMode}
          searchValue={get('search') ?? ''}
          onSearchChange={(v) => setOne('search', v || undefined)}
          stage={get('stage') ?? ''}
          onFilterChange={(key, value) => setOne(key as keyof DealFilters, value)}
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
      <DealHeader 
        viewMode={viewMode} 
        onViewModeChange={setViewMode}
        totalValue={totalValue}
        totalDeals={activeDeals.length}
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        stage={get('stage') ?? ''}
        onFilterChange={(key, value) => setOne(key as keyof DealFilters, value)}
        onClearFilters={clear}
        activeFilterCount={activeFilterCount}
      />

      {viewMode === 'kanban' ? (
        <PipelineBoard 
          deals={deals}
          onStageChange={handleStageChange}
          onDealClick={handleDealClick}
        />
      ) : (
        <DealList deals={deals} />
      )}
    </div>
  );
}

/**
 * 取引（パイプライン）一覧ページ
 * Kanbanボードまたはリスト表示、検索・フィルターはURL連携
 */
export default function DealsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <DealsPageContent />
    </Suspense>
  );
}
