import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DealDetail } from '@/components/features/deals/deal-detail';

interface DealDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ 
  params 
}: DealDetailPageProps): Promise<Metadata> {
  return {
    title: `案件詳細 | CRM App`,
    description: '案件の詳細情報',
  };
}

/**
 * 取引詳細ページ
 */
export default function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  return <DealDetail dealId={id} />;
}
