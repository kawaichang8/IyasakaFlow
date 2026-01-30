import { z } from 'zod';

/**
 * タスクバリデーションスキーマ
 */

/**
 * 優先度
 */
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

/**
 * ステータス
 */
export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

/**
 * タスク作成/更新スキーマ
 */
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'タスク名は必須です')
    .max(200, 'タスク名は200文字以内で入力してください'),
  
  description: z
    .string()
    .max(5000, '説明は5000文字以内で入力してください')
    .optional()
    .nullable(),
  
  dueDate: z
    .string()
    .optional()
    .nullable(),
  
  priority: taskPrioritySchema.default('medium'),
  
  status: taskStatusSchema.default('pending'),
  
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
  
  assigneeId: z
    .string()
    .optional()
    .nullable(),
});

/**
 * タスクフィルタースキーマ
 */
export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().optional(),
  accountId: z.string().optional(),
  dealId: z.string().optional(),
  dueBefore: z.string().optional(),
  dueAfter: z.string().optional(),
});

/**
 * 優先度設定
 */
export const TASK_PRIORITIES = [
  { value: 'low', label: '低', color: 'bg-slate-500', textColor: 'text-slate-600' },
  { value: 'medium', label: '中', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { value: 'high', label: '高', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { value: 'urgent', label: '緊急', color: 'bg-red-500', textColor: 'text-red-600' },
] as const;

/**
 * ステータス設定
 */
export const TASK_STATUSES = [
  { value: 'pending', label: '未着手', color: 'bg-slate-500', icon: '○' },
  { value: 'in_progress', label: '進行中', color: 'bg-blue-500', icon: '◐' },
  { value: 'completed', label: '完了', color: 'bg-green-500', icon: '●' },
  { value: 'cancelled', label: 'キャンセル', color: 'bg-gray-400', icon: '✕' },
] as const;

/**
 * 型エクスポート
 */
export type TaskFormData = z.infer<typeof taskSchema>;
export type TaskFilterData = z.infer<typeof taskFilterSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
