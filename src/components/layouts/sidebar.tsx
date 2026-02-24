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
  Kanban,
  CheckSquare,
  Activity,
  Mail,
  BarChart3,
  LineChart,
  Settings,
  HelpCircle,
  BookOpen,
  Zap,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * サイドバーナビゲーション
 * Iyasaka Flowの主要機能へのアクセスを提供
 */

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
}

const mainNavItems: NavItem[] = [
  {
    title: 'ダッシュボード',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: '売上やタスクなど、営業活動の全体像を一目で確認できます',
  },
  {
    title: '企業アカウント',
    href: '/accounts',
    icon: Building2,
    description: '取引先の企業を登録・管理します。まずここから顧客を追加しましょう',
  },
  {
    title: '連絡先',
    href: '/contacts',
    icon: Users,
    description: '企業の担当者（連絡先）を管理します。名前・メール・役職など',
  },
  {
    title: 'パイプライン',
    href: '/deals',
    icon: TrendingUp,
    description: '商談の進捗を「リード→提案→成約」のように段階で管理します',
  },
  {
    title: '案件',
    href: '/opportunities',
    icon: Kanban,
    description: '案件をカンバンボードで視覚的に管理。ドラッグ＆ドロップで移動',
  },
  {
    title: 'タスク',
    href: '/tasks',
    icon: CheckSquare,
    badge: '3',
    description: 'やるべきことを一覧管理。期限や優先度で整理できます',
  },
  {
    title: '活動履歴',
    href: '/activities',
    icon: Activity,
    description: '電話・メール・打合せなどの活動を記録して履歴を残します',
  },
];

const marketingNavItems: NavItem[] = [
  {
    title: 'メール',
    href: '/emails',
    icon: Mail,
    description: 'メールの送信・テンプレート管理。開封状況も確認できます',
  },
  {
    title: 'キャンペーン',
    href: '/campaigns',
    icon: Zap,
    description: 'メールキャンペーンやイベントなどのマーケティング施策を管理',
  },
  {
    title: '分析',
    href: '/analytics',
    icon: BarChart3,
    description: '営業データの傾向や実績をグラフで分析します',
  },
];

const settingsNavItems: NavItem[] = [
  {
    title: 'レポート',
    href: '/reports',
    icon: LineChart,
    description: '売上・活動・パイプラインなどの詳細なレポートを作成します',
  },
  {
    title: '設定',
    href: '/settings',
    icon: Settings,
    description: 'ユーザー管理やチーム設定、データのインポート・エクスポート',
  },
  {
    title: '営業スクリプト',
    href: '/scripts',
    icon: BookOpen,
    description: '電話・メール・ヒアリング・クロージングの「話し方・書き方」テンプレート',
  },
  {
    title: 'ヘルプ',
    href: '/help',
    icon: HelpCircle,
    description: '使い方やよくある質問を確認できます',
  },
];

interface SidebarProps {
  /** モバイルでドロップダウン表示する場合は true */
  open?: boolean;
  /** モバイルで閉じるコールバック（指定時のみモバイルオーバーレイを表示） */
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = typeof onClose === 'function';

  const navContent = (
    <TooltipProvider delayDuration={400}>
      {/* ロゴ・アプリ名 */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
            <Image src="/icon.png" alt="Iyasaka Flow" fill sizes="32px" className="object-contain" />
          </div>
          <span className="text-lg font-bold">Iyasaka Flow</span>
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="メニューを閉じる">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            営業管理
          </p>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              onClick={onClose}
            />
          ))}
        </div>
        <div className="mt-6 space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            マーケティング
          </p>
          {marketingNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              onClick={onClose}
            />
          ))}
        </div>
        <div className="mt-6 space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            その他
          </p>
          {settingsNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              onClick={onClose}
            />
          ))}
        </div>
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <p className="text-sm font-medium text-primary">ヒント</p>
          <p className="mt-1 text-xs text-muted-foreground">
            まずは「企業アカウント」から顧客を登録しましょう
          </p>
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <>
      {/* デスクトップ: 常に表示 */}
      <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
        {navContent}
      </aside>

      {/* モバイル: オーバーレイ（open 時のみ表示） */}
      {isMobile && (
        <>
          {open && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              aria-hidden
              onClick={onClose}
            />
          )}
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card shadow-lg transition-transform duration-200 ease-out lg:hidden',
              open ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}

/**
 * ナビゲーションリンクコンポーネント（ツールチップ付き）
 */
function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          onClick={onClick}
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
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px]">
        <p>{item.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
