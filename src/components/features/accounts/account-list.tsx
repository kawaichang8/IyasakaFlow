'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  TrendingUp,
  MoreHorizontal,
  ExternalLink,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { useAccounts, useUpdateAccount, useDeleteAccount } from '@/hooks/use-accounts';
import { AccountForm } from './account-form';
import { ACCOUNT_TYPES, ACCOUNT_STATUSES, ACCOUNT_INDUSTRIES } from '@/lib/validations/account';
import type { AccountFormData } from '@/lib/validations/account';
import type { Account, QueryParams } from '@/types';

interface AccountWithCounts extends Account {
  contactCount?: number;
  totalDealValue?: number;
}

/** APIのアカウントをフォームの initialData に変換 */
function accountToFormData(account: Account): Partial<AccountFormData> & { id: string } {
  const sp = account.socialProfiles;
  return {
    id: account.id,
    name: account.name,
    industry: account.industry ?? '',
    website: account.website ?? '',
    phone: account.phone ?? '',
    email: account.email ?? '',
    socialProfiles: {
      linkedin: sp?.linkedin ?? '',
      twitter: sp?.twitter ?? '',
      facebook: sp?.facebook ?? '',
    },
    address: account.address ?? '',
    city: account.city ?? '',
    state: account.state ?? '',
    postalCode: account.postalCode ?? '',
    country: account.country ?? '日本',
    employeeCount: account.employeeCount ?? undefined,
    annualRevenue: account.annualRevenue ?? undefined,
    accountType: account.accountType ?? undefined,
    status: account.status,
    description: account.description ?? '',
    tags: account.tags ?? [],
  };
}

interface AccountListProps {
  params?: { search?: string; industry?: string; accountType?: string; status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string };
  onPageChange?: (page: number) => void;
}

/**
 * 企業アカウント一覧コンポーネント
 * テーブル/カード表示、検索・フィルターはURL連携
 */
export function AccountList({ params, onPageChange }: AccountListProps) {
  const { data, isLoading, error } = useAccounts(params as QueryParams | undefined);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [editingAccount, setEditingAccount] = useState<AccountWithCounts | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const deleteAccount = useDeleteAccount();
  const accounts = (data?.data ?? []) as AccountWithCounts[];
  const pagination = data?.pagination;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive whitespace-pre-wrap">
        {error instanceof Error ? error.message : 'データの取得に失敗しました'}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">アカウントがありません</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          検索条件を変えるか、「新規アカウント」から最初の顧客企業を登録しましょう
        </p>
      </div>
    );
  }

  const handleCloseEdit = () => {
    setEditingAccount(null);
    setEditingIndex(null);
  };

  const allSelected = accounts.length > 0 && selectedIds.length === accounts.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const ok = window.confirm(
      `${selectedIds.length}件の企業を削除しますか？\n関連する連絡先・案件もまとめて削除されます。`,
    );
    if (!ok) return;
    try {
      // 接続数制限を避けるため、1件ずつ順番に削除する
      // （まとめて多数のリクエストを飛ばさない）
      for (const id of selectedIds) {
        // eslint-disable-next-line no-await-in-loop
        await deleteAccount.mutateAsync(id);
      }
      setSelectedIds([]);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'アカウントの削除に失敗しました';
      window.alert(message);
    }
  };

  const handleSaveAndNext = () => {
    if (editingIndex == null) {
      handleCloseEdit();
      return;
    }
    const nextIndex = editingIndex + 1;
    if (nextIndex < accounts.length) {
      setEditingIndex(nextIndex);
      setEditingAccount(accounts[nextIndex]);
    } else {
      handleCloseEdit();
    }
  };

  return (
    <div className="space-y-4">
      {/* 表示切替 */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === 'table' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('table')}
        >
          テーブル
        </Button>
        <Button
          variant={viewMode === 'card' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('card')}
        >
          カード
        </Button>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>企業アカウントを編集</DialogTitle>
            <DialogDescription>
              顧客企業の情報を変更できます
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <AccountForm
              initialData={accountToFormData(editingAccount)}
              onSuccess={handleCloseEdit}
              onSaveAndNext={handleSaveAndNext}
              onCancel={handleCloseEdit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* テーブル表示 */}
      {viewMode === 'table' && (
        <div className="space-y-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between rounded-md border bg-muted/60 px-3 py-2 text-xs">
              <span>
                {selectedIds.length}件選択中
              </span>
              <Button
                variant="destructive"
                size="xs"
                onClick={handleBulkDelete}
                disabled={deleteAccount.isPending}
              >
                選択した企業を削除
              </Button>
            </div>
          )}
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">会社名</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">電話</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">メール</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">Webサイト</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">業種</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">種別</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">ステータス</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium xl:table-cell">最終連絡</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium xl:table-cell">反応</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium xl:table-cell">ネクストアクション</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">連絡先数</th>
                  <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">取引総額</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account, index) => (
                  <AccountTableRow
                    key={account.id}
                    account={{
                      ...account,
                      contactCount: account.contactCount ?? 0,
                      totalDealValue: account.totalDealValue ?? 0,
                    }}
                    selected={selectedIds.includes(account.id)}
                    onToggleSelect={() => toggleSelectOne(account.id)}
                    onEdit={() => {
                      setEditingIndex(index);
                      setEditingAccount(account);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* カード表示 */}
      {viewMode === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account, index) => (
            <AccountCard
              key={account.id}
              account={{
                ...account,
                contactCount: account.contactCount ?? 0,
                totalDealValue: account.totalDealValue ?? 0,
              }}
              onEdit={() => {
                setEditingIndex(index);
                setEditingAccount(account);
              }}
            />
          ))}
        </div>
      )}

      {/* ページ送り */}
      {pagination && pagination.totalPages > 1 && onPageChange && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}件 / 全{pagination.total}件
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>
            <span className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * テーブル行コンポーネント
 */
function AccountTableRow({
  account,
  selected,
  onToggleSelect,
  onEdit,
}: {
  account: AccountWithCounts;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="w-10 px-4 py-3 align-top">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <InlineTextField
              id={account.id}
              field="name"
              value={account.name}
              placeholder="会社名を入力"
              className="font-medium"
            />
            <Link
              href={`/accounts/${account.id}`}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              詳細
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
        <InlineTextField
          id={account.id}
          field="phone"
          value={account.phone ?? null}
          placeholder="—"
        />
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
        <InlineTextField
          id={account.id}
          field="email"
          value={account.email ?? null}
          placeholder="—"
        />
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
        <InlineWebsiteField
          id={account.id}
          value={account.website ?? null}
        />
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
        <InlineIndustrySelect id={account.id} value={account.industry ?? null} />
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
        <InlineAccountTypeSelect id={account.id} value={account.accountType ?? null} />
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <InlineStatusSelect id={account.id} value={account.status} />
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell" title={account.lastActivityAt ? formatDate(account.lastActivityAt) : undefined}>
        {account.lastActivityAt ? formatRelativeTime(account.lastActivityAt) : '—'}
      </td>
      <td className="hidden max-w-[120px] truncate px-4 py-3 text-sm xl:table-cell" title={account.lastOutcome ?? undefined}>
        {account.lastOutcome ? <span className="text-muted-foreground">{account.lastOutcome}</span> : '—'}
      </td>
      <td className="hidden max-w-[140px] truncate px-4 py-3 text-sm xl:table-cell" title={account.nextAction ?? undefined}>
        {account.nextAction ? (
          <span className="font-medium text-primary">{account.nextAction}</span>
        ) : '—'}
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <div className="flex items-center gap-1 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          {account.contactCount || 0}
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm md:table-cell">
        {account.totalDealValue ? formatCurrency(account.totalDealValue) : '-'}
      </td>
      <td className="px-4 py-3 text-right">
        <AccountActions account={account} onEdit={onEdit} />
      </td>
    </tr>
  );
}

/**
 * カードコンポーネント
 */
function AccountCard({ account, onEdit }: { account: Account & { contactCount?: number; totalDealValue?: number }; onEdit: () => void }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/accounts/${account.id}`} className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold hover:underline">{account.name}</h3>
              <p className="text-sm text-muted-foreground">{account.industry || '業種未設定'}</p>
              {account.accountType && (
                <p className="text-xs text-muted-foreground">
                  {ACCOUNT_TYPES.find((t) => t.value === account.accountType)?.label ?? account.accountType}
                </p>
              )}
            </div>
          </Link>
          <AccountActions account={account} onEdit={onEdit} />
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <StatusBadge status={account.status} />
        </div>

        {(account.lastActivityAt || account.lastOutcome || account.nextAction) && (
          <div className="mt-3 space-y-1 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2 text-xs">
            {account.lastActivityAt && (
              <p className="text-muted-foreground">最終連絡: {formatRelativeTime(account.lastActivityAt)}</p>
            )}
            {account.lastOutcome && (
              <p className="truncate text-muted-foreground" title={account.lastOutcome}>反応: {account.lastOutcome}</p>
            )}
            {account.nextAction && (
              <p className="font-medium text-primary" title={account.nextAction}>次: {account.nextAction}</p>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{account.contactCount || 0} 連絡先</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {account.totalDealValue ? formatCurrency(account.totalDealValue) : '-'}
            </span>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-4 flex gap-2">
          {account.phone && (
            <Button variant="outline" size="sm" className="flex-1">
              <Phone className="mr-1 h-3 w-3" />
              電話
            </Button>
          )}
          {account.email && (
            <Button variant="outline" size="sm" className="flex-1">
              <Mail className="mr-1 h-3 w-3" />
              メール
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ステータスバッジ（従来の表示用）
 */
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
    active: 'success',
    prospect: 'warning',
    trial: 'warning',
    customer: 'success',
    inactive: 'secondary',
    suspended: 'secondary',
    churned: 'secondary',
    partner: 'default',
  };

  const labels: Record<string, string> = {
    active: 'アクティブ',
    prospect: '見込み',
    trial: 'トライアル中',
    customer: '顧客',
    inactive: '非アクティブ',
    suspended: '一時停止',
    churned: '離脱',
    partner: 'パートナー',
  };

  return (
    <Badge variant={variants[status] || 'default'}>
      {labels[status] || status}
    </Badge>
  );
}

/**
 * ステータスのインライン編集用セレクト
 */
function InlineStatusSelect({ id, value }: { id: string; value: string }) {
  const update = useUpdateAccount(id);
  return (
    <Select
      value={value}
      onValueChange={(v) => update.mutate({ status: v as any })}
    >
      <SelectTrigger className="h-8 w-[120px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ACCOUNT_STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * 取引先種別のインライン編集用セレクト
 */
function InlineAccountTypeSelect({ id, value }: { id: string; value: string | null }) {
  const update = useUpdateAccount(id);
  const current = value ?? 'none';
  return (
    <Select
      value={current}
      onValueChange={(v) =>
        update.mutate({ accountType: v === 'none' ? undefined : (v as any) })
      }
    >
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue placeholder="未選択" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">未選択</SelectItem>
        {ACCOUNT_TYPES.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * 業種のインライン編集用セレクト
 */
function InlineIndustrySelect({ id, value }: { id: string; value: string | null }) {
  const update = useUpdateAccount(id);
  const current = value ?? 'none';
  return (
    <Select
      value={current}
      onValueChange={(v) =>
        update.mutate({ industry: v === 'none' ? null : v })
      }
    >
      <SelectTrigger className="h-8 w-[160px] text-xs">
        <SelectValue placeholder="未選択" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">未選択</SelectItem>
        {ACCOUNT_INDUSTRIES.map((ind) => (
          <SelectItem key={ind} value={ind}>
            {ind}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Webサイト列: クリックでリンクを開く。編集はペンアイコンから。
 */
function InlineWebsiteField({ id, value }: { id: string; value: string | null }) {
  const update = useUpdateAccount(id);
  const [local, setLocal] = useState(value ?? '');
  const [editing, setEditing] = useState(false);

  const commit = () => {
    const trimmed = local.trim();
    if (trimmed === (value ?? '')) {
      setEditing(false);
      return;
    }
    update.mutate({ website: trimmed || null });
    setEditing(false);
  };

  const href = (() => {
    const v = (value ?? '').trim();
    if (!v) return null;
    if (/^https?:\/\//i.test(v)) return v;
    return `https://${v}`;
  })();

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          className="min-w-0 flex-1 rounded border px-1 py-0.5 text-sm"
          autoFocus
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
            if (e.key === 'Escape') {
              setLocal(value ?? '');
              setEditing(false);
            }
          }}
          placeholder="https://..."
        />
      </div>
    );
  }

  if (value && value.trim().length > 0 && href) {
    return (
      <div className="flex items-center gap-1">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 truncate text-sm text-primary hover:underline"
          title={value}
        >
          {value}
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => {
            e.preventDefault();
            setEditing(true);
          }}
          title="Webサイトを編集"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-muted-foreground">—</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => setEditing(true)}
        title="Webサイトを追加"
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}

/**
 * テキスト項目のインライン編集用フィールド
 */
function InlineTextField({
  id,
  field,
  value,
  placeholder,
  className,
}: {
  id: string;
  field: 'name' | 'phone' | 'email';
  value: string | null;
  placeholder?: string;
  className?: string;
}) {
  const update = useUpdateAccount(id);
  const [local, setLocal] = useState(value ?? '');
  const [editing, setEditing] = useState(false);

  const commit = () => {
    const trimmed = local.trim();
    if (trimmed === (value ?? '')) {
      setEditing(false);
      return;
    }
    update.mutate({ [field]: trimmed || null } as any);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        className={`w-full truncate text-left text-sm hover:underline ${className ?? ''}`}
        onClick={() => setEditing(true)}
      >
        {value && value.trim().length > 0 ? value : placeholder ?? '—'}
      </button>
    );
  }

  return (
    <input
      className={`w-full rounded border px-1 py-0.5 text-sm ${className ?? ''}`}
      autoFocus
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        }
        if (e.key === 'Escape') {
          setLocal(value ?? '');
          setEditing(false);
        }
      }}
    />
  );
}

/**
 * アクションメニュー
 */
function AccountActions({ account, onEdit }: { account: Account; onEdit?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">メニュー</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>アクション</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/accounts/${account.id}`}>
            詳細を見る
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.()}>
          編集
        </DropdownMenuItem>
        <DropdownMenuItem>連絡先を追加</DropdownMenuItem>
        <DropdownMenuItem>案件を作成</DropdownMenuItem>
        {account.website && (
          <DropdownMenuItem asChild>
            <a href={account.website} target="_blank" rel="noopener noreferrer">
              Webサイトを開く
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

