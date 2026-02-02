'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Target,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
export function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 今月の成約額 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月の成約</CardTitle>
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
          <CardTitle className="text-sm font-medium">パイプライン</CardTitle>
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
          <CardTitle className="text-sm font-medium">顧客アカウント</CardTitle>
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
          <CardTitle className="text-sm font-medium">タスク</CardTitle>
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
