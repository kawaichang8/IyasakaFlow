'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp,
  Building2, 
  User, 
  Calendar,
  Edit,
  Plus,
  ChevronLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { StageAdviceCard } from '@/components/features/sales-advisor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DEAL_STAGES } from '@/lib/validations/deal';

interface DealDetailProps {
  dealId: string;
}

/**
 * 取引詳細コンポーネント
 */
export function DealDetail({ dealId }: DealDetailProps) {
  const [deal, setDeal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDeal() {
      try {
        const response = await fetch(`/api/deals/${dealId}`);
        const data = await response.json();
        setDeal(data.data);
      } catch (error) {
        console.error('Error fetching deal:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeal();
  }, [dealId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <p className="text-muted-foreground">案件が見つかりません</p>
      </div>
    );
  }

  const stageConfig = DEAL_STAGES.find((s) => s.value === deal.stage);
  const isClosed = deal.stage === 'closed_won' || deal.stage === 'closed_lost';

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <Link href="/deals" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        パイプラインに戻る
      </Link>

      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${
            deal.stage === 'closed_won' ? 'bg-green-100 dark:bg-green-900' :
            deal.stage === 'closed_lost' ? 'bg-red-100 dark:bg-red-900' :
            'bg-primary/10'
          }`}>
            {deal.stage === 'closed_won' ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : deal.stage === 'closed_lost' ? (
              <XCircle className="h-8 w-8 text-red-600" />
            ) : (
              <TrendingUp className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{deal.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              {stageConfig && (
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${stageConfig.color}`} />
                  <span className="text-muted-foreground">{stageConfig.label}</span>
                </div>
              )}
              <Badge variant="outline">{deal.probability}%</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            編集
          </Button>
          {!isClosed && (
            <>
              <Button variant="outline" className="text-green-600 hover:text-green-700">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                成約
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <XCircle className="mr-2 h-4 w-4" />
                失注
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 金額カード */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <p className="text-sm text-muted-foreground">取引金額</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(deal.value)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">加重金額</p>
            <p className="text-xl font-semibold text-muted-foreground">
              {formatCurrency(Math.round(deal.value * deal.probability / 100))}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ステージ進捗 */}
      {!isClosed && (
        <Card>
          <CardHeader>
            <CardTitle>進捗状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {(() => {
                const openStages = DEAL_STAGES.filter(s => s.value !== 'closed_won' && s.value !== 'closed_lost');
                return openStages.map((stage, index) => {
                  const isActive = stage.value === deal.stage;
                  const isPast = DEAL_STAGES.findIndex(s => s.value === deal.stage) > index;
                  return (
                    <div key={stage.value} className="flex flex-1 items-center">
                      <div className={`flex h-8 flex-1 items-center justify-center rounded-full text-xs font-medium ${
                        isActive ? `${stage.color} text-white` :
                        isPast ? 'bg-green-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {stage.label}
                      </div>
                      {index < openStages.length - 1 && (
                        <div className={`h-1 w-4 ${isPast ? 'bg-green-500' : 'bg-muted'}`} />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ステージ別アドバイス */}
      <StageAdviceCard stage={deal.stage} variant="deal" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 取引情報 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>取引情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 企業 */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">企業</p>
              <Link 
                href={`/accounts/${deal.account.id}`}
                className="flex items-center gap-2 font-medium text-primary hover:underline"
              >
                <Building2 className="h-4 w-4" />
                {deal.account.name}
              </Link>
            </div>

            {/* 連絡先 */}
            {deal.contact && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">担当連絡先</p>
                <Link 
                  href={`/contacts/${deal.contact.id}`}
                  className="flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  <User className="h-4 w-4" />
                  {deal.contact.name}
                  {deal.contact.role && (
                    <span className="text-muted-foreground">({deal.contact.role})</span>
                  )}
                </Link>
              </div>
            )}

            {/* 予定クローズ日 */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">予定クローズ日</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {deal.expectedCloseDate 
                  ? formatDate(deal.expectedCloseDate)
                  : '未設定'
                }
              </div>
            </div>

            {/* 実際のクローズ日 */}
            {deal.actualCloseDate && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">クローズ日</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(deal.actualCloseDate)}
                </div>
              </div>
            )}

            {/* 担当者 */}
            {deal.owner && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">担当者</p>
                <p className="font-medium">{deal.owner.name}</p>
              </div>
            )}

            {/* 説明 */}
            {deal.description && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">説明</p>
                <p className="mt-1 text-sm">{deal.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* インタラクション履歴 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>活動履歴</CardTitle>
              <CardDescription>この案件に関する活動</CardDescription>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              活動を記録
            </Button>
          </CardHeader>
          <CardContent>
            {deal.interactions && deal.interactions.length > 0 ? (
              <div className="space-y-4">
                {deal.interactions.map((interaction: any) => (
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
                      {interaction.subject && (
                        <p className="mt-1 font-medium">{interaction.subject}</p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">{interaction.note}</p>
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

      {/* タスク */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>関連タスク</CardTitle>
            <CardDescription>この案件に関連するタスク</CardDescription>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            タスクを作成
          </Button>
        </CardHeader>
        <CardContent>
          {deal.tasks && deal.tasks.length > 0 ? (
            <div className="space-y-2">
              {deal.tasks.map((task: any) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        期限: {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </div>
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

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    low: { label: '低', variant: 'secondary' },
    medium: { label: '中', variant: 'default' },
    high: { label: '高', variant: 'destructive' },
    urgent: { label: '緊急', variant: 'destructive' },
  };
  
  const { label, variant } = config[priority] || { label: priority, variant: 'default' as const };
  return <Badge variant={variant}>{label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' }> = {
    pending: { label: '未着手', variant: 'secondary' },
    in_progress: { label: '進行中', variant: 'default' },
    completed: { label: '完了', variant: 'success' },
    cancelled: { label: 'キャンセル', variant: 'secondary' },
  };
  
  const { label, variant } = config[status] || { label: status, variant: 'default' as const };
  return <Badge variant={variant}>{label}</Badge>;
}
