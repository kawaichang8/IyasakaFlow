'use client';

import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  Users, 
  FileText,
  CheckSquare,
  MoreHorizontal,
  Building2,
  User,
  TrendingUp,
  Clock,
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
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { INTERACTION_TYPES } from '@/lib/validations/interaction';

interface Interaction {
  id: string;
  type: string;
  subject: string | null;
  note: string;
  date: string;
  duration: number | null;
  outcome: string | null;
  account?: { id: string; name: string } | null;
  contact?: { id: string; name: string; email?: string } | null;
  deal?: { id: string; name: string; stage: string } | null;
  createdBy?: { id: string; name: string } | null;
}

interface InteractionListProps {
  interactions: Interaction[];
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
};

/**
 * 活動一覧コンポーネント
 */
export function InteractionList({ interactions, onDelete, isLoading }: InteractionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Phone className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">活動記録がありません</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          「活動を記録」ボタンから最初の活動を記録しましょう
        </p>
      </div>
    );
  }

  // 日付でグループ化
  const groupedInteractions = groupByDate(interactions);

  return (
    <div className="space-y-6">
      {Object.entries(groupedInteractions).map(([dateLabel, items]) => (
        <div key={dateLabel}>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {dateLabel}
          </h3>
          <div className="space-y-3">
            {items.map((interaction) => (
              <InteractionCard
                key={interaction.id}
                interaction={interaction}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 日付でグループ化
 */
function groupByDate(interactions: Interaction[]): Record<string, Interaction[]> {
  const groups: Record<string, Interaction[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  interactions.forEach((interaction) => {
    const date = new Date(interaction.date);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    let label: string;
    if (dateOnly >= today) {
      label = '今日';
    } else if (dateOnly >= yesterday) {
      label = '昨日';
    } else if (dateOnly >= weekAgo) {
      label = '今週';
    } else {
      label = formatDate(date, { year: 'numeric', month: 'long' });
    }

    const key = label ?? '日付なし';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(interaction);
  });

  return groups;
}

interface InteractionCardProps {
  interaction: Interaction;
  onDelete?: (id: string) => void;
}

function InteractionCard({ interaction, onDelete }: InteractionCardProps) {
  const typeConfig = INTERACTION_TYPES.find((t) => t.value === interaction.type);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* アイコン */}
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${typeConfig?.color || 'bg-muted'}`}>
            {typeIcons[interaction.type] || <FileText className="h-4 w-4" />}
          </div>

          {/* コンテンツ */}
          <div className="min-w-0 flex-1">
            {/* ヘッダー */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {typeConfig?.label || interaction.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(new Date(interaction.date))}
                  </span>
                  {interaction.duration && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {interaction.duration}分
                    </span>
                  )}
                </div>
                {interaction.subject && (
                  <h4 className="mt-1 font-medium">{interaction.subject}</h4>
                )}
              </div>

              {/* アクションメニュー */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>編集</DropdownMenuItem>
                  <DropdownMenuItem>コピー</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => onDelete?.(interaction.id)}
                  >
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ノート */}
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
              {interaction.note}
            </p>

            {/* 結果 */}
            {interaction.outcome && (
              <div className="mt-2 rounded-md bg-muted/50 p-2">
                <p className="text-xs font-medium text-muted-foreground">結果:</p>
                <p className="text-sm">{interaction.outcome}</p>
              </div>
            )}

            {/* 関連情報 */}
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              {interaction.account && (
                <Link
                  href={`/accounts/${interaction.account.id}`}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Building2 className="h-3 w-3" />
                  {interaction.account.name}
                </Link>
              )}
              {interaction.contact && (
                <Link
                  href={`/contacts/${interaction.contact.id}`}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <User className="h-3 w-3" />
                  {interaction.contact.name}
                </Link>
              )}
              {interaction.deal && (
                <Link
                  href={`/deals/${interaction.deal.id}`}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <TrendingUp className="h-3 w-3" />
                  {interaction.deal.name}
                </Link>
              )}
              {interaction.createdBy && (
                <span className="text-muted-foreground">
                  by {interaction.createdBy.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
