'use client';

import { Calendar, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReportHeaderProps {
  period: string;
  onPeriodChange: (period: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const PERIODS = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '今週' },
  { value: 'month', label: '今月' },
  { value: 'quarter', label: '今四半期' },
  { value: 'year', label: '今年' },
];

/**
 * レポートページのヘッダー
 */
export function ReportHeader({ period, onPeriodChange, onRefresh, isLoading }: ReportHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">レポート・分析</h1>
        <p className="text-muted-foreground">
          営業活動のパフォーマンスを可視化
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {/* 期間選択 */}
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-36">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 更新ボタン */}
        <Button 
          variant="outline" 
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>

        {/* エクスポート */}
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          エクスポート
        </Button>
      </div>
    </div>
  );
}
