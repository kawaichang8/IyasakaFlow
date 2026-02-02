'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Building2, User, TrendingUp, Search, Loader2 } from 'lucide-react';
import { useGlobalSearch, type SearchResults } from '@/hooks/use-global-search';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const KBD = () => (
  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
    ⌘K
  </kbd>
);

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * グローバル検索（コマンドパレット風）
 * ⌘K またはヘッダー検索フォーカスで表示
 */
export function GlobalSearch({ open, onOpenChange, triggerRef }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useGlobalSearch(query, {
    enabled: open && query.length >= 2,
    limit: 8,
  });

  const results = data?.data;

  // 開いたときにフォーカス
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ⌘K ショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  const totalCount =
    (results?.accounts.length ?? 0) +
    (results?.contacts.length ?? 0) +
    (results?.deals.length ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0"
        onPointerDownOutside={(e) => {
          if (triggerRef?.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="border-b px-4 py-3">
          <div className="relative flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="企業・連絡先・案件を検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0"
              autoComplete="off"
            />
            <KBD />
          </div>
        </DialogHeader>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              2文字以上入力してください
            </div>
          ) : isLoading || isFetching ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              検索中...
            </div>
          ) : totalCount === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              「{query}」に一致する結果はありません
            </div>
          ) : (
            <SearchResultSections results={results!} onSelect={handleSelect} />
          )}
        </div>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <kbd className="rounded bg-muted px-1">Esc</kbd> で閉じる
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchResultSections({
  results,
  onSelect,
}: {
  results: SearchResults;
  onSelect: (href: string) => void;
}) {
  return (
    <div className="py-2">
      {results.accounts.length > 0 && (
        <Section
          title="企業"
          icon={Building2}
          items={results.accounts.map((a) => ({
            key: a.id,
            label: a.name,
            subtitle: a.subtitle,
            href: a.href,
          }))}
          onSelect={onSelect}
        />
      )}
      {results.contacts.length > 0 && (
        <Section
          title="連絡先"
          icon={User}
          items={results.contacts.map((c) => ({
            key: c.id,
            label: c.name,
            subtitle: c.subtitle,
            href: c.href,
          }))}
          onSelect={onSelect}
        />
      )}
      {results.deals.length > 0 && (
        <Section
          title="案件"
          icon={TrendingUp}
          items={results.deals.map((d) => ({
            key: d.id,
            label: d.name,
            subtitle: d.subtitle,
            meta: formatCurrency(d.value),
            href: d.href,
          }))}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  items,
  onSelect,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { key: string; label: string; subtitle?: string; meta?: string; href: string }[];
  onSelect: (href: string) => void;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={cn(
            'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm outline-none',
            'hover:bg-muted focus:bg-muted'
          )}
          onClick={() => onSelect(item.href)}
        >
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{item.label}</div>
            {item.subtitle && (
              <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
            )}
          </div>
          {item.meta && (
            <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
          )}
        </button>
      ))}
    </div>
  );
}
