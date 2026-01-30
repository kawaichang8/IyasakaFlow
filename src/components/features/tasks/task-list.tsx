'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Circle,
  MoreHorizontal,
  Calendar,
  Building2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/validations/task';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  account?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  deal?: { id: string; name: string } | null;
  assignee?: { id: string; name: string } | null;
}

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: string) => void;
  onDelete?: (taskId: string) => void;
  isLoading?: boolean;
}

/**
 * タスク一覧コンポーネント
 */
export function TaskList({ tasks, onStatusChange, onDelete, isLoading }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">タスクがありません</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          「新規タスク」ボタンからタスクを作成しましょう
        </p>
      </div>
    );
  }

  // 今日・期限切れ・今週・それ以降でグループ化
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const groupedTasks = {
    overdue: tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < today;
    }),
    today: tasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= today && due < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }),
    thisWeek: tasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= new Date(today.getTime() + 24 * 60 * 60 * 1000) && due < weekEnd;
    }),
    later: tasks.filter((t) => {
      if (!t.dueDate) return true;
      return new Date(t.dueDate) >= weekEnd;
    }),
  };

  return (
    <div className="space-y-6">
      {/* 期限切れ */}
      {groupedTasks.overdue.length > 0 && (
        <TaskGroup
          title="期限切れ"
          tasks={groupedTasks.overdue}
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
          className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      )}

      {/* 今日 */}
      {groupedTasks.today.length > 0 && (
        <TaskGroup
          title="今日"
          tasks={groupedTasks.today}
          icon={<Calendar className="h-4 w-4 text-blue-600" />}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      )}

      {/* 今週 */}
      {groupedTasks.thisWeek.length > 0 && (
        <TaskGroup
          title="今週"
          tasks={groupedTasks.thisWeek}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      )}

      {/* それ以降 / 期限なし */}
      {groupedTasks.later.length > 0 && (
        <TaskGroup
          title="それ以降"
          tasks={groupedTasks.later}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  icon: React.ReactNode;
  className?: string;
  onStatusChange?: (taskId: string, status: string) => void;
  onDelete?: (taskId: string) => void;
}

function TaskGroup({ title, tasks, icon, className = '', onStatusChange, onDelete }: TaskGroupProps) {
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  onStatusChange?: (taskId: string, status: string) => void;
  onDelete?: (taskId: string) => void;
}

function TaskItem({ task, onStatusChange, onDelete }: TaskItemProps) {
  const priorityConfig = TASK_PRIORITIES.find((p) => p.value === task.priority);
  const statusConfig = TASK_STATUSES.find((s) => s.value === task.status);
  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

  const handleToggleComplete = () => {
    const newStatus = isCompleted ? 'pending' : 'completed';
    onStatusChange?.(task.id, newStatus);
  };

  return (
    <Card className={`transition-all hover:shadow-sm ${isCompleted ? 'opacity-60' : ''}`}>
      <CardContent className="flex items-center gap-3 p-3">
        {/* 完了チェックボタン */}
        <button
          onClick={handleToggleComplete}
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            isCompleted
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-muted-foreground/30 hover:border-green-500'
          }`}
        >
          {isCompleted && <CheckCircle2 className="h-4 w-4" />}
        </button>

        {/* タスク内容 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
              {task.title}
            </p>
            {/* 優先度バッジ */}
            {priorityConfig && task.priority !== 'medium' && (
              <Badge 
                variant={task.priority === 'urgent' || task.priority === 'high' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {priorityConfig.label}
              </Badge>
            )}
          </div>

          {/* 関連情報 */}
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {/* 期限 */}
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate, { month: 'short', day: 'numeric' })}
              </span>
            )}

            {/* 関連企業 */}
            {task.account && (
              <Link
                href={`/accounts/${task.account.id}`}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Building2 className="h-3 w-3" />
                {task.account.name}
              </Link>
            )}

            {/* 関連案件 */}
            {task.deal && (
              <Link
                href={`/deals/${task.deal.id}`}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <TrendingUp className="h-3 w-3" />
                {task.deal.name}
              </Link>
            )}

            {/* 担当者 */}
            {task.assignee && (
              <span className="flex items-center gap-1">
                @ {task.assignee.name}
              </span>
            )}
          </div>
        </div>

        {/* アクションメニュー */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>編集</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'in_progress')}>
              進行中にする
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete?.(task.id)}
            >
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
