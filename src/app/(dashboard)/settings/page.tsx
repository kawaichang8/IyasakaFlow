'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Settings, 
  Users, 
  Shield, 
  Building,
  Bell,
  Palette,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { TeamManagement, UserManagement, RolePermissions, ImportExport } from '@/components/features/settings';
import { useCurrentUser } from '@/hooks/use-current-user';
import { isAdmin, isManagerOrAbove } from '@/lib/auth/permissions';

type SettingsTab = 'general' | 'teams' | 'users' | 'permissions' | 'data';

const LIST_FILTERS_PERSIST_KEY = 'settings:listFilters:persistent';

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

/**
 * 設定ページ（useSearchParams 利用のため Suspense 内で表示）
 */
function SettingsPageContent() {
  const { user } = useCurrentUser();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(() =>
    tabFromUrl && ['general', 'teams', 'users', 'permissions', 'data'].includes(tabFromUrl) ? tabFromUrl : 'general'
  );

  useEffect(() => {
    if (tabFromUrl && ['general', 'teams', 'users', 'permissions', 'data'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const canManageTeams = isManagerOrAbove(user as any);
  const canManageUsers = isAdmin(user as any);

  const tabs = [
    { 
      id: 'general' as const, 
      label: '一般', 
      icon: Settings,
      show: true,
    },
    { 
      id: 'teams' as const, 
      label: 'チーム', 
      icon: Building,
      show: canManageTeams,
    },
    { 
      id: 'users' as const, 
      label: 'ユーザー', 
      icon: Users,
      show: canManageUsers,
    },
    { 
      id: 'permissions' as const, 
      label: '権限', 
      icon: Shield,
      show: canManageUsers,
    },
    { 
      id: 'data' as const, 
      label: 'データ', 
      icon: Database,
      show: true,
    },
  ].filter((tab) => tab.show);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground">
          アプリケーションとチームの設定を管理します
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* サイドナビゲーション */}
        <div className="w-full lg:w-64">
          <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 space-y-6">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'teams' && canManageTeams && <TeamManagement />}
          {activeTab === 'users' && canManageUsers && <UserManagement />}
          {activeTab === 'permissions' && canManageUsers && <RolePermissions />}
          {activeTab === 'data' && <ImportExport />}
        </div>
      </div>
    </div>
  );
}

/**
 * 設定ページ
 */
export default function SettingsPage() {
  return (
    <Suspense fallback={<PageFallback />}>
      <SettingsPageContent />
    </Suspense>
  );
}

/**
 * 一般設定
 */
function GeneralSettings() {
  const [persistListFilters, setPersistListFilters] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPersistListFilters(localStorage.getItem(LIST_FILTERS_PERSIST_KEY) === 'true');
  }, []);

  const handleTogglePersistListFilters = (checked: boolean) => {
    setPersistListFilters(checked);
    if (typeof window === 'undefined') return;
    localStorage.setItem(LIST_FILTERS_PERSIST_KEY, checked ? 'true' : 'false');
  };

  return (
    <div className="space-y-6">
      {/* プロフィール */}
      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
          <CardDescription>あなたのアカウント情報を管理します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">プロフィール画像</p>
              <p className="text-sm text-muted-foreground">
                クリックして画像をアップロード
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            プロフィール編集機能は今後追加予定です
          </p>
        </CardContent>
      </Card>

      {/* 通知設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知設定
          </CardTitle>
          <CardDescription>通知の受信方法を設定します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">メール通知</p>
                <p className="text-sm text-muted-foreground">
                  重要な更新をメールで受け取る
                </p>
              </div>
              <div className="h-6 w-11 rounded-full bg-primary/30">
                <div className="h-5 w-5 translate-x-5 translate-y-0.5 rounded-full bg-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">タスクリマインダー</p>
                <p className="text-sm text-muted-foreground">
                  期限前にリマインダーを送信
                </p>
              </div>
              <div className="h-6 w-11 rounded-full bg-primary/30">
                <div className="h-5 w-5 translate-x-5 translate-y-0.5 rounded-full bg-primary" />
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            詳細な通知設定は今後追加予定です
          </p>
        </CardContent>
      </Card>

      {/* 表示設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            表示設定
          </CardTitle>
          <CardDescription>アプリの表示をカスタマイズします</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">ダークモード</p>
                <p className="text-sm text-muted-foreground">
                  システム設定に従う
                </p>
              </div>
              <select className="rounded-md border px-3 py-1 text-sm">
                <option>システム設定</option>
                <option>ライト</option>
                <option>ダーク</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">言語</p>
                <p className="text-sm text-muted-foreground">
                  アプリの表示言語
                </p>
              </div>
              <select className="rounded-md border px-3 py-1 text-sm">
                <option>日本語</option>
                <option>English</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">一覧フィルターの保持</p>
                <p className="text-sm text-muted-foreground">
                  ページを移動・再読み込みしても直前の絞り込み条件を保持します
                </p>
              </div>
              <Switch
                checked={persistListFilters}
                onCheckedChange={handleTogglePersistListFilters}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
