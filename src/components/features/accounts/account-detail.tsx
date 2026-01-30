'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Calendar,
  Edit,
  Plus,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AccountDetailProps {
  accountId: string;
}

/**
 * 企業アカウント詳細コンポーネント
 * 企業情報、連絡先一覧、取引履歴、インタラクション履歴を表示
 */
export function AccountDetail({ accountId }: AccountDetailProps) {
  // TODO: TanStack Queryでデータフェッチ
  const [account] = useState(getMockAccountDetail(accountId));

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">アカウントが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <Link href="/accounts" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        アカウント一覧に戻る
      </Link>

      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <p className="text-muted-foreground">{account.industry}</p>
            <div className="mt-1">
              <StatusBadge status={account.status} />
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
            連絡先を追加
          </Button>
        </div>
      </div>

      {/* 概要カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{account.contacts?.length || 0}</p>
              <p className="text-sm text-muted-foreground">連絡先</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{account.deals?.length || 0}</p>
              <p className="text-sm text-muted-foreground">進行中の案件</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="text-2xl">¥</div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(account.totalDealValue || 0)}</p>
              <p className="text-sm text-muted-foreground">取引総額</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{formatDate(account.createdAt)}</p>
              <p className="text-sm text-muted-foreground">登録日</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 企業情報 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>企業情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {account.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={account.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {account.website}
                </a>
              </div>
            )}
            {account.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{account.phone}</span>
              </div>
            )}
            {account.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${account.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {account.email}
                </a>
              </div>
            )}
            {account.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {account.postalCode && `〒${account.postalCode} `}
                  {account.state}{account.city}{account.address}
                </span>
              </div>
            )}
            
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">従業員数</p>
              <p className="font-medium">{account.employeeCount?.toLocaleString() || '-'} 名</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">年間売上</p>
              <p className="font-medium">{account.annualRevenue ? formatCurrency(account.annualRevenue) : '-'}</p>
            </div>
            
            {account.description && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">メモ</p>
                <p className="mt-1 text-sm">{account.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 連絡先一覧 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>連絡先</CardTitle>
              <CardDescription>この企業の担当者一覧</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              追加
            </Button>
          </CardHeader>
          <CardContent>
            {account.contacts && account.contacts.length > 0 ? (
              <div className="space-y-3">
                {account.contacts.map((contact: any) => (
                  <div 
                    key={contact.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <span className="text-sm font-medium">
                          {contact.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <Link 
                          href={`/contacts/${contact.id}`}
                          className="font-medium hover:underline"
                        >
                          {contact.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {contact.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.email && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`mailto:${contact.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <InfluenceBadge level={contact.influenceLevel} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                連絡先が登録されていません
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* インタラクション履歴 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>インタラクション履歴</CardTitle>
            <CardDescription>この企業との活動履歴</CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            活動を記録
          </Button>
        </CardHeader>
        <CardContent>
          {account.interactions && account.interactions.length > 0 ? (
            <div className="space-y-4">
              {account.interactions.map((interaction: any) => (
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
  );
}

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

function InfluenceBadge({ level }: { level?: string }) {
  if (!level) return null;
  
  const labels: Record<string, string> = {
    decision_maker: '意思決定者',
    influencer: '影響者',
    user: 'ユーザー',
    gatekeeper: 'ゲートキーパー',
  };
  
  return (
    <Badge variant="outline" className="text-xs">
      {labels[level] || level}
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

function getMockAccountDetail(id: string) {
  return {
    id,
    name: '株式会社ABC',
    industry: 'IT・ソフトウェア',
    website: 'https://abc-corp.example.com',
    phone: '03-1234-5678',
    email: 'info@abc.example.com',
    address: '1-2-3 ABCビル5F',
    city: '渋谷区',
    state: '東京都',
    postalCode: '150-0001',
    employeeCount: 150,
    annualRevenue: 500000000,
    status: 'active',
    description: 'ITソリューションを提供する企業。クラウドサービスに積極的。',
    totalDealValue: 3000000,
    contacts: [
      { id: 'con_1', name: '田中太郎', role: '代表取締役', email: 'tanaka@abc.example.com', influenceLevel: 'decision_maker' },
      { id: 'con_2', name: '鈴木花子', role: '営業部長', email: 'suzuki@abc.example.com', influenceLevel: 'influencer' },
    ],
    interactions: [
      { id: 'int_1', type: 'meeting', date: '2024-01-20', note: '初回打ち合わせ。課題のヒアリングを実施。' },
      { id: 'int_2', type: 'email', date: '2024-01-25', note: '提案書を送付' },
    ],
    deals: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
  };
}
