import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Opportunity, PaginatedResponse, QueryParams } from '@/types';
import type { OpportunityFormData } from '@/lib/validations/opportunity';

const OPPORTUNITIES_KEY = 'opportunities';

/**
 * 案件一覧を取得
 */
export function useOpportunities(params?: QueryParams) {
  return useQuery<PaginatedResponse<Opportunity>>({
    queryKey: [OPPORTUNITIES_KEY, params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.page) sp.set('page', String(params.page));
      if (params?.limit) sp.set('limit', String(params.limit));
      if (params?.search) sp.set('search', params.search);
      if (params?.stage) sp.set('stage', params.stage);
      if (params?.accountId) sp.set('accountId', params.accountId);
      if (params?.sortBy) sp.set('sortBy', params.sortBy);
      if (params?.sortOrder) sp.set('sortOrder', params.sortOrder);

      const res = await fetch(`/api/opportunities?${sp.toString()}`);
      if (!res.ok) throw new Error('案件の取得に失敗しました');
      return res.json();
    },
  });
}

/**
 * 単一の案件を取得
 */
export function useOpportunity(id: string) {
  return useQuery<{ data: Opportunity }>({
    queryKey: [OPPORTUNITIES_KEY, id],
    queryFn: async () => {
      const res = await fetch(`/api/opportunities/${id}`);
      if (!res.ok) throw new Error('案件の取得に失敗しました');
      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * 案件を作成
 */
export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: OpportunityFormData) => {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '案件の作成に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [OPPORTUNITIES_KEY] }),
  });
}

/**
 * 案件を更新
 */
export function useUpdateOpportunity(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OpportunityFormData>) => {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '案件の更新に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [OPPORTUNITIES_KEY] });
      qc.invalidateQueries({ queryKey: [OPPORTUNITIES_KEY, id] });
    },
  });
}

/**
 * 案件ステージを更新（Kanban DnD 用）
 */
export function useUpdateOpportunityStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'ステージの更新に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [OPPORTUNITIES_KEY] }),
  });
}

/**
 * 案件を削除
 */
export function useDeleteOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || '案件の削除に失敗しました');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [OPPORTUNITIES_KEY] }),
  });
}
