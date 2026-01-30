'use client';

import { Check, X, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { USER_ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '@/lib/validations/team';

/**
 * 権限一覧
 */
const PERMISSION_GROUPS = [
  {
    name: 'データ操作',
    permissions: [
      { key: PERMISSIONS.READ, label: '閲覧' },
      { key: PERMISSIONS.WRITE, label: '作成・編集' },
      { key: PERMISSIONS.DELETE, label: '削除' },
      { key: PERMISSIONS.DELETE_OWN, label: '自分のデータを削除' },
    ],
  },
  {
    name: 'チーム管理',
    permissions: [
      { key: PERMISSIONS.TEAM_READ, label: 'チーム情報の閲覧' },
      { key: PERMISSIONS.TEAM_WRITE, label: 'チームの作成・編集' },
      { key: PERMISSIONS.TEAM_DELETE, label: 'チームの削除' },
    ],
  },
  {
    name: 'ユーザー管理',
    permissions: [
      { key: PERMISSIONS.USER_READ, label: 'ユーザー情報の閲覧' },
      { key: PERMISSIONS.USER_WRITE, label: 'ユーザーの作成・編集' },
      { key: PERMISSIONS.USER_DELETE, label: 'ユーザーの削除' },
      { key: PERMISSIONS.USER_INVITE, label: 'ユーザーの招待' },
    ],
  },
  {
    name: 'レポート',
    permissions: [
      { key: PERMISSIONS.REPORTS_READ, label: 'レポートの閲覧' },
      { key: PERMISSIONS.REPORTS_EXPORT, label: 'レポートのエクスポート' },
    ],
  },
  {
    name: '設定',
    permissions: [
      { key: PERMISSIONS.SETTINGS_READ, label: '設定の閲覧' },
      { key: PERMISSIONS.SETTINGS_WRITE, label: '設定の変更' },
    ],
  },
];

/**
 * 役割別権限マトリクス
 */
export function RolePermissions() {
  const hasPermission = (role: string, permission: string): boolean => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(PERMISSIONS.ALL) || permissions.includes(permission);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          役割と権限
        </CardTitle>
        <CardDescription>
          各役割に設定されている権限の一覧です
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 役割の説明 */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {USER_ROLES.map((role) => (
            <div 
              key={role.value}
              className="rounded-lg border p-3"
            >
              <Badge className={role.color}>{role.label}</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                {role.description}
              </p>
            </div>
          ))}
        </div>

        {/* 権限マトリクス */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left text-sm font-medium">権限</th>
                {USER_ROLES.map((role) => (
                  <th key={role.value} className="pb-3 text-center text-sm font-medium">
                    {role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) => (
                <>
                  <tr key={group.name} className="bg-muted/50">
                    <td colSpan={USER_ROLES.length + 1} className="py-2 pl-2 text-sm font-medium">
                      {group.name}
                    </td>
                  </tr>
                  {group.permissions.map((permission) => (
                    <tr key={permission.key} className="border-b">
                      <td className="py-2 pl-4 text-sm">{permission.label}</td>
                      {USER_ROLES.map((role) => (
                        <td key={role.value} className="py-2 text-center">
                          {hasPermission(role.value, permission.key) ? (
                            <Check className="mx-auto h-4 w-4 text-green-600" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* 注意書き */}
        <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          <p>
            <strong>管理者</strong>はすべての権限を持ちます。
            <strong>マネージャー</strong>はチームメンバーの管理とレポート閲覧が可能です。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
