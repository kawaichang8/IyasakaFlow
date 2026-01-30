'use client';

import { useState, useEffect } from 'react';
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
import { dealSchema, DEAL_STAGES, type DealFormData } from '@/lib/validations/deal';

interface DealFormProps {
  initialData?: Partial<DealFormData>;
  accountId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Account {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
  role?: string;
}

/**
 * 取引作成/編集フォーム
 */
export function DealForm({ initialData, accountId, onSuccess, onCancel }: DealFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      name: '',
      accountId: accountId || '',
      contactId: '',
      value: 0,
      currency: 'JPY',
      stage: 'lead',
      probability: 10,
      expectedCloseDate: '',
      description: '',
      tags: [],
      ...initialData,
    },
  });

  const selectedAccountId = watch('accountId');
  const selectedStage = watch('stage');

  // アカウント一覧を取得
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch('/api/accounts?limit=100');
        const data = await response.json();
        setAccounts(data.data || []);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setIsLoadingAccounts(false);
      }
    }
    fetchAccounts();
  }, []);

  // 選択されたアカウントの連絡先を取得
  useEffect(() => {
    async function fetchContacts() {
      if (!selectedAccountId) {
        setContacts([]);
        return;
      }
      
      try {
        const response = await fetch(`/api/contacts?accountId=${selectedAccountId}&limit=50`);
        const data = await response.json();
        setContacts(data.data || []);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    }
    fetchContacts();
  }, [selectedAccountId]);

  // ステージ変更時に確率を自動設定
  useEffect(() => {
    const stageConfig = DEAL_STAGES.find((s) => s.value === selectedStage);
    if (stageConfig) {
      setValue('probability', stageConfig.probability);
    }
  }, [selectedStage, setValue]);

  const onSubmit = async (data: DealFormData) => {
    try {
      const response = await fetch('/api/deals', {
        method: initialData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 基本情報 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">基本情報</h3>
        
        {/* 案件名（必須） */}
        <div className="space-y-2">
          <Label htmlFor="name">
            案件名 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="例: クラウドサービス導入プロジェクト"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* 企業アカウント（必須） */}
        <div className="space-y-2">
          <Label>
            企業アカウント <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedAccountId}
            onValueChange={(value) => {
              setValue('accountId', value);
              setValue('contactId', ''); // 連絡先をリセット
            }}
            disabled={isLoadingAccounts}
          >
            <SelectTrigger>
              <SelectValue placeholder="企業を選択" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-destructive">{errors.accountId.message}</p>
          )}
        </div>

        {/* 担当連絡先 */}
        <div className="space-y-2">
          <Label>担当連絡先</Label>
          <Select
            value={watch('contactId') || ''}
            onValueChange={(value) => setValue('contactId', value)}
            disabled={!selectedAccountId || contacts.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="連絡先を選択（任意）" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name} {contact.role && `(${contact.role})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 金額とステージ */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">金額とステージ</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="value">金額（円）</Label>
            <Input
              id="value"
              type="number"
              min="0"
              placeholder="1000000"
              {...register('value', { valueAsNumber: true })}
            />
            {errors.value && (
              <p className="text-sm text-destructive">{errors.value.message}</p>
            )}
          </div>

          {/* ステージ */}
          <div className="space-y-2">
            <Label>ステージ</Label>
            <Select
              value={selectedStage}
              onValueChange={(value) => setValue('stage', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="ステージを選択" />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                      {stage.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 成約確率 */}
          <div className="space-y-2">
            <Label htmlFor="probability">成約確率（%）</Label>
            <Input
              id="probability"
              type="number"
              min="0"
              max="100"
              {...register('probability', { valueAsNumber: true })}
            />
            {errors.probability && (
              <p className="text-sm text-destructive">{errors.probability.message}</p>
            )}
          </div>

          {/* 予定クローズ日 */}
          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">予定クローズ日</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              {...register('expectedCloseDate')}
            />
          </div>
        </div>
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <Label htmlFor="description">説明・メモ</Label>
        <textarea
          id="description"
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="この案件についての詳細や特記事項..."
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
