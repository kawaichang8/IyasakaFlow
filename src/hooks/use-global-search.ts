'use client';

import { useQuery } from '@tanstack/react-query';

const SEARCH_QUERY_KEY = 'global-search';

export interface SearchResultAccount {
  id: string;
  type: 'account';
  name: string;
  subtitle?: string;
  status?: string;
  href: string;
}

export interface SearchResultContact {
  id: string;
  type: 'contact';
  name: string;
  subtitle?: string;
  href: string;
}

export interface SearchResultDeal {
  id: string;
  type: 'deal';
  name: string;
  subtitle?: string;
  stage?: string;
  value: number;
  href: string;
}

export interface SearchResults {
  accounts: SearchResultAccount[];
  contacts: SearchResultContact[];
  deals: SearchResultDeal[];
}

/**
 * グローバル検索
 * 入力に応じて企業・連絡先・案件を横断検索
 */
export function useGlobalSearch(query: string, options?: { enabled?: boolean; limit?: number }) {
  const enabled = (options?.enabled ?? true) && query.trim().length >= 2;
  const limit = options?.limit ?? 10;

  return useQuery<{ data: SearchResults }>({
    queryKey: [SEARCH_QUERY_KEY, query.trim(), limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: String(limit),
      });
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('検索に失敗しました');
      return response.json();
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });
}
