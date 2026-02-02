export const dynamic = 'force-dynamic';

/**
 * 認証ページ用レイアウト
 * シンプルな中央寄せレイアウト
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
