'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  campaignSchema,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
  type CampaignFormData,
} from '@/lib/validations/campaign';

interface EmailTemplate {
  id: string;
  name: string;
}

interface CampaignFormProps {
  initialData?: Partial<CampaignFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * キャンペーン作成/編集フォーム
 */
export function CampaignForm({ initialData, onSuccess, onCancel }: CampaignFormProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'email',
      status: 'draft',
      startDate: '',
      endDate: '',
      targetSegment: undefined,
      templateId: '',
      tags: [],
      ...initialData,
    },
  });

  const type = watch('type');

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('/api/emails/templates?limit=100');
        const json = await res.json();
        setTemplates(json.data ?? []);
      } catch {
        setTemplates([]);
      }
    }
    fetchTemplates();
  }, []);

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const payload = {
        ...data,
        templateId: data.templateId || null,
        targetSegment: data.targetSegment ?? { accountIds: [], contactIds: [], filters: {} },
      };
      const url = initialData && 'id' in initialData && initialData.id
        ? `/api/campaigns/${(initialData as { id: string }).id}`
        : '/api/campaigns';
      const method = initialData && 'id' in initialData && initialData.id ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || '保存に失敗しました');
      }
      onSuccess?.();
    } catch (e) {
      throw e;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">キャンペーン名 *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="例: 春の新規リード獲得キャンペーン"
            className="mt-1"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">種別</Label>
          <Select
            value={watch('type')}
            onValueChange={(v) => setValue('type', v as CampaignFormData['type'])}
          >
            <SelectTrigger id="type" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAMPAIGN_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">ステータス</Label>
          <Select
            value={watch('status')}
            onValueChange={(v) => setValue('status', v as CampaignFormData['status'])}
          >
            <SelectTrigger id="status" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAMPAIGN_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startDate">開始日</Label>
          <Input
            id="startDate"
            type="date"
            {...register('startDate')}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="endDate">終了日</Label>
          <Input
            id="endDate"
            type="date"
            {...register('endDate')}
            className="mt-1"
          />
        </div>

        {type === 'email' && templates.length > 0 && (
          <div className="sm:col-span-2">
            <Label htmlFor="templateId">メールテンプレート</Label>
            <Select
              value={watch('templateId') ?? '__none__'}
              onValueChange={(v) => setValue('templateId', v === '__none__' ? null : v)}
            >
              <SelectTrigger id="templateId" className="mt-1">
                <SelectValue placeholder="テンプレートを選択（任意）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">未選択</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="sm:col-span-2">
          <Label htmlFor="description">説明</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="キャンペーンの目的・概要"
            rows={3}
            className="mt-1"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : initialData && 'id' in initialData ? '更新' : '作成'}
        </Button>
      </div>
    </form>
  );
}
