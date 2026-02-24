'use client';

import { useState } from 'react';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Target,
  Phone,
  FileText,
  Handshake,
  Trophy,
  XCircle,
  Search,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageAdvice {
  stage: string;
  label: string;
  icon: React.ElementType;
  color: string;
  goal: string;
  keyActions: string[];
  tips: string[];
  checkpoints: string[];
}

const DEAL_STAGE_ADVICE: StageAdvice[] = [
  {
    stage: 'lead',
    label: 'リード',
    icon: Search,
    color: 'text-gray-600',
    goal: '見込み客の関心を引き、ヒアリングのアポを取る',
    keyActions: [
      '初回の電話やメールで接点を作る',
      '相手の課題やニーズをざっくり把握する',
      'アポ（打合せ・ヒアリング）の日程を確定する',
    ],
    tips: [
      '最初の電話は「売り込み」ではなく「お役に立てるか確認」というスタンスで',
      '相手の業界ニュースや課題に触れると興味を引きやすい',
      'メールは件名を具体的に。「ご挨拶」より「〇〇の△△についてご相談」が開封率UP',
    ],
    checkpoints: [
      '相手の連絡先（電話・メール）が分かっているか',
      '決裁者が誰か、少しでも分かっているか',
      '次のアクション（電話日、メール送信日）が決まっているか',
    ],
  },
  {
    stage: 'discovery',
    label: 'ヒアリング・発見',
    icon: MessageSquare,
    color: 'text-blue-600',
    goal: '相手の課題・予算・時期・決裁プロセスを把握する',
    keyActions: [
      'BANT（予算・決裁者・ニーズ・時期）を確認する',
      '相手が「解決したい」と思っている課題を深掘りする',
      '競合がいるか、他に検討しているものがないか聞く',
    ],
    tips: [
      '「御社で今一番困っていることは何ですか？」と率直に聞く',
      '話を聞く時間を8割、こちらの説明は2割にする',
      '議事録を書いて送ると「この人はちゃんとしている」と信頼が増す',
    ],
    checkpoints: [
      '予算の目安が分かったか',
      '決裁者・キーパーソンは誰か把握したか',
      '導入時期の希望はあるか',
    ],
  },
  {
    stage: 'qualified',
    label: '見込み評価済み',
    icon: CheckCircle2,
    color: 'text-cyan-600',
    goal: '正式な提案に進めるか判断し、提案準備を始める',
    keyActions: [
      'ヒアリング結果を整理し、解決策の方向性を伝える',
      '提案内容の骨子を社内で確認・承認する',
      '提案日の日程を確定する',
    ],
    tips: [
      '見込みが低いならここで正直に撤退する判断も大切（時間は有限）',
      '提案準備で迷ったら上司やチームに相談する',
      '提案日までの間も1回は連絡を入れて温度感を維持する',
    ],
    checkpoints: [
      'この案件に時間をかける価値があるか冷静に評価したか',
      '提案の方向性が相手のニーズに合っているか',
      '提案日が決まっているか',
    ],
  },
  {
    stage: 'proposal',
    label: '提案',
    icon: FileText,
    color: 'text-indigo-600',
    goal: '相手の課題に合った提案をし、見積を提示する',
    keyActions: [
      '提案書を作成し、プレゼンする',
      '見積書を提示する',
      '相手の質問や懸念に回答する',
    ],
    tips: [
      '提案書は「相手の課題→解決策→期待効果→費用」の流れで',
      '金額だけでなく「導入後にどうなるか」を具体的に見せる',
      '提案後は1〜2営業日以内にフォローの連絡をする',
    ],
    checkpoints: [
      '提案内容が相手の課題に直結しているか',
      '見積は競合と比較して妥当か',
      '決裁者が提案を見ているか',
    ],
  },
  {
    stage: 'negotiation',
    label: '交渉',
    icon: Handshake,
    color: 'text-orange-600',
    goal: '条件を合意し、契約を締結する',
    keyActions: [
      '値引き・条件変更の交渉に対応する',
      '契約書・発注書の準備を進める',
      '決裁者の最終承認を取り付ける',
    ],
    tips: [
      '値引きを求められたら「代わりに契約期間を長く」など交換条件で交渉する',
      '「いつまでに決めてもらえますか」とクロージングの期限を明確にする',
      '相手が迷っている場合は「導入企業の事例」を見せると効果的',
    ],
    checkpoints: [
      '相手の懸念をすべて解消したか',
      '契約条件で双方合意できているか',
      'クロージングの期日が決まっているか',
    ],
  },
  {
    stage: 'closed_won',
    label: '成約',
    icon: Trophy,
    color: 'text-green-600',
    goal: 'スムーズな導入と、長期的な関係構築',
    keyActions: [
      '導入・納品のスケジュールを確定する',
      '社内に成約報告し、関係者に引き継ぐ',
      '1ヶ月後にフォローの連絡を入れる',
    ],
    tips: [
      '成約後のフォローが次の紹介や追加受注につながる',
      '成約の理由を振り返ると、自分の勝ちパターンが見えてくる',
      '「ありがとうございます」の気持ちを忘れずに',
    ],
    checkpoints: [
      '導入までのタスクが明確になっているか',
      '次のフォロー日をカレンダーに入れたか',
    ],
  },
  {
    stage: 'closed_lost',
    label: '失注',
    icon: XCircle,
    color: 'text-red-600',
    goal: '失注理由を分析し、次に活かす',
    keyActions: [
      '失注の理由を可能な限りヒアリングする',
      '振り返りを記録に残す',
      '半年後に再アプローチできるかを判断する',
    ],
    tips: [
      '失注は「終わり」ではなく「次の種まき」のチャンス',
      '「予算・タイミング・機能不足・競合」のどれが原因かを特定する',
      '丁寧にお礼を伝えると、将来また声がかかることがある',
    ],
    checkpoints: [
      '失注理由を記録したか',
      '再アプローチのタイミングをメモしたか',
    ],
  },
];

const OPPORTUNITY_STAGE_ADVICE: StageAdvice[] = [
  DEAL_STAGE_ADVICE[0], // lead
  DEAL_STAGE_ADVICE[3], // proposal
  DEAL_STAGE_ADVICE[4], // negotiation
  DEAL_STAGE_ADVICE[5], // won
  DEAL_STAGE_ADVICE[6], // lost
];

interface StageAdviceCardProps {
  stage: string;
  variant?: 'deal' | 'opportunity';
}

export function StageAdviceCard({ stage, variant = 'deal' }: StageAdviceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const adviceList = variant === 'deal' ? DEAL_STAGE_ADVICE : OPPORTUNITY_STAGE_ADVICE;
  const advice = adviceList.find(
    (a) => a.stage === stage.toLowerCase() || a.label === stage
  );

  if (!advice) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className={cn('h-4 w-4', advice.color)} />
          <span className="text-sm font-medium">
            「{advice.label}」ステージのアドバイス
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 text-sm">
          {/* ゴール */}
          <div>
            <div className="flex items-center gap-1.5 font-medium">
              <Target className="h-3.5 w-3.5" />
              このステージのゴール
            </div>
            <p className="mt-1 text-muted-foreground">{advice.goal}</p>
          </div>

          {/* やるべきこと */}
          <div>
            <p className="font-medium">やるべきこと</p>
            <ul className="mt-1 space-y-1">
              {advice.keyActions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* コツ */}
          <div>
            <p className="font-medium">プロのコツ</p>
            <ul className="mt-1 space-y-1">
              {advice.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* チェックポイント */}
          <div>
            <p className="font-medium">次に進む前のチェック</p>
            <ul className="mt-1 space-y-1">
              {advice.checkpoints.map((cp, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                  {cp}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export { DEAL_STAGE_ADVICE, OPPORTUNITY_STAGE_ADVICE };
export type { StageAdvice };
