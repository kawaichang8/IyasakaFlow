import { z } from 'zod';

/**
 * チーム・ユーザー管理バリデーションスキーマ
 */

/**
 * ユーザーロール
 */
export const userRoleSchema = z.enum(['admin', 'manager', 'member', 'viewer']);

/**
 * チーム作成/更新スキーマ
 */
export const teamSchema = z.object({
  name: z
    .string()
    .min(1, 'チーム名は必須です')
    .max(100, 'チーム名は100文字以内で入力してください'),
  
  description: z
    .string()
    .max(500, '説明は500文字以内で入力してください')
    .optional()
    .nullable(),
});

/**
 * ユーザー作成スキーマ（管理者用）
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内で入力してください'),
  
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/[A-Z]/, '大文字を1文字以上含めてください')
    .regex(/[a-z]/, '小文字を1文字以上含めてください')
    .regex(/[0-9]/, '数字を1文字以上含めてください'),
  
  role: userRoleSchema.default('member'),
  
  teamId: z
    .string()
    .optional()
    .nullable(),
});

/**
 * ユーザー更新スキーマ
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内で入力してください')
    .optional(),
  
  role: userRoleSchema.optional(),
  
  teamId: z
    .string()
    .optional()
    .nullable(),
  
  isActive: z
    .boolean()
    .optional(),
});

/**
 * ユーザー招待スキーマ
 */
export const inviteUserSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  
  role: userRoleSchema.default('member'),
  
  teamId: z
    .string()
    .optional()
    .nullable(),
});

/**
 * ロール設定
 */
export const USER_ROLES = [
  { 
    value: 'admin', 
    label: '管理者',
    description: 'すべての機能にアクセス可能。ユーザー・チームの管理が可能',
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    permissions: ['*'],
  },
  { 
    value: 'manager', 
    label: 'マネージャー',
    description: 'チームメンバーの管理、レポート閲覧が可能',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    permissions: ['read', 'write', 'delete', 'team:read', 'team:write', 'reports:read'],
  },
  { 
    value: 'member', 
    label: 'メンバー',
    description: '通常の営業活動機能を利用可能',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    permissions: ['read', 'write', 'delete:own'],
  },
  { 
    value: 'viewer', 
    label: '閲覧者',
    description: 'データの閲覧のみ可能',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    permissions: ['read'],
  },
] as const;

/**
 * 権限定義
 */
export const PERMISSIONS = {
  // 基本権限
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  DELETE_OWN: 'delete:own',
  
  // チーム権限
  TEAM_READ: 'team:read',
  TEAM_WRITE: 'team:write',
  TEAM_DELETE: 'team:delete',
  
  // ユーザー権限
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  USER_INVITE: 'user:invite',
  
  // レポート権限
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',
  
  // 設定権限
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  
  // すべての権限
  ALL: '*',
} as const;

/**
 * ロール別権限マッピング
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [PERMISSIONS.ALL],
  manager: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE,
    PERMISSIONS.DELETE,
    PERMISSIONS.TEAM_READ,
    PERMISSIONS.TEAM_WRITE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  member: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE,
    PERMISSIONS.DELETE_OWN,
  ],
  viewer: [
    PERMISSIONS.READ,
  ],
};

/**
 * 型エクスポート
 */
export type TeamFormData = z.infer<typeof teamSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type InviteUserFormData = z.infer<typeof inviteUserSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
