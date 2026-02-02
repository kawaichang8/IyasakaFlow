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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface MonthlyData {
  month: string;
  value: number;
  count: number;
}

interface RevenueChartProps {
  data: MonthlyData[];
}

/**
 * 月別売上チャート
 */
export function RevenueChart({ data }: RevenueChartProps) {
  const currentMonth = new Date().getMonth();
  const yearTotal = data.reduce((sum, d) => sum + d.value, 0);
  const yearCount = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>月別売上推移</CardTitle>
        <CardDescription>
          今年の成約額（累計 {formatCurrency(yearTotal)} / {yearCount}件）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
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
                dataKey="month" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  const first = payload?.[0];
                  if (active && first) {
                    const data = first.payload as MonthlyData;
                    const monthIndex = parseInt(label) - 1;
                    const isFuture = monthIndex > currentMonth;
                    
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm font-medium text-green-600">
                          売上: {formatCurrency(data.value)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          成約数: {data.count}件
                        </p>
                        {isFuture && (
                          <p className="text-xs text-muted-foreground mt-1">
                            （未来の月）
                          </p>
                        )}
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

        {/* 四半期サマリー */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: 'Q1', months: [0, 1, 2] },
            { label: 'Q2', months: [3, 4, 5] },
            { label: 'Q3', months: [6, 7, 8] },
            { label: 'Q4', months: [9, 10, 11] },
          ].map((quarter) => {
            const quarterValue = quarter.months.reduce(
              (sum, m) => sum + (data[m]?.value || 0),
              0
            );
            const quarterCount = quarter.months.reduce(
              (sum, m) => sum + (data[m]?.count || 0),
              0
            );
            const isCurrent = quarter.months.includes(currentMonth);
            
            return (
              <div 
                key={quarter.label}
                className={`rounded-lg border p-2 text-center ${
                  isCurrent ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''
                }`}
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {quarter.label}
                </p>
                <p className={`text-sm font-bold ${isCurrent ? 'text-green-600' : ''}`}>
                  {formatCurrency(quarterValue, { notation: 'compact' })}
                </p>
                <p className="text-xs text-muted-foreground">{quarterCount}件</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 売上チャートのスケルトン
 */
export function RevenueChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
