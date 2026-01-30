import { useQuery } from '@tanstack/react-query';

/**
 * レポート関連のカスタムフック
 */

const REPORTS_QUERY_KEY = 'reports';

interface RevenueSummary {
  current: number;
  previous: number;
  growth: number;
  wonCount: number;
  lostCount: number;
  lostValue: number;
  winRate: number;
}

interface PipelineSummary {
  total: number;
  weighted: number;
  count: number;
}

interface ActivitySummary {
  current: number;
  previous: number;
  growth: number;
  completedTasks: number;
  prevCompletedTasks: number;
}

interface AcquisitionSummary {
  newAccounts: number;
  prevNewAccounts: number;
  newContacts: number;
  prevNewContacts: number;
}

interface StageData {
  stage: string;
  stageKey: string;
  count: number;
  value: number;
}

interface ActivityType {
  type: string;
  typeKey: string;
  count: number;
}

interface DailyData {
  date: string;
  value: number;
  count: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  revenue: number;
  dealCount: number;
  activityCount: number;
}

interface ReportData {
  period: {
    start: string;
    end: string;
    label: string;
  };
  summary: {
    revenue: RevenueSummary;
    pipeline: PipelineSummary;
    activity: ActivitySummary;
    acquisition: AcquisitionSummary;
  };
  charts: {
    pipelineByStage: StageData[];
    activityByType: ActivityType[];
    dailyTrend: DailyData[];
  };
  leaderboard: LeaderboardEntry[];
}

interface ReportsResponse {
  data: ReportData;
}

/**
 * レポートデータを取得
 */
export function useReports(period: string = 'month', startDate?: string, endDate?: string) {
  return useQuery<ReportsResponse>({
    queryKey: [REPORTS_QUERY_KEY, period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('period', period);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const response = await fetch(`/api/reports?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('レポートの取得に失敗しました');
      }
      
      return response.json();
    },
    // 5分間キャッシュ
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 売上サマリーのみを取得
 */
export function useRevenueSummary(period: string = 'month') {
  const { data, ...rest } = useReports(period);
  return {
    data: data?.data.summary.revenue,
    ...rest,
  };
}

/**
 * パイプラインサマリーのみを取得
 */
export function usePipelineSummary(period: string = 'month') {
  const { data, ...rest } = useReports(period);
  return {
    data: data?.data.summary.pipeline,
    ...rest,
  };
}

/**
 * リーダーボードのみを取得
 */
export function useLeaderboard(period: string = 'month') {
  const { data, ...rest } = useReports(period);
  return {
    data: data?.data.leaderboard,
    ...rest,
  };
}
