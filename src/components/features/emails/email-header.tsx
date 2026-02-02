'use client';

import { useState } from 'react';
import { Plus, Mail, FileText, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar } from '@/components/ui/filter-bar';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EMAIL_STATUSES } from '@/lib/validations/email';

interface EmailStats {
  total: number;
  sent: number;
  draft: number;
  scheduled: number;
  opened: number;
}

interface EmailHeaderProps {
  stats?: EmailStats;
  searchValue: string;
  onSearchChange: (value: string) => void;
  status: string;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  onComposeClick: () => void;
  onTemplatesClick: () => void;
}

/**
 * メール一覧ヘッダー
 */
export function EmailHeader({
  stats,
  searchValue,
  onSearchChange,
  status,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  onComposeClick,
  onTemplatesClick,
}: EmailHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* タイトルとアクション */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">メール</h1>
          <p className="text-sm text-muted-foreground">
            メールの送信・管理
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onTemplatesClick}>
            <FileText className="mr-2 h-4 w-4" />
            テンプレート
          </Button>
          <Button onClick={onComposeClick}>
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard
            label="合計"
            value={stats.total}
            icon={<Mail className="h-4 w-4" />}
          />
          <StatCard
            label="送信済み"
            value={stats.sent}
            color="text-green-600"
          />
          <StatCard
            label="下書き"
            value={stats.draft}
            color="text-gray-600"
          />
          <StatCard
            label="予約済み"
            value={stats.scheduled}
            color="text-blue-600"
          />
          <StatCard
            label="開封"
            value={stats.opened}
            color="text-purple-600"
          />
        </div>
      )}

      {/* 検索とフィルター */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder="件名、宛先で検索..."
          className="sm:w-80"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={activeFilterCount > 0 ? 'border-primary' : ''}
        >
          <Filter className="mr-2 h-4 w-4" />
          フィルター
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="mr-1 h-4 w-4" />
            クリア
          </Button>
        )}
      </div>

      {/* フィルターバー */}
      {showFilters && (
        <FilterBar
          activeCount={activeFilterCount}
          onClear={onClearFilters}
          defaultOpen
        >
          <div className="space-y-2">
            <Label>ステータス</Label>
            <Select
              value={status || 'all'}
              onValueChange={(v) => onFilterChange('status', v === 'all' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="すべてのステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                {EMAIL_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FilterBar>
      )}
    </div>
  );
}

/**
 * 統計カード
 */
function StatCard({
  label,
  value,
  icon,
  color = 'text-foreground',
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
