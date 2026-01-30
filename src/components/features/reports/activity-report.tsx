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
import { 
  TrendingUp, 
  TrendingDown,
  Phone,
  Mail,
  Users,
  FileText,
  CheckSquare,
  Building2,
  User,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface ActivitySummary {
  current: number;
  previous: number;
  growth: number;
  completedTasks: number;
  prevCompletedTasks: number;
}

interface AcquisitionSummary {
  newAccounts: number;
  prevNewAccounts: number;
  newContacts: number;
  prevNewContacts: number;
}

interface ActivityType {
  type: string;
  typeKey: string;
  count: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  revenue: number;
  dealCount: number;
  activityCount: number;
}

interface ActivityReportProps {
  activity: ActivitySummary;
  acquisition: AcquisitionSummary;
  activityByType: ActivityType[];
  leaderboard: LeaderboardEntry[];
}

const TYPE_COLORS: Record<string, string> = {
  call: '#22c55e',
  email: '#3b82f6',
  meeting: '#a855f7',
  note: '#eab308',
  task: '#6b7280',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
};

/**
 * 活動レポートコンポーネント
 */
export function ActivityReport({ activity, acquisition, activityByType, leaderboard }: ActivityReportProps) {
  const taskGrowth = activity.prevCompletedTasks > 0
    ? ((activity.completedTasks - activity.prevCompletedTasks) / activity.prevCompletedTasks) * 100
    : activity.completedTasks > 0 ? 100 : 0;

  const accountGrowth = acquisition.prevNewAccounts > 0
    ? ((acquisition.newAccounts - acquisition.prevNewAccounts) / acquisition.prevNewAccounts) * 100
    : acquisition.newAccounts > 0 ? 100 : 0;

  const contactGrowth = acquisition.prevNewContacts > 0
    ? ((acquisition.newContacts - acquisition.prevNewContacts) / acquisition.prevNewContacts) * 100
    : acquisition.newContacts > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* 活動KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 活動数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活動数</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activity.current}</div>
            <GrowthIndicator value={activity.growth} />
          </CardContent>
        </Card>

        {/* 完了タスク */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了タスク</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activity.completedTasks}</div>
            <GrowthIndicator value={Math.round(taskGrowth * 10) / 10} />
          </CardContent>
        </Card>

        {/* 新規アカウント */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新規アカウント</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acquisition.newAccounts}</div>
            <GrowthIndicator value={Math.round(accountGrowth * 10) / 10} />
          </CardContent>
        </Card>

        {/* 新規連絡先 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新規連絡先</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acquisition.newContacts}</div>
            <GrowthIndicator value={Math.round(contactGrowth * 10) / 10} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 活動タイプ別 */}
        <Card>
          <CardHeader>
            <CardTitle>活動タイプ別</CardTitle>
            <CardDescription>期間中の活動内訳</CardDescription>
          </CardHeader>
          <CardContent>
            {activityByType.length > 0 ? (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activityByType}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as ActivityType;
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-lg">
                                <p className="font-medium">{data.type}</p>
                                <p className="text-sm">{data.count}件</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {activityByType.map((entry) => (
                          <Cell 
                            key={entry.typeKey}
                            fill={TYPE_COLORS[entry.typeKey] || '#6b7280'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 凡例 */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {activityByType.map((type) => (
                    <div 
                      key={type.typeKey}
                      className="flex items-center gap-2 rounded-lg border px-3 py-1"
                    >
                      <div 
                        className="flex h-6 w-6 items-center justify-center rounded"
                        style={{ backgroundColor: TYPE_COLORS[type.typeKey] || '#6b7280', color: 'white' }}
                      >
                        {TYPE_ICONS[type.typeKey]}
                      </div>
                      <span className="text-sm">{type.type}</span>
                      <Badge variant="secondary">{type.count}</Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                この期間の活動データがありません
              </div>
            )}
          </CardContent>
        </Card>

        {/* リーダーボード */}
        <Card>
          <CardHeader>
            <CardTitle>セールスランキング</CardTitle>
            <CardDescription>期間中の成績トップメンバー</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-4">
                {leaderboard.slice(0, 5).map((user, index) => (
                  <div 
                    key={user.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    {/* 順位 */}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>

                    {/* ユーザー情報 */}
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.dealCount}件成約 · {user.activityCount}活動
                      </p>
                    </div>

                    {/* 売上 */}
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(user.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                この期間のデータがありません
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GrowthIndicator({ value }: { value: number }) {
  return (
    <div className="flex items-center text-xs text-muted-foreground">
      {value >= 0 ? (
        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
      ) : (
        <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
      )}
      <span className={value >= 0 ? 'text-green-500' : 'text-red-500'}>
        {value >= 0 ? '+' : ''}{value}%
      </span>
      <span className="ml-1">前期比</span>
    </div>
  );
}
