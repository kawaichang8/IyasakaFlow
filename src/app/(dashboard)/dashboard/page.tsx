'use client';

import { useCallback } from 'react';
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

/**
 * ダッシュボードページ
 * 営業活動の概要をKPI、グラフ、最近の活動で表示
 */
export default function DashboardPage() {
  const { user } = useCurrentUser();
  const { data, isLoading, error, refetch } = useDashboard();
  const updateTaskStatus = useUpdateTaskStatus();

  // 現在の時間帯に応じた挨拶
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

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
            {getGreeting()}、{user?.name || 'ゲスト'}さん
          </p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          データの取得に失敗しました。再読み込みしてください。
        </div>
      </div>
    );
  }

  const dashboardData = data?.data;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          {getGreeting()}、{user?.name || 'ゲスト'}さん
        </p>
      </div>

      {/* KPIカード */}
      {isLoading ? (
        <KPICardsSkeleton />
      ) : dashboardData ? (
        <KPICards data={dashboardData.kpi} />
      ) : null}

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

      {/* クイックヒント（初心者向け） */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200">
          💡 今日のヒント
        </h3>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          パイプラインの案件をドラッグ＆ドロップで移動できます。
          ステージを更新すると、成約確率も自動で調整されます。
          <a href="/deals" className="ml-1 underline">
            パイプラインを見る →
          </a>
        </p>
      </div>
    </div>
  );
}
