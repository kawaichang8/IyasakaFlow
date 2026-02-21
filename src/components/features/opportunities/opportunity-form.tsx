'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreateOpportunity } from '@/hooks/use-opportunities';
import {
  opportunitySchema,
  OPPORTUNITY_STAGES,
  type OpportunityFormData,
} from '@/lib/validations/opportunity';
import { toast } from 'sonner';

interface OpportunityFormProps {
  onSuccess?: () => void;
}

export function OpportunityForm({ onSuccess }: OpportunityFormProps) {
  const createOpp = useCreateOpportunity();
  const { data: accountsData } = useAccounts({ limit: 200 });
  const accounts = accountsData?.data ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      name: '',
      stage: 'lead',
      amount: 0,
      probability: 10,
      notes: '',
    },
  });

  const stage = watch('stage');

  const onSubmit = async (data: OpportunityFormData) => {
    try {
      await createOpp.mutateAsync(data);
      toast.success('案件を作成しました');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || '案件の作成に失敗しました');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 案件名 */}
      <div className="space-y-2">
        <Label>案件名 *</Label>
        <Input {...register('name')} placeholder="例: A社向けWebサイトリニューアル" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* 企業 */}
      <div className="space-y-2">
        <Label>企業 *</Label>
        <Select onValueChange={(v) => setValue('accountId', v)} defaultValue="">
          <SelectTrigger>
            <SelectValue placeholder="企業を選択" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.accountId && <p className="text-xs text-destructive">{errors.accountId.message}</p>}
      </div>

      {/* ステージ */}
      <div className="space-y-2">
        <Label>ステージ</Label>
        <Select
          value={stage}
          onValueChange={(v) => setValue('stage', v as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPPORTUNITY_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 金額 / 確度 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>金額（円）</Label>
          <Input
            type="number"
            min={0}
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>確度（%）</Label>
          <Input
            type="number"
            min={0}
            max={100}
            {...register('probability', { valueAsNumber: true })}
          />
          {errors.probability && <p className="text-xs text-destructive">{errors.probability.message}</p>}
        </div>
      </div>

      {/* 予定クローズ日 */}
      <div className="space-y-2">
        <Label>予定クローズ日</Label>
        <Input type="date" {...register('expectedCloseDate')} />
      </div>

      {/* メモ */}
      <div className="space-y-2">
        <Label>メモ</Label>
        <Textarea rows={3} {...register('notes')} placeholder="案件に関するメモ" />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? '作成中...' : '案件を作成'}
      </Button>
    </form>
  );
}
