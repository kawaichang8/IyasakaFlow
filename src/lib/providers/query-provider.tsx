'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * TanStack Query プロバイダー
 * データフェッチとキャッシュ管理
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // キャッシュ設定
            staleTime: 1000 * 60 * 5, // 5分間はフレッシュとして扱う
            gcTime: 1000 * 60 * 30, // 30分間キャッシュを保持
            
            // リトライ設定
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // エラー時の自動リフェッチを制御
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            // ミューテーション後の自動リフェッチ
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 開発環境でのみDevtoolsを表示 */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
