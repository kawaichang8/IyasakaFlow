'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, Edit3, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface SalesGoalData {
  targetRevenue: number;
  targetDealCount: number;
  targetActivity: number;
}

interface Actuals {
  wonThisMonth: number;
  wonDealCount: number;
  activityCount: number;
}

interface SalesGoalCardProps {
  actuals: Actuals;
}

function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SalesGoalCard({ actuals }: SalesGoalCardProps) {
  const [goal, setGoal] = useState<SalesGoalData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ revenue: '', deals: '', activity: '' });
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fetchGoal = useCallback(async () => {
    try {
      const res = await fetch(`/api/sales-goals?year=${year}&month=${month}`);
      const json = await res.json();
      if (json.data) {
        setGoal({
          targetRevenue: Number(json.data.targetRevenue),
          targetDealCount: json.data.targetDealCount,
          targetActivity: json.data.targetActivity,
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/sales-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          targetRevenue: Number(form.revenue) || 0,
          targetDealCount: Number(form.deals) || 0,
          targetActivity: Number(form.activity) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('月間目標を保存しました');
      setEditing(false);
      fetchGoal();
    } catch {
      toast.error('目標の保存に失敗しました');
    }
  };

  const startEdit = () => {
    setForm({
      revenue: String(goal?.targetRevenue ?? 0),
      deals: String(goal?.targetDealCount ?? 0),
      activity: String(goal?.targetActivity ?? 0),
    });
    setEditing(true);
  };

  if (loading) return null;

  if (!goal && !editing) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Target className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            月間目標を設定すると、進捗をグラフで確認できます
          </p>
          <Button size="sm" onClick={startEdit}>
            今月の目標を設定する
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            {year}年{month}月の目標を設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">成約額目標（円）</Label>
            <Input
              type="number"
              placeholder="例: 5000000"
              value={form.revenue}
              onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">成約件数目標</Label>
            <Input
              type="number"
              placeholder="例: 5"
              value={form.deals}
              onChange={(e) => setForm((f) => ({ ...f, deals: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">活動数目標（電話+メール+訪問の合計）</Label>
            <Input
              type="number"
              placeholder="例: 50"
              value={form.activity}
              onChange={(e) => setForm((f) => ({ ...f, activity: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave}>
              <Save className="mr-1 h-3.5 w-3.5" />
              保存
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="mr-1 h-3.5 w-3.5" />
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const g = goal!;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            {month}月の目標進捗
          </CardTitle>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit}>
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>目標を編集</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          目標に対する今月の達成状況です
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {g.targetRevenue > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-muted-foreground">成約額</span>
              <span className="text-sm font-medium">
                {formatCurrency(actuals.wonThisMonth)} / {formatCurrency(g.targetRevenue)}
              </span>
            </div>
            <ProgressBar
              value={actuals.wonThisMonth}
              max={g.targetRevenue}
              label=""
              color="bg-green-500"
            />
          </div>
        )}
        {g.targetDealCount > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-muted-foreground">成約件数</span>
              <span className="text-sm font-medium">
                {actuals.wonDealCount} / {g.targetDealCount} 件
              </span>
            </div>
            <ProgressBar
              value={actuals.wonDealCount}
              max={g.targetDealCount}
              label=""
              color="bg-blue-500"
            />
          </div>
        )}
        {g.targetActivity > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-muted-foreground">活動数</span>
              <span className="text-sm font-medium">
                {actuals.activityCount} / {g.targetActivity} 回
              </span>
            </div>
            <ProgressBar
              value={actuals.activityCount}
              max={g.targetActivity}
              label=""
              color="bg-violet-500"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
