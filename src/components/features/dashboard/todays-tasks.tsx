'use client';

import Link from 'next/link';
import { 
  CheckCircle2, 
  Circle,
  Calendar,
  AlertTriangle,
  Building2,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TASK_PRIORITIES } from '@/lib/validations/task';

interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  priority: string;
  status: string;
  account?: { id: string; name: string } | null;
  deal?: { id: string; name: string } | null;
  isOverdue?: boolean;
}

interface TodaysTasksProps {
  tasks: Task[];
  onComplete?: (taskId: string) => void;
}

/**
 * 今日のタスクコンポーネント
 */
export function TodaysTasks({ tasks, onComplete }: TodaysTasksProps) {
  const overdueTasks = tasks.filter((t) => t.isOverdue);
  const todayTasks = tasks.filter((t) => !t.isOverdue);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            今日のタスク
          </CardTitle>
          <CardDescription>
            {tasks.length > 0 
              ? `${tasks.length}件のタスクがあります`
              : '今日のタスクはありません'
            }
          </CardDescription>
        </div>
        <Link href="/tasks">
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            追加
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="mt-4 font-medium text-green-600">
              素晴らしい！タスクはすべて完了しています
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              今日も一日頑張りましょう
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 期限切れタスク */}
            {overdueTasks.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <div className="mb-2 flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">期限切れ</span>
                </div>
                <div className="space-y-2">
                  {overdueTasks.map((task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onComplete={onComplete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 今日のタスク */}
            {todayTasks.length > 0 && (
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onComplete={onComplete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* すべて表示リンク */}
        {tasks.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <Link
              href="/tasks"
              className="text-sm text-primary hover:underline"
            >
              すべてのタスクを見る →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: string) => void;
}

function TaskItem({ task, onComplete }: TaskItemProps) {
  const priorityConfig = TASK_PRIORITIES.find((p) => p.value === task.priority);
  const isHighPriority = task.priority === 'high' || task.priority === 'urgent';

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      {/* 完了ボタン */}
      <button
        onClick={() => onComplete?.(task.id)}
        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 transition-colors hover:border-green-500 hover:bg-green-50"
      >
        <Circle className="h-3 w-3 text-transparent" />
      </button>

      {/* コンテンツ */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link 
            href={`/tasks`}
            className="font-medium hover:text-primary hover:underline"
          >
            {task.title}
          </Link>
          {isHighPriority && priorityConfig && (
            <Badge 
              variant={task.priority === 'urgent' ? 'destructive' : 'default'}
              className="text-xs"
            >
              {priorityConfig.label}
            </Badge>
          )}
        </div>

        {/* 関連情報 */}
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {task.account && (
            <Link
              href={`/accounts/${task.account.id}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Building2 className="h-3 w-3" />
              {task.account.name}
            </Link>
          )}
          {task.deal && (
            <Link
              href={`/deals/${task.deal.id}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <TrendingUp className="h-3 w-3" />
              {task.deal.name}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 今日のタスクスケルトン
 */
export function TodaysTasksSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-lg border p-3">
              <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
