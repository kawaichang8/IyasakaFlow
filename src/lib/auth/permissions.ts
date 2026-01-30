import { ROLE_PERMISSIONS, PERMISSIONS } from '@/lib/validations/team';

/**
 * 権限チェックユーティリティ
 */

type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

interface User {
  id: string;
  role: UserRole;
}

/**
 * ユーザーが特定の権限を持っているかチェック
 */
export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  
  // 管理者はすべての権限を持つ
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  
  return userPermissions.includes(permission);
}

/**
 * ユーザーが複数の権限のいずれかを持っているかチェック
 */
export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * ユーザーが複数の権限すべてを持っているかチェック
 */
export function hasAllPermissions(user: User | null | undefined, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * ユーザーが管理者かどうかチェック
 */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin';
}

/**
 * ユーザーがマネージャー以上かどうかチェック
 */
export function isManagerOrAbove(user: User | null | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'manager';
}

/**
 * ユーザーが特定のリソースの所有者かチェック
 */
export function isOwner(user: User | null | undefined, ownerId: string | null | undefined): boolean {
  if (!user || !ownerId) return false;
  return user.id === ownerId;
}

/**
 * ユーザーがリソースを編集できるかチェック
 * （所有者または管理者/マネージャー）
 */
export function canEdit(
  user: User | null | undefined, 
  ownerId: string | null | undefined
): boolean {
  if (!user) return false;
  
  // 管理者/マネージャーは編集可能
  if (isManagerOrAbove(user)) return true;
  
  // 所有者は編集可能
  return isOwner(user, ownerId);
}

/**
 * ユーザーがリソースを削除できるかチェック
 */
export function canDelete(
  user: User | null | undefined, 
  ownerId: string | null | undefined
): boolean {
  if (!user) return false;
  
  // 管理者/マネージャーは削除可能
  if (hasPermission(user, PERMISSIONS.DELETE)) return true;
  
  // メンバーは自分のリソースのみ削除可能
  if (hasPermission(user, PERMISSIONS.DELETE_OWN)) {
    return isOwner(user, ownerId);
  }
  
  return false;
}

/**
 * チーム管理権限をチェック
 */
export function canManageTeam(user: User | null | undefined): boolean {
  return hasPermission(user, PERMISSIONS.TEAM_WRITE) || isAdmin(user);
}

/**
 * ユーザー管理権限をチェック
 */
export function canManageUsers(user: User | null | undefined): boolean {
  return hasPermission(user, PERMISSIONS.USER_WRITE) || isAdmin(user);
}

/**
 * ユーザー招待権限をチェック
 */
export function canInviteUsers(user: User | null | undefined): boolean {
  return hasPermission(user, PERMISSIONS.USER_INVITE) || isManagerOrAbove(user);
}

/**
 * レポート閲覧権限をチェック
 */
export function canViewReports(user: User | null | undefined): boolean {
  return hasPermission(user, PERMISSIONS.REPORTS_READ) || isManagerOrAbove(user);
}

/**
 * 設定変更権限をチェック
 */
export function canChangeSettings(user: User | null | undefined): boolean {
  return hasPermission(user, PERMISSIONS.SETTINGS_WRITE) || isAdmin(user);
}

/**
 * 権限エラーメッセージを取得
 */
export function getPermissionError(permission: string): string {
  const errorMessages: Record<string, string> = {
    [PERMISSIONS.READ]: 'このデータを閲覧する権限がありません',
    [PERMISSIONS.WRITE]: 'このデータを編集する権限がありません',
    [PERMISSIONS.DELETE]: 'このデータを削除する権限がありません',
    [PERMISSIONS.TEAM_WRITE]: 'チームを管理する権限がありません',
    [PERMISSIONS.USER_WRITE]: 'ユーザーを管理する権限がありません',
    [PERMISSIONS.USER_INVITE]: 'ユーザーを招待する権限がありません',
    [PERMISSIONS.REPORTS_READ]: 'レポートを閲覧する権限がありません',
    [PERMISSIONS.SETTINGS_WRITE]: '設定を変更する権限がありません',
  };
  
  return errorMessages[permission] || 'この操作を行う権限がありません';
}
