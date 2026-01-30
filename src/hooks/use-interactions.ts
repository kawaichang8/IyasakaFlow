import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InteractionFormData } from '@/lib/validations/interaction';

/**
 * インタラクション関連のカスタムフック
 */

const INTERACTIONS_QUERY_KEY = 'interactions';

interface Interaction {
  id: string;
  type: string;
  subject: string | null;
  note: string;
  date: string;
  duration: number | null;
  outcome: string | null;
  account?: { id: string; name: string } | null;
  contact?: { id: string; name: string; email?: string } | null;
  deal?: { id: string; name: string; stage: string } | null;
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface InteractionsResponse {
  data: Interaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface InteractionFilters {
  search?: string;
  type?: string;
  accountId?: string;
  contactId?: string;
  dealId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

/**
 * インタラクション一覧を取得
 */
export function useInteractions(params?: InteractionFilters) {
  return useQuery<InteractionsResponse>({
    queryKey: [INTERACTIONS_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.accountId) searchParams.set('accountId', params.accountId);
      if (params?.contactId) searchParams.set('contactId', params.contactId);
      if (params?.dealId) searchParams.set('dealId', params.dealId);
      if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
      
      const response = await fetch(`/api/interactions?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('インタラクションの取得に失敗しました');
      }
      
      return response.json();
    },
  });
}

/**
 * 単一のインタラクションを取得
 */
export function useInteraction(id: string) {
  return useQuery<{ data: Interaction }>({
    queryKey: [INTERACTIONS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/interactions/${id}`);
      
      if (!response.ok) {
        throw new Error('インタラクションの取得に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * インタラクションを作成
 */
export function useCreateInteraction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InteractionFormData) => {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'インタラクションの作成に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTERACTIONS_QUERY_KEY] });
      // ダッシュボードの最近の活動も更新
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * インタラクションを更新
 */
export function useUpdateInteraction(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<InteractionFormData>) => {
      const response = await fetch(`/api/interactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'インタラクションの更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTERACTIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INTERACTIONS_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * インタラクションを削除
 */
export function useDeleteInteraction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/interactions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'インタラクションの削除に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTERACTIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * アカウント別のインタラクションを取得
 */
export function useAccountInteractions(accountId: string) {
  return useInteractions({ accountId });
}

/**
 * 取引別のインタラクションを取得
 */
export function useDealInteractions(dealId: string) {
  return useInteractions({ dealId });
}

/**
 * 連絡先別のインタラクションを取得
 */
export function useContactInteractions(contactId: string) {
  return useInteractions({ contactId });
}
