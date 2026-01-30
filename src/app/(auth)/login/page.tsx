import { Metadata } from 'next';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { LoginForm } from '@/components/features/auth/login-form';
import { OAuthButtons } from '@/components/features/auth/oauth-buttons';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'ログイン | CRM App',
  description: 'CRM Appにログイン',
};

/**
 * ログインページ
 */
export default function LoginPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        {/* ロゴ */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Building2 className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold">CRM Appにログイン</CardTitle>
        <CardDescription>
          アカウント情報を入力してください
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* OAuth認証ボタン */}
        <OAuthButtons />

        {/* 区切り線 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              または
            </span>
          </div>
        </div>

        {/* メール/パスワードフォーム */}
        <LoginForm />
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <div className="text-center text-sm text-muted-foreground">
          アカウントをお持ちでないですか？{' '}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            新規登録
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
