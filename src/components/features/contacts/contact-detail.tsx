'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  Edit,
  Plus,
  ChevronLeft,
  Linkedin,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { CONTACT_SOURCES } from '@/lib/validations/contact';
import { useContact } from '@/hooks/use-contacts';
import { ContactForm } from './contact-form';
import type { ContactFormData } from '@/lib/validations/contact';
import type { Contact } from '@/types';

interface ContactDetailProps {
  contactId: string;
}

type ContactWithRelations = Contact & {
  company?: string;
  account?: { id: string; name: string };
  interactions?: Array<{ id: string; type: string; date: string; note: string | null; nextAction?: string | null }>;
  tasks?: Array<{ id: string; title: string; dueDate: string | null; priority: string; status: string }>;
};

/**
 * 連絡先詳細コンポーネント
 * APIから実データを取得して表示
 */
export function ContactDetail({ contactId }: ContactDetailProps) {
  const { data, isLoading, error } = useContact(contactId);
  const [editing, setEditing] = useState(false);
  const contact = data?.data as ContactWithRelations | undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">連絡先が見つかりません</p>
        <Link href="/contacts" className="mt-4 text-sm text-primary hover:underline">
          一覧に戻る
        </Link>
      </div>
    );
  }

  const accountId = contact.account?.id ?? contact.accountId;
  const companyName = contact.company ?? contact.account?.name ?? '—';

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <Link href="/contacts" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        連絡先一覧に戻る
      </Link>

      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-2xl font-bold text-primary">
              {contact.name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            <p className="text-muted-foreground">
              {[contact.role, contact.department].filter(Boolean).join(' - ') || '—'}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <InfluenceBadge level={contact.influenceLevel} />
              <StatusBadge status={contact.status} />
              {contact.contactSource && (
                <Badge variant="secondary">
                  {CONTACT_SOURCES.find((s) => s.value === contact.contactSource)?.label ?? contact.contactSource}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
          <Button asChild>
            <Link href={accountId ? `/activities?accountId=${accountId}&contactId=${contact.id}` : '/activities'}>
              <Plus className="mr-2 h-4 w-4" />
              活動を記録
            </Link>
          </Button>
        </div>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>連絡先を編集</DialogTitle>
            <DialogDescription>担当者情報を変更できます</DialogDescription>
          </DialogHeader>
          <ContactForm
            initialData={contactToFormData(contact)}
            onSuccess={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </DialogContent>
      </Dialog>

      {/* クイックアクション */}
      <div className="flex flex-wrap gap-2">
        {contact.email && (
          <Button variant="outline" asChild>
            <a href={`mailto:${contact.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              メールを送る
            </a>
          </Button>
        )}
        {contact.phone && (
          <Button variant="outline">
            <Phone className="mr-2 h-4 w-4" />
            電話をかける
          </Button>
        )}
        {contact.socialProfiles?.linkedin && (
          <Button variant="outline" asChild>
            <a href={contact.socialProfiles.linkedin} target="_blank" rel="noopener noreferrer">
              <Linkedin className="mr-2 h-4 w-4" />
              LinkedIn
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 連絡先情報 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>連絡先情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 所属企業 */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">所属企業</p>
              {accountId ? (
                <Link
                  href={`/accounts/${accountId}`}
                  className="flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  <Building2 className="h-4 w-4" />
                  {companyName}
                </Link>
              ) : (
                <span className="flex items-center gap-2">{companyName}</span>
              )}
            </div>

            {contact.email && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">メール</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {contact.email}
                </a>
              </div>
            )}

            {contact.phone && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">電話</p>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {contact.phone}
                </div>
              </div>
            )}

            {contact.mobile && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">携帯</p>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {contact.mobile}
                </div>
              </div>
            )}

            {contact.website && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Webサイト</p>
                <a
                  href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  {contact.website}
                </a>
              </div>
            )}

            {contact.socialProfiles && (contact.socialProfiles.linkedin || contact.socialProfiles.twitter || contact.socialProfiles.facebook) && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm text-muted-foreground">SNS</p>
                <div className="flex flex-wrap gap-2">
                  {contact.socialProfiles.linkedin && (
                    <a
                      href={contact.socialProfiles.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-[#0A66C2]/10 px-2 py-1 text-sm text-[#0A66C2] hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {contact.socialProfiles.twitter && (
                    <a
                      href={contact.socialProfiles.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-black/10 px-2 py-1 text-sm hover:underline dark:bg-white/10"
                    >
                      X
                    </a>
                  )}
                  {contact.socialProfiles.facebook && (
                    <a
                      href={contact.socialProfiles.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-[#1877F2]/10 px-2 py-1 text-sm text-[#1877F2] hover:underline"
                    >
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">最終連絡日</p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {contact.lastContactDate
                  ? `${formatDate(contact.lastContactDate)} (${formatRelativeTime(contact.lastContactDate)})`
                  : '未連絡'}
              </div>
            </div>

            {contact.notes && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">メモ</p>
                <p className="mt-1 text-sm">{contact.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* インタラクション履歴 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>インタラクション履歴</CardTitle>
              <CardDescription>この連絡先との活動履歴</CardDescription>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={accountId ? `/activities?accountId=${accountId}&contactId=${contact.id}` : '/activities'}>
                <Plus className="mr-2 h-4 w-4" />
                記録を追加
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {contact.interactions && contact.interactions.length > 0 ? (
              <div className="space-y-4">
                {contact.interactions.map((interaction: { id: string; type: string; date: string; note: string | null; nextAction?: string | null }) => (
                  <div
                    key={interaction.id}
                    className="flex gap-4 border-l-2 border-primary/20 pl-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getInteractionTypeLabel(interaction.type)}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(interaction.date)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{interaction.note ?? '—'}</p>
                      {interaction.nextAction && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          次のアクション: {interaction.nextAction}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                活動履歴がありません
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 関連タスク */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>関連タスク</CardTitle>
            <CardDescription>この連絡先に関連するタスク</CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href={`/tasks?openCreate=1${accountId ? `&accountId=${accountId}` : ''}`}>
              <Plus className="mr-2 h-4 w-4" />
              タスクを作成
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {contact.tasks && contact.tasks.length > 0 ? (
            <div className="space-y-2">
              {contact.tasks.map((task: { id: string; title: string; dueDate: string | null; priority: string; status: string }) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="block rounded-lg border p-3 text-sm hover:bg-muted/50"
                >
                  <span className="font-medium">{task.title}</span>
                  {task.dueDate && (
                    <span className="ml-2 text-muted-foreground">
                      — 期限: {formatDate(task.dueDate)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              タスクがありません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
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

function getInteractionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    call: '電話',
    email: 'メール',
    meeting: 'ミーティング',
    note: 'メモ',
    task: 'タスク',
  };
  return labels[type] || type;
}

/** contact-detail 用：API連絡先をフォーム初期値に変換（contact-list の contactToFormData と同様） */
function contactToFormData(c: ContactWithRelations): Partial<ContactFormData> & { id: string } {
  const accountId = c.account?.id ?? c.accountId;
  const sp = c.socialProfiles as { linkedin?: string; twitter?: string; facebook?: string } | undefined;
  return {
    id: c.id,
    accountId: accountId ?? '',
    name: c.name,
    firstName: c.firstName ?? '',
    lastName: c.lastName ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    mobile: c.mobile ?? '',
    website: c.website ?? '',
    role: c.role ?? '',
    department: c.department ?? '',
    company: c.company ?? c.account?.name ?? '',
    influenceLevel: (c.influenceLevel as ContactFormData['influenceLevel']) ?? 'other',
    contactSource: c.contactSource ?? undefined,
    status: c.status,
    tags: c.tags ?? [],
    notes: c.notes ?? '',
    socialProfiles: {
      linkedin: sp?.linkedin ?? '',
      twitter: sp?.twitter ?? '',
      facebook: sp?.facebook ?? '',
    },
  };
}
