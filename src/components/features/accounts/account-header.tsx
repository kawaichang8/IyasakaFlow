'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Download, Upload, ChevronDown } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { AccountForm } from './account-form';
import { ACCOUNT_STATUSES } from '@/lib/validations/account';
import { downloadExport } from '@/lib/import-export/download';
import { toast } from 'sonner';

interface AccountHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  industry: string;
  status: string;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

/**
 * 企業アカウントページのヘッダー
 * 検索・フィルターをURLと連携
 */
export function AccountHeader({
  searchValue,
  onSearchChange,
  industry,
  status,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: AccountHeaderProps) {
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
          <h1 className="text-3xl font-bold tracking-tight">企業アカウント</h1>
          <p className="text-muted-foreground">
            顧客企業の情報を管理します
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
              <DropdownMenuItem onClick={() => { downloadExport('accounts', 'csv'); toast.success('CSVをダウンロードしました'); }}>
                CSVでダウンロード
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { downloadExport('accounts', 'json'); toast.success('JSONをダウンロードしました'); }}>
                JSONでダウンロード
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                新規アカウント
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>新規企業アカウントを作成</DialogTitle>
                <DialogDescription>
                  顧客企業の基本情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <AccountForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 検索（デバウンスでURL更新） */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput
            placeholder="会社名、業種で検索..."
            value={localSearch}
            onChange={setLocalSearch}
            onDebouncedChange={(v) => onSearchChange(v.trim() || '')}
            debounceMs={300}
          />
        </div>
        <FilterBar
          activeCount={activeFilterCount}
          onClear={onClearFilters}
          defaultOpen={activeFilterCount > 0}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ステータス</Label>
              <Select
                value={status || 'all'}
                onValueChange={(v) => onFilterChange('status', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {ACCOUNT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>業種</Label>
              <Select
                value={industry || 'all'}
                onValueChange={(v) => onFilterChange('industry', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="IT・ソフトウェア">IT・ソフトウェア</SelectItem>
                  <SelectItem value="製造業">製造業</SelectItem>
                  <SelectItem value="商社">商社</SelectItem>
                  <SelectItem value="小売">小売</SelectItem>
                  <SelectItem value="金融">金融</SelectItem>
                  <SelectItem value="その他">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterBar>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>ヒント:</strong> 企業アカウントを作成すると、その企業の連絡先（担当者）を追加できます。
          BtoBでは、1つの企業に複数の連絡先を紐づけて管理することが重要です。
        </p>
      </div>
    </div>
  );
}
