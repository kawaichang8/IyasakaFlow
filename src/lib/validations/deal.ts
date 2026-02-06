import { z } from 'zod';

/**
 * 取引（案件）バリデーションスキーマ
 */

/**
 * 取引ステージ
 */
export const dealStageSchema = z.enum([
  'lead',
  'discovery',
  'qualified',
  'demo',
  'proposal',
  'quote',
  'negotiation',
  'on_hold',
  'closed_won',
  'closed_lost',
]);

/**
 * 取引作成/更新スキーマ
 */
export const dealSchema = z.object({
  name: z
    .string()
    .min(1, '案件名は必須です')
    .max(200, '案件名は200文字以内で入力してください'),
  
  accountId: z
    .string()
    .min(1, '企業アカウントは必須です'),
  
  contactId: z
    .string()
    .optional()
    .nullable(),
  
  value: z
    .number()
    .min(0, '0以上の金額を入力してください')
    .default(0),
  
  currency: z
    .string()
    .default('JPY'),
  
  stage: dealStageSchema.default('lead'),
  
  probability: z
    .number()
    .min(0, '0以上の確率を入力してください')
    .max(100, '100以下の確率を入力してください')
    .default(0),
  
  expectedCloseDate: z
    .string()
    .optional()
    .nullable(),
  
  description: z
    .string()
    .max(5000, '説明は5000文字以内で入力してください')
    .optional()
    .nullable(),
  
  tags: z
    .array(z.string())
    .optional()
    .default([]),
  
  ownerId: z
    .string()
    .optional()
    .nullable(),
});

/**
 * ステージ変更スキーマ
 */
export const dealStageUpdateSchema = z.object({
  stage: dealStageSchema,
});

/**
 * 取引フィルタースキーマ
 */
export const dealFilterSchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
  contactId: z.string().optional(),
  stage: dealStageSchema.optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  ownerId: z.string().optional(),
});

/**
 * ステージ設定
 */
export const DEAL_STAGES = [
  { value: 'lead', label: 'リード', color: 'bg-slate-500', probability: 10 },
  { value: 'discovery', label: 'ヒアリング', color: 'bg-slate-400', probability: 15 },
  { value: 'qualified', label: '見込み評価済み', color: 'bg-blue-500', probability: 25 },
  { value: 'demo', label: 'デモ', color: 'bg-blue-400', probability: 35 },
  { value: 'proposal', label: '提案', color: 'bg-yellow-500', probability: 50 },
  { value: 'quote', label: '見積', color: 'bg-yellow-400', probability: 60 },
  { value: 'negotiation', label: '交渉', color: 'bg-orange-500', probability: 75 },
  { value: 'on_hold', label: '保留', color: 'bg-amber-400', probability: 50 },
  { value: 'closed_won', label: '成約', color: 'bg-green-500', probability: 100 },
  { value: 'closed_lost', label: '失注', color: 'bg-red-500', probability: 0 },
] as const;

/**
 * 型エクスポート
 */
export type DealFormData = z.infer<typeof dealSchema>;
export type DealFilterData = z.infer<typeof dealFilterSchema>;
export type DealStage = z.infer<typeof dealStageSchema>;
