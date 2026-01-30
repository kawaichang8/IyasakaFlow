'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  Award,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface RevenueSummary {
  current: number;
  previous: number;
  growth: number;
  wonCount: number;
  lostCount: number;
  lostValue: number;
  winRate: number;
}

interface PipelineSummary {
  total: number;
  weighted: number;
  count: number;
}

interface DailyData {
  date: string;
  value: number;
  count: number;
}

interface RevenueReportProps {
  revenue: RevenueSummary;
  pipeline: PipelineSummary;
  dailyTrend: DailyData[];
}

/**
 * 売上レポートコンポーネント
 */
export function RevenueReport({ revenue, pipeline, dailyTrend }: RevenueReportProps) {
  return (
    <div className="space-y-6">
      {/* KPIカード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 売上 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">売上</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(revenue.current)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {revenue.growth >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={revenue.growth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {revenue.growth >= 0 ? '+' : ''}{revenue.growth}%
              </span>
              <span className="ml-1">前期比</span>
            </div>
          </CardContent>
        </Card>

        {/* パイプライン */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">パイプライン</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pipeline.total)}
            </div>
            <div className="text-xs text-muted-foreground">
              加重: {formatCurrency(pipeline.weighted)} ({pipeline.count}件)
            </div>
          </CardContent>
        </Card>

        {/* 成約率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成約率</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue.winRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              成約 {revenue.wonCount}件 / 失注 {revenue.lostCount}件
            </div>
          </CardContent>
        </Card>

        {/* 失注額 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失注額</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(revenue.lostValue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {revenue.lostCount}件の失注
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 売上推移グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>売上推移</CardTitle>
          <CardDescription>期間中の日別成約額</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyTrend.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyTrend}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as DailyData;
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-lg">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm font-medium text-green-600">
                              売上: {formatCurrency(data.value)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              成約数: {data.count}件
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              この期間のデータがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
