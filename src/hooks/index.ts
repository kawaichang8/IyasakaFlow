/**
 * カスタムフックのエクスポート
 */

// URL検索パラメータ
export { useSearchParamsState } from './use-search-params';

// グローバル検索
export { useGlobalSearch } from './use-global-search';

// アカウント関連
export {
  useAccounts,
  useAccount,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from './use-accounts';

// 連絡先関連
export {
  useContacts,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from './use-contacts';

// 取引関連
export {
  useDeals,
  useDeal,
  useCreateDeal,
  useUpdateDeal,
  useUpdateDealStage,
  useDeleteDeal,
} from './use-deals';

// タスク関連
export {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useTodayTasks,
  useOverdueTasks,
} from './use-tasks';

// ダッシュボード関連
export {
  useDashboard,
  useKPI,
  usePipelineStats,
  useMonthlyRevenue,
} from './use-dashboard';

// インタラクション関連
export {
  useInteractions,
  useInteraction,
  useCreateInteraction,
  useUpdateInteraction,
  useDeleteInteraction,
  useAccountInteractions,
  useDealInteractions,
  useContactInteractions,
} from './use-interactions';

// チーム・ユーザー関連
export {
  useTeams,
  useTeam,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from './use-teams';

// レポート関連
export {
  useReports,
  useRevenueSummary,
  usePipelineSummary,
  useLeaderboard,
} from './use-reports';

// 認証関連
export {
  useCurrentUser,
  useRequireAuth,
} from './use-current-user';
