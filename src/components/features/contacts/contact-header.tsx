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
import { ContactForm } from './contact-form';
import { useAccounts } from '@/hooks/use-accounts';
import { CONTACT_STATUSES } from '@/lib/validations/contact';
import { downloadExport } from '@/lib/import-export/download';
import { toast } from 'sonner';

interface ContactHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  accountId: string;
  status: string;
  onFilterChange: (key: string, value: string | undefined) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

/**
 * 連絡先ページのヘッダー
 * 検索・フィルターをURLと連携
 */
export function ContactHeader({
  searchValue,
  onSearchChange,
  accountId,
  status,
  onFilterChange,
  onClearFilters,
  activeFilterCount,
}: ContactHeaderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const { data: accountsData } = useAccounts({ limit: 100 });
  const accounts = accountsData?.data ?? [];

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
          <h1 className="text-3xl font-bold tracking-tight">連絡先</h1>
          <p className="text-muted-foreground">
            顧客企業の担当者を管理します
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
              <DropdownMenuItem onClick={() => { downloadExport('contacts', 'csv'); toast.success('CSVをダウンロードしました'); }}>
                CSVでダウンロード
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { downloadExport('contacts', 'json'); toast.success('JSONをダウンロードしました'); }}>
                JSONでダウンロード
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                新規連絡先
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>新規連絡先を作成</DialogTitle>
                <DialogDescription>
                  担当者の情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <ContactForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput
            placeholder="名前、メール、会社名で検索..."
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
                  {CONTACT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>企業</Label>
              <Select
                value={accountId || 'all'}
                onValueChange={(v) => onFilterChange('accountId', v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterBar>
      </div>
      <div className="rounded-lg border border-muted-200 bg-muted/50 p-3 dark:border-muted-800">
        <p className="text-xs text-muted-foreground">
          <strong>ヒント:</strong> 電話・メールしたら「活動履歴」に記録すると、「最終連絡」「反応」「ネクストアクション」が一覧に表示されます。
          <Link href="/activities" className="ml-1 text-primary hover:underline">活動を記録 →</Link>
        </p>
      </div>
    </div>
  );
}
