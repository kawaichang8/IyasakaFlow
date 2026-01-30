'use client';

import { use } from 'react';
import { CampaignDetail } from '@/components/features/campaigns';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * キャンペーン詳細ページ
 */
export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params);

  if (!id) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
        キャンペーンIDが指定されていません
      </div>
    );
  }

  return <CampaignDetail campaignId={id} />;
}
