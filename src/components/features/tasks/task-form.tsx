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
import { 
  taskSchema, 
  TASK_PRIORITIES, 
  TASK_STATUSES,
  type TaskFormData 
} from '@/lib/validations/task';

interface TaskFormProps {
  initialData?: Partial<TaskFormData>;
  accountId?: string;
  dealId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Account {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

/**
 * タスク作成/編集フォーム
 */
export function TaskForm({ initialData, accountId, dealId, onSuccess, onCancel }: TaskFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      status: 'pending',
      accountId: accountId || '',
      dealId: dealId || '',
      assigneeId: '',
      ...initialData,
    },
  });

  const selectedAccountId = watch('accountId');

  // 初期データを取得
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
        
        // ダミーユーザー（実際は /api/users から取得）
        setUsers([
          { id: '1', name: '管理者' },
          { id: '2', name: '営業 太郎' },
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // アカウントに紐づく案件をフィルタリング
  const filteredDeals = selectedAccountId
    ? deals.filter((d: any) => d.account?.id === selectedAccountId)
    : deals;

  const onSubmit = async (data: TaskFormData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: initialData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  // 明日の日付をデフォルトとして設定するヘルパー
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* タスク名（必須） */}
      <div className="space-y-2">
        <Label htmlFor="title">
          タスク名 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="例: フォローアップの電話をする"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* 説明 */}
      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <textarea
          id="description"
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="タスクの詳細を入力..."
          {...register('description')}
        />
      </div>

      {/* 期限と優先度 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">期限</Label>
          <Input
            id="dueDate"
            type="date"
            {...register('dueDate')}
          />
        </div>

        <div className="space-y-2">
          <Label>優先度</Label>
          <Select
            value={watch('priority')}
            onValueChange={(value) => setValue('priority', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="優先度を選択" />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${priority.color}`} />
                    {priority.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ステータスと担当者 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>ステータス</Label>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ステータスを選択" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <span>{status.icon}</span>
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>担当者</Label>
          <Select
            value={watch('assigneeId') || ''}
            onValueChange={(value) => setValue('assigneeId', value)}
            disabled={users.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="担当者を選択" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 関連エンティティ */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-sm font-medium text-muted-foreground">関連付け（任意）</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 関連企業 */}
          <div className="space-y-2">
            <Label>企業</Label>
            <Select
              value={watch('accountId') || '__none__'}
              onValueChange={(value) => {
                const accountIdVal = value === '__none__' ? '' : value;
                setValue('accountId', accountIdVal);
                // 企業が変わったら案件をリセット
                if (watch('dealId')) {
                  const deal = deals.find((d: any) => d.id === watch('dealId'));
                  if (deal && (deal as any).account?.id !== accountIdVal) {
                    setValue('dealId', '');
                  }
                }
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

          {/* 関連案件 */}
          <div className="space-y-2">
            <Label>案件</Label>
            <Select
              value={watch('dealId') || '__none__'}
              onValueChange={(value) => setValue('dealId', value === '__none__' ? '' : value)}
              disabled={isLoadingData || filteredDeals.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="案件を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">なし</SelectItem>
                {filteredDeals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* クイック設定ボタン */}
      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setValue('dueDate', getTomorrowDate())}
        >
          明日まで
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            setValue('dueDate', nextWeek.toISOString().split('T')[0]);
          }}
        >
          来週まで
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setValue('priority', 'high')}
        >
          高優先度
        </Button>
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
