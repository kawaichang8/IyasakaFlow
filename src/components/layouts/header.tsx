'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Bell, Search, User, Menu, Plus, LogOut, Settings, Building2, Users, TrendingUp, CheckSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/hooks/use-current-user';
import { GlobalSearch } from '@/components/features/search';
import {
  NotificationDropdownContent,
  useNotificationCount,
} from '@/components/features/dashboard';

interface HeaderProps {
  /** モバイルでメニューボタン押下時（サイドバーを開く） */
  onMenuClick?: () => void;
}

/**
 * ヘッダーコンポーネント
 * 検索、通知、ユーザーメニューを提供
 */
export function Header({ onMenuClick }: HeaderProps) {
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* 左側: モバイルメニュー + 検索 */}
      <div className="flex items-center gap-4">
        {/* モバイルメニューボタン */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">メニュー</span>
        </Button>

        {/* グローバル検索トリガー */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchTriggerRef}
            type="search"
            placeholder="顧客、連絡先、案件を検索... (⌘K)"
            className="w-80 pl-10"
            onFocus={() => setGlobalSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setGlobalSearchOpen(true);
              }
            }}
            readOnly
          />
        </div>
      </div>

      <GlobalSearch
        open={globalSearchOpen}
        onOpenChange={setGlobalSearchOpen}
        triggerRef={searchTriggerRef}
      />

      {/* 右側: アクション */}
      <div className="flex items-center gap-2">
        {/* クイック追加ボタン */}
        <QuickAddMenu />

        {/* 通知 */}
        <NotificationBell />


        {/* ユーザーメニュー */}
        <UserMenu />
      </div>
    </header>
  );
}

/**
 * 通知ベル（ドロップダウン + 件数バッジ）
 */
function NotificationBell() {
  const count = useNotificationCount();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">通知</span>
          {count > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <NotificationDropdownContent />
    </DropdownMenu>
  );
}

/**
 * クイック追加メニュー
 * 新規作成のショートカット（該当ページへ遷移し作成ダイアログを開く）
 */
function QuickAddMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">新規作成</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>新規作成</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/accounts?openCreate=1" className="flex items-center">
            <Building2 className="mr-2 h-4 w-4" />
            企業アカウント
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/contacts?openCreate=1" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            連絡先
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/deals?openCreate=1" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            案件
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/tasks?openCreate=1" className="flex items-center">
            <CheckSquare className="mr-2 h-4 w-4" />
            タスク
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/campaigns?openCreate=1" className="flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            キャンペーン
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ユーザーメニュー
 * プロフィール、設定、ログアウト
 */
function UserMenu() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    );
  }

  const displayName = user?.name || 'ユーザー';
  const displayEmail = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {user?.image ? (
            <img
              src={user.image}
              alt={displayName}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {initial}
            </div>
          )}
          <span className="sr-only">ユーザーメニュー</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{displayEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
          <User className="mr-2 h-4 w-4" />
          プロフィール
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          設定
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
