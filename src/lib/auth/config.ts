import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

/**
 * 認証プロバイダー設定
 */
const providers: NextAuthConfig['providers'] = [
  /**
   * Google OAuth
   * 環境変数: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   */
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: true,
  }),

  /**
   * メール/パスワード認証
   */
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'メールアドレス', type: 'email' },
      password: { label: 'パスワード', type: 'password' },
    },
    async authorize(credentials) {
      // バリデーション
      const parsedCredentials = z
        .object({
          email: z.string().email(),
          password: z.string().min(6),
        })
        .safeParse(credentials);

      if (!parsedCredentials.success) {
        return null;
      }

      const { email, password } = parsedCredentials.data;

      // ユーザーを検索
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        return null;
      }

      // パスワードを検証
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

/**
 * NextAuth.js 設定
 */
export const authConfig: NextAuthConfig = {
  providers,
  
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/onboarding',
  },

  callbacks: {
    /**
     * 認証チェック（ミドルウェア用）
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
                            nextUrl.pathname.startsWith('/accounts') ||
                            nextUrl.pathname.startsWith('/contacts') ||
                            nextUrl.pathname.startsWith('/deals') ||
                            nextUrl.pathname.startsWith('/tasks') ||
                            nextUrl.pathname.startsWith('/campaigns') ||
                            nextUrl.pathname.startsWith('/analytics') ||
                            nextUrl.pathname.startsWith('/settings');
      
      const isOnAuth = nextUrl.pathname.startsWith('/login') ||
                       nextUrl.pathname.startsWith('/register');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // リダイレクトしてログインページへ
      } else if (isOnAuth) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      return true;
    },

    /**
     * JWTトークンのカスタマイズ
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // セッション更新時
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.picture = session.image;
      }

      return token;
    },

    /**
     * セッションのカスタマイズ
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    /**
     * サインイン時の処理
     */
    async signIn({ user, account }) {
      // OAuth認証の場合、ユーザーが存在しなければ作成
      if (account?.provider !== 'credentials') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
            },
          });
        }
      }

      return true;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },

  // デバッグモード（開発環境のみ）
  debug: process.env.NODE_ENV === 'development',
};
