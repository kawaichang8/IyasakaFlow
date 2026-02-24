'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  TrendingUp,
  CheckSquare,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  checkFn: (counts: StepCounts) => boolean;
}

interface StepCounts {
  accounts: number;
  contacts: number;
  deals: number;
  tasks: number;
}

const STEPS: Step[] = [
  {
    id: 'account',
    title: '企業を登録する',
    description: '取引先の企業を1件登録してみましょう。「＋ 新規追加」ボタンから作成できます。',
    href: '/accounts?openCreate=1',
    icon: Building2,
    checkFn: (c) => c.accounts > 0,
  },
  {
    id: 'contact',
    title: '連絡先を追加する',
    description: '企業の担当者を登録します。名前・メール・役職を入力しましょう。',
    href: '/contacts?openCreate=1',
    icon: Users,
    checkFn: (c) => c.contacts > 0,
  },
  {
    id: 'deal',
    title: '案件を作成する',
    description: '商談をパイプラインで管理します。金額や成約見込みを入力しましょう。',
    href: '/deals?openCreate=1',
    icon: TrendingUp,
    checkFn: (c) => c.deals > 0,
  },
  {
    id: 'task',
    title: 'タスクを追加する',
    description: 'やるべきことを登録します。期限と優先度を設定しておくと忘れません。',
    href: '/tasks?openCreate=1',
    icon: CheckSquare,
    checkFn: (c) => c.tasks > 0,
  },
];

const STORAGE_KEY = 'iyasaka-getting-started-dismissed';

interface GettingStartedProps {
  counts: StepCounts;
}

export function GettingStarted({ counts }: GettingStartedProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  if (dismissed) return null;

  const completedSteps = STEPS.filter((s) => s.checkFn(counts));
  const allDone = completedSteps.length === STEPS.length;

  if (allDone) return null;

  const progress = Math.round((completedSteps.length / STEPS.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  return (
    <Card className="border-emerald-200 dark:border-emerald-900">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            はじめに — セットアップガイド
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">閉じる</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          以下のステップを順番に進めると、すぐに営業管理を始められます。
        </p>
        {/* プログレスバー */}
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {completedSteps.length}/{STEPS.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {STEPS.map((step) => {
          const done = step.checkFn(counts);
          return (
            <Link
              key={step.id}
              href={step.href}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                done
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950'
                  : 'hover:bg-accent'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <step.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    done && 'line-through text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
              {!done && (
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
