import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Contact, PaginatedResponse, QueryParams } from '@/types';
import type { ContactFormData } from '@/lib/validations/contact';

/**
 * 連絡先関連のカスタムフック
 * TanStack Queryを使用したデータフェッチ
 */

export const CONTACTS_QUERY_KEY = 'contacts';

/**
 * 連絡先一覧を取得
 */
export function useContacts(params?: QueryParams) {
  return useQuery<PaginatedResponse<Contact>>({
    queryKey: [CONTACTS_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.accountId) searchParams.set('accountId', params.accountId);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const response = await fetch(`/api/contacts?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('連絡先の取得に失敗しました');
      }
      
      return response.json();
    },
  });
}

/**
 * 単一の連絡先を取得
 */
export function useContact(id: string) {
  return useQuery<{ data: Contact }>({
    queryKey: [CONTACTS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/contacts/${id}`);
      
      if (!response.ok) {
        throw new Error('連絡先の取得に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * 連絡先を作成
 */
export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '連絡先の作成に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
    },
  });
}

/**
 * 連絡先を更新
 */
export function useUpdateContact(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ContactFormData>) => {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '連絡先の更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY, id] });
    },
  });
}

/**
 * 連絡先を削除
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '連絡先の削除に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
    },
  });
}
