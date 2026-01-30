import { z } from 'zod';

/**
 * キャンペーンバリデーションスキーマ
 */

export const campaignTypeSchema = z.enum([
  'email',
  'event',
  'landing',
  'other',
]);

export const campaignStatusSchema = z.enum([
  'draft',
  'scheduled',
  'running',
  'completed',
  'cancelled',
]);

/**
 * ターゲットセグメント（JSON用）
 */
export const targetSegmentSchema = z.object({
  accountIds: z.array(z.string()).optional().default([]),
  contactIds: z.array(z.string()).optional().default([]),
  filters: z.record(z.unknown()).optional().default({}),
}).optional().nullable();

/**
 * キャンペーン作成/更新スキーマ
 */
export const campaignSchema = z.object({
  name: z
    .string()
    .min(1, 'キャンペーン名は必須です')
    .max(200, 'キャンペーン名は200文字以内で入力してください'),

  description: z
    .string()
    .max(5000, '説明は5000文字以内で入力してください')
    .optional()
    .nullable(),

  type: campaignTypeSchema.default('email'),

  status: campaignStatusSchema.default('draft'),

  startDate: z
    .string()
    .optional()
    .nullable(),

  endDate: z
    .string()
    .optional()
    .nullable(),

  targetSegment: targetSegmentSchema,

  templateId: z
    .string()
    .optional()
    .nullable(),

  tags: z
    .array(z.string())
    .optional()
    .default([]),
});

/**
 * キャンペーンフィルタースキーマ
 */
export const campaignFilterSchema = z.object({
  search: z.string().optional(),
  type: campaignTypeSchema.optional(),
  status: campaignStatusSchema.optional(),
});

export const CAMPAIGN_TYPES = [
  { value: 'email', label: 'メール' },
  { value: 'event', label: 'イベント' },
  { value: 'landing', label: 'ランディング' },
  { value: 'other', label: 'その他' },
] as const;

export const CAMPAIGN_STATUSES = [
  { value: 'draft', label: '下書き' },
  { value: 'scheduled', label: '予約済み' },
  { value: 'running', label: '実行中' },
  { value: 'completed', label: '完了' },
  { value: 'cancelled', label: 'キャンセル' },
] as const;

export type CampaignFormData = z.infer<typeof campaignSchema>;
export type CampaignFilterData = z.infer<typeof campaignFilterSchema>;
export type CampaignType = z.infer<typeof campaignTypeSchema>;
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;
