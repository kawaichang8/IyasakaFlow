import { z } from 'zod';

/**
 * インタラクション（活動記録）バリデーションスキーマ
 */

/**
 * インタラクションタイプ
 */
export const interactionTypeSchema = z.enum([
  'call',
  'email',
  'meeting',
  'note',
  'task',
]);

/**
 * 通話方向
 */
export const callDirectionSchema = z.enum(['inbound', 'outbound']);

/**
 * インタラクション作成/更新スキーマ
 */
export const interactionSchema = z.object({
  type: interactionTypeSchema,
  
  subject: z
    .string()
    .max(200, '件名は200文字以内で入力してください')
    .optional()
    .nullable(),
  
  note: z
    .string()
    .min(1, '内容は必須です')
    .max(10000, '内容は10000文字以内で入力してください'),
  
  date: z
    .string()
    .min(1, '日時は必須です'),
  
  duration: z
    .number()
    .min(0, '0以上の数値を入力してください')
    .optional()
    .nullable(),
  
  outcome: z
    .string()
    .max(500, '結果は500文字以内で入力してください')
    .optional()
    .nullable(),
  
  // 通話固有
  callDirection: callDirectionSchema.optional().nullable(),
  
  // 関連エンティティ
  accountId: z
    .string()
    .optional()
    .nullable(),
  
  contactId: z
    .string()
    .optional()
    .nullable(),
  
  dealId: z
    .string()
    .optional()
    .nullable(),
});

/**
 * インタラクションフィルタースキーマ
 */
export const interactionFilterSchema = z.object({
  search: z.string().optional(),
  type: interactionTypeSchema.optional(),
  accountId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

/**
 * インタラクションタイプ設定
 */
export const INTERACTION_TYPES = [
  { 
    value: 'call', 
    label: '電話', 
    icon: 'Phone',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    description: '電話での会話を記録',
  },
  { 
    value: 'email', 
    label: 'メール', 
    icon: 'Mail',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    description: 'メールのやり取りを記録',
  },
  { 
    value: 'meeting', 
    label: 'ミーティング', 
    icon: 'Users',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    description: '対面/オンライン会議を記録',
  },
  { 
    value: 'note', 
    label: 'メモ', 
    icon: 'FileText',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    description: '一般的なメモを記録',
  },
  { 
    value: 'task', 
    label: 'タスク完了', 
    icon: 'CheckSquare',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    description: 'タスク関連の活動を記録',
  },
] as const;

/**
 * 通話方向設定
 */
export const CALL_DIRECTIONS = [
  { value: 'inbound', label: '着信', icon: 'PhoneIncoming' },
  { value: 'outbound', label: '発信', icon: 'PhoneOutgoing' },
] as const;

/**
 * 型エクスポート
 */
export type InteractionFormData = z.infer<typeof interactionSchema>;
export type InteractionFilterData = z.infer<typeof interactionFilterSchema>;
export type InteractionType = z.infer<typeof interactionTypeSchema>;
export type CallDirection = z.infer<typeof callDirectionSchema>;
