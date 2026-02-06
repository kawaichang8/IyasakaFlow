'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Phone, Mail, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FilterBar } from '@/components/ui/filter-bar';
import { SearchInput } from '@/components/ui/search-input';
import { InteractionForm } from './interaction-form';
import { INTERACTION_TYPES } from '@/lib/validations/interaction';

interface InteractionStats {
  total: number;
  calls: number;
  emails: number;
  meetings: number;
  notes: number;
}

interface InteractionHeaderProps {
  stats?: InteractionStats;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  type?: string;
  onFilterChange?: (key: string, value: string | undefined) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;
}

/**
 * 活動ページのヘッダー
 * 検索・フィルターをURLと連携
 */
export function InteractionHeader({ 
  stats, 
  searchValue = '', 
  onSearchChange, 
  type = '', 
  onFilterChange, 
  onClearFilters, 
  activeFilterCount = 0 
}: InteractionHeaderProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);

  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* タイトルとアクション */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">活動履歴</h1>
          <p className="text-muted-foreground">
            電話、メール、ミーティングなどの活動を記録・管理
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              活動を記録
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>活動を記録</DialogTitle>
              <DialogDescription>
                顧客とのやり取りを記録します
              </DialogDescription>
            </DialogHeader>
            <InteractionForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Phone className="h-5 w-5 text-green-600" />}
            label="電話"
            value={stats.calls}
            color="bg-green-100 dark:bg-green-900"
          />
          <StatCard
            icon={<Mail className="h-5 w-5 text-blue-600" />}
            label="メール"
            value={stats.emails}
            color="bg-blue-100 dark:bg-blue-900"
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-purple-600" />}
            label="ミーティング"
            value={stats.meetings}
            color="bg-purple-100 dark:bg-purple-900"
          />
          <StatCard
            icon={<FileText className="h-5 w-5 text-yellow-600" />}
            label="メモ"
            value={stats.notes}
            color="bg-yellow-100 dark:bg-yellow-900"
          />
        </div>
      )}

      {/* 検索とフィルター */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput
            placeholder="件名、内容、企業名で検索..."
            value={localSearch}
            onChange={setLocalSearch}
            onDebouncedChange={(v) => onSearchChange?.(v.trim() || '')}
            debounceMs={300}
          />
        </div>
        {onFilterChange && onClearFilters && (
          <FilterBar
            activeCount={activeFilterCount}
            onClear={onClearFilters}
            defaultOpen={activeFilterCount > 0}
          >
            <div className="space-y-2">
              <Label>活動タイプ</Label>
              <Select
                value={type || 'all'}
                onValueChange={(v) => onFilterChange('type', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {INTERACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FilterBar>
        )}
      </div>
      <div className="rounded-lg border border-muted-200 bg-muted/50 p-3 dark:border-muted-800">
        <p className="text-xs text-muted-foreground">
          <strong>営業のコツ:</strong> 「結果・アウトカム」と「次のアクション」を毎回書くと、企業・連絡先一覧で状況が一目で分かり、翌日から何をすべきか迷いません。
          <Link href="/help" className="ml-1 text-primary hover:underline">用語集・チェックリスト →</Link>
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`flex items-center gap-3 rounded-lg p-4 ${color}`}>
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
