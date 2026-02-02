import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContactDetail } from '@/components/features/contacts/contact-detail';

interface ContactDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params: _params,
}: ContactDetailPageProps): Promise<Metadata> {
  return {
    title: `連絡先詳細 | Iyasaka Flow`,
    description: '連絡先の詳細情報',
  };
}

/**
 * 連絡先詳細ページ
 * 連絡先情報、所属企業、インタラクション履歴を表示
 */
export default function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  return <ContactDetail contactId={id} />;
}
