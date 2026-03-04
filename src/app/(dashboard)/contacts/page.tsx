'use client';

import { Suspense, useMemo, useEffect, useState } from 'react';
import { ContactHeader } from '@/components/features/contacts/contact-header';
import { ContactList } from '@/components/features/contacts/contact-list';
import { useSearchParamsState } from '@/hooks/use-search-params';

type ContactFilters = {
  search?: string;
  accountId?: string;
  status?: string;
  influenceLevel?: string;
  contactSource?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

const LIST_FILTERS_PERSIST_KEY = 'settings:listFilters:persistent';
const CONTACTS_FILTERS_KEY = 'contacts:listFilters';

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
  const [restoredFilters, setRestoredFilters] = useState(false);

  const params = useMemo<ContactFilters>(() => ({
    search: get('search'),
    accountId: get('accountId'),
    status: get('status'),
    influenceLevel: get('influenceLevel'),
    contactSource: get('contactSource'),
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
        get('accountId') ||
        get('status') ||
        get('influenceLevel') ||
        get('contactSource') ||
        get('sortBy') ||
        get('limit'));

    if (hasAnyFilter) {
      setRestoredFilters(true);
      return;
    }

    const saved = localStorage.getItem(CONTACTS_FILTERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ContactFilters;
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

    const payload: ContactFilters = {
      search: params.search,
      accountId: params.accountId,
      status: params.status,
      influenceLevel: params.influenceLevel,
      contactSource: params.contactSource,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };

    localStorage.setItem(CONTACTS_FILTERS_KEY, JSON.stringify(payload));
  }, [params]);

  const activeFilterCount = [get('accountId'), get('status'), get('influenceLevel'), get('contactSource')].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <ContactHeader
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        accountId={get('accountId') ?? ''}
        status={get('status') ?? ''}
        influenceLevel={get('influenceLevel') ?? ''}
        contactSource={get('contactSource') ?? ''}
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
