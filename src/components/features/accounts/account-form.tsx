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
import { accountSchema, type AccountFormData } from '@/lib/validations/account';

interface AccountFormProps {
  initialData?: Partial<AccountFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 企業アカウント作成/編集フォーム
 * React Hook Form + Zodバリデーション
 */
export function AccountForm({ initialData, onSuccess, onCancel }: AccountFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      industry: '',
      website: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '日本',
      employeeCount: undefined,
      annualRevenue: undefined,
      status: 'prospect',
      description: '',
      tags: [],
      ...initialData,
    },
  });

  const status = watch('status');

  const onSubmit = async (data: AccountFormData) => {
    try {
      // TODO: APIコールを実装
      const response = await fetch('/api/accounts', {
        method: initialData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving account:', error);
      // TODO: トースト通知でエラーを表示
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本情報セクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本情報</h3>
        
        {/* 会社名（必須） */}
        <div className="space-y-2">
          <Label htmlFor="name">
            会社名 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="例: 株式会社ABC"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* 業種 */}
        <div className="space-y-2">
          <Label htmlFor="industry">業種</Label>
          <Select
            value={watch('industry') || ''}
            onValueChange={(value) => setValue('industry', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="業種を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IT・ソフトウェア">IT・ソフトウェア</SelectItem>
              <SelectItem value="製造業">製造業</SelectItem>
              <SelectItem value="商社">商社</SelectItem>
              <SelectItem value="金融・保険">金融・保険</SelectItem>
              <SelectItem value="小売・流通">小売・流通</SelectItem>
              <SelectItem value="サービス業">サービス業</SelectItem>
              <SelectItem value="建設・不動産">建設・不動産</SelectItem>
              <SelectItem value="医療・ヘルスケア">医療・ヘルスケア</SelectItem>
              <SelectItem value="教育">教育</SelectItem>
              <SelectItem value="その他">その他</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="prospect">見込み客</SelectItem>
              <SelectItem value="active">アクティブ</SelectItem>
              <SelectItem value="inactive">非アクティブ</SelectItem>
              <SelectItem value="churned">離脱</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 連絡先情報セクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">連絡先情報</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Webサイト */}
          <div className="space-y-2">
            <Label htmlFor="website">Webサイト</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              {...register('website')}
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            )}
          </div>

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
        </div>

        {/* メールアドレス */}
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            placeholder="info@example.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* 住所セクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">住所</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 郵便番号 */}
          <div className="space-y-2">
            <Label htmlFor="postalCode">郵便番号</Label>
            <Input
              id="postalCode"
              placeholder="100-0001"
              {...register('postalCode')}
            />
          </div>

          {/* 都道府県 */}
          <div className="space-y-2">
            <Label htmlFor="state">都道府県</Label>
            <Input
              id="state"
              placeholder="東京都"
              {...register('state')}
            />
          </div>
        </div>

        {/* 市区町村 */}
        <div className="space-y-2">
          <Label htmlFor="city">市区町村</Label>
          <Input
            id="city"
            placeholder="渋谷区"
            {...register('city')}
          />
        </div>

        {/* 住所 */}
        <div className="space-y-2">
          <Label htmlFor="address">住所</Label>
          <Input
            id="address"
            placeholder="1-2-3 ABCビル 5F"
            {...register('address')}
          />
        </div>
      </div>

      {/* 企業規模セクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">企業規模（オプション）</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 従業員数 */}
          <div className="space-y-2">
            <Label htmlFor="employeeCount">従業員数</Label>
            <Input
              id="employeeCount"
              type="number"
              min="0"
              placeholder="100"
              {...register('employeeCount', { valueAsNumber: true })}
            />
          </div>

          {/* 年間売上 */}
          <div className="space-y-2">
            <Label htmlFor="annualRevenue">年間売上（円）</Label>
            <Input
              id="annualRevenue"
              type="number"
              min="0"
              placeholder="100000000"
              {...register('annualRevenue', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <Label htmlFor="description">メモ・説明</Label>
        <textarea
          id="description"
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="この企業についてのメモや特記事項を入力..."
          {...register('description')}
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
