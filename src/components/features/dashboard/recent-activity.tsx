'use client';

import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  Users, 
  FileText,
  MessageSquare,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';

interface Activity {
  id: string;
  type: string;
  subject: string | null;
  note: string | null;
  date: string;
  account?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  deal?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string } | null;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <MessageSquare className="h-4 w-4" />,
};

const activityLabels: Record<string, string> = {
  call: '電話',
  email: 'メール',
  meeting: 'ミーティング',
  note: 'メモ',
  task: 'タスク',
};

const activityColors: Record<string, string> = {
  call: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  email: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  meeting: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  note: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  task: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
};

/**
 * 最近の活動コンポーネント
 */
export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
          <CardDescription>チームの営業活動</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">まだ活動記録がありません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近の活動</CardTitle>
        <CardDescription>チームの営業活動</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className="flex gap-3 border-l-2 border-muted pl-4 pb-4 last:pb-0"
            >
              {/* アイコン */}
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${activityColors[activity.type] || 'bg-muted'}`}>
                {activityIcons[activity.type] || <MessageSquare className="h-4 w-4" />}
              </div>

              {/* コンテンツ */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {activityLabels[activity.type] || activity.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(new Date(activity.date))}
                  </span>
                </div>

                {activity.subject && (
                  <p className="mt-1 font-medium">{activity.subject}</p>
                )}

                {activity.note && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {activity.note}
                  </p>
                )}

                {/* 関連リンク */}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {activity.account && (
                    <Link
                      href={`/accounts/${activity.account.id}`}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Building2 className="h-3 w-3" />
                      {activity.account.name}
                    </Link>
                  )}
                  {activity.deal && (
                    <Link
                      href={`/deals/${activity.deal.id}`}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <TrendingUp className="h-3 w-3" />
                      {activity.deal.name}
                    </Link>
                  )}
                  {activity.createdBy && (
                    <span className="text-muted-foreground">
                      by {activity.createdBy.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* すべて表示リンク */}
        <div className="mt-4 border-t pt-4">
          <Link
            href="/activities"
            className="text-sm text-primary hover:underline"
          >
            すべての活動を見る →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 最近の活動スケルトン
 */
export function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
