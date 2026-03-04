'use client';

import { Suspense, useMemo, useEffect, useState } from 'react';
import { AccountHeader } from '@/components/features/accounts/account-header';
import { AccountList } from '@/components/features/accounts/account-list';
import { useSearchParamsState } from '@/hooks/use-search-params';

type AccountFilters = {
  search?: string;
  industry?: string;
  accountType?: string;
  status?: string;
  needFollowUp?: string;
  duplicates?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

const LIST_FILTERS_PERSIST_KEY = 'settings:listFilters:persistent';
const ACCOUNTS_FILTERS_KEY = 'accounts:listFilters';

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
  const { get, getNumber, setOne, set, clear } = useSearchParamsState<AccountFilters>();
  const [restoredFilters, setRestoredFilters] = useState(false);

  const params = useMemo<AccountFilters>(() => ({
    search: get('search'),
    industry: get('industry'),
    accountType: get('accountType'),
    status: get('status'),
    needFollowUp: get('needFollowUp'),
    duplicates: get('duplicates'),
    page: getNumber('page') ?? 1,
    limit: getNumber('limit') || 10,
    sortBy: get('sortBy') || 'updatedAt',
    sortOrder: (get('sortOrder') as 'asc' | 'desc') || 'desc',
  }), [get, getNumber]);

  // 初回マウント時に、設定がONかつURLにフィルターが無い場合はローカル保存されたフィルターを復元
  useEffect(() => {
    if (restoredFilters) return;
    if (typeof window === 'undefined') return;

    const persist = localStorage.getItem(LIST_FILTERS_PERSIST_KEY) === 'true';
    if (!persist) {
      setRestoredFilters(true);
      return;
    }

    const hasAnyFilter =
      !!(get('search') ||
        get('industry') ||
        get('accountType') ||
        get('status') ||
        get('needFollowUp') ||
        get('duplicates') ||
        get('sortBy') ||
        get('limit'));

    if (hasAnyFilter) {
      setRestoredFilters(true);
      return;
    }

    const saved = localStorage.getItem(ACCOUNTS_FILTERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AccountFilters;
        // ページは1から始める
        const { page: _page, ...rest } = parsed;
        set(rest);
      } catch {
        // 破損していた場合は何もしない
      }
    }

    setRestoredFilters(true);
  }, [get, set, restoredFilters]);

  // フィルター・ソート条件をローカルストレージに保存
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persist = localStorage.getItem(LIST_FILTERS_PERSIST_KEY) === 'true';
    if (!persist) return;

    const payload: AccountFilters = {
      search: params.search,
      industry: params.industry,
      accountType: params.accountType,
      status: params.status,
      needFollowUp: params.needFollowUp,
      duplicates: params.duplicates,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };

    localStorage.setItem(ACCOUNTS_FILTERS_KEY, JSON.stringify(payload));
  }, [params]);

  const activeFilterCount = [
    get('industry'),
    get('accountType'),
    get('status'),
    get('needFollowUp') === '1' ? '1' : null,
    get('duplicates') === '1' ? '1' : null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <AccountHeader
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        industry={get('industry') ?? ''}
        accountType={get('accountType') ?? ''}
        status={get('status') ?? ''}
        needFollowUp={get('needFollowUp') ?? ''}
        duplicates={get('duplicates') ?? ''}
        sortBy={get('sortBy') || 'updatedAt'}
        sortOrder={(get('sortOrder') as 'asc' | 'desc') || 'desc'}
        limit={getNumber('limit') || 10}
        onFilterChange={(key, value) => setOne(key as keyof AccountFilters, value)}
        onSortChange={(sortBy, sortOrder) => set({ sortBy, sortOrder })}
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
