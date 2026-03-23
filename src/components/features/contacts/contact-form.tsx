'use client';

import { useForm } from 'react-hook-form';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { contactSchema, CONTACT_SOURCES, type ContactFormData } from '@/lib/validations/contact';
import { useAccounts, useCreateAccount } from '@/hooks/use-accounts';
import { useQueryClient } from '@tanstack/react-query';
import { CONTACTS_QUERY_KEY } from '@/hooks/use-contacts';
import { toast } from 'sonner';
import { contactNamePartsFromLegacy } from '@/lib/contact-name';

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
  const [accountSearch, setAccountSearch] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const createAccount = useCreateAccount();
  /** 同一企業内の同名連絡先（インライン表示用） */
  const [nameDuplicateCount, setNameDuplicateCount] = useState<number | null>(null);
  const duplicateToastKeyRef = useRef<string | null>(null);
  const defaultValues = useMemo((): ContactFormData => {
    const parts = contactNamePartsFromLegacy(
      initialData?.name,
      initialData?.lastName,
      initialData?.firstName
    );
    const sp = initialData?.socialProfiles;
    return {
      accountId: accountId || initialData?.accountId || '',
      lastName: parts.lastName,
      firstName: parts.firstName,
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      mobile: initialData?.mobile ?? '',
      website: initialData?.website ?? '',
      role: initialData?.role ?? '',
      department: initialData?.department ?? '',
      company: initialData?.company ?? '',
      influenceLevel: (initialData?.influenceLevel as ContactFormData['influenceLevel']) ?? 'other',
      contactSource: initialData?.contactSource,
      status: initialData?.status ?? 'active',
      tags: initialData?.tags ?? [],
      notes: initialData?.notes ?? '',
      socialProfiles: {
        linkedin: sp?.linkedin ?? '',
        twitter: sp?.twitter ?? '',
        facebook: sp?.facebook ?? '',
        threads: sp?.threads ?? '',
        instagram: sp?.instagram ?? '',
      },
    };
  }, [
    accountId,
    initialData?.id,
    initialData?.accountId,
    initialData?.name,
    initialData?.lastName,
    initialData?.firstName,
    initialData?.email,
    initialData?.phone,
    initialData?.mobile,
    initialData?.website,
    initialData?.role,
    initialData?.department,
    initialData?.company,
    initialData?.influenceLevel,
    initialData?.contactSource,
    initialData?.status,
    initialData?.notes,
    initialData?.tags,
    initialData?.socialProfiles?.linkedin,
    initialData?.socialProfiles?.twitter,
    initialData?.socialProfiles?.facebook,
    initialData?.socialProfiles?.threads,
    initialData?.socialProfiles?.instagram,
  ]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });

  const influenceLevel = watch('influenceLevel');
  const contactSource = watch('contactSource');
  const status = watch('status');
  const accountIdW = watch('accountId');
  const lastNameW = watch('lastName');
  const firstNameW = watch('firstName');

  /** 同一企業で姓+名（または表示名）が既存と重複する場合に通知 */
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const aid = getValues('accountId');
      const ln = (getValues('lastName') ?? '').trim();
      const fn = (getValues('firstName') ?? '').trim();
      if (!aid || !ln || !fn) {
        if (!cancelled) {
          setNameDuplicateCount(null);
          duplicateToastKeyRef.current = null;
        }
        return;
      }

      const params = new URLSearchParams({
        accountId: aid,
        lastName: ln,
        firstName: fn,
      });
      if (initialData?.id) params.set('excludeId', initialData.id);

      try {
        const res = await fetch(`/api/contacts/check-duplicate?${params.toString()}`);
        if (cancelled) return;
        const data = (await res.json()) as {
          duplicate?: boolean;
          matches?: { id: string; name: string }[];
        };
        const lnNow = (getValues('lastName') ?? '').trim();
        const fnNow = (getValues('firstName') ?? '').trim();
        if (lnNow !== ln || fnNow !== fn) return;

        if (res.ok && data.duplicate && data.matches && data.matches.length > 0) {
          const n = data.matches.length;
          setNameDuplicateCount(n);
          const key = `${aid}|${ln}|${fn}|${initialData?.id ?? 'new'}`;
          if (duplicateToastKeyRef.current !== key) {
            duplicateToastKeyRef.current = key;
            toast.warning('同じ所属企業に同じ氏名の連絡先がいます', {
              description: `既存 ${n} 件と重複の可能性があります。別人の場合は役職やメモで区別するか、意図した登録か確認してください。`,
            });
          }
        } else {
          setNameDuplicateCount(null);
          duplicateToastKeyRef.current = null;
        }
      } catch {
        if (!cancelled) setNameDuplicateCount(null);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [accountIdW, lastNameW, firstNameW, initialData?.id, getValues]);

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

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((account) => {
      const name = account.name?.toLowerCase() ?? '';
      const industry = (account as any).industry?.toLowerCase?.() ?? '';
      return name.includes(q) || industry.includes(q);
    });
  }, [accounts, accountSearch]);

  const handleQuickCreateAccount = async () => {
    const name = newAccountName.trim();
    if (!name) {
      toast.error('企業名を入力してください');
      return;
    }
    try {
      const result = await createAccount.mutateAsync({ name } as any);
      const newId = (result as any)?.data?.id;
      if (newId) {
        setValue('accountId', newId);
        setAccountSearch('');
        toast.success('企業アカウントを作成し、所属企業に設定しました');
      } else {
        toast.success('企業アカウントを作成しました');
      }
      setNewAccountName('');
    } catch (error) {
      console.error('Error creating account from contact form:', error);
      toast.error(error instanceof Error ? error.message : '企業アカウントの作成に失敗しました');
    }
  };

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
              {accounts.length > 0 && (
                <div className="p-2">
                  <Input
                    autoFocus
                    placeholder="企業名・業種で絞り込み"
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
              )}
              {filteredAccounts.map((account) => (
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
          <div className="mt-2 space-y-1 rounded-md border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">この画面から企業アカウントを簡易登録</p>
            <div className="flex gap-2">
              <Input
                placeholder="例: 株式会社ABC"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleQuickCreateAccount}
                disabled={createAccount.isPending}
              >
                {createAccount.isPending ? '作成中...' : '企業を登録'}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              会社名だけで登録します。詳細情報はあとから企業画面で編集できます。
            </p>
          </div>
        </div>

        {/* 姓・名（必須）— メール挨拶などで姓だけ使い分けしやすくする */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lastName">
              姓 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              placeholder="例: 山田"
              autoComplete="family-name"
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">
              名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              placeholder="例: 太郎"
              autoComplete="given-name"
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          一覧・案件では「姓 名」の順で表示されます。メール作成時は「姓」で挨拶文を入れられます。
        </p>
        {nameDuplicateCount != null && nameDuplicateCount > 0 && (
          <p
            className="text-sm font-medium text-amber-800 dark:text-amber-200"
            role="status"
          >
            この企業にはすでに同じ氏名の連絡先が {nameDuplicateCount} 件あります。別人の場合は区別できるよう役職・メモを入れるか、重複登録で問題ないか確認してください。
          </p>
        )}

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

        {/* 初回接触経路（名刺・対面等） */}
        <div className="space-y-2">
          <Label>初回接触経路</Label>
          <Select
            value={contactSource ?? 'none'}
            onValueChange={(v) => setValue('contactSource', v === 'none' ? undefined : (v as any))}
          >
            <SelectTrigger>
              <SelectValue placeholder="選択（任意）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未選択</SelectItem>
              {CONTACT_SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            名刺・対面・紹介など、どのように知り合ったか
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

        {/* SNSアカウント */}
        <div className="space-y-3">
          <Label>SNS・プロフィール</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="socialProfiles.linkedin" className="text-xs text-muted-foreground">LinkedIn</Label>
              <Input
                id="socialProfiles.linkedin"
                type="url"
                placeholder="https://linkedin.com/in/..."
                {...register('socialProfiles.linkedin')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialProfiles.twitter" className="text-xs text-muted-foreground">X (Twitter)</Label>
              <Input
                id="socialProfiles.twitter"
                type="url"
                placeholder="https://x.com/..."
                {...register('socialProfiles.twitter')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialProfiles.facebook" className="text-xs text-muted-foreground">Facebook</Label>
              <Input
                id="socialProfiles.facebook"
                type="url"
                placeholder="https://facebook.com/..."
                {...register('socialProfiles.facebook')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialProfiles.threads" className="text-xs text-muted-foreground">Threads</Label>
              <Input
                id="socialProfiles.threads"
                type="url"
                placeholder="https://www.threads.net/@..."
                {...register('socialProfiles.threads')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialProfiles.instagram" className="text-xs text-muted-foreground">Instagram</Label>
              <Input
                id="socialProfiles.instagram"
                type="url"
                placeholder="https://instagram.com/..."
                {...register('socialProfiles.instagram')}
              />
            </div>
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
