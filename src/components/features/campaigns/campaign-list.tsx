'use client';

import Link from 'next/link';
import {
  Zap,
  MoreHorizontal,
  Calendar,
  FileText,
  Pencil,
  Trash2,
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
import { formatDate } from '@/lib/utils';
import { CAMPAIGN_TYPES, CAMPAIGN_STATUSES } from '@/lib/validations/campaign';
import type { Campaign } from '@/hooks/use-campaigns';

interface CampaignListProps {
  campaigns: Campaign[];
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  running: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

/**
 * キャンペーン一覧
 */
export function CampaignList({ campaigns, onDelete, isLoading }: CampaignListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Zap className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">キャンペーンがありません</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          「新規キャンペーン」から作成しましょう
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="font-medium hover:underline"
                  >
                    {campaign.name}
                  </Link>
                  <Badge variant="secondary" className={statusColors[campaign.status] ?? statusColors.draft}>
                    {CAMPAIGN_STATUSES.find((s) => s.value === campaign.status)?.label ?? campaign.status}
                  </Badge>
                  <Badge variant="outline">
                    {CAMPAIGN_TYPES.find((t) => t.value === campaign.type)?.label ?? campaign.type}
                  </Badge>
                </div>
                {campaign.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {campaign.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {campaign.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(campaign.startDate)}
                      {campaign.endDate && ` 〜 ${formatDate(campaign.endDate)}`}
                    </span>
                  )}
                  {campaign.template && (
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {campaign.template.name}
                    </span>
                  )}
                  {campaign.createdBy && (
                    <span>作成: {campaign.createdBy.name}</span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      編集
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete?.(campaign.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
