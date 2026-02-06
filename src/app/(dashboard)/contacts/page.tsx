'use client';

import { Suspense, useMemo } from 'react';
import { ContactHeader } from '@/components/features/contacts/contact-header';
import { ContactList } from '@/components/features/contacts/contact-list';
import { useSearchParamsState } from '@/hooks/use-search-params';

type ContactFilters = {
  search?: string;
  accountId?: string;
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
 * 連絡先一覧ページ（useSearchParams 利用のため Suspense 内で表示）
 */
function ContactsPageContent() {
  const { get, getNumber, setOne, clear } = useSearchParamsState<ContactFilters>();

  const params = useMemo<ContactFilters>(() => ({
    search: get('search'),
    accountId: get('accountId'),
    status: get('status'),
    page: getNumber('page') ?? 1,
    limit: 10,
    sortBy: get('sortBy') || 'updatedAt',
    sortOrder: get('sortOrder') || 'desc',
  }), [get, getNumber]);

  const activeFilterCount = [get('accountId'), get('status')].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <ContactHeader
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        accountId={get('accountId') ?? ''}
        status={get('status') ?? ''}
        onFilterChange={(key, value) => setOne(key as keyof ContactFilters, value)}
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
