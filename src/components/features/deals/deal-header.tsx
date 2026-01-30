'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, List, Download, Upload, ChevronDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { DealForm } from './deal-form';
import { formatCurrency } from '@/lib/utils';
import { DEAL_STAGES } from '@/lib/validations/deal';
import { downloadExport } from '@/lib/import-export/download';
import { toast } from 'sonner';

interface DealHeaderProps {
  viewMode: 'kanban' | 'list';
  onViewModeChange: (mode: 'kanban' | 'list') => void;
  totalValue?: number;
  totalDeals?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  stage?: string;
  onFilterChange?: (key: string, value: string | undefined) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;
}

/**
 * 取引ページのヘッダー
 * 検索・フィルターをURLと連携
 */
export function DealHeader({ 
  viewMode, 
  onViewModeChange, 
  totalValue = 0, 
  totalDeals = 0,
  searchValue = '',
  onSearchChange,
  stage = '',
  onFilterChange,
  onClearFilters,
  activeFilterCount = 0,
}: DealHeaderProps) {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">パイプライン</h1>
          <p className="text-muted-foreground">
            取引・案件の進捗を管理します
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings?tab=data">
              <Upload className="mr-2 h-4 w-4" />
              インポート
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                エクスポート
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { downloadExport('deals', 'csv'); toast.success('CSVをダウンロードしました'); }}>
                CSVでダウンロード
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { downloadExport('deals', 'json'); toast.success('JSONをダウンロードしました'); }}>
                JSONでダウンロード
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                新規案件
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>新規案件を作成</DialogTitle>
                <DialogDescription>
                  案件の基本情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <DealForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-xs text-muted-foreground">パイプライン総額</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalValue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
          <div>
            <p className="text-xs text-muted-foreground">進行中の案件</p>
            <p className="text-lg font-bold">{totalDeals} 件</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput
            placeholder="案件名、企業名で検索..."
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
              <Label>ステージ</Label>
              <Select
                value={stage || 'all'}
                onValueChange={(v) => onFilterChange('stage', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {DEAL_STAGES.map((s) => (
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
    </div>
  );
}
