'use client';

import { useState } from 'react';
import { 
  ReportHeader, 
  RevenueReport, 
  PipelineReport, 
  ActivityReport 
} from '@/components/features/reports';
import { useReports } from '@/hooks/use-reports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * レポート・分析ページ
 */
export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const { data, isLoading, error, refetch } = useReports(period);

  const reportData = data?.data;

  if (error) {
    return (
      <div className="space-y-6">
        <ReportHeader 
          period={period} 
          onPeriodChange={setPeriod}
          onRefresh={refetch}
        />
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          レポートの取得に失敗しました
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader 
        period={period} 
        onPeriodChange={setPeriod}
        onRefresh={refetch}
        isLoading={isLoading}
      />

      {isLoading ? (
        <ReportSkeleton />
      ) : reportData ? (
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">売上分析</TabsTrigger>
            <TabsTrigger value="pipeline">パイプライン</TabsTrigger>
            <TabsTrigger value="activity">活動分析</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueReport
              revenue={reportData.summary.revenue}
              pipeline={reportData.summary.pipeline}
              dailyTrend={reportData.charts.dailyTrend}
            />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-6">
            <PipelineReport data={reportData.charts.pipelineByStage} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <ActivityReport
              activity={reportData.summary.activity}
              acquisition={reportData.summary.acquisition}
              activityByType={reportData.charts.activityByType}
              leaderboard={reportData.leaderboard}
            />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-[400px] animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
