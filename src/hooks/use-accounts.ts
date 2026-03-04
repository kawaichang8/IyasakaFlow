import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Account, PaginatedResponse, QueryParams } from '@/types';
import type { AccountFormData } from '@/lib/validations/account';

/**
 * アカウント関連のカスタムフック
 * TanStack Queryを使用したデータフェッチ
 */

export const ACCOUNTS_QUERY_KEY = 'accounts';

/**
 * アカウント一覧を取得
 */
export function useAccounts(params?: QueryParams) {
  return useQuery<PaginatedResponse<Account>>({
    queryKey: [ACCOUNTS_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.industry) searchParams.set('industry', params.industry);
      if (params?.accountType) searchParams.set('accountType', params.accountType);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.needFollowUp) searchParams.set('needFollowUp', params.needFollowUp);
      if (params?.duplicates) searchParams.set('duplicates', params.duplicates);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      
      const response = await fetch(`/api/accounts?${searchParams.toString()}`);
      
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = typeof body?.error === 'string' ? body.error : 'アカウントの取得に失敗しました';
        throw new Error(message);
      }
      
      return response.json();
    },
  });
}

/**
 * 単一のアカウントを取得
 */
export function useAccount(id: string) {
  return useQuery<{ data: Account }>({
    queryKey: [ACCOUNTS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/accounts/${id}`);
      
      if (!response.ok) {
        throw new Error('アカウントの取得に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * アカウントを作成
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AccountFormData) => {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'アカウントの作成に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
    },
  });
}

/**
 * アカウントを更新
 */
export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<AccountFormData>) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'アカウントの更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY, id] });
    },
  });
}

/**
 * アカウントを削除
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'アカウントの削除に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
    },
  });
}
