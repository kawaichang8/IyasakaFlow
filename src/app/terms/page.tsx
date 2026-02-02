import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '利用規約 | Iyasaka Flow',
  description: 'Iyasaka Flow の利用規約',
};

/**
 * 利用規約ページ（プレースホルダー）
 */
export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>利用規約</CardTitle>
          <CardDescription>Iyasaka Flow のご利用にあたって</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground">
            本ページの内容は準備中です。サービスをご利用いただく際は、本規約に同意いただいたものとみなします。
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
