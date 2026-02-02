import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { RegisterForm } from '@/components/features/auth/register-form';
import { OAuthButtons } from '@/components/features/auth/oauth-buttons';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '新規登録 | Iyasaka Flow',
  description: 'Iyasaka Flowに新規登録',
};

/**
 * 新規登録ページ
 */
export default function RegisterPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        {/* ロゴ */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden">
          <Image src="/icon.png" alt="Iyasaka Flow" width={48} height={48} className="object-contain" />
        </div>
        <CardTitle className="text-2xl font-bold">アカウントを作成</CardTitle>
        <CardDescription>
          無料で始められます
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

        {/* 登録フォーム */}
        <RegisterForm />
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <p className="text-center text-xs text-muted-foreground">
          登録することで、
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            利用規約
          </Link>
          と
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            プライバシーポリシー
          </Link>
          に同意したことになります。
        </p>
        <div className="text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちですか？{' '}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            ログイン
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
