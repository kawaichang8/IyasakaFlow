'use client';

import { useState, useMemo } from 'react';
import { Plus, LayoutGrid, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OpportunityKanban, OpportunityForm } from '@/components/features/opportunities';
import { useOpportunities, useUpdateOpportunityStage } from '@/hooks/use-opportunities';
import { OPPORTUNITY_STAGES } from '@/lib/validations/opportunity';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function OpportunitiesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useOpportunities({ limit: 500 });
  const updateStage = useUpdateOpportunityStage();

  const opportunities = data?.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return opportunities;
    const q = search.toLowerCase();
    return opportunities.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.account?.name?.toLowerCase().includes(q),
    );
  }, [opportunities, search]);

  const summary = useMemo(() => {
    const active = opportunities.filter((o) => o.stage !== 'won' && o.stage !== 'lost');
    const totalAmount = active.reduce((s, o) => s + o.amount, 0);
    const avgProbability = active.length
      ? Math.round(active.reduce((s, o) => s + o.probability, 0) / active.length)
      : 0;
    const weightedAmount = active.reduce((s, o) => s + o.amount * (o.probability / 100), 0);
    const wonAmount = opportunities
      .filter((o) => o.stage === 'won')
      .reduce((s, o) => s + o.amount, 0);
    return { totalAmount, avgProbability, weightedAmount, wonAmount, activeCount: active.length };
  }, [opportunities]);

  const handleStageChange = async (id: string, newStage: string) => {
    try {
      await updateStage.mutateAsync({ id, stage: newStage });
      const label = OPPORTUNITY_STAGES.find((s) => s.value === newStage)?.label ?? newStage;
      toast.success(`ステージを「${label}」に変更しました`);
    } catch (err: any) {
      toast.error(err.message || 'ステージの変更に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">案件管理</h1>
          <p className="text-muted-foreground">
            ドラッグ＆ドロップでステージを変更できます
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              新規案件
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>新規案件を作成</DialogTitle>
              <DialogDescription>案件の情報を入力してください</DialogDescription>
            </DialogHeader>
            <OpportunityForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">進行中の案件</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.activeCount}<span className="text-sm font-normal text-muted-foreground ml-1">件</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">パイプライン総額</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">加重金額</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.weightedAmount)}</p>
            <p className="text-xs text-muted-foreground">平均確度 {summary.avgProbability}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">成約済み</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.wonAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 検索バー */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="案件名・企業名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Kanban ボード */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          データの取得に失敗しました。再読み込みしてください。
        </div>
      ) : (
        <OpportunityKanban opportunities={filtered} onStageChange={handleStageChange} />
      )}
    </div>
  );
}
