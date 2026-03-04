import { z } from 'zod';

/**
 * 企業アカウントバリデーションスキーマ
 * React Hook Form + Zodで使用
 */

/**
 * 取引先種別（顧客・下請け・外注・フリーランス等）
 */
export const accountTypeSchema = z.enum([
  'customer',
  'prospect',
  'subcontractor',
  'outsource',
  'freelancer',
  'partner',
  'other',
]);

/**
 * 取引先種別表示用
 */
export const ACCOUNT_TYPES = [
  { value: 'customer', label: '顧客' },
  { value: 'prospect', label: '見込み' },
  { value: 'subcontractor', label: '下請け' },
  { value: 'outsource', label: '外注先' },
  { value: 'freelancer', label: 'フリーランス・個人' },
  { value: 'partner', label: 'パートナー' },
  { value: 'other', label: 'その他' },
] as const;

/**
 * アカウントステータス
 */
export const accountStatusSchema = z.enum([
  'prospect',
  'trial',
  'customer',
  'active',
  'inactive',
  'suspended',
  'churned',
  'partner',
]);

/**
 * ステータス表示用
 */
export const ACCOUNT_STATUSES = [
  { value: 'prospect', label: '見込み' },
  { value: 'trial', label: 'トライアル中' },
  { value: 'customer', label: '顧客' },
  { value: 'active', label: 'アクティブ' },
  { value: 'inactive', label: '非アクティブ' },
  { value: 'suspended', label: '一時停止' },
  { value: 'churned', label: '離脱' },
  { value: 'partner', label: 'パートナー' },
] as const;

/**
 * 業種選択肢（企業アカウント・フィルターで共通利用）
 */
export const ACCOUNT_INDUSTRIES = [
  'IT・ソフトウェア',
  'SaaS・クラウド',
  '製造業',
  'メーカー（消費財）',
  'メーカー（産業用・BtoB）',
  'クリエイティブ・広告',
  'デザイン・映像・制作',
  'マスコミ・メディア・出版',
  '商社・卸',
  '小売・流通',
  '金融・保険',
  '不動産・建設',
  '医療・ヘルスケア・介護',
  '教育・人材',
  'コンサルティング',
  '法律・会計・士業',
  '運輸・物流',
  '飲食・フード',
  '旅行・ホテル・観光',
  'エネルギー・資源・環境',
  '公務・自治体・非営利',
  'その他',
] as const;

export type AccountIndustry = (typeof ACCOUNT_INDUSTRIES)[number];

/**
 * SNSプロフィール（企業・連絡先で共通の形）
 */
export const socialProfilesSchema = z.object({
  linkedin: z.string().url().optional().nullable().or(z.literal('')),
  twitter: z.string().url().optional().nullable().or(z.literal('')),
  facebook: z.string().url().optional().nullable().or(z.literal('')),
});

/**
 * アカウント作成/更新スキーマ
 */
export const accountSchema = z.object({
  name: z
    .string()
    .min(1, '会社名は必須です')
    .max(200, '会社名は200文字以内で入力してください'),
  
  industry: z
    .string()
    .max(100, '業種は100文字以内で入力してください')
    .optional()
    .nullable(),
  
  website: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === '' || v == null ? null : v))
    .pipe(z.union([z.literal(null), z.string().url('有効なURLを入力してください')])),
  
  phone: z
    .string()
    .max(50, '電話番号は50文字以内で入力してください')
    .optional()
    .nullable(),
  
  email: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === '' || v == null ? null : v))
    .pipe(z.union([z.literal(null), z.string().email('有効なメールアドレスを入力してください')])),
  
  address: z
    .string()
    .max(500, '住所は500文字以内で入力してください')
    .optional()
    .nullable(),
  
  city: z
    .string()
    .max(100, '市区町村は100文字以内で入力してください')
    .optional()
    .nullable(),
  
  state: z
    .string()
    .max(100, '都道府県は100文字以内で入力してください')
    .optional()
    .nullable(),
  
  postalCode: z
    .string()
    .max(20, '郵便番号は20文字以内で入力してください')
    .optional()
    .nullable(),
  
  country: z
    .string()
    .max(100, '国名は100文字以内で入力してください')
    .default('日本')
    .optional()
    .nullable(),
  
  employeeCount: z
    .union([
      z.number().int('整数で入力してください').min(0, '0以上の数値を入力してください'),
      z.literal(''),
      z.nan(),
      z.undefined(),
      z.null(),
    ])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === '' || v == null || (typeof v === 'number' && Number.isNaN(v))) return null;
      return typeof v === 'number' ? v : null;
    }),
  
  annualRevenue: z
    .union([
      z.number().min(0, '0以上の数値を入力してください'),
      z.literal(''),
      z.nan(),
      z.undefined(),
      z.null(),
    ])
    .optional()
    .nullable()
    .transform((v) => {
      if (v === '' || v == null || (typeof v === 'number' && Number.isNaN(v))) return null;
      return typeof v === 'number' ? v : null;
    }),
  
  accountType: accountTypeSchema.optional().nullable(),
  
  status: accountStatusSchema.default('prospect'),
  
  description: z
    .string()
    .max(2000, '説明は2000文字以内で入力してください')
    .optional()
    .nullable(),
  
  tags: z
    .array(z.string())
    .optional()
    .default([]),
  
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
  
  parentAccountId: z
    .string()
    .optional()
    .nullable(),
});

/**
 * アカウント検索/フィルタースキーマ
 */
export const accountFilterSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  accountType: accountTypeSchema.optional(),
  status: accountStatusSchema.optional(),
  minEmployeeCount: z.number().optional(),
  maxEmployeeCount: z.number().optional(),
  minRevenue: z.number().optional(),
  maxRevenue: z.number().optional(),
  tags: z.array(z.string()).optional(),
  ownerId: z.string().optional(),
});

/**
 * 型エクスポート
 */
export type AccountFormData = z.infer<typeof accountSchema>;
export type AccountFilterData = z.infer<typeof accountFilterSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type AccountType = z.infer<typeof accountTypeSchema>;
