'use client';

import { Suspense, useMemo } from 'react';
import { AccountHeader } from '@/components/features/accounts/account-header';
import { AccountList } from '@/components/features/accounts/account-list';
import { useSearchParamsState } from '@/hooks/use-search-params';

type AccountFilters = {
  search?: string;
  industry?: string;
  accountType?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

/**
 * 企業アカウント一覧ページ（useSearchParams 利用のため Suspense 内で表示）
 */
function AccountsPageContent() {
  const { get, getNumber, setOne, clear } = useSearchParamsState<AccountFilters>();

  const params = useMemo<AccountFilters>(() => ({
    search: get('search'),
    industry: get('industry'),
    accountType: get('accountType'),
    status: get('status'),
    page: getNumber('page') ?? 1,
    limit: 10,
    sortBy: get('sortBy') || 'updatedAt',
    sortOrder: get('sortOrder') || 'desc',
  }), [get, getNumber]);

  const activeFilterCount = [get('industry'), get('accountType'), get('status')].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <AccountHeader
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        industry={get('industry') ?? ''}
        accountType={get('accountType') ?? ''}
        status={get('status') ?? ''}
        onFilterChange={(key, value) => setOne(key as keyof AccountFilters, value)}
        onClearFilters={clear}
        activeFilterCount={activeFilterCount}
      />
      <AccountList params={params} onPageChange={(page) => setOne('page', page)} />
    </div>
  );
}

/**
 * 企業アカウント一覧ページ
 * URL検索パラメータとフィルターを連携
 */
export default function AccountsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <AccountsPageContent />
    </Suspense>
  );
}
