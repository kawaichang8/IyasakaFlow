'use client';

import Link from 'next/link';
import { AlertTriangle, Bell, Calendar, CheckSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/use-dashboard';

const TASK_MAX_DISPLAY = 5;

/**
 * ヘッダー用通知ドロップダウン
 * 期限切れ・本日のタスクを表示
 */
export function NotificationDropdownContent() {
  const { data, isLoading } = useDashboard();
  const kpi = data?.data?.kpi;
  const todaysTasks = data?.data?.todaysTasks ?? [];
  const displayTasks = todaysTasks.slice(0, TASK_MAX_DISPLAY);
  const overdueCount = kpi?.overdueTasks ?? 0;

  return (
    <DropdownMenuContent align="end" className="w-80" sideOffset={8}>
      <DropdownMenuLabel className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          通知
        </span>
        <Link
          href="/tasks"
          className="text-xs font-normal text-primary hover:underline"
        >
          タスク一覧
        </Link>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {isLoading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          読み込み中...
        </div>
      ) : (
        <>
          {/* サマリー */}
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                期限切れ {overdueCount}件
              </span>
            )}
            {todaysTasks.length > 0 && overdueCount === 0 && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                本日のタスク {todaysTasks.length}件
              </span>
            )}
            {todaysTasks.length === 0 && (
              <span className="flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-green-600" />
                対応中のタスクはありません
              </span>
            )}
          </div>

          {/* タスク一覧（最大5件） */}
          {displayTasks.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {displayTasks.map((task) => (
                  <DropdownMenuItem key={task.id} asChild>
                    <Link
                      href="/tasks"
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <span className="flex items-center gap-2">
                        {task.isOverdue && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        )}
                        <span className="line-clamp-1 font-medium">
                          {task.title}
                        </span>
                      </span>
                      {(task.account || task.deal) && (
                        <span className="text-xs text-muted-foreground">
                          {[task.account?.name, task.deal?.name]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </div>
              {todaysTasks.length > TASK_MAX_DISPLAY && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/tasks"
                      className="justify-center text-primary"
                    >
                      すべて見る（{todaysTasks.length}件）
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </>
      )}
    </DropdownMenuContent>
  );
}

/**
 * 通知ベル（ドロップダウン + 件数バッジ）
 * ヘッダーでそのまま使える単一コンポーネント（バレル経由でもビルドが通るようフックを内包）
 */
export function NotificationBell() {
  const { data } = useDashboard();
  const todaysTasks = data?.data?.todaysTasks ?? [];
  const count = todaysTasks.length;

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
