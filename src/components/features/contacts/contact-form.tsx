'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { contactSchema, type ContactFormData } from '@/lib/validations/contact';
import { useAccounts } from '@/hooks/use-accounts';
import { useQueryClient } from '@tanstack/react-query';
import { CONTACTS_QUERY_KEY } from '@/hooks/use-contacts';
import { toast } from 'sonner';

interface ContactFormProps {
  initialData?: Partial<ContactFormData> & { id?: string };
  accountId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 連絡先作成/編集フォーム
 * React Hook Form + Zodバリデーション
 */
export function ContactForm({ initialData, accountId, onSuccess, onCancel }: ContactFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      accountId: accountId || '',
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      role: '',
      department: '',
      company: '',
      influenceLevel: 'other',
      status: 'active',
      tags: [],
      notes: '',
      ...initialData,
    },
  });

  const influenceLevel = watch('influenceLevel');
  const status = watch('status');

  const onSubmit = async (data: ContactFormData) => {
    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/contacts/${initialData.id}` : '/api/contacts';
      const response = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = result.error || (result.details && Array.isArray(result.details) ? result.details.map((d: { message?: string }) => d.message).filter(Boolean).join(', ') : null) || '保存に失敗しました';
        toast.error(message);
        return;
      }

      toast.success(isEdit ? '連絡先を更新しました' : '連絡先を作成しました');
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      onSuccess?.();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error(error instanceof Error ? error.message : '保存に失敗しました');
    }
  };

  // APIから企業一覧を取得（所属企業の選択肢）
  const { data: accountsData } = useAccounts({ limit: 500 });
  const accounts = accountsData?.data ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本情報 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本情報</h3>
        
        {/* 所属企業（必須） */}
        <div className="space-y-2">
          <Label>
            所属企業 <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watch('accountId')}
            onValueChange={(value) => setValue('accountId', value)}
            disabled={accounts.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={accounts.length === 0 ? 'まず企業アカウントを作成してください' : '企業を選択'} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">連絡先を登録するには、先に企業アカウントを作成してください。</p>
          )}
          {errors.accountId && (
            <p className="text-sm text-destructive">{errors.accountId.message}</p>
          )}
        </div>

        {/* 氏名（必須） */}
        <div className="space-y-2">
          <Label htmlFor="name">
            氏名 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="例: 田中 太郎"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 役職 */}
          <div className="space-y-2">
            <Label htmlFor="role">役職</Label>
            <Input
              id="role"
              placeholder="例: 営業部長"
              {...register('role')}
            />
          </div>

          {/* 部署 */}
          <div className="space-y-2">
            <Label htmlFor="department">部署</Label>
            <Input
              id="department"
              placeholder="例: 営業部"
              {...register('department')}
            />
          </div>
        </div>

        {/* 影響力レベル */}
        <div className="space-y-2">
          <Label>影響力レベル</Label>
          <Select
            value={influenceLevel}
            onValueChange={(value) => setValue('influenceLevel', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="影響力を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="decision_maker">意思決定者（最終決裁権を持つ）</SelectItem>
              <SelectItem value="influencer">影響者（意思決定に影響を与える）</SelectItem>
              <SelectItem value="user">ユーザー（実際に使用する人）</SelectItem>
              <SelectItem value="gatekeeper">ゲートキーパー（情報の門番）</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            BtoB営業では、組織内での役割を把握することが重要です
          </p>
        </div>

        {/* ステータス */}
        <div className="space-y-2">
          <Label>ステータス</Label>
          <Select
            value={status}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ステータスを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">アクティブ</SelectItem>
              <SelectItem value="inactive">非アクティブ</SelectItem>
              <SelectItem value="bounced">メール不達</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 連絡先情報 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">連絡先情報</h3>
        
        {/* メールアドレス */}
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            placeholder="tanaka@example.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 電話番号 */}
          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="03-1234-5678"
              {...register('phone')}
            />
          </div>

          {/* 携帯番号 */}
          <div className="space-y-2">
            <Label htmlFor="mobile">携帯番号</Label>
            <Input
              id="mobile"
              type="tel"
              placeholder="090-1234-5678"
              {...register('mobile')}
            />
          </div>
        </div>
      </div>

      {/* メモ */}
      <div className="space-y-2">
        <Label htmlFor="notes">メモ・特記事項</Label>
        <textarea
          id="notes"
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="この連絡先についてのメモや特記事項を入力..."
          {...register('notes')}
        />
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : initialData ? '更新' : '作成'}
        </Button>
      </div>
    </form>
  );
}
