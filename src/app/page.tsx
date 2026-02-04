import { redirect } from 'next/navigation';

/**
 * ルートページ
 * 認証状態に応じてリダイレクト
 */
export default function Home() {
  redirect('/dashboard');
}
