'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
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
import { ACCOUNT_STATUSES, ACCOUNT_INDUSTRIES, ACCOUNT_TYPES } from '@/lib/validations/account';
import { downloadExport } from '@/lib/import-export/download';
import { toast } from 'sonner';

interface AccountHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  industry: string;
  accountType: string;
  status: string;
  needFollowUp?: string;
  duplicates?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  onFilterChange: (key: string, value: string | number | undefined) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
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
  accountType,
  status,
  needFollowUp = '',
  duplicates = '',
  sortBy = 'updatedAt',
  sortOrder = 'desc',
  limit = 10,
  onFilterChange,
  onSortChange,
  onClearFilters,
  activeFilterCount,
}: AccountHeaderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);

  useEffect(() => {
    if (searchParams.get('openCreate') === '1') {
      setIsCreateDialogOpen(true);
      router.replace(pathname);
    }
  }, [searchParams, pathname, router]);

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <Label>取引先種別</Label>
              <Select
                value={accountType || 'all'}
                onValueChange={(v) => onFilterChange('accountType', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
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
                  {ACCOUNT_INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>条件</Label>
              <Select
                value={needFollowUp || 'all'}
                onValueChange={(v) => onFilterChange('needFollowUp', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="1">要フォロー（7日以上連絡なし）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>データ品質</Label>
              <Select
                value={duplicates || 'all'}
                onValueChange={(v) => onFilterChange('duplicates', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="1">重複候補（会社名が同じ）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>並び替え</Label>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(v) => {
                  const [by, order] = v.split('-') as [string, 'asc' | 'desc'];
                  if (onSortChange) onSortChange(by, order);
                  else { onFilterChange('sortBy', by); onFilterChange('sortOrder', order); }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt-desc">更新日が新しい順</SelectItem>
                  <SelectItem value="updatedAt-asc">更新日が古い順</SelectItem>
                  <SelectItem value="name-asc">会社名あいうえお順</SelectItem>
                  <SelectItem value="name-desc">会社名逆順</SelectItem>
                  <SelectItem value="createdAt-desc">登録日が新しい順</SelectItem>
                  <SelectItem value="createdAt-asc">登録日が古い順</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>表示件数</Label>
              <Select
                value={String(limit)}
                onValueChange={(v) => onFilterChange('limit', parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10件</SelectItem>
                  <SelectItem value="20">20件</SelectItem>
                  <SelectItem value="50">50件</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterBar>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>営業のコツ:</strong> まず企業を1件登録 → その企業の「連絡先」で担当者を追加 → 電話・メールしたら「活動履歴」に記録。
          「最終連絡」「反応」「ネクストアクション」が一覧で分かるので、次に何をすべきか迷いません。
          <a href="/help" className="ml-1 font-medium underline">ヘルプで基本フローを見る →</a>
        </p>
      </div>
    </div>
  );
}
