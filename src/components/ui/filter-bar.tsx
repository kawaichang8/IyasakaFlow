'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  children: React.ReactNode;
  /** アクティブなフィルター数（バッジ表示） */
  activeCount?: number;
  /** クリア時のコールバック */
  onClear?: () => void;
  /** デフォルトで開くか */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * フィルターエリアのラッパー
 * 開閉・クリア・アクティブ数表示
 */
export function FilterBar({
  children,
  activeCount = 0,
  onClear,
  defaultOpen = false,
  className,
}: FilterBarProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <div className="flex items-center justify-between px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setOpen((o) => !o)}
        >
          <Filter className="h-4 w-4" />
          フィルター
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {activeCount > 0 && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
            <X className="mr-1 h-4 w-4" />
            クリア
          </Button>
        )}
      </div>
      {open && <div className="border-t px-3 py-3">{children}</div>}
    </div>
  );
}
