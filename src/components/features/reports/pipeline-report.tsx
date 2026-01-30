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
  PieChart,
  Pie,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface StageData {
  stage: string;
  stageKey: string;
  count: number;
  value: number;
}

interface PipelineReportProps {
  data: StageData[];
}

const COLORS = {
  lead: '#94a3b8',
  qualified: '#3b82f6',
  proposal: '#eab308',
  negotiation: '#f97316',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
};

/**
 * パイプライン分析コンポーネント
 */
export function PipelineReport({ data }: PipelineReportProps) {
  // 成約・失注を除いたアクティブなパイプライン
  const activeStages = data.filter(
    (d) => d.stageKey !== 'closed_won' && d.stageKey !== 'closed_lost'
  );
  
  const totalValue = activeStages.reduce((sum, d) => sum + d.value, 0);
  const totalCount = activeStages.reduce((sum, d) => sum + d.count, 0);

  // パイチャート用データ
  const pieData = activeStages.map((d) => ({
    name: d.stage,
    value: d.value,
    color: COLORS[d.stageKey as keyof typeof COLORS] || '#94a3b8',
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ステージ別金額（バーチャート） */}
      <Card>
        <CardHeader>
          <CardTitle>ステージ別金額</CardTitle>
          <CardDescription>
            パイプライン総額: {formatCurrency(totalValue)} ({totalCount}件)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeStages}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => `¥${(value / 1000000).toFixed(0)}M`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as StageData;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-lg">
                          <p className="font-medium">{data.stage}</p>
                          <p className="text-sm font-medium text-green-600">
                            金額: {formatCurrency(data.value)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            案件数: {data.count}件
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {activeStages.map((entry) => (
                    <Cell 
                      key={entry.stageKey}
                      fill={COLORS[entry.stageKey as keyof typeof COLORS] || '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ステージ別割合（パイチャート） */}
      <Card>
        <CardHeader>
          <CardTitle>ステージ別割合</CardTitle>
          <CardDescription>
            金額ベースの構成比
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = totalValue > 0 
                        ? ((data.value / totalValue) * 100).toFixed(1)
                        : 0;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(data.value)} ({percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 凡例 */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {activeStages.map((stage) => (
              <div key={stage.stageKey} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[stage.stageKey as keyof typeof COLORS] || '#94a3b8' }}
                />
                <span className="text-sm">{stage.stage}</span>
                <span className="text-sm text-muted-foreground">({stage.count})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ファネル分析 */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>セールスファネル</CardTitle>
          <CardDescription>
            各ステージの案件数と金額
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeStages.map((stage, index) => {
              const widthPercentage = totalValue > 0 
                ? Math.max((stage.value / totalValue) * 100, 10) 
                : 25;
              
              return (
                <div key={stage.stageKey} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">
                      {stage.count}件 · {formatCurrency(stage.value)}
                    </span>
                  </div>
                  <div 
                    className="h-8 rounded-md transition-all"
                    style={{ 
                      width: `${widthPercentage}%`,
                      backgroundColor: COLORS[stage.stageKey as keyof typeof COLORS] || '#94a3b8',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
