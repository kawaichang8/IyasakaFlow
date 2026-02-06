'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Book, MessageCircle, ListChecks, Lightbulb, Target } from 'lucide-react';
import Link from 'next/link';

/**
 * ヘルプページ
 * 営業初心者でも使えるよう、基本フロー・用語集・チェックリストを掲載
 */
export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <HelpCircle className="h-8 w-8" />
          ヘルプ
        </h1>
        <p className="mt-1 text-muted-foreground">
          営業未経験の方でも迷わず使える、Iyasaka Flow の使い方ガイド
        </p>
      </div>

      {/* 営業の基本フロー */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            営業の基本フロー（BtoB）
          </CardTitle>
          <CardDescription>案件はこの流れで進めると迷いません</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-inside list-decimal space-y-2 text-sm">
            <li><strong>リード</strong> — 見込み客を登録する（企業・連絡先を追加）</li>
            <li><strong>ヒアリング</strong> — 相手の課題やニーズを聞く（活動履歴に「電話」「ミーティング」で記録）</li>
            <li><strong>見込み評価</strong> — 本当に商談になりそうか判断する</li>
            <li><strong>デモ・提案</strong> — 商品・サービスを紹介し、提案書や見積を出す</li>
            <li><strong>交渉</strong> — 条件や価格のすり合わせ</li>
            <li><strong>成約</strong> — 契約・受注。パイプラインで「成約」に移動</li>
          </ol>
          <p className="text-sm text-muted-foreground">
            毎回、<strong>「結果・アウトカム」</strong>と<strong>「次のアクション」</strong>を記録しておくと、次に何をすべきか一目で分かります。
          </p>
          <Link href="/activities" className="inline-flex text-sm font-medium text-primary hover:underline">
            活動履歴を記録する →
          </Link>
        </CardContent>
      </Card>

      {/* 初めての営業チェックリスト */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            初めての営業チェックリスト
          </CardTitle>
          <CardDescription>今日からできること。上から順に試してみましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">1</span>
              <span><Link href="/accounts" className="font-medium text-primary hover:underline">企業アカウント</Link>で、取引したい（または既に連絡している）会社を1件登録する</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">2</span>
              <span>その会社の<Link href="/contacts" className="font-medium text-primary hover:underline">連絡先</Link>（担当者）を1人登録する</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">3</span>
              <span>電話やメールをしたら、<Link href="/activities" className="font-medium text-primary hover:underline">活動履歴</Link>に「誰に・何をした・相手の反応・次にやること」を記録する</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">4</span>
              <span>商談になりそうなら<Link href="/deals" className="font-medium text-primary hover:underline">パイプライン</Link>に案件を追加し、ステージを進めていく</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">5</span>
              <span><Link href="/dashboard" className="font-medium text-primary hover:underline">ダッシュボード</Link>の「要フォロー」と「今日のタスク」を毎日確認し、忘れずにフォローする</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* 用語集 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            営業用語集
          </CardTitle>
          <CardDescription>よく使う言葉の意味（初心者向け）</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="font-semibold text-foreground">リード</dt><dd className="text-muted-foreground">見込み客。商談の候補になる企業・担当者。</dd></div>
            <div><dt className="font-semibold text-foreground">ヒアリング</dt><dd className="text-muted-foreground">相手の課題・ニーズ・予算などを聞くこと。営業の基本。</dd></div>
            <div><dt className="font-semibold text-foreground">アウトカム</dt><dd className="text-muted-foreground">連絡した結果。「好感触」「要フォロー」「反応なし」など。</dd></div>
            <div><dt className="font-semibold text-foreground">ネクストアクション</dt><dd className="text-muted-foreground">次にやること。例：次回コール、提案書送付。</dd></div>
            <div><dt className="font-semibold text-foreground">パイプライン</dt><dd className="text-muted-foreground">案件の進捗を「リード→提案→交渉→成約」のように並べたもの。</dd></div>
            <div><dt className="font-semibold text-foreground">ステージ</dt><dd className="text-muted-foreground">案件の段階。進むほど成約に近づく。</dd></div>
            <div><dt className="font-semibold text-foreground">フォロー</dt><dd className="text-muted-foreground">忘れずに再度連絡すること。放置すると案件が冷める。</dd></div>
            <div><dt className="font-semibold text-foreground">成約</dt><dd className="text-muted-foreground">契約が決まること。パイプラインで「成約」に移動して記録。</dd></div>
          </dl>
        </CardContent>
      </Card>

      {/* 今日のヒント（ランダム風） */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Lightbulb className="h-5 w-5" />
            プロのコツ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
          <p>・<strong>「結果」と「次のアクション」</strong>を毎回書くだけで、翌日から「何をすべきか」が明確になります。</p>
          <p>・<strong>7日以上連絡していない</strong>企業は、ダッシュボードの「要フォロー」に表示されます。こまめにフォローしましょう。</p>
          <p>・メールを送る前に<strong>メールテンプレート</strong>を使うと、初心者でも安心して送れます。</p>
        </CardContent>
      </Card>

      {/* はじめに・サポート */}
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
            <p>右上の<strong>通知ベル</strong>で、期限切れ・本日のタスクを確認できます。</p>
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
            <p>ご不明な点は<strong>設定</strong>ページのプロフィールから、または管理者にお問い合わせください。</p>
            <Link href="/settings" className="inline-flex gap-1 text-primary hover:underline">設定ページへ →</Link>
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
            <li><Link href="/dashboard" className="text-primary hover:underline">ダッシュボード</Link> — 今日やること・要フォロー・KPI</li>
            <li><Link href="/accounts" className="text-primary hover:underline">企業アカウント</Link> — 顧客企業の登録・管理</li>
            <li><Link href="/contacts" className="text-primary hover:underline">連絡先</Link> — 担当者の登録・管理</li>
            <li><Link href="/deals" className="text-primary hover:underline">パイプライン</Link> — 案件のステージ管理</li>
            <li><Link href="/tasks" className="text-primary hover:underline">タスク</Link> — やるべきことの管理</li>
            <li><Link href="/activities" className="text-primary hover:underline">活動履歴</Link> — 電話・メール・ミーティングの記録</li>
            <li><Link href="/emails" className="text-primary hover:underline">メール</Link> — 送信・テンプレート</li>
            <li><Link href="/reports" className="text-primary hover:underline">レポート</Link> — 売上・分析</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
