'use client';

import { useState } from 'react';
import {
  Phone,
  Mail,
  Users,
  Handshake,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Script {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  situation: string;
  script: string;
  tips: string[];
}

const SCRIPTS: Script[] = [
  {
    id: 'cold-call',
    title: '初回電話（コールドコール）',
    category: 'リード獲得',
    icon: Phone,
    situation: 'まだ接点のない見込み客に初めて電話するとき',
    script: `「お忙しいところ恐れ入ります。〇〇株式会社の△△と申します。

本日は、御社の□□（業界/部門）のお取り組みについて、少しだけお時間をいただきたくお電話いたしました。

実は、同じ業界の企業様で「◎◎」という課題をお持ちのケースが多く、弊社でお手伝いできる可能性があると思いご連絡しました。

もしよろしければ、15分ほどお話を伺う時間をいただけませんでしょうか？
来週の◯曜日か◯曜日はいかがでしょうか？」`,
    tips: [
      '最初の10秒で「売り込み」ではなく「お役に立てるかの確認」というスタンスを示す',
      '断られても「資料だけでもお送りしてよろしいですか？」と一歩残す',
      '電話の前に相手企業のHPを必ずチェックし、事業内容や最近のニュースを把握しておく',
    ],
  },
  {
    id: 'follow-up-call',
    title: 'フォローアップ電話',
    category: 'フォロー',
    icon: Phone,
    situation: '提案後や見積送付後にフォローの電話をするとき',
    script: `「お世話になっております。〇〇の△△です。

先日お送りした（ご提案/お見積り）の件でお電話いたしました。
内容はご覧いただけましたでしょうか？

何かご不明な点や、追加で知りたい情報がございましたら、すぐにご対応いたしますので、お気軽にお申し付けください。

社内でのご検討状況はいかがでしょうか？」`,
    tips: [
      '提案後のフォローは1〜2営業日以内が効果的',
      '「確認しました」と言われたら「どの部分が特に気になりましたか？」と深掘りする',
      '決裁者がいつ確認するか、次のスケジュールを必ず聞く',
    ],
  },
  {
    id: 'initial-hearing',
    title: '初回ヒアリング',
    category: 'ヒアリング',
    icon: Users,
    situation: '初めての打合せ・オンラインミーティングで課題を聞き出すとき',
    script: `「本日はお時間いただきありがとうございます。

まずは御社のことをもう少し教えていただきたいのですが、
現在、□□（業務/分野）において特に課題に感じていらっしゃることはありますか？

（聞いた後）
ありがとうございます。ちなみに、それはいつ頃から課題になっていますか？
今まで何か対策は取られましたか？

もし解決できるとしたら、御社にとってどのくらいのインパクトがありそうですか？

ご予算や導入時期のイメージはございますか？」`,
    tips: [
      '自分が話す時間は全体の2割以下にする',
      '「なぜ？」を3回繰り返すと本当の課題が見えてくる',
      'BANTを意識する：Budget（予算）、Authority（決裁者）、Need（ニーズ）、Timeline（時期）',
      '打合せ後に議事録を送ると信頼度が大きく上がる',
    ],
  },
  {
    id: 'closing-push',
    title: 'クロージング（決断を促す）',
    category: '交渉・クロージング',
    icon: Handshake,
    situation: '見積提示後、相手が迷っているときに決断を促す',
    script: `「ここまでご検討いただきありがとうございます。

改めて確認ですが、□□（課題）を解決したいというお気持ちに変わりはないでしょうか？

弊社のご提案で、特に気になっている点やご不安な点はございますか？

（不安を聞いた後に対応して）
それでは、ぜひ前に進めさせていただければと思いますが、いかがでしょうか？

もし今月中にスタートいただければ、◎◎（特典/早期のメリット）もございます。」`,
    tips: [
      '「いかがでしょうか？」と聞いたら、相手が答えるまで沈黙を恐れない',
      '値引きを求められたら「代わりに契約期間を◯ヶ月に」など交換条件にする',
      '「社内で確認します」と言われたら「いつ頃ご回答いただけそうですか？」と期限を設定する',
    ],
  },
  {
    id: 'intro-email',
    title: '初回アプローチメール',
    category: 'リード獲得',
    icon: Mail,
    situation: '初めてメールを送る見込み客へのテンプレート',
    script: `件名：【□□の課題解決】に関するご提案 — 〇〇株式会社

◯◯株式会社
△△様

突然のご連絡失礼いたします。
〇〇株式会社の□□と申します。

御社の◎◎事業について拝見し、
弊社がお力になれる可能性があると思い、ご連絡いたしました。

弊社では、同じ業界の企業様が抱える
「××」「△△」といった課題を解決するサービスを提供しております。

もしよろしければ、15〜20分ほどオンラインで
御社のお取り組みについてお話を伺えればと存じます。

ご都合の良い日時をいくつかお教えいただけますと幸いです。

何卒よろしくお願いいたします。`,
    tips: [
      '件名は具体的に。「ご挨拶」より「【◯◯の課題解決】」のほうが開封率が高い',
      '本文は3〜5行で改行を入れ、読みやすくする',
      '「15〜20分」と短い時間を提示するとハードルが下がる',
      '送信後2〜3営業日経っても返事がなければフォローメールを送る',
    ],
  },
  {
    id: 'follow-up-email',
    title: 'フォローアップメール',
    category: 'フォロー',
    icon: Mail,
    situation: '打合せや提案後のフォローメール',
    script: `件名：本日のお打合せのお礼と議事録 — 〇〇株式会社

◯◯株式会社
△△様

本日はお忙しい中、お時間をいただきありがとうございました。

お打合せの内容を下記にまとめましたのでご確認ください。

【議事録】
・御社の課題：◎◎
・弊社の提案方向：□□
・次のステップ：△△（◯月◯日までに）

ご不明な点がございましたら、お気軽にご連絡ください。
引き続きよろしくお願いいたします。`,
    tips: [
      '打合せ当日中にメールを送るのがベスト',
      '議事録に「次のステップと期日」を明記すると、案件が止まりにくい',
      '相手の発言を引用すると「ちゃんと聞いてくれている」と感じてもらえる',
    ],
  },
];

const CATEGORIES = Array.from(new Set(SCRIPTS.map((s) => s.category)));

export function ScriptLibrary() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = SCRIPTS.filter((s) => {
    if (selectedCategory && s.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.situation.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('スクリプトをコピーしました');
  };

  return (
    <div className="space-y-4">
      {/* 検索・フィルター */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="スクリプトを検索..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
          >
            すべて
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* スクリプト一覧 */}
      <div className="space-y-3">
        {filtered.map((script) => {
          const isOpen = expandedId === script.id;
          return (
            <Card key={script.id}>
              <button
                onClick={() => setExpandedId(isOpen ? null : script.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <script.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{script.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{script.situation}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                  {script.category}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <CardContent className="pt-0 space-y-4">
                  {/* スクリプト本文 */}
                  <div className="relative">
                    <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-relaxed">
                      {script.script}
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute right-2 top-2"
                      onClick={() => handleCopy(script.script)}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      コピー
                    </Button>
                  </div>

                  {/* プロのコツ */}
                  <div>
                    <p className="text-sm font-medium mb-2">プロのコツ</p>
                    <ul className="space-y-1.5">
                      {script.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                            {i + 1}
                          </span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            該当するスクリプトが見つかりません
          </p>
        )}
      </div>
    </div>
  );
}
