'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
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
import { formatRelativeTime } from '@/lib/utils';
import { useContacts } from '@/hooks/use-contacts';
import type { Contact } from '@/types';

interface ContactListProps {
  params?: { search?: string; accountId?: string; status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string };
}

/**
 * 連絡先一覧コンポーネント
 * 検索・フィルターはURL連携
 */
export function ContactList({ params }: ContactListProps) {
  const { data, isLoading, error } = useContacts(params);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const contacts = data?.data ?? [];

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

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">連絡先がありません</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          検索条件を変えるか、「新規連絡先」から担当者を登録しましょう
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {viewMode === 'table' && (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">名前</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">会社</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">役職</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">影響力</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">最終連絡</th>
                <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <ContactTableRow key={contact.id} contact={contact} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactTableRow({ contact }: { contact: Contact & { account?: { id: string; name: string } } }) {
  const accountId = contact.account?.id ?? contact.accountId;
  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="px-4 py-3">
        <Link 
          href={`/contacts/${contact.id}`}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">
              {contact.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium hover:underline">{contact.name}</p>
            {contact.email && (
              <p className="text-xs text-muted-foreground">{contact.email}</p>
            )}
          </div>
        </Link>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        {accountId ? (
        <Link 
          href={`/accounts/${accountId}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Building2 className="h-4 w-4" />
          {contact.account?.name ?? (contact as any).company ?? '—'}
        </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
        {contact.role || '-'}
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <InfluenceBadge level={contact.influenceLevel} />
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
        {contact.lastContactDate ? formatRelativeTime(contact.lastContactDate) : '-'}
      </td>
      <td className="px-4 py-3 text-right">
        <ContactActions contact={contact} />
      </td>
    </tr>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-lg font-medium text-primary">
                {contact.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold hover:underline">{contact.name}</h3>
              <p className="text-sm text-muted-foreground">{contact.role || '役職未設定'}</p>
            </div>
          </Link>
          <ContactActions contact={contact} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <InfluenceBadge level={contact.influenceLevel} />
          <StatusBadge status={contact.status} />
        </div>

        <div className="mt-4 space-y-2 border-t pt-4 text-sm">
          {contact.company && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <Link href={`/accounts/${contact.accountId}`} className="hover:text-foreground">
                {contact.company}
              </Link>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${contact.email}`} className="hover:text-foreground">
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {contact.email && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={`mailto:${contact.email}`}>
                <Mail className="mr-1 h-3 w-3" />
                メール
              </a>
            </Button>
          )}
          {contact.phone && (
            <Button variant="outline" size="sm" className="flex-1">
              <Phone className="mr-1 h-3 w-3" />
              電話
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InfluenceBadge({ level }: { level?: string }) {
  if (!level) return null;
  
  const config: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'secondary' }> = {
    decision_maker: { label: '意思決定者', variant: 'success' },
    influencer: { label: '影響者', variant: 'info' },
    user: { label: 'ユーザー', variant: 'secondary' },
    gatekeeper: { label: 'ゲートキーパー', variant: 'warning' },
    other: { label: 'その他', variant: 'secondary' },
  };
  
  const { label, variant } = config[level] || { label: level, variant: 'secondary' as const };
  
  return <Badge variant={variant}>{label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'secondary'> = {
    active: 'success',
    inactive: 'secondary',
    bounced: 'secondary',
  };

  const labels: Record<string, string> = {
    active: 'アクティブ',
    inactive: '非アクティブ',
    bounced: 'メール不達',
  };

  return (
    <Badge variant={variants[status] || 'default'}>
      {labels[status] || status}
    </Badge>
  );
}

function ContactActions({ contact }: { contact: Contact }) {
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
          <Link href={`/contacts/${contact.id}`}>詳細を見る</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>編集</DropdownMenuItem>
        <DropdownMenuItem>活動を記録</DropdownMenuItem>
        <DropdownMenuItem>タスクを作成</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

