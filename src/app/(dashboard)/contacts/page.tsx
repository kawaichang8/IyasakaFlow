'use client';

import { useMemo } from 'react';
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

/**
 * 連絡先一覧ページ
 * URL検索パラメータとフィルターを連携
 */
export default function ContactsPage() {
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
      <ContactList params={params} />
    </div>
  );
}
