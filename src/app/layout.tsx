import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { QueryProvider } from '@/lib/providers/query-provider';
import { SessionProvider } from '@/lib/providers/session-provider';

// システムフォントでオフライン・本番ビルドを安定化（要 Google Fonts 時は next/font/google の Inter に戻す）
const fontClassName = 'font-sans antialiased';

// ビルド時の静的生成をスキップ（DB・useSearchParams 利用のため）
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Iyasaka Flow - BtoB営業・顧客管理ツール',
  description: 'Iyasaka Flow - 営業プロセスを一元化し、ビジネスをますます繁栄させるCRM + MAアプリケーション',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={fontClassName}>
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
