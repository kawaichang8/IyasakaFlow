import { Sidebar } from '@/components/layouts/sidebar';
import { Header } from '@/components/layouts/header';

/**
 * ダッシュボードレイアウト
 * サイドバーとヘッダーを含むメインレイアウト
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* サイドバー */}
      <Sidebar />
      
      {/* メインコンテンツエリア */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ヘッダー */}
        <Header />
        
        {/* ページコンテンツ */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
