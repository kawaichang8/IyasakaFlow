'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Target,
  CheckSquare,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';

interface KPIData {
  pipelineTotal: number;
  weightedPipeline: number;
  wonThisMonth: number;
  wonLastMonth: number;
  revenueGrowth: number;
  totalAccounts: number;
  newAccountsThisMonth: number;
  accountGrowth: number;
  pendingTasks: number;
  overdueTasks: number;
  completedTasksThisMonth: number;
  dealCount: number;
}

interface KPICardsProps {
  data: KPIData;
}

/**
 * KPIカードコンポーネント
 */
function KPIHelp({ tip }: { tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px]">
        <p>{tip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function KPICards({ data }: KPICardsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 今月の成約額 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium">
              今月の成約
              <KPIHelp tip="今月中にステージが「成約」になった案件の合計金額です。先月と比較した伸び率も表示します。" />
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(data.wonThisMonth)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {data.revenueGrowth >= 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={data.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
              {data.revenueGrowth >= 0 ? '+' : ''}{data.revenueGrowth}%
            </span>
            <span className="ml-1">先月比</span>
          </div>
        </CardContent>
      </Card>

        {/* パイプライン */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium">
              パイプライン
              <KPIHelp tip="現在進行中の案件の合計金額です。「加重」は成約確率を掛けた期待値で、より現実的な見込み額です。" />
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.pipelineTotal)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="text-blue-500 font-medium">
              {formatCurrency(data.weightedPipeline)}
            </span>
            <span className="ml-1">（加重）</span>
            <span className="ml-2">{data.dealCount} 件</span>
          </div>
        </CardContent>
      </Card>

        {/* 顧客数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium">
              顧客アカウント
              <KPIHelp tip="登録されている企業アカウントの総数です。今月新しく追加した件数も表示します。" />
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCompactNumber(data.totalAccounts)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {data.accountGrowth >= 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={data.accountGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
              +{data.newAccountsThisMonth}
            </span>
            <span className="ml-1">今月の新規</span>
          </div>
        </CardContent>
      </Card>

        {/* タスク */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium">
              タスク
              <KPIHelp tip="未完了のタスク数です。期限切れのタスクがあれば赤く表示されます。今月完了した件数も確認できます。" />
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.pendingTasks}
            <span className="text-sm font-normal text-muted-foreground ml-1">件</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {data.overdueTasks > 0 && (
              <span className="flex items-center text-red-500">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {data.overdueTasks} 期限切れ
              </span>
            )}
            <span className="flex items-center text-green-500">
              <CheckSquare className="mr-1 h-3 w-3" />
              {data.completedTasksThisMonth} 完了（今月）
            </span>
          </div>
        </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

/**
 * KPIカードのスケルトン（ローディング用）
 */
export function KPICardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 animate-pulse rounded bg-muted mb-2" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
