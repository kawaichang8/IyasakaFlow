'use client';

import Link from 'next/link';
import {
  Mail,
  MailOpen,
  Clock,
  AlertCircle,
  CheckCircle,
  MoreHorizontal,
  Trash2,
  Eye,
  Building2,
  User,
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
import { formatRelativeTime } from '@/lib/utils';
import { EMAIL_STATUSES } from '@/lib/validations/email';

interface Email {
  id: string;
  subject: string;
  toAddresses: string[];
  status: string;
  sentAt?: string;
  scheduledAt?: string;
  openedAt?: string;
  account?: { id: string; name: string };
  contact?: { id: string; name: string; email?: string };
  createdBy?: { id: string; name: string };
  createdAt: string;
}

interface EmailListProps {
  emails: Email[];
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  isLoading?: boolean;
}

/**
 * メール一覧コンポーネント
 */
export function EmailList({ emails, onDelete, onView, isLoading }: EmailListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <Mail className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">メールがありません</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          新しいメールを作成してください
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="divide-y">
        {emails.map((email) => (
          <EmailRow
            key={email.id}
            email={email}
            onDelete={onDelete}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * メール行コンポーネント
 */
function EmailRow({
  email,
  onDelete,
  onView,
}: {
  email: Email;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}) {
  const statusConfig = getStatusConfig(email.status);

  const displayDate = email.sentAt || email.scheduledAt || email.createdAt;
  const dateLabel = email.sentAt
    ? '送信日'
    : email.scheduledAt
    ? '予定日'
    : '作成日';

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50">
      {/* ステータスアイコン */}
      <div className={`flex-shrink-0 ${statusConfig.color}`}>
        {statusConfig.icon}
      </div>

      {/* メイン情報 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/emails/${email.id}`}
            className="truncate font-medium hover:text-primary"
          >
            {email.subject || '(件名なし)'}
          </Link>
          <Badge variant={statusConfig.variant as any} className="flex-shrink-0">
            {EMAIL_STATUSES.find((s) => s.value === email.status)?.label || email.status}
          </Badge>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {/* 宛先 */}
          <span className="truncate">
            To: {email.toAddresses.slice(0, 2).join(', ')}
            {email.toAddresses.length > 2 && ` +${email.toAddresses.length - 2}`}
          </span>

          {/* 関連先 */}
          {email.account && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {email.account.name}
            </span>
          )}
          {email.contact && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {email.contact.name}
            </span>
          )}
        </div>
      </div>

      {/* 日時 */}
      <div className="hidden flex-shrink-0 text-right text-sm text-muted-foreground sm:block">
        <div>{dateLabel}</div>
        <div>{formatRelativeTime(displayDate)}</div>
      </div>

      {/* 開封表示 */}
      {email.openedAt && (
        <div className="hidden flex-shrink-0 sm:block">
          <Badge variant="outline" className="text-green-600">
            <MailOpen className="mr-1 h-3 w-3" />
            開封
          </Badge>
        </div>
      )}

      {/* アクションメニュー */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">メニュー</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView?.(email.id)}>
            <Eye className="mr-2 h-4 w-4" />
            詳細を表示
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete?.(email.id)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * ステータスに応じた設定を取得
 */
function getStatusConfig(status: string) {
  switch (status) {
    case 'sent':
    case 'delivered':
      return {
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'text-green-500',
        variant: 'default',
      };
    case 'opened':
    case 'clicked':
      return {
        icon: <MailOpen className="h-5 w-5" />,
        color: 'text-purple-500',
        variant: 'default',
      };
    case 'scheduled':
      return {
        icon: <Clock className="h-5 w-5" />,
        color: 'text-blue-500',
        variant: 'secondary',
      };
    case 'draft':
      return {
        icon: <Mail className="h-5 w-5" />,
        color: 'text-gray-400',
        variant: 'outline',
      };
    case 'bounced':
    case 'failed':
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        color: 'text-red-500',
        variant: 'destructive',
      };
    default:
      return {
        icon: <Mail className="h-5 w-5" />,
        color: 'text-gray-500',
        variant: 'outline',
      };
  }
}
