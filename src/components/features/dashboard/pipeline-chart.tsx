'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface PipelineData {
  stage: string;
  count: number;
  value: number;
}

interface PipelineChartProps {
  data: PipelineData[];
}

const COLORS = ['#94a3b8', '#3b82f6', '#eab308', '#f97316'];

/**
 * パイプラインステージ別チャート
 */
export function PipelineChart({ data }: PipelineChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>パイプライン状況</CardTitle>
        <CardDescription>
          ステージ別の案件数と金額（{totalCount}件 / {formatCurrency(total)}）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="stage" 
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
                    const data = first.payload as PipelineData;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          案件数: {data.count}件
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          金額: {formatCurrency(data.value)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ステージ別サマリー */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {data.map((item, index) => (
            <div 
              key={item.stage}
              className="flex items-center gap-2 rounded-lg border p-2"
            >
              <div 
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{item.stage}</p>
                <p className="text-xs text-muted-foreground">{item.count}件</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * パイプラインチャートのスケルトン
 */
export function PipelineChartSkeleton() {
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
