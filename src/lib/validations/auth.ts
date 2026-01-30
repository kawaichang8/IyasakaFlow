import { z } from 'zod';

/**
 * ログインフォームスキーマ
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードは必須です')
    .min(6, 'パスワードは6文字以上で入力してください'),
});

/**
 * 登録フォームスキーマ
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードは必須です')
    .min(6, 'パスワードは6文字以上で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードは大文字、小文字、数字を含む必要があります'
    ),
  confirmPassword: z
    .string()
    .min(1, 'パスワード確認は必須です'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

/**
 * 型エクスポート
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
