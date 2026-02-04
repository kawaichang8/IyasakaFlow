import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AccountDetail } from '@/components/features/accounts/account-detail';

interface AccountDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: AccountDetailPageProps): Promise<Metadata> {
  const { id } = params;
  const account = await prisma.account.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!account) {
    return {
      title: '企業詳細 | Iyasaka Flow',
      description: '企業アカウントの詳細情報',
    };
  }
  return {
    title: `${account.name} | Iyasaka Flow`,
    description: `${account.name}の企業アカウント詳細`,
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
