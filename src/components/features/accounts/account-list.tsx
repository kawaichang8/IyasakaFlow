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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import { useAccounts } from '@/hooks/use-accounts';
import type { Account, QueryParams } from '@/types';

interface AccountWithCounts extends Account {
  contactCount?: number;
  totalDealValue?: number;
}

interface AccountListProps {
  params?: { search?: string; industry?: string; status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string };
}

/**
 * 企業アカウント一覧コンポーネント
 * テーブル/カード表示、検索・フィルターはURL連携
 */
export function AccountList({ params }: AccountListProps) {
  const { data, isLoading, error } = useAccounts(params as QueryParams | undefined);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const accounts = (data?.data ?? []) as AccountWithCounts[];

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
        データの取得に失敗しました
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

      {/* テーブル表示 */}
      {viewMode === 'table' && (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">会社名</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">業種</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">ステータス</th>
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
function AccountTableRow({ account }: { account: Account & { contactCount?: number; totalDealValue?: number } }) {
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
      <td className="hidden px-4 py-3 lg:table-cell">
        <StatusBadge status={account.status} />
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
        <AccountActions account={account} />
      </td>
    </tr>
  );
}

/**
 * カードコンポーネント
 */
function AccountCard({ account }: { account: Account & { contactCount?: number; totalDealValue?: number } }) {
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
            </div>
          </Link>
          <AccountActions account={account} />
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <StatusBadge status={account.status} />
        </div>

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
    inactive: 'secondary',
    churned: 'secondary',
  };

  const labels: Record<string, string> = {
    active: 'アクティブ',
    prospect: '見込み',
    inactive: '非アクティブ',
    churned: '離脱',
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
function AccountActions({ account }: { account: Account }) {
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
        <DropdownMenuItem>編集</DropdownMenuItem>
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

