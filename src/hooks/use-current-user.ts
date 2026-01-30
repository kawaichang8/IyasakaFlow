'use client';

import { useSession } from 'next-auth/react';

/**
 * 現在のユーザー情報を取得するフック
 */
export function useCurrentUser() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

/**
 * 認証が必要なページで使用するフック
 */
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  
  return {
    user,
    isLoading,
    isAuthenticated,
    // 認証されていない場合はリダイレクト（ミドルウェアで処理されるが、クライアント側でも確認）
    shouldRedirect: !isLoading && !isAuthenticated,
  };
}
