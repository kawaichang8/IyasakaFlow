'use client';

import { useMemo } from 'react';
import { AccountHeader } from '@/components/features/accounts/account-header';
import { AccountList } from '@/components/features/accounts/account-list';
import { useSearchParamsState } from '@/hooks/use-search-params';

type AccountFilters = {
  search?: string;
  industry?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

/**
 * 企業アカウント一覧ページ
 * URL検索パラメータとフィルターを連携
 */
export default function AccountsPage() {
  const { get, getNumber, set, setOne, clear, toObject } = useSearchParamsState<AccountFilters>();

  const params = useMemo<AccountFilters>(() => ({
    search: get('search'),
    industry: get('industry'),
    status: get('status'),
    page: getNumber('page') ?? 1,
    limit: 10,
    sortBy: get('sortBy') || 'updatedAt',
    sortOrder: get('sortOrder') || 'desc',
  }), [get, getNumber]);

  const activeFilterCount = [get('industry'), get('status')].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <AccountHeader
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        industry={get('industry') ?? ''}
        status={get('status') ?? ''}
        onFilterChange={(key, value) => setOne(key as keyof AccountFilters, value)}
        onClearFilters={clear}
        activeFilterCount={activeFilterCount}
      />
      <AccountList params={params} />
    </div>
  );
}
