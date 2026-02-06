'use client';

import { Suspense, useMemo } from 'react';
import { ContactHeader } from '@/components/features/contacts/contact-header';
import { ContactList } from '@/components/features/contacts/contact-list';
import { useSearchParamsState } from '@/hooks/use-search-params';

type ContactFilters = {
  search?: string;
  accountId?: string;
  status?: string;
  influenceLevel?: string;
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
 * 連絡先一覧ページ（useSearchParams 利用のため Suspense 内で表示）
 */
function ContactsPageContent() {
  const { get, getNumber, setOne, set, clear } = useSearchParamsState<ContactFilters>();

  const params = useMemo<ContactFilters>(() => ({
    search: get('search'),
    accountId: get('accountId'),
    status: get('status'),
    influenceLevel: get('influenceLevel'),
    page: getNumber('page') ?? 1,
    limit: getNumber('limit') || 10,
    sortBy: get('sortBy') || 'updatedAt',
    sortOrder: (get('sortOrder') as 'asc' | 'desc') || 'desc',
  }), [get, getNumber]);

  const activeFilterCount = [get('accountId'), get('status'), get('influenceLevel')].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <ContactHeader
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        accountId={get('accountId') ?? ''}
        status={get('status') ?? ''}
        influenceLevel={get('influenceLevel') ?? ''}
        sortBy={get('sortBy') || 'updatedAt'}
        sortOrder={(get('sortOrder') as 'asc' | 'desc') || 'desc'}
        limit={getNumber('limit') || 10}
        onFilterChange={(key, value) => setOne(key as keyof ContactFilters, value)}
        onSortChange={(sortBy, sortOrder) => set({ sortBy, sortOrder })}
        onClearFilters={clear}
        activeFilterCount={activeFilterCount}
      />
      <ContactList params={params} onPageChange={(page) => setOne('page', page)} />
    </div>
  );
}

/**
 * 連絡先一覧ページ
 * URL検索パラメータとフィルターを連携
 */
export default function ContactsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <ContactsPageContent />
    </Suspense>
  );
}
