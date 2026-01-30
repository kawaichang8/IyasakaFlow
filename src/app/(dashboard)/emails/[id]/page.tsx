'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  MailOpen,
  Clock,
  AlertCircle,
  CheckCircle,
  Building2,
  User,
  Briefcase,
  Trash2,
  Reply,
  Forward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEmail, useDeleteEmail } from '@/hooks/use-emails';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { EMAIL_STATUSES } from '@/lib/validations/email';
import { toast } from 'sonner';

interface EmailDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * メール詳細ページ
 */
export default function EmailDetailPage({ params }: EmailDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useEmail(id);
  const deleteMutation = useDeleteEmail();

  const email = data?.data;

  const handleDelete = async () => {
    if (!confirm('このメールを削除してもよろしいですか？')) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('メールを削除しました');
      router.push('/emails');
    } catch (error) {
      toast.error('メールの削除に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          メールが見つかりません
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(email.status);
  const statusLabel = EMAIL_STATUSES.find((s) => s.value === email.status)?.label || email.status;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Reply className="mr-2 h-4 w-4" />
            返信
          </Button>
          <Button variant="outline" disabled>
            <Forward className="mr-2 h-4 w-4" />
            転送
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>
      </div>

      {/* メイン */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左: メール本文 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{email.subject || '(件名なし)'}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig.variant as any}>
                      {statusConfig.icon}
                      <span className="ml-1">{statusLabel}</span>
                    </Badge>
                    {email.openedAt && (
                      <Badge variant="outline" className="text-green-600">
                        <MailOpen className="mr-1 h-3 w-3" />
                        開封済み
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 宛先情報 */}
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="w-20 text-muted-foreground">From:</span>
                  <span>
                    {email.fromName && `${email.fromName} `}
                    &lt;{email.fromAddress}&gt;
                  </span>
                </div>
                <div className="flex">
                  <span className="w-20 text-muted-foreground">To:</span>
                  <span>{email.toAddresses.join(', ')}</span>
                </div>
                {email.ccAddresses && email.ccAddresses.length > 0 && (
                  <div className="flex">
                    <span className="w-20 text-muted-foreground">CC:</span>
                    <span>{email.ccAddresses.join(', ')}</span>
                  </div>
                )}
                {email.bccAddresses && email.bccAddresses.length > 0 && (
                  <div className="flex">
                    <span className="w-20 text-muted-foreground">BCC:</span>
                    <span>{email.bccAddresses.join(', ')}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="w-20 text-muted-foreground">日時:</span>
                  <span>
                    {email.sentAt
                      ? formatDate(email.sentAt, { dateStyle: 'long', timeStyle: 'short' })
                      : email.scheduledAt
                      ? `予約: ${formatDate(email.scheduledAt, { dateStyle: 'long', timeStyle: 'short' })}`
                      : formatDate(email.createdAt, { dateStyle: 'long', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              <Separator />

              {/* 本文 */}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {email.body}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右: メタ情報 */}
        <div className="space-y-6">
          {/* 関連先 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">関連先</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {email.account && (
                <Link
                  href={`/accounts/${email.account.id}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {email.account.name}
                </Link>
              )}
              {email.contact && (
                <Link
                  href={`/contacts/${email.contact.id}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  {email.contact.name}
                </Link>
              )}
              {email.deal && (
                <Link
                  href={`/deals/${email.deal.id}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {email.deal.name}
                </Link>
              )}
              {!email.account && !email.contact && !email.deal && (
                <p className="text-sm text-muted-foreground">関連先なし</p>
              )}
            </CardContent>
          </Card>

          {/* 追跡情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">追跡情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ステータス</span>
                <span>{statusLabel}</span>
              </div>
              {email.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">送信日時</span>
                  <span>{formatRelativeTime(email.sentAt)}</span>
                </div>
              )}
              {email.openedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">開封日時</span>
                  <span>{formatRelativeTime(email.openedAt)}</span>
                </div>
              )}
              {email.clickedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">クリック日時</span>
                  <span>{formatRelativeTime(email.clickedAt)}</span>
                </div>
              )}
              {email.bouncedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">バウンス日時</span>
                  <span>{formatRelativeTime(email.bouncedAt)}</span>
                </div>
              )}
              {email.bounceReason && (
                <div>
                  <span className="text-muted-foreground">バウンス理由</span>
                  <p className="mt-1 text-destructive">{email.bounceReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 作成者 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">作成者</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{email.createdBy?.name || '不明'}</p>
              <p className="text-muted-foreground">
                {formatRelativeTime(email.createdAt)}に作成
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
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
        icon: <CheckCircle className="h-4 w-4" />,
        variant: 'default',
      };
    case 'opened':
    case 'clicked':
      return {
        icon: <MailOpen className="h-4 w-4" />,
        variant: 'default',
      };
    case 'scheduled':
      return {
        icon: <Clock className="h-4 w-4" />,
        variant: 'secondary',
      };
    case 'draft':
      return {
        icon: <Mail className="h-4 w-4" />,
        variant: 'outline',
      };
    case 'bounced':
    case 'failed':
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        variant: 'destructive',
      };
    default:
      return {
        icon: <Mail className="h-4 w-4" />,
        variant: 'outline',
      };
  }
}
