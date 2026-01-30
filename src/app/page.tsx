import { redirect } from 'next/navigation';

/**
 * ルートページ
 * 認証状態に応じてリダイレクト
 */
export default function Home() {
  // TODO: 認証チェックを実装後、認証済みならダッシュボードへ
  redirect('/dashboard');
}
