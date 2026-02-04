import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Book, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ヘルプ | Iyasaka Flow',
  description: 'Iyasaka Flow の使い方とサポート',
};

/**
 * ヘルプページ
 * 使い方の概要とサポートへのリンク
 */
export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          ヘルプ
        </h1>
        <p className="text-muted-foreground mt-1">
          Iyasaka Flow の使い方とサポート情報
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              はじめに
            </CardTitle>
            <CardDescription>基本的な使い方</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>企業アカウント</strong>から顧客企業を登録し、<strong>連絡先</strong>で担当者を管理します。
              案件は<strong>パイプライン</strong>でステージごとに管理し、<strong>タスク</strong>と<strong>活動履歴</strong>でフォローアップを記録できます。
            </p>
            <p>
              右上の<strong>通知ベル</strong>で、期限切れ・本日のタスクを確認できます。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              サポート
            </CardTitle>
            <CardDescription>お問い合わせ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              ご不明な点は<strong>設定</strong>ページのプロフィールから、または管理者にお問い合わせください。
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              設定ページへ →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>主な機能</CardTitle>
          <CardDescription>メニューとページの対応</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm md:grid-cols-2">
            <li><Link href="/dashboard" className="text-primary hover:underline">ダッシュボード</Link> — KPI・今日のタスク・活動サマリー</li>
            <li><Link href="/accounts" className="text-primary hover:underline">企業アカウント</Link> — 顧客企業の登録・管理</li>
            <li><Link href="/contacts" className="text-primary hover:underline">連絡先</Link> — 担当者の登録・管理</li>
            <li><Link href="/deals" className="text-primary hover:underline">パイプライン</Link> — 案件のステージ管理</li>
            <li><Link href="/tasks" className="text-primary hover:underline">タスク</Link> — やるべきことの管理</li>
            <li><Link href="/activities" className="text-primary hover:underline">活動履歴</Link> — 電話・メール・ミーティングの記録</li>
            <li><Link href="/emails" className="text-primary hover:underline">メール</Link> — 送信・テンプレート</li>
            <li><Link href="/reports" className="text-primary hover:underline">レポート</Link> — 売上・パイプライン・活動分析</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
