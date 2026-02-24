'use client';

import Link from 'next/link';
import {
  Phone,
  FileText,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Priority = 'high' | 'medium' | 'low';

interface ActionItem {
  id: string;
  title: string;
  reason: string;
  priority: Priority;
  href: string;
  icon: React.ElementType;
  category: string;
}

interface NeedFollowUp {
  id: string;
  name: string;
  lastActivityAt: string | null;
}

interface DealInfo {
  id: string;
  name: string;
  stage: string;
  value: number;
  expectedCloseDate: string | null;
}

interface TaskInfo {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  isOverdue: boolean;
}

interface NextActionsProps {
  needToFollowUp: NeedFollowUp[];
  pipeline: DealInfo[];
  todaysTasks: TaskInfo[];
  pendingTasks: number;
  overdueTasks: number;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: { label: '重要', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  medium: { label: '推奨', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  low: { label: 'ヒント', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
};

function generateActions({
  needToFollowUp,
  pipeline,
  todaysTasks,
  pendingTasks,
  overdueTasks,
}: NextActionsProps): ActionItem[] {
  const actions: ActionItem[] = [];

  if (overdueTasks > 0) {
    actions.push({
      id: 'overdue-tasks',
      title: `期限切れのタスクが ${overdueTasks} 件あります`,
      reason: '期限切れのタスクがあると信頼を損ないます。今すぐ対応するか、期限を見直しましょう。',
      priority: 'high',
      href: '/tasks',
      icon: AlertCircle,
      category: 'タスク',
    });
  }

  if (needToFollowUp.length > 0) {
    const top = needToFollowUp[0];
    actions.push({
      id: 'follow-up',
      title: `${top.name} にフォローの連絡をしましょう`,
      reason: '7日以上連絡していない企業です。定期的なフォローは成約率を大きく向上させます。まずは電話やメールで近況を確認しましょう。',
      priority: 'high',
      href: `/accounts/${top.id}`,
      icon: Phone,
      category: 'フォロー',
    });
  }

  if (pipeline.length > 0) {
    const stalled = pipeline.find(
      (d) => d.stage === 'PROPOSAL' || d.stage === 'NEGOTIATION'
    );
    if (stalled) {
      actions.push({
        id: `deal-push-${stalled.id}`,
        title: `「${stalled.name}」を次のステージに進めましょう`,
        reason: stalled.stage === 'PROPOSAL'
          ? '提案済みの案件は時間が経つと熱が冷めます。反応を確認し、見積や交渉に進めましょう。'
          : '交渉段階です。決裁者の懸念を解消し、条件をまとめてクロージングに向かいましょう。',
        priority: 'medium',
        href: `/deals/${stalled.id}`,
        icon: FileText,
        category: 'パイプライン',
      });
    }

    const leads = pipeline.filter((d) => d.stage === 'LEAD');
    if (leads.length > 0) {
      actions.push({
        id: 'qualify-leads',
        title: `リード ${leads.length} 件のヒアリングを進めましょう`,
        reason: 'リードはまだ見込み度が分かっていません。ヒアリングで「予算・決裁者・時期・課題」を確認し、見込みを評価しましょう。',
        priority: 'medium',
        href: '/deals',
        icon: Calendar,
        category: 'リード',
      });
    }
  }

  const todayUndone = todaysTasks.filter((t) => t.priority === 'high' || t.priority === 'urgent');
  if (todayUndone.length > 0) {
    actions.push({
      id: 'priority-tasks',
      title: `今日の重要タスク ${todayUndone.length} 件を先に片付けましょう`,
      reason: '優先度の高いタスクを午前中に終わらせると、午後の営業活動に集中できます。',
      priority: 'medium',
      href: '/tasks',
      icon: CheckCircle2,
      category: 'タスク',
    });
  }

  if (needToFollowUp.length >= 3) {
    actions.push({
      id: 'batch-follow',
      title: `要フォロー企業が ${needToFollowUp.length} 件。まとめて連絡しましょう`,
      reason: 'フォロー対象が複数あるときは、30分などの時間を決めてまとめて電話やメールすると効率的です。',
      priority: 'low',
      href: '/accounts',
      icon: Mail,
      category: 'フォロー',
    });
  }

  if (pipeline.length === 0 && pendingTasks === 0) {
    actions.push({
      id: 'create-deal',
      title: '新しい案件を作成しましょう',
      reason: 'パイプラインが空です。見込み客への営業活動を始めて案件を作ると、営業の流れが見える化されます。',
      priority: 'low',
      href: '/deals?openCreate=1',
      icon: Zap,
      category: '営業活動',
    });
  }

  return actions.slice(0, 5);
}

export function NextActions(props: NextActionsProps) {
  const actions = generateActions(props);

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="border-violet-200 dark:border-violet-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-5 w-5 text-violet-600" />
          次にやること — AIアシスタントの提案
        </CardTitle>
        <CardDescription>
          あなたの営業データから、今やるべきことを優先度順にお知らせします
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={300}>
          <ul className="space-y-2">
            {actions.map((action) => (
              <li key={action.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={action.href}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div
                        className={cn(
                          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
                          action.priority === 'high'
                            ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                            : action.priority === 'medium'
                              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        )}
                      >
                        <action.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{action.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.category}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn('flex-shrink-0 text-[10px]', priorityConfig[action.priority].className)}
                      >
                        {priorityConfig[action.priority].label}
                      </Badge>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[280px]">
                    <p className="text-xs leading-relaxed">{action.reason}</p>
                  </TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
