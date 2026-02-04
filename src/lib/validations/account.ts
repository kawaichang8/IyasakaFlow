import { z } from 'zod';

/**
 * 企業アカウントバリデーションスキーマ
 * React Hook Form + Zodで使用
 */

/**
 * アカウントステータス
 */
export const accountStatusSchema = z.enum([
  'prospect',
  'active',
  'inactive',
  'churned',
]);

/**
 * ステータス表示用
 */
export const ACCOUNT_STATUSES = [
  { value: 'prospect', label: '見込み' },
  { value: 'active', label: 'アクティブ' },
  { value: 'inactive', label: '非アクティブ' },
  { value: 'churned', label: '離脱' },
] as const;

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
    .number()
    .int('整数で入力してください')
    .min(0, '0以上の数値を入力してください')
    .optional()
    .nullable(),
  
  annualRevenue: z
    .number()
    .min(0, '0以上の数値を入力してください')
    .optional()
    .nullable(),
  
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
