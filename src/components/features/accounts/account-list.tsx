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
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { useAccounts } from '@/hooks/use-accounts';
import { AccountForm } from './account-form';
import { ACCOUNT_TYPES } from '@/lib/validations/account';
import type { AccountFormData } from '@/lib/validations/account';
import type { Account, QueryParams } from '@/types';

interface AccountWithCounts extends Account {
  contactCount?: number;
  totalDealValue?: number;
}

/** APIのアカウントをフォームの initialData に変換 */
function accountToFormData(account: Account): Partial<AccountFormData> & { id: string } {
  return {
    id: account.id,
    name: account.name,
    industry: account.industry ?? '',
    website: account.website ?? '',
    phone: account.phone ?? '',
    email: account.email ?? '',
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
}

/**
 * 企業アカウント一覧コンポーネント
 * テーブル/カード表示、検索・フィルターはURL連携
 */
export function AccountList({ params }: AccountListProps) {
  const { data, isLoading, error } = useAccounts(params as QueryParams | undefined);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [editingAccount, setEditingAccount] = useState<AccountWithCounts | null>(null);
  const accounts = (data?.data ?? []) as AccountWithCounts[];

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
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
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
              onSuccess={() => setEditingAccount(null)}
              onCancel={() => setEditingAccount(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* テーブル表示 */}
      {viewMode === 'table' && (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">会社名</th>
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
              {accounts.map((account) => (
                <AccountTableRow
                  key={account.id}
                  account={{
                    ...account,
                    contactCount: account.contactCount ?? 0,
                    totalDealValue: account.totalDealValue ?? 0,
                  }}
                  onEdit={() => setEditingAccount(account)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* カード表示 */}
      {viewMode === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={{
                ...account,
                contactCount: account.contactCount ?? 0,
                totalDealValue: account.totalDealValue ?? 0,
              }}
              onEdit={() => setEditingAccount(account)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * テーブル行コンポーネント
 */
function AccountTableRow({ account, onEdit }: { account: AccountWithCounts; onEdit: () => void }) {
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="px-4 py-3">
        <Link 
          href={`/accounts/${account.id}`}
          className="flex items-center gap-3 font-medium hover:underline"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{account.name}</p>
            {account.website && (
              <p className="text-xs text-muted-foreground">{account.website}</p>
            )}
          </div>
        </Link>
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
        {account.industry || '-'}
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
        {account.accountType ? ACCOUNT_TYPES.find((t) => t.value === account.accountType)?.label ?? account.accountType : '-'}
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <StatusBadge status={account.status} />
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
 * ステータスバッジ
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

