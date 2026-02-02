'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  TrendingUp,
  CheckSquare,
  Activity,
  Mail,
  BarChart3,
  LineChart,
  Settings,
  HelpCircle,
  Zap,
} from 'lucide-react';

/**
 * サイドバーナビゲーション
 * Iyasaka Flowの主要機能へのアクセスを提供
 */

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  {
    title: 'ダッシュボード',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '企業アカウント',
    href: '/accounts',
    icon: Building2,
  },
  {
    title: '連絡先',
    href: '/contacts',
    icon: Users,
  },
  {
    title: 'パイプライン',
    href: '/deals',
    icon: TrendingUp,
  },
  {
    title: 'タスク',
    href: '/tasks',
    icon: CheckSquare,
    badge: '3',
  },
  {
    title: '活動履歴',
    href: '/activities',
    icon: Activity,
  },
];

const marketingNavItems: NavItem[] = [
  {
    title: 'メール',
    href: '/emails',
    icon: Mail,
  },
  {
    title: 'キャンペーン',
    href: '/campaigns',
    icon: Zap,
  },
  {
    title: '分析',
    href: '/analytics',
    icon: BarChart3,
  },
];

const settingsNavItems: NavItem[] = [
  {
    title: 'レポート',
    href: '/reports',
    icon: LineChart,
  },
  {
    title: '設定',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'ヘルプ',
    href: '/help',
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
      {/* ロゴ・アプリ名 */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
            <Image src="/icon.png" alt="Iyasaka Flow" fill sizes="32px" className="object-contain" />
          </div>
          <span className="text-lg font-bold">Iyasaka Flow</span>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {/* メインナビ */}
        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            営業管理
          </p>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </div>

        {/* マーケティング */}
        <div className="mt-6 space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            マーケティング
          </p>
          {marketingNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </div>

        {/* 設定 */}
        <div className="mt-6 space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            その他
          </p>
          {settingsNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </div>
      </nav>

      {/* 初心者向けヒント */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="text-sm font-medium text-primary">ヒント</p>
          <p className="mt-1 text-xs text-muted-foreground">
            まずは「企業アカウント」から顧客を登録しましょう
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * ナビゲーションリンクコンポーネント
 */
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <div className="flex items-center gap-3">
        <item.icon className="h-4 w-4" />
        {item.title}
      </div>
      {item.badge && (
        <span
          className={cn(
            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
            isActive
              ? 'bg-primary-foreground text-primary'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
