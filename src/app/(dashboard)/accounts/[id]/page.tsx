import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AccountDetail } from '@/components/features/accounts/account-detail';

interface AccountDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params: _params,
}: AccountDetailPageProps): Promise<Metadata> {
  // TODO: 実際のアカウント名を取得
  return {
    title: `企業詳細 | Iyasaka Flow`,
    description: '企業アカウントの詳細情報',
  };
}

/**
 * 企業アカウント詳細ページ
 * 企業情報、連絡先一覧、取引履歴を表示
 */
export default function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  return <AccountDetail accountId={id} />;
}
