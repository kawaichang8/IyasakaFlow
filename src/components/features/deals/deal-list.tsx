'use client';

import Link from 'next/link';
import { 
  Building2, 
  User,
  MoreHorizontal,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DEAL_STAGES } from '@/lib/validations/deal';

interface Deal {
  id: string;
  name: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate: string | null;
  account: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    name: string;
  } | null;
}

interface DealListProps {
  deals: Deal[];
}

/**
 * 取引リスト表示
 */
export function DealList({ deals }: DealListProps) {
  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">案件がありません</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          「新規案件」ボタンから最初の案件を登録しましょう
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-medium">案件名</th>
            <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">企業</th>
            <th className="hidden px-4 py-3 text-left text-sm font-medium lg:table-cell">ステージ</th>
            <th className="px-4 py-3 text-right text-sm font-medium">金額</th>
            <th className="hidden px-4 py-3 text-left text-sm font-medium sm:table-cell">確率</th>
            <th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">予定日</th>
            <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <DealRow key={deal.id} deal={deal} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DealRow({ deal }: { deal: Deal }) {
  const stageConfig = DEAL_STAGES.find((s) => s.value === deal.stage);

  return (
    <tr className="border-b transition-colors hover:bg-muted/50">
      <td className="px-4 py-3">
        <Link 
          href={`/deals/${deal.id}`}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium hover:underline">{deal.name}</p>
            {deal.contact && (
              <p className="text-xs text-muted-foreground">
                <User className="mr-1 inline h-3 w-3" />
                {deal.contact.name}
              </p>
            )}
          </div>
        </Link>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <Link 
          href={`/accounts/${deal.account.id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Building2 className="h-4 w-4" />
          {deal.account.name}
        </Link>
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        {stageConfig && (
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${stageConfig.color}`} />
            <span className="text-sm">{stageConfig.label}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-semibold text-green-600">
          {formatCurrency(deal.value)}
        </span>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <Badge variant="outline">{deal.probability}%</Badge>
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
        {deal.expectedCloseDate ? (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(deal.expectedCloseDate, { month: 'short', day: 'numeric' })}
          </div>
        ) : (
          '-'
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <DealActions deal={deal} />
      </td>
    </tr>
  );
}

function DealActions({ deal }: { deal: Deal }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/deals/${deal.id}`}>詳細を見る</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>編集</DropdownMenuItem>
        <DropdownMenuItem>タスクを追加</DropdownMenuItem>
        <DropdownMenuItem>活動を記録</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">削除</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
