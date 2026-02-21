'use client';

import { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDashboard } from '@/hooks/use-dashboard';
import { useUpdateTaskStatus } from '@/hooks/use-tasks';
import {
  KPICards,
  KPICardsSkeleton,
  PipelineChart,
  PipelineChartSkeleton,
  RevenueChart,
  RevenueChartSkeleton,
  RecentActivity,
  RecentActivitySkeleton,
  TodaysTasks,
  TodaysTasksSkeleton,
} from '@/components/features/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lightbulb, ArrowRight, Kanban, Target } from 'lucide-react';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';

const TIPS = [
  { text: '活動を記録するときは「結果」と「次のアクション」を書くと、翌日から何をすべきか明確になります。', link: '/activities', label: '活動を記録' },
  { text: 'パイプラインの案件をドラッグ＆ドロップでステージ移動できます。成約したら「成約」に移動しましょう。', link: '/deals', label: 'パイプラインを見る' },
  { text: '7日以上連絡していない企業は「要フォロー」に表示されます。こまめにフォローすると成約率が上がります。', link: '/accounts', label: '企業一覧' },
  { text: 'メール送信前にテンプレートを使うと、初心者でも安心して送れます。', link: '/emails', label: 'メール・テンプレート' },
];

/**
 * ダッシュボードページ
 * 営業活動の概要をKPI、グラフ、最近の活動で表示
 */
export default function DashboardPage() {
  const { user } = useCurrentUser();
  const { data, isLoading, error, refetch } = useDashboard();
  const updateTaskStatus = useUpdateTaskStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 現在の時間帯に応じた挨拶（クライアントのみで計算し、ハイドレーション不一致を防ぐ）
  const greeting = !mounted
    ? 'こんにちは'
    : (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'おはようございます';
        if (hour < 18) return 'こんにちは';
        return 'こんばんは';
      })();
  const todayTip = TIPS[mounted ? new Date().getDate() % TIPS.length : 0];

  // タスク完了ハンドラー
  const handleTaskComplete = useCallback(async (taskId: string) => {
    try {
      await updateTaskStatus.mutateAsync({ taskId, status: 'completed' });
      refetch();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  }, [updateTaskStatus, refetch]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">
            {greeting}、{user?.name || 'ゲスト'}さん
          </p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          データの取得に失敗しました。再読み込みしてください。
        </div>
      </div>
    );
  }

  const dashboardData = data?.data;
  const needToFollowUp = dashboardData?.needToFollowUp ?? [];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          {greeting}、{user?.name || 'ゲスト'}さん
        </p>
      </div>

      {/* KPIカード */}
      {isLoading ? (
        <KPICardsSkeleton />
      ) : dashboardData ? (
        <KPICards data={dashboardData.kpi} />
      ) : null}

      {/* 案件サマリー */}
      {!isLoading && dashboardData?.opportunitySummary && (
        <Card className="border-indigo-200 dark:border-indigo-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Kanban className="h-4 w-4" />
              案件サマリー（SFA）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">進行中</p>
                <p className="text-lg font-bold">{dashboardData.opportunitySummary.activeCount}<span className="text-xs font-normal ml-0.5">件</span></p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">総額</p>
                <p className="text-lg font-bold">{formatCurrency(dashboardData.opportunitySummary.totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">加重金額</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(dashboardData.opportunitySummary.weightedAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">平均確度</p>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-bold">{dashboardData.opportunitySummary.avgProbability}%</p>
                </div>
              </div>
            </div>
            <Button variant="link" size="sm" className="mt-2 p-0" asChild>
              <Link href="/opportunities">案件ボードを見る →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* グラフセクション */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* パイプラインチャート */}
        {isLoading ? (
          <PipelineChartSkeleton />
        ) : dashboardData ? (
          <PipelineChart data={dashboardData.pipeline} />
        ) : null}

        {/* 月別売上チャート */}
        {isLoading ? (
          <RevenueChartSkeleton />
        ) : dashboardData ? (
          <RevenueChart data={dashboardData.monthlyRevenue} />
        ) : null}
      </div>

      {/* 要フォロー（営業初心者向け：忘れずにフォロー） */}
      {!isLoading && needToFollowUp.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-5 w-5" />
              要フォロー
            </CardTitle>
            <CardDescription>
              7日以上連絡していない企業です。フォローすると商談が進みやすくなります
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {needToFollowUp.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    {item.lastActivityAt ? (
                      <span className="text-muted-foreground">{formatRelativeTime(item.lastActivityAt)}</span>
                    ) : (
                      <span className="text-muted-foreground">未連絡</span>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/accounts/${item.id}`}>
                        確認 <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="link" className="mt-2 text-amber-700 dark:text-amber-300" asChild>
              <Link href="/accounts">企業一覧で全て見る →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* アクティビティとタスク */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 最近の活動 */}
        {isLoading ? (
          <RecentActivitySkeleton />
        ) : dashboardData ? (
          <RecentActivity activities={dashboardData.recentActivity} />
        ) : null}

        {/* 今日のタスク */}
        {isLoading ? (
          <TodaysTasksSkeleton />
        ) : dashboardData ? (
          <TodaysTasks 
            tasks={dashboardData.todaysTasks} 
            onComplete={handleTaskComplete}
          />
        ) : null}
      </div>

      {/* 今日のヒント（営業初心者向け） */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <h3 className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-200">
          <Lightbulb className="h-4 w-4" />
          今日のヒント
        </h3>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          {todayTip.text}
        </p>
        <Button variant="link" size="sm" className="mt-2 p-0 text-blue-700 dark:text-blue-300" asChild>
          <Link href={todayTip.link}>{todayTip.label} →</Link>
        </Button>
      </div>
    </div>
  );
}
