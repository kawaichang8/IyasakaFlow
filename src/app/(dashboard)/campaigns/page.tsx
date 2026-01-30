'use client';

import { useState, useCallback, useMemo } from 'react';
import { CampaignHeader, CampaignList, CampaignForm } from '@/components/features/campaigns';
import { useCampaigns, useDeleteCampaign } from '@/hooks/use-campaigns';
import { useSearchParamsState } from '@/hooks/use-search-params';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type CampaignFilters = { search?: string; type?: string; status?: string };

/**
 * キャンペーン一覧ページ
 */
export default function CampaignsPage() {
  const { get, setOne, clear } = useSearchParamsState<CampaignFilters>();
  const [showForm, setShowForm] = useState(false);

  const params = useMemo<CampaignFilters>(
    () => ({
      search: get('search'),
      type: get('type'),
      status: get('status'),
    }),
    [get]
  );

  const activeFilterCount = [get('type'), get('status')].filter(Boolean).length;

  const { data, isLoading, error, refetch } = useCampaigns(params);
  const deleteMutation = useDeleteCampaign();

  const campaigns = data?.data ?? [];

  const stats = useMemo(
    () => ({
      total: campaigns.length,
      draft: campaigns.filter((c) => c.status === 'draft').length,
      scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
      running: campaigns.filter((c) => c.status === 'running').length,
      completed: campaigns.filter((c) => c.status === 'completed').length,
    }),
    [campaigns]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('このキャンペーンを削除してもよろしいですか？')) return;
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('キャンペーンを削除しました');
        refetch();
      } catch {
        toast.error('削除に失敗しました');
      }
    },
    [deleteMutation, refetch]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      setOne(key as keyof CampaignFilters, value);
    },
    [setOne]
  );

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    refetch();
    toast.success('キャンペーンを保存しました');
  }, [refetch]);

  if (error) {
    return (
      <div className="space-y-6">
        <CampaignHeader
          stats={stats}
          searchValue={get('search') ?? ''}
          onSearchChange={(v) => setOne('search', v || undefined)}
          type={get('type') ?? ''}
          status={get('status') ?? ''}
          onFilterChange={handleFilterChange}
          onClearFilters={clear}
          activeFilterCount={activeFilterCount}
          onCreateClick={() => setShowForm(true)}
        />
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          データの取得に失敗しました
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CampaignHeader
        stats={stats}
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        type={get('type') ?? ''}
        status={get('status') ?? ''}
        onFilterChange={handleFilterChange}
        onClearFilters={clear}
        activeFilterCount={activeFilterCount}
        onCreateClick={() => setShowForm(true)}
      />

      <CampaignList
        campaigns={campaigns}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新規キャンペーン</DialogTitle>
          </DialogHeader>
          <CampaignForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
