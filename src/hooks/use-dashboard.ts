import { useQuery } from '@tanstack/react-query';

/**
 * ダッシュボード関連のカスタムフック
 */

const DASHBOARD_QUERY_KEY = 'dashboard';

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

interface PipelineData {
  stage: string;
  count: number;
  value: number;
}

interface MonthlyData {
  month: string;
  value: number;
  count: number;
}

interface Activity {
  id: string;
  type: string;
  subject: string | null;
  note: string | null;
  date: string;
  account?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  deal?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string } | null;
}

interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  status: string;
  account?: { id: string; name: string } | null;
  deal?: { id: string; name: string } | null;
  isOverdue?: boolean;
}

interface DashboardData {
  kpi: KPIData;
  pipeline: PipelineData[];
  monthlyRevenue: MonthlyData[];
  recentActivity: Activity[];
  todaysTasks: Task[];
}

interface DashboardResponse {
  data: DashboardData;
}

/**
 * ダッシュボードデータを取得
 */
export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: [DASHBOARD_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/dashboard');
      
      if (!response.ok) {
        throw new Error('ダッシュボードデータの取得に失敗しました');
      }
      
      return response.json();
    },
    // 1分間キャッシュ
    staleTime: 60 * 1000,
    // 5分間GC対象外
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * KPIデータのみを取得
 */
export function useKPI() {
  const { data, ...rest } = useDashboard();
  return {
    data: data?.data.kpi,
    ...rest,
  };
}

/**
 * パイプラインデータのみを取得
 */
export function usePipelineStats() {
  const { data, ...rest } = useDashboard();
  return {
    data: data?.data.pipeline,
    ...rest,
  };
}

/**
 * 月別売上データのみを取得
 */
export function useMonthlyRevenue() {
  const { data, ...rest } = useDashboard();
  return {
    data: data?.data.monthlyRevenue,
    ...rest,
  };
}
