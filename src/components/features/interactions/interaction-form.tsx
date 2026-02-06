'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, Mail, Users, FileText, CheckSquare } from 'lucide-react';
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
import { 
  interactionSchema, 
  INTERACTION_TYPES,
  type InteractionFormData 
} from '@/lib/validations/interaction';

interface InteractionFormProps {
  initialData?: Partial<InteractionFormData>;
  accountId?: string;
  contactId?: string;
  dealId?: string;
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
}

interface Deal {
  id: string;
  name: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
};

/**
 * 活動記録フォーム
 */
export function InteractionForm({ 
  initialData, 
  accountId, 
  contactId, 
  dealId, 
  onSuccess, 
  onCancel 
}: InteractionFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 現在の日時をデフォルトに
  const now = new Date();
  const defaultDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: 'call',
      subject: '',
      note: '',
      date: defaultDateTime,
      duration: undefined,
      outcome: '',
      nextAction: '',
      nextActionDate: '',
      accountId: accountId || '',
      contactId: contactId || '',
      dealId: dealId || '',
      ...initialData,
    },
  });

  const selectedType = watch('type');
  const selectedAccountId = watch('accountId');

  // データを取得
  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsRes, dealsRes] = await Promise.all([
          fetch('/api/accounts?limit=100'),
          fetch('/api/deals?limit=100'),
        ]);
        
        const accountsData = await accountsRes.json();
        const dealsData = await dealsRes.json();
        
        setAccounts(accountsData.data || []);
        setDeals(dealsData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // アカウント選択時に連絡先を取得
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

  const onSubmit = async (data: InteractionFormData) => {
    try {
      const response = await fetch('/api/interactions', {
        method: initialData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving interaction:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 活動タイプ選択 */}
      <div className="space-y-2">
        <Label>活動タイプ <span className="text-destructive">*</span></Label>
        <div className="grid grid-cols-5 gap-2">
          {INTERACTION_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setValue('type', type.value as any)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-all ${
                selectedType === type.value
                  ? 'border-primary bg-primary/10 ring-2 ring-primary'
                  : 'hover:border-muted-foreground/50'
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${type.color}`}>
                {typeIcons[type.value]}
              </div>
              <span className="text-xs font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 件名 */}
      <div className="space-y-2">
        <Label htmlFor="subject">件名</Label>
        <Input
          id="subject"
          placeholder={
            selectedType === 'call' ? '例: フォローアップ電話' :
            selectedType === 'email' ? '例: 資料送付のお礼' :
            selectedType === 'meeting' ? '例: 初回ミーティング' :
            '例: 打ち合わせメモ'
          }
          {...register('subject')}
        />
        {errors.subject && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      {/* 日時と所要時間 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">日時 <span className="text-destructive">*</span></Label>
          <Input
            id="date"
            type="datetime-local"
            {...register('date')}
          />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>

        {(selectedType === 'call' || selectedType === 'meeting') && (
          <div className="space-y-2">
            <Label htmlFor="duration">所要時間（分）</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              placeholder="30"
              {...register('duration', { valueAsNumber: true })}
            />
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="space-y-2">
        <Label htmlFor="note">内容 <span className="text-destructive">*</span></Label>
        <textarea
          id="note"
          rows={5}
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={
            selectedType === 'call' ? '通話の内容を記録...\n\n・話した内容\n・相手の反応\n・次のアクション' :
            selectedType === 'email' ? 'メールのやり取りの要約...' :
            selectedType === 'meeting' ? 'ミーティングの議事録...\n\n・参加者\n・議題\n・決定事項\n・次のステップ' :
            '活動の詳細を記録...'
          }
          {...register('note')}
        />
        {errors.note && (
          <p className="text-sm text-destructive">{errors.note.message}</p>
        )}
      </div>

      {/* 結果/アウトカム（反応のありなし・相手の反応） */}
      <div className="space-y-2">
        <Label htmlFor="outcome">結果・アウトカム（相手の反応を一言で）</Label>
        <Input
          id="outcome"
          placeholder="例: 好感触、要フォロー、反応なし、次回提案予定"
          {...register('outcome')}
        />
        <p className="text-xs text-muted-foreground">記録しておくと一覧で「反応」が一目で分かります</p>
      </div>
      {/* アウトカムのクイック入力 */}
      <div className="flex flex-wrap gap-2">
        <span className="w-full text-xs text-muted-foreground">クイック:</span>
        {[
          { label: '好感触', value: '好感触' },
          { label: '要フォロー', value: '要フォロー' },
          { label: '反応あり', value: '反応あり' },
          { label: '反応なし', value: '反応なし' },
          { label: '次回コール予定', value: '次回コール予定' },
          { label: 'メール送信予定', value: 'メール送信予定' },
          { label: 'ミーティング設定', value: 'ミーティング設定' },
          { label: '提案書送付予定', value: '提案書送付予定' },
        ].map(({ label, value }) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValue('outcome', value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 次のアクション・予定日 */}
      <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nextAction">次のアクション（次にやること）</Label>
          <Input
            id="nextAction"
            placeholder="例: 3日後にフォロー電話"
            {...register('nextAction')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextActionDate">予定日（任意）</Label>
          <Input
            id="nextActionDate"
            type="datetime-local"
            {...register('nextActionDate')}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="w-full text-xs text-muted-foreground">次のアクション クイック:</span>
        {[
          '次回コール',
          'メール送る',
          '提案書送付',
          '見積送付',
          'ミーティング設定',
          '資料送付',
        ].map((action) => (
          <Button
            key={action}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setValue('nextAction', action)}
          >
            {action}
          </Button>
        ))}
      </div>

      {/* 関連エンティティ */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">関連付け</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 企業 */}
          <div className="space-y-2">
            <Label>企業</Label>
            <Select
              value={watch('accountId') || '__none__'}
              onValueChange={(value) => {
                setValue('accountId', value === '__none__' ? '' : value);
                setValue('contactId', ''); // 連絡先をリセット
              }}
              disabled={isLoadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder="企業を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">なし</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 連絡先 */}
          <div className="space-y-2">
            <Label>連絡先</Label>
            <Select
              value={watch('contactId') || '__none__'}
              onValueChange={(value) => setValue('contactId', value === '__none__' ? '' : value)}
              disabled={!selectedAccountId || contacts.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="連絡先を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">なし</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 案件 */}
        <div className="space-y-2">
          <Label>関連案件</Label>
          <Select
            value={watch('dealId') || '__none__'}
            onValueChange={(value) => setValue('dealId', value === '__none__' ? '' : value)}
            disabled={isLoadingData}
          >
            <SelectTrigger>
              <SelectValue placeholder="案件を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">なし</SelectItem>
              {deals.map((deal) => (
                <SelectItem key={deal.id} value={deal.id}>
                  {deal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : initialData ? '更新' : '記録'}
        </Button>
      </div>
    </form>
  );
}
