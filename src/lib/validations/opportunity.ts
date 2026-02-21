import { z } from 'zod';

/**
 * 案件ステージ
 */
export const opportunityStageSchema = z.enum([
  'lead',
  'proposal',
  'negotiation',
  'won',
  'lost',
]);

/**
 * 案件作成/更新スキーマ
 */
export const opportunitySchema = z.object({
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

  stage: opportunityStageSchema.default('lead'),

  amount: z
    .number()
    .min(0, '0以上の金額を入力してください')
    .default(0),

  probability: z
    .number()
    .min(0, '0以上の確率を入力してください')
    .max(100, '100以下の確率を入力してください')
    .default(0),

  expectedCloseDate: z
    .string()
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(10000, 'メモは10000文字以内で入力してください')
    .optional()
    .nullable(),

  ownerId: z
    .string()
    .optional()
    .nullable(),
});

/**
 * ステージ変更スキーマ
 */
export const opportunityStageUpdateSchema = z.object({
  stage: opportunityStageSchema,
});

/**
 * ステージ設定
 */
export const OPPORTUNITY_STAGES = [
  { value: 'lead', label: 'リード', color: 'bg-slate-500', textColor: 'text-slate-700', bgLight: 'bg-slate-50', probability: 10 },
  { value: 'proposal', label: '提案', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50', probability: 40 },
  { value: 'negotiation', label: '交渉', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50', probability: 70 },
  { value: 'won', label: '成約', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', probability: 100 },
  { value: 'lost', label: '失注', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', probability: 0 },
] as const;

export type OpportunityFormData = z.infer<typeof opportunitySchema>;
export type OpportunityStage = z.infer<typeof opportunityStageSchema>;
