'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReports } from '@/hooks/use-reports';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import { BarChart3, TrendingUp, Users, Target, Activity } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  lead: 'リード',
  qualified: '見込み',
  proposal: '提案',
  negotiation: '交渉',
  closed_won: '成約',
  closed_lost: '失注',
};

const ACTIVITY_LABELS: Record<string, string> = {
  call: '電話',
  email: 'メール',
  meeting: 'ミーティング',
  note: 'メモ',
  task: 'タスク',
};

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * 分析ページ
 * 転換ファネル・トレンド・チャネル別を表示
 */
export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month');
  const { data, isLoading, error, refetch } = useReports(period);
  const reportData = data?.data;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">分析</h1>
          <p className="text-muted-foreground">営業・マーケティングの分析ダッシュボード</p>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          データの取得に失敗しました
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">分析</h1>
          <p className="text-muted-foreground">
            転換ファネル・トレンド・チャネル別の分析
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="期間" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">今日</SelectItem>
            <SelectItem value="week">今週</SelectItem>
            <SelectItem value="month">今月</SelectItem>
            <SelectItem value="quarter">今四半期</SelectItem>
            <SelectItem value="year">今年</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : reportData ? (
        <>
          {/* KPIサマリー */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">売上</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(reportData.summary.revenue.current)}
                </div>
                <p className="text-xs text-muted-foreground">
                  成約 {reportData.summary.revenue.wonCount}件 / 勝率 {reportData.summary.revenue.winRate}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">パイプライン</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.summary.pipeline.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.summary.pipeline.count}件 / 加重 {formatCurrency(reportData.summary.pipeline.weighted)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活動数</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCompactNumber(reportData.summary.activity.current)}
                </div>
                <p className="text-xs text-muted-foreground">
                  タスク完了 {reportData.summary.activity.completedTasks}件
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">新規獲得</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  企業 {reportData.summary.acquisition.newAccounts} / 連絡先 {reportData.summary.acquisition.newContacts}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.period.label}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="funnel" className="space-y-6">
            <TabsList>
              <TabsTrigger value="funnel">転換ファネル</TabsTrigger>
              <TabsTrigger value="trend">トレンド</TabsTrigger>
              <TabsTrigger value="channel">チャネル別</TabsTrigger>
              <TabsTrigger value="leaderboard">リーダーボード</TabsTrigger>
            </TabsList>

            <TabsContent value="funnel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>パイプライン転換ファネル</CardTitle>
                  <CardDescription>ステージ別の案件数・金額</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData.charts.pipelineByStage.map((s) => ({
                          name: STAGE_LABELS[s.stageKey] || s.stage,
                          件数: s.count,
                          金額: s.value,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompactNumber(v)} />
                        <Tooltip formatter={(value: number, name: string) => [name === '金額' ? formatCurrency(value) : value, name]} />
                        <Bar yAxisId="left" dataKey="件数" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="金額" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trend" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>日別トレンド</CardTitle>
                  <CardDescription>成約額・件数の推移</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={reportData.charts.dailyTrend.map((d) => ({
                          date: d.date.slice(5),
                          売上: d.value,
                          件数: d.count,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCompactNumber(v)} />
                        <Tooltip formatter={(value: number) => [formatCurrency(value), '売上']} />
                        <Legend />
                        <Line type="monotone" dataKey="売上" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="件数" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="channel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>活動チャネル別</CardTitle>
                  <CardDescription>活動タイプ別の件数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.charts.activityByType.map((a, i) => ({
                            name: ACTIVITY_LABELS[a.typeKey] || a.type,
                            value: a.count,
                            fill: CHART_COLORS[i % CHART_COLORS.length],
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {reportData.charts.activityByType.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, '件']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ユーザー別リーダーボード</CardTitle>
                  <CardDescription>売上・案件数・活動数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.leaderboard.slice(0, 10).map((user, i) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {i + 1}
                          </span>
                          <span className="font-medium">{user.name}</span>
                        </div>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <span>売上: {formatCurrency(user.revenue)}</span>
                          <span>案件: {user.dealCount}件</span>
                          <span>活動: {user.activityCount}件</span>
                        </div>
                      </div>
                    ))}
                    {reportData.leaderboard.length === 0 && (
                      <p className="py-8 text-center text-muted-foreground">データがありません</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
