import { DashboardShell } from '@/components/layouts/dashboard-shell';

export const dynamic = 'force-dynamic';

/**
 * ダッシュボードレイアウト
 * サイドバーとヘッダーを含むメインレイアウト（モバイルメニュー対応）
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
