import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryParams } from '@/types';
import type { DealFormData } from '@/lib/validations/deal';

/**
 * 取引関連のカスタムフック
 */

const DEALS_QUERY_KEY = 'deals';

interface Deal {
  id: string;
  name: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  description: string | null;
  tags: string[];
  account: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    name: string;
  } | null;
  owner?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface DealsResponse {
  data: Deal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 取引一覧を取得
 */
export function useDeals(params?: QueryParams) {
  return useQuery<DealsResponse>({
    queryKey: [DEALS_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.accountId) searchParams.set('accountId', params.accountId);
      if (params?.stage) searchParams.set('stage', params.stage);
      
      const response = await fetch(`/api/deals?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('取引の取得に失敗しました');
      }
      
      return response.json();
    },
  });
}

/**
 * 単一の取引を取得
 */
export function useDeal(id: string) {
  return useQuery<{ data: Deal }>({
    queryKey: [DEALS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/deals/${id}`);
      
      if (!response.ok) {
        throw new Error('取引の取得に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * 取引を作成
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: DealFormData) => {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '取引の作成に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
    },
  });
}

/**
 * 取引を更新
 */
export function useUpdateDeal(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<DealFormData>) => {
      const response = await fetch(`/api/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '取引の更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY, id] });
    },
  });
}

/**
 * 取引のステージを更新（Kanbanドラッグ＆ドロップ用）
 */
export function useUpdateDealStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      const response = await fetch(`/api/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'ステージの更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
    },
  });
}

/**
 * 取引を削除
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/deals/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '取引の削除に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEALS_QUERY_KEY] });
    },
  });
}
