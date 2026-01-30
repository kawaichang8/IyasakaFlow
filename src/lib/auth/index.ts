import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { authConfig } from './config';

/**
 * NextAuth.js インスタンス
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
});

/**
 * 現在のユーザーを取得
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

/**
 * 認証が必要なAPIで使用
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  return session.user;
}

/**
 * 管理者権限が必要なAPIで使用
 */
export async function requireAdmin() {
  const user = await requireAuth();
  
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  
  return user;
}
