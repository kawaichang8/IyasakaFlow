'use client';

import { useEffect, useRef, useState } from 'react';
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
import { accountSchema, ACCOUNT_INDUSTRIES, ACCOUNT_STATUSES, ACCOUNT_TYPES, type AccountFormData } from '@/lib/validations/account';
import { useQueryClient } from '@tanstack/react-query';
import { ACCOUNTS_QUERY_KEY } from '@/hooks/use-accounts';
import { CONTACTS_QUERY_KEY } from '@/hooks/use-contacts';
import { toast } from 'sonner';
import { fetchAddressFromPostalCode } from '@/lib/postal-code-jp';

interface AccountFormProps {
  initialData?: Partial<AccountFormData> & { id?: string };
  onSuccess?: () => void;
  onSaveAndNext?: () => void;
  onCancel?: () => void;
}

/** 新規作成時に同時登録する連絡先の入力値 */
interface CreateWithContactFields {
  contactLastName: string;
  contactFirstName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
}

/**
 * 企業アカウント作成/編集フォーム
 * 新規作成時は取引先名（会社名・氏名・屋号など）のみ必須。任意で担当者（連絡先）を同時登録可能。
 */
export function AccountForm({ initialData, onSuccess, onSaveAndNext, onCancel }: AccountFormProps) {
  const queryClient = useQueryClient();
  const isCreate = !initialData?.id;
  const [createContact, setCreateContact] = useState<CreateWithContactFields>({
    contactLastName: '',
    contactFirstName: '',
    contactEmail: '',
    contactPhone: '',
    contactRole: '',
  });
  /** 取引先名が既存と重複している件数（インライン表示用） */
  const [nameDuplicateCount, setNameDuplicateCount] = useState<number | null>(null);
  const duplicateToastKeyRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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
      socialProfiles: { linkedin: '', twitter: '', facebook: '', threads: '', instagram: '' },
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '日本',
      employeeCount: undefined,
      annualRevenue: undefined,
      accountType: undefined,
      status: 'prospect',
      description: '',
      tags: [],
      ...initialData,
    },
  });

  const status = watch('status');
  const accountType = watch('accountType');
  const postalCodeW = watch('postalCode');
  const countryW = watch('country');
  const nameW = watch('name');

  /** 取引先名の重複を検知してトースト・インラインで通知 */
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const name = (getValues('name') ?? '').trim();
      if (name.length < 1) {
        if (!cancelled) {
          setNameDuplicateCount(null);
          duplicateToastKeyRef.current = null;
        }
        return;
      }

      const params = new URLSearchParams({ name });
      if (initialData?.id) params.set('excludeId', initialData.id);

      try {
        const res = await fetch(`/api/accounts/check-duplicate?${params.toString()}`);
        if (cancelled) return;
        const data = (await res.json()) as {
          duplicate?: boolean;
          matches?: { id: string; name: string }[];
          error?: string;
        };
        const currentName = (getValues('name') ?? '').trim();
        if (currentName !== name) return;

        if (res.ok && data.duplicate && data.matches && data.matches.length > 0) {
          const n = data.matches.length;
          setNameDuplicateCount(n);
          const key = `${name}|${initialData?.id ?? 'new'}`;
          if (duplicateToastKeyRef.current !== key) {
            duplicateToastKeyRef.current = key;
            toast.warning('同じ取引先名のデータが既にあります', {
              description: `既存 ${n} 件と名前が重複しています。別名にするか、意図した重複か確認してください。`,
            });
          }
        } else {
          setNameDuplicateCount(null);
          duplicateToastKeyRef.current = null;
        }
      } catch {
        if (!cancelled) {
          setNameDuplicateCount(null);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nameW, initialData?.id, getValues]);

  /** 日本の郵便番号7桁で zipcloud から住所を補完（空欄の項目のみ） */
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const country = getValues('country');
      if (country && country !== '日本') return;

      const pc = getValues('postalCode') ?? '';
      const digits = pc.replace(/\D/g, '');
      if (digits.length !== 7) return;

      const addr = await fetchAddressFromPostalCode(pc);
      if (cancelled) return;
      const digitsNow = (getValues('postalCode') ?? '').replace(/\D/g, '');
      if (digitsNow !== digits) return;
      if (!addr) return;

      const state = getValues('state');
      const city = getValues('city');
      const line = getValues('address');
      const opts = { shouldDirty: true, shouldValidate: true } as const;
      if (!state?.trim()) setValue('state', addr.state, opts);
      if (!city?.trim()) setValue('city', addr.city, opts);
      if (!line?.trim()) setValue('address', addr.town, opts);
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [postalCodeW, countryW, getValues, setValue]);

  const submitCore = async (data: AccountFormData, mode: 'save' | 'next') => {
    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/accounts/${initialData.id}` : '/api/accounts';
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

      const newAccountId = result.data?.id;

      // 新規作成かつ姓・名が入力されていれば連絡先を同時作成
      if (
        isCreate &&
        newAccountId &&
        createContact.contactLastName.trim() &&
        createContact.contactFirstName.trim()
      ) {
        const ln = createContact.contactLastName.trim();
        const fn = createContact.contactFirstName.trim();
        try {
          const dupParams = new URLSearchParams({
            accountId: newAccountId,
            lastName: ln,
            firstName: fn,
          });
          const dupRes = await fetch(`/api/contacts/check-duplicate?${dupParams.toString()}`);
          const dupData = (await dupRes.json()) as {
            duplicate?: boolean;
            matches?: { id: string; name: string }[];
          };
          if (dupRes.ok && dupData.duplicate && dupData.matches && dupData.matches.length > 0) {
            toast.warning('同じ企業に同じ氏名の連絡先が既にいます', {
              description: `既存 ${dupData.matches.length} 件と重複の可能性があります。このまま登録してよいか確認してください。`,
            });
          }
        } catch {
          /* 重複確認失敗時は登録処理は続行 */
        }

        const contactRes = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: newAccountId,
            lastName: createContact.contactLastName.trim(),
            firstName: createContact.contactFirstName.trim(),
            email: createContact.contactEmail.trim() || null,
            phone: createContact.contactPhone.trim() || null,
            role: createContact.contactRole.trim() || null,
            status: 'active',
            influenceLevel: 'other',
          }),
        });
        if (!contactRes.ok) {
          const contactErr = await contactRes.json().catch(() => ({}));
          toast.error(contactErr.error || '企業は作成されましたが、連絡先の登録に失敗しました');
        } else {
          queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
          toast.success('企業アカウントと担当者を登録しました');
        }
      } else {
        toast.success(isEdit ? '企業アカウントを更新しました' : '企業アカウントを作成しました');
      }

      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
      if (mode === 'next') {
        onSaveAndNext?.();
      } else {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error(error instanceof Error ? error.message : '保存に失敗しました');
    }
  };

  const handleSave = handleSubmit((data) => submitCore(data, 'save'));
  const handleSaveAndNext = handleSubmit((data) => submitCore(data, 'next'));

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* 基本情報セクション */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本情報</h3>
        
        {/* 取引先名（必須）— 法人は会社名、個人・フリーランスは氏名・屋号など */}
        <div className="space-y-2">
          <Label htmlFor="name">
            {accountType === 'freelancer' ? (
              <>氏名・屋号（表示名） </>
            ) : (
              <>取引先名（会社名など） </>
            )}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder={
              accountType === 'freelancer'
                ? '例: 山田太郎 / 山田デザイン（個人事業主）'
                : '例: 株式会社ABC'
            }
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          <p className="text-xs text-muted-foreground">
            法人は会社名を入力。フリーランス・個人の方は氏名や屋号を入力してください。種別で「フリーランス・個人」を選ぶと一覧で分かりやすくなります。
          </p>
          {nameDuplicateCount != null && nameDuplicateCount > 0 && (
            <p
              className="text-sm font-medium text-amber-800 dark:text-amber-200"
              role="status"
            >
              同じ取引先名が {nameDuplicateCount} 件すでに登録されています。別の表示名にするか、重複で問題ないか確認してください。
            </p>
          )}
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
              {ACCOUNT_INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 取引先種別（顧客・下請け・外注・フリーランス等） */}
        <div className="space-y-2">
          <Label>取引先種別</Label>
          <Select
            // Radix Selectでは空文字の value が禁止のため、未選択は 'none' で表現する
            value={accountType ?? 'none'}
            onValueChange={(value) =>
              setValue('accountType', value === 'none' ? undefined : (value as any))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="種別を選択（任意）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未選択</SelectItem>
              {ACCOUNT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">顧客・下請け・外注先・フリーランスなど</p>
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
              {ACCOUNT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 新規作成時のみ：担当者（連絡先）を同時に登録（任意） */}
      {isCreate && (
        <div className="space-y-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            担当者を同時に登録（任意）
          </h3>
          <p className="text-xs text-muted-foreground">
            姓・名を入力すると、この取引先の連絡先として1件登録されます。個人・フリーランスで取引先名にすでに氏名を入れている場合は、ここは空でも構いません。
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="createContactLastName">担当者の姓</Label>
              <Input
                id="createContactLastName"
                placeholder="例: 山田"
                value={createContact.contactLastName}
                onChange={(e) => setCreateContact((c) => ({ ...c, contactLastName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createContactFirstName">担当者の名</Label>
              <Input
                id="createContactFirstName"
                placeholder="例: 太郎"
                value={createContact.contactFirstName}
                onChange={(e) => setCreateContact((c) => ({ ...c, contactFirstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createContactRole">役職</Label>
              <Input
                id="createContactRole"
                placeholder="例: 営業部長"
                value={createContact.contactRole}
                onChange={(e) => setCreateContact((c) => ({ ...c, contactRole: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="createContactEmail">メール</Label>
              <Input
                id="createContactEmail"
                type="email"
                placeholder="example@company.com"
                value={createContact.contactEmail}
                onChange={(e) => setCreateContact((c) => ({ ...c, contactEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createContactPhone">電話</Label>
              <Input
                id="createContactPhone"
                type="tel"
                placeholder="03-1234-5678"
                value={createContact.contactPhone}
                onChange={(e) => setCreateContact((c) => ({ ...c, contactPhone: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* 連絡先情報セクション（企業の連絡先＝会社の電話・メール等） */}
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

        {/* SNS */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">SNS</Label>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="account-socialProfiles.linkedin" className="text-xs text-muted-foreground">LinkedIn</Label>
              <Input
                id="account-socialProfiles.linkedin"
                type="url"
                placeholder="https://linkedin.com/company/..."
                {...register('socialProfiles.linkedin')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-socialProfiles.twitter" className="text-xs text-muted-foreground">X (Twitter)</Label>
              <Input
                id="account-socialProfiles.twitter"
                type="url"
                placeholder="https://x.com/..."
                {...register('socialProfiles.twitter')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-socialProfiles.facebook" className="text-xs text-muted-foreground">Facebook</Label>
              <Input
                id="account-socialProfiles.facebook"
                type="url"
                placeholder="https://facebook.com/..."
                {...register('socialProfiles.facebook')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-socialProfiles.threads" className="text-xs text-muted-foreground">Threads</Label>
              <Input
                id="account-socialProfiles.threads"
                type="url"
                placeholder="https://www.threads.net/@..."
                {...register('socialProfiles.threads')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-socialProfiles.instagram" className="text-xs text-muted-foreground">Instagram</Label>
              <Input
                id="account-socialProfiles.instagram"
                type="url"
                placeholder="https://instagram.com/..."
                {...register('socialProfiles.instagram')}
              />
            </div>
          </div>
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
            <p className="text-xs text-muted-foreground">
              7桁（ハイフン可）で入力すると、都道府県・市区町村・町名を自動入力します（すでに入力がある欄は上書きしません）
            </p>
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
        {onSaveAndNext && initialData?.id && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveAndNext}
            disabled={isSubmitting}
          >
            保存して次へ
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : initialData?.id ? '更新' : '作成'}
        </Button>
      </div>
    </form>
  );
}
