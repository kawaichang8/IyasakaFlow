'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * セッションプロバイダー
 * NextAuth.jsのセッション状態をReactコンテキストで提供
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
