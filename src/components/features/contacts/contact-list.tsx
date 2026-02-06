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
import { formatRelativeTime } from '@/lib/utils';
import { useContacts, useDeleteContact } from '@/hooks/use-contacts';
import { ContactForm } from './contact-form';
import { toast } from 'sonner';
import type { ContactFormData } from '@/lib/validations/contact';
import type { Contact, QueryParams } from '@/types';

/** APIの連絡先をフォームの initialData に変換 */
function contactToFormData(contact: Contact & { account?: { id: string; name: string } }): Partial<ContactFormData> & { id: string } {
  const accountId = contact.account?.id ?? contact.accountId;
  return {
    id: contact.id,
    accountId: accountId ?? '',
    name: contact.name,
    firstName: contact.firstName ?? '',
    lastName: contact.lastName ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    mobile: contact.mobile ?? '',
    role: contact.role ?? '',
    department: contact.department ?? '',
    company: contact.company ?? contact.account?.name ?? '',
    influenceLevel: (contact.influenceLevel as ContactFormData['influenceLevel']) ?? 'other',
    status: contact.status,
    tags: contact.tags ?? [],
    notes: contact.notes ?? '',
  };
}

interface ContactListProps {
  params?: { search?: string; accountId?: string; status?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string };
}

/**
 * 連絡先一覧コンポーネント
 * 検索・フィルターはURL連携
 */
type ContactWithAccount = Contact & { account?: { id: string; name: string } };

export function ContactList({ params }: ContactListProps) {
  const { data, isLoading, error } = useContacts(params as QueryParams | undefined);
  const deleteMutation = useDeleteContact();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [editingContact, setEditingContact] = useState<ContactWithAccount | null>(null);
  const contacts = (data?.data ?? []) as ContactWithAccount[];

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除してもよろしいですか？`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('連絡先を削除しました');
      setEditingContact(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

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

      {/* 編集ダイアログ */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>連絡先を編集</DialogTitle>
            <DialogDescription>
              担当者情報を変更できます
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <ContactForm
              initialData={contactToFormData(editingContact)}
              onSuccess={() => setEditingContact(null)}
              onCancel={() => setEditingContact(null)}
            />
          )}
        </DialogContent>
      </Dialog>

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
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">反応</th>
                <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">ネクストアクション</th>
                <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <ContactTableRow
                  key={contact.id}
                  contact={contact}
                  onEdit={() => setEditingContact(contact)}
                  onDelete={() => handleDelete(contact.id, contact.name)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'card' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={() => setEditingContact(contact)}
              onDelete={() => handleDelete(contact.id, contact.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactTableRow({
  contact,
  onEdit,
  onDelete,
}: {
  contact: ContactWithAccount;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
          {contact.account?.name ?? (contact as Contact).company ?? '—'}
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
      <td className="hidden max-w-[100px] truncate px-4 py-3 text-sm text-muted-foreground lg:table-cell" title={contact.lastOutcome ?? undefined}>
        {contact.lastOutcome ?? '—'}
      </td>
      <td className="hidden max-w-[120px] truncate px-4 py-3 text-sm lg:table-cell" title={contact.nextAction ?? undefined}>
        {contact.nextAction ? <span className="font-medium text-primary">{contact.nextAction}</span> : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <ContactActions contact={contact} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}

function ContactCard({ contact, onEdit, onDelete }: { contact: ContactWithAccount; onEdit: () => void; onDelete: () => void }) {
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
          <ContactActions contact={contact} onEdit={onEdit} onDelete={onDelete} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <InfluenceBadge level={contact.influenceLevel} />
          <StatusBadge status={contact.status} />
        </div>

        {(contact.lastOutcome || contact.nextAction) && (
          <div className="mt-3 space-y-1 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2 text-xs">
            {contact.lastOutcome && <p className="truncate text-muted-foreground" title={contact.lastOutcome}>反応: {contact.lastOutcome}</p>}
            {contact.nextAction && <p className="font-medium text-primary" title={contact.nextAction}>次: {contact.nextAction}</p>}
          </div>
        )}

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

function ContactActions({ contact, onEdit, onDelete }: { contact: Contact; onEdit: () => void; onDelete: () => void }) {
  const accountId = (contact as ContactWithAccount).account?.id ?? contact.accountId;
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
        <DropdownMenuItem onClick={onEdit}>編集</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={accountId ? `/activities?accountId=${accountId}&contactId=${contact.id}` : '/activities'}>
            活動を記録
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={accountId ? `/tasks?openCreate=1&accountId=${accountId}` : '/tasks?openCreate=1'}>
            タスクを作成
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
          削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

