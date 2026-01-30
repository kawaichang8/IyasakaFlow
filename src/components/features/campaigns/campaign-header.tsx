'use client';

import { useState } from 'react';
import { Plus, Zap, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterBar, type FilterOption } from '@/components/ui/filter-bar';
import { CAMPAIGN_TYPES, CAMPAIGN_STATUSES } from '@/lib/validations/campaign';

interface CampaignStats {
  total: number;
  draft: number;
  scheduled: number;
  running: number;
  completed: number;
}

interface CampaignHeaderProps {
  stats?: CampaignStats;
  searchValue: string;
  onSearchChange: (value: string) => void;
  type: string;
  status: string;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  onCreateClick: () => void;
}

/**
 * キャンペーン一覧ヘッダー
 */
export function CampaignHeader({
  stats,
  searchValue,
  onSearchChange,
  type,
  status,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
  onCreateClick,
}: CampaignHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  const typeOptions: FilterOption[] = [
    { value: '', label: 'すべての種別' },
    ...CAMPAIGN_TYPES.map((t) => ({ value: t.value, label: t.label })),
  ];

  const statusOptions: FilterOption[] = [
    { value: '', label: 'すべてのステータス' },
    ...CAMPAIGN_STATUSES.map((s) => ({ value: s.value, label: s.label })),
  ];

  const filters = [
    { key: 'type', label: '種別', value: type, options: typeOptions },
    { key: 'status', label: 'ステータス', value: status, options: statusOptions },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">キャンペーン</h1>
          <p className="text-sm text-muted-foreground">
            マーケティングキャンペーンの管理
          </p>
        </div>
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          新規キャンペーン
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="合計" value={stats.total} icon={<Zap className="h-4 w-4" />} />
          <StatCard label="下書き" value={stats.draft} color="text-muted-foreground" />
          <StatCard label="予約済み" value={stats.scheduled} color="text-blue-600" />
          <StatCard label="実行中" value={stats.running} color="text-green-600" />
          <StatCard label="完了" value={stats.completed} color="text-purple-600" />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder="キャンペーン名で検索..."
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

      {showFilters && (
        <FilterBar
          filters={filters}
          onChange={onFilterChange}
          onClear={onClearFilters}
        />
      )}
    </div>
  );
}

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
