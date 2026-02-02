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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface ContactDetailProps {
  contactId: string;
}

/**
 * 連絡先詳細コンポーネント
 */
export function ContactDetail({ contactId }: ContactDetailProps) {
  const [contact] = useState(getMockContactDetail(contactId));

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">連絡先が見つかりません</p>
      </div>
    );
  }

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
            <p className="text-muted-foreground">{contact.role} - {contact.department}</p>
            <div className="mt-1 flex gap-2">
              <InfluenceBadge level={contact.influenceLevel} />
              <StatusBadge status={contact.status} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            活動を記録
          </Button>
        </div>
      </div>

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
              <Link 
                href={`/accounts/${contact.accountId}`}
                className="flex items-center gap-2 font-medium text-primary hover:underline"
              >
                <Building2 className="h-4 w-4" />
                {contact.company}
              </Link>
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

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">最終連絡日</p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {contact.lastContactDate 
                  ? `${formatDate(contact.lastContactDate)} (${formatRelativeTime(contact.lastContactDate)})`
                  : '未連絡'
                }
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
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              記録を追加
            </Button>
          </CardHeader>
          <CardContent>
            {contact.interactions && contact.interactions.length > 0 ? (
              <div className="space-y-4">
                {contact.interactions.map((interaction: any) => (
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
                      <p className="mt-1 text-sm">{interaction.note}</p>
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
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            タスクを作成
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            タスクがありません
          </p>
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

function getMockContactDetail(id: string) {
  return {
    id,
    accountId: 'acc_1',
    name: '田中太郎',
    email: 'tanaka@abc.example.com',
    phone: '03-1234-5678',
    mobile: '090-1234-5678',
    role: '代表取締役',
    department: '経営',
    company: '株式会社ABC',
    influenceLevel: 'decision_maker',
    status: 'active',
    notes: '創業者。IT導入に積極的。毎週火曜日の午前中が連絡しやすい。',
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/tanaka',
    },
    lastContactDate: '2024-01-20T10:00:00Z',
    interactions: [
      { id: 'int_1', type: 'meeting', date: '2024-01-20', note: '初回打ち合わせ。課題のヒアリングを実施。来月中に提案書を提出予定。', nextAction: '提案書作成' },
      { id: 'int_2', type: 'email', date: '2024-01-25', note: '提案書を送付。確認後にフィードバックをいただく予定。' },
      { id: 'int_3', type: 'call', date: '2024-01-28', note: '提案書についての質問回答。概ね好意的な反応。' },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-28T15:30:00Z',
  };
}
