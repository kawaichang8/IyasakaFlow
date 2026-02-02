import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | Iyasaka Flow',
  description: 'Iyasaka Flow のプライバシーポリシー',
};

/**
 * プライバシーポリシーページ（プレースホルダー）
 */
export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>プライバシーポリシー</CardTitle>
          <CardDescription>Iyasaka Flow における個人情報の取り扱いについて</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            本ページの内容は準備中です。サービス提供にあたり、お客様の個人情報を適切に保護する方針で運営しています。
          </p>
          <p className="mt-4">
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              ログインへ戻る
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
