'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  User, 
  Calendar, 
  MoreHorizontal,
  GripVertical,
  TrendingUp,
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { DEAL_STAGES } from '@/lib/validations/deal';

interface Deal {
  id: string;
  name: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate: string | null;
  account: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    name: string;
  } | null;
}

interface PipelineBoardProps {
  deals: Deal[];
  onStageChange: (dealId: string, newStage: string) => void;
  onDealClick?: (dealId: string) => void;
}

/**
 * パイプラインKanbanボード
 * ドラッグ＆ドロップでステージ変更可能
 */
export function PipelineBoard({ deals, onStageChange, onDealClick }: PipelineBoardProps) {
  const [draggingDeal, setDraggingDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // ステージごとに取引をグループ化
  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    acc[stage.value] = deals.filter((deal) => deal.stage === stage.value);
    return acc;
  }, {} as Record<string, Deal[]>);

  // ステージごとの合計金額を計算
  const stageTotal = (stageValue: string) => {
    return dealsByStage[stageValue]?.reduce((sum, deal) => sum + deal.value, 0) || 0;
  };

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, dealId: string) => {
    setDraggingDeal(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dealId);
  }, []);

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    setDraggingDeal(null);
    setDragOverStage(null);
  }, []);

  // ドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent, stageValue: string) => {
    e.preventDefault();
    setDragOverStage(stageValue);
  }, []);

  // ドロップ
  const handleDrop = useCallback((e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    
    if (dealId && draggingDeal) {
      const deal = deals.find((d) => d.id === dealId);
      if (deal && deal.stage !== newStage) {
        onStageChange(dealId, newStage);
      }
    }
    
    setDraggingDeal(null);
    setDragOverStage(null);
  }, [draggingDeal, deals, onStageChange]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {DEAL_STAGES.map((stage) => (
        <div
          key={stage.value}
          className={`flex w-80 flex-shrink-0 flex-col rounded-lg border bg-muted/30 ${
            dragOverStage === stage.value ? 'ring-2 ring-primary' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, stage.value)}
          onDragLeave={() => setDragOverStage(null)}
          onDrop={(e) => handleDrop(e, stage.value)}
        >
          {/* ステージヘッダー */}
          <div className="flex items-center justify-between border-b bg-card p-3">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${stage.color}`} />
              <h3 className="font-semibold">{stage.label}</h3>
              <Badge variant="secondary" className="text-xs">
                {dealsByStage[stage.value]?.length || 0}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(stageTotal(stage.value))}
            </div>
          </div>

          {/* 取引リスト */}
          <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin" style={{ maxHeight: '60vh' }}>
            {dealsByStage[stage.value]?.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                isDragging={draggingDeal === deal.id}
                onDragStart={(e) => handleDragStart(e, deal.id)}
                onDragEnd={handleDragEnd}
                onClick={() => onDealClick?.(deal.id)}
              />
            ))}

            {/* 空のステージ表示 */}
            {(!(stage.value && dealsByStage[stage.value]) || (dealsByStage[stage.value]?.length ?? 0) === 0) && (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                案件をドロップ
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 取引カードコンポーネント
 */
interface DealCardProps {
  deal: Deal;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick?: () => void;
}

function DealCard({ deal, isDragging, onDragStart, onDragEnd, onClick: _onClick }: DealCardProps) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-grab transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 ring-2 ring-primary' : ''
      }`}
    >
      <CardContent className="p-3">
        {/* ヘッダー */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Link
              href={`/deals/${deal.id}`}
              className="font-medium hover:text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {deal.name}
            </Link>
          </div>
          <DealActions deal={deal} />
        </div>

        {/* 金額 */}
        <div className="mt-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-600">
            {formatCurrency(deal.value)}
          </span>
          <Badge variant="outline" className="text-xs">
            {deal.probability}%
          </Badge>
        </div>

        {/* 企業情報 */}
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <Link
            href={`/accounts/${deal.account.id}`}
            className="hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {deal.account.name}
          </Link>
        </div>

        {/* 連絡先 */}
        {deal.contact && (
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <Link
              href={`/contacts/${deal.contact.id}`}
              className="hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              {deal.contact.name}
            </Link>
          </div>
        )}

        {/* 予定クローズ日 */}
        {deal.expectedCloseDate && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            予定: {formatDate(deal.expectedCloseDate, { month: 'short', day: 'numeric' })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 取引アクションメニュー
 */
function DealActions({ deal }: { deal: Deal }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/deals/${deal.id}`}>詳細を見る</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>編集</DropdownMenuItem>
        <DropdownMenuItem>タスクを追加</DropdownMenuItem>
        <DropdownMenuItem>活動を記録</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
