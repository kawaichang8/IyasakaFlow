'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Zap,
  Calendar,
  FileText,
  User,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { CAMPAIGN_TYPES, CAMPAIGN_STATUSES } from '@/lib/validations/campaign';
import { useCampaign, useDeleteCampaign } from '@/hooks/use-campaigns';
import { CampaignForm } from './campaign-form';
import type { CampaignFormData } from '@/lib/validations/campaign';
import { toast } from 'sonner';

interface CampaignDetailProps {
  campaignId: string;
}

/**
 * キャンペーン詳細
 */
export function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const [showEdit, setShowEdit] = useState(false);
  const { data, isLoading, error, refetch } = useCampaign(campaignId);
  const deleteMutation = useDeleteCampaign();

  const campaign = data?.data;

  const handleDelete = async () => {
    if (!confirm('このキャンペーンを削除してもよろしいですか？')) return;
    try {
      await deleteMutation.mutateAsync(campaignId);
      toast.success('キャンペーンを削除しました');
      window.location.href = '/campaigns';
    } catch {
      toast.error('削除に失敗しました');
    }
  };

  const handleEditSuccess = () => {
    setShowEdit(false);
    refetch();
    toast.success('キャンペーンを更新しました');
  };

  const initialFormData: Partial<CampaignFormData> & { id?: string } | undefined = campaign
    ? {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description ?? undefined,
        type: campaign.type as CampaignFormData['type'],
        status: campaign.status as CampaignFormData['status'],
        startDate: campaign.startDate ?? undefined,
        endDate: campaign.endDate ?? undefined,
        templateId: campaign.templateId ?? undefined,
        targetSegment: campaign.targetSegment as CampaignFormData['targetSegment'],
        tags: campaign.tags ?? [],
      }
    : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          キャンペーン一覧に戻る
        </Link>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          キャンペーンが見つかりません
        </div>
      </div>
    );
  }

  const typeLabel = CAMPAIGN_TYPES.find((t) => t.value === campaign.type)?.label ?? campaign.type;
  const statusLabel = CAMPAIGN_STATUSES.find((s) => s.value === campaign.status)?.label ?? campaign.status;

  return (
    <div className="space-y-6">
      <Link
        href="/campaigns"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        キャンペーン一覧に戻る
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{statusLabel}</Badge>
              <Badge variant="outline">{typeLabel}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEdit(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            編集
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">概要</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {campaign.description ? (
              <p className="whitespace-pre-wrap">{campaign.description}</p>
            ) : (
              <p className="text-muted-foreground">説明なし</p>
            )}
            {campaign.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDate(campaign.startDate)}
                {campaign.endDate && ` 〜 ${formatDate(campaign.endDate)}`}
              </div>
            )}
            {campaign.template && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {campaign.template.name}
              </div>
            )}
            {campaign.createdBy && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                作成者: {campaign.createdBy.name}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">メタ情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">作成日</span>
              <span>{formatDate(campaign.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">更新日</span>
              <span>{formatDate(campaign.updatedAt)}</span>
            </div>
            {campaign.tags && campaign.tags.length > 0 && (
              <div>
                <span className="text-muted-foreground">タグ</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {campaign.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>キャンペーンを編集</DialogTitle>
          </DialogHeader>
          {initialFormData && (
            <CampaignForm
              initialData={initialFormData}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEdit(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
