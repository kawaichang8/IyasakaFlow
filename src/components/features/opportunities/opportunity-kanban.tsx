'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  User,
  Calendar,
  GripVertical,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OPPORTUNITY_STAGES } from '@/lib/validations/opportunity';
import type { Opportunity } from '@/types';

interface OpportunityKanbanProps {
  opportunities: Opportunity[];
  onStageChange: (id: string, newStage: string) => void;
}

/**
 * 案件 Kanban ボード（HTML5 DnD）
 */
export function OpportunityKanban({ opportunities, onStageChange }: OpportunityKanbanProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const byStage = OPPORTUNITY_STAGES.reduce((acc, s) => {
    acc[s.value] = opportunities.filter((o) => o.stage === s.value);
    return acc;
  }, {} as Record<string, Opportunity[]>);

  const stageTotal = (sv: string) =>
    byStage[sv]?.reduce((sum, o) => sum + o.amount, 0) ?? 0;

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverStage(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, sv: string) => {
    e.preventDefault();
    setDragOverStage(sv);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, newStage: string) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (id && draggingId) {
        const opp = opportunities.find((o) => o.id === id);
        if (opp && opp.stage !== newStage) {
          onStageChange(id, newStage);
        }
      }
      setDraggingId(null);
      setDragOverStage(null);
    },
    [draggingId, opportunities, onStageChange],
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {OPPORTUNITY_STAGES.map((stage) => (
        <div
          key={stage.value}
          className={`flex w-72 flex-shrink-0 flex-col rounded-lg border bg-muted/30 transition-shadow ${
            dragOverStage === stage.value ? 'ring-2 ring-primary shadow-lg' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, stage.value)}
          onDragLeave={() => setDragOverStage(null)}
          onDrop={(e) => handleDrop(e, stage.value)}
        >
          {/* ステージヘッダー */}
          <div className="flex items-center justify-between border-b bg-card p-3 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${stage.color}`} />
              <h3 className="font-semibold text-sm">{stage.label}</h3>
              <Badge variant="secondary" className="text-xs">
                {byStage[stage.value]?.length ?? 0}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {formatCurrency(stageTotal(stage.value))}
            </span>
          </div>

          {/* カードリスト */}
          <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin" style={{ maxHeight: '65vh' }}>
            {byStage[stage.value]?.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                isDragging={draggingId === opp.id}
                onDragStart={(e) => handleDragStart(e, opp.id)}
                onDragEnd={handleDragEnd}
              />
            ))}
            {(byStage[stage.value]?.length ?? 0) === 0 && (
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

function OpportunityCard({
  opportunity: opp,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  opportunity: Opportunity;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-grab transition-all hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'opacity-50 ring-2 ring-primary' : ''
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Link
              href={`/opportunities`}
              className="font-medium text-sm truncate hover:text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {opp.name}
            </Link>
          </div>
        </div>

        {/* 金額・確度 */}
        <div className="mt-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-600 text-sm">
            {formatCurrency(opp.amount)}
          </span>
          <Badge variant="outline" className="text-xs">
            {opp.probability}%
          </Badge>
        </div>

        {/* 企業名 */}
        {opp.account && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{opp.account.name}</span>
          </div>
        )}

        {/* 担当者 */}
        {opp.owner && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{opp.owner.name}</span>
          </div>
        )}

        {/* 予定クローズ日 */}
        {opp.expectedCloseDate && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            予定: {formatDate(opp.expectedCloseDate, { month: 'short', day: 'numeric' })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
