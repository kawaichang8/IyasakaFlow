import { z } from 'zod';

/**
 * メールステータス
 */
export const EMAIL_STATUSES = [
  { value: 'draft', label: '下書き' },
  { value: 'scheduled', label: '予約済み' },
  { value: 'sending', label: '送信中' },
  { value: 'sent', label: '送信済み' },
  { value: 'delivered', label: '配信済み' },
  { value: 'opened', label: '開封済み' },
  { value: 'clicked', label: 'クリック済み' },
  { value: 'bounced', label: 'バウンス' },
  { value: 'failed', label: '失敗' },
] as const;

/**
 * テンプレートカテゴリ
 */
export const TEMPLATE_CATEGORIES = [
  { value: 'sales', label: '営業' },
  { value: 'follow_up', label: 'フォローアップ' },
  { value: 'introduction', label: '紹介・挨拶' },
  { value: 'proposal', label: '提案' },
  { value: 'thank_you', label: 'お礼' },
  { value: 'notification', label: '通知' },
  { value: 'other', label: 'その他' },
] as const;

/**
 * メール送信スキーマ
 */
export const sendEmailSchema = z.object({
  to: z.union([
    z.string().email('有効なメールアドレスを入力してください'),
    z.array(z.string().email('有効なメールアドレスを入力してください')).min(1, '宛先を入力してください'),
  ]),
  cc: z.union([
    z.string().email().optional(),
    z.array(z.string().email()).optional(),
  ]).optional(),
  bcc: z.union([
    z.string().email().optional(),
    z.array(z.string().email()).optional(),
  ]).optional(),
  subject: z.string().min(1, '件名を入力してください').max(200, '件名は200文字以内で入力してください'),
  body: z.string().min(1, '本文を入力してください'),
  bodyHtml: z.string().optional(),
  replyTo: z.string().email().optional(),
  templateId: z.string().optional(),
  accountId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  variables: z.record(z.string()).optional(),
});

export type SendEmailFormData = z.infer<typeof sendEmailSchema>;

/**
 * メール作成スキーマ（下書き保存用）
 */
export const emailSchema = z.object({
  subject: z.string().max(200, '件名は200文字以内で入力してください').optional(),
  body: z.string().optional(),
  bodyHtml: z.string().optional(),
  toAddresses: z.array(z.string().email()).optional(),
  ccAddresses: z.array(z.string().email()).optional(),
  bccAddresses: z.array(z.string().email()).optional(),
  replyTo: z.string().email().optional(),
  templateId: z.string().optional(),
  accountId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['draft', 'scheduled']).optional(),
});

export type EmailFormData = z.infer<typeof emailSchema>;

/**
 * メールテンプレートスキーマ
 */
export const emailTemplateSchema = z.object({
  name: z.string().min(1, 'テンプレート名を入力してください').max(100, '名前は100文字以内で入力してください'),
  subject: z.string().min(1, '件名を入力してください').max(200, '件名は200文字以内で入力してください'),
  body: z.string().min(1, '本文を入力してください'),
  bodyHtml: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;
