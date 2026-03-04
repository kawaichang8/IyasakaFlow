import { z } from 'zod';

/**
 * 連絡先バリデーションスキーマ
 * React Hook Form + Zodで使用
 */

/**
 * 影響力レベル
 */
export const influenceLevelSchema = z.enum([
  'decision_maker',
  'influencer',
  'user',
  'gatekeeper',
  'other',
]);

/**
 * 連絡先ステータス
 */
export const contactStatusSchema = z.enum([
  'active',
  'inactive',
  'left',
  'do_not_contact',
  'opted_out',
  'bounced',
]);

/**
 * ステータス表示用
 */
export const CONTACT_STATUSES = [
  { value: 'active', label: 'アクティブ' },
  { value: 'inactive', label: '非アクティブ' },
  { value: 'left', label: '退職' },
  { value: 'do_not_contact', label: '連絡不可' },
  { value: 'opted_out', label: '配信停止' },
  { value: 'bounced', label: 'バウンス' },
] as const;

/**
 * 初回接触経路（名刺・対面・紹介等）
 */
export const contactSourceSchema = z.enum([
  'business_card',
  'in_person',
  'referral',
  'webinar_lp',
  'phone_email',
  'other',
]);

/**
 * 初回接触経路 表示用
 */
export const CONTACT_SOURCES = [
  { value: 'business_card', label: '名刺' },
  { value: 'in_person', label: '対面（イベント・商談等）' },
  { value: 'referral', label: '紹介' },
  { value: 'webinar_lp', label: 'ウェビナー・LP' },
  { value: 'phone_email', label: '電話・メールのみ' },
  { value: 'other', label: 'その他' },
] as const;

/**
 * SNSプロファイルスキーマ
 */
export const socialProfilesSchema = z.object({
  linkedin: z.string().url().optional().nullable().or(z.literal('')),
  twitter: z.string().url().optional().nullable().or(z.literal('')),
  facebook: z.string().url().optional().nullable().or(z.literal('')),
  threads: z.string().url().optional().nullable().or(z.literal('')),
  instagram: z.string().url().optional().nullable().or(z.literal('')),
});

/**
 * 連絡先作成/更新スキーマ
 */
export const contactSchema = z.object({
  accountId: z
    .string()
    .min(1, '所属企業は必須です'),
  
  name: z
    .string()
    .min(1, '氏名は必須です')
    .max(100, '氏名は100文字以内で入力してください'),
  
  firstName: z
    .string()
    .max(50, '名は50文字以内で入力してください')
    .optional()
    .nullable(),
  
  lastName: z
    .string()
    .max(50, '姓は50文字以内で入力してください')
    .optional()
    .nullable(),
  
  email: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === '' || v == null ? null : v))
    .pipe(z.union([z.literal(null), z.string().email('有効なメールアドレスを入力してください')])),
  
  phone: z
    .string()
    .max(50, '電話番号は50文字以内で入力してください')
    .optional()
    .nullable(),
  
  mobile: z
    .string()
    .max(50, '携帯番号は50文字以内で入力してください')
    .optional()
    .nullable(),
  
  website: z
    .string()
    .max(500, 'WebサイトURLは500文字以内で入力してください')
    .optional()
    .nullable()
    .transform((v) => (v === '' || v == null ? null : v))
    .pipe(z.union([z.literal(null), z.string().url('有効なURLを入力してください')])),
  
  role: z
    .string()
    .max(100, '役職は100文字以内で入力してください')
    .optional()
    .nullable(),
  
  department: z
    .string()
    .max(100, '部署は100文字以内で入力してください')
    .optional()
    .nullable(),
  
  company: z
    .string()
    .max(200, '会社名は200文字以内で入力してください')
    .optional()
    .nullable(),
  
  influenceLevel: influenceLevelSchema
    .optional()
    .default('other'),
  
  contactSource: contactSourceSchema
    .optional()
    .nullable(),
  
  status: contactStatusSchema
    .default('active'),
  
  tags: z
    .array(z.string())
    .optional()
    .default([]),
  
  notes: z
    .string()
    .max(5000, 'メモは5000文字以内で入力してください')
    .optional()
    .nullable(),
  
  socialProfiles: socialProfilesSchema
    .optional()
    .default({}),
  
  customFields: z
    .record(z.any())
    .optional()
    .default({}),
  
  ownerId: z
    .string()
    .optional()
    .nullable(),
});

/**
 * 連絡先検索/フィルタースキーマ
 */
export const contactFilterSchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
  influenceLevel: influenceLevelSchema.optional(),
  contactSource: contactSourceSchema.optional(),
  status: contactStatusSchema.optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ownerId: z.string().optional(),
});

/**
 * 型エクスポート
 */
export type ContactFormData = z.infer<typeof contactSchema>;
export type ContactFilterData = z.infer<typeof contactFilterSchema>;
export type InfluenceLevel = z.infer<typeof influenceLevelSchema>;
export type ContactStatus = z.infer<typeof contactStatusSchema>;
