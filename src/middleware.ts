import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/config';

/**
 * 認証ミドルウェア
 * 保護されたルートへのアクセスを制御
 */
export default NextAuth(authConfig).auth;

export const config = {
  // 認証チェックを行うルート
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ:
     * - api (APIルート)
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - public フォルダ内のファイル
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
