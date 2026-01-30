'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  emailTemplateSchema,
  type EmailTemplateFormData,
  TEMPLATE_CATEGORIES,
} from '@/lib/validations/email';
import {
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
} from '@/hooks/use-emails';
import { toast } from 'sonner';

interface TemplateFormProps {
  open: boolean;
  onClose: () => void;
  template?: {
    id: string;
    name: string;
    subject: string;
    body: string;
    bodyHtml?: string;
    category?: string;
    tags: string[];
    variables: string[];
    isActive: boolean;
    isDefault: boolean;
  };
}

/**
 * テンプレート作成・編集フォーム
 */
export function TemplateForm({ open, onClose, template }: TemplateFormProps) {
  const isEditing = !!template;

  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate(template?.id || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: '',
      subject: '',
      body: '',
      category: '',
      isActive: true,
      isDefault: false,
    },
  });

  // テンプレート編集時に値を設定
  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        subject: template.subject,
        body: template.body,
        bodyHtml: template.bodyHtml,
        category: template.category || '',
        isActive: template.isActive,
        isDefault: template.isDefault,
      });
    } else {
      reset({
        name: '',
        subject: '',
        body: '',
        category: '',
        isActive: true,
        isDefault: false,
      });
    }
  }, [template, reset]);

  const onSubmit = async (data: EmailTemplateFormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
        toast.success('テンプレートを更新しました');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('テンプレートを作成しました');
      }
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'テンプレートの保存に失敗しました'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'テンプレート編集' : '新規テンプレート作成'}
          </DialogTitle>
          <DialogDescription>
            メールテンプレートを{isEditing ? '編集' : '作成'}します。
            変数は {`{{変数名}}`} の形式で指定してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* テンプレート名 */}
          <div className="space-y-2">
            <Label htmlFor="name">テンプレート名 *</Label>
            <Input
              id="name"
              placeholder="例: 初回挨拶メール"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* カテゴリ */}
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <Select
              value={watch('category') || '__none__'}
              onValueChange={(v) => setValue('category', v === '__none__' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">なし</SelectItem>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 件名 */}
          <div className="space-y-2">
            <Label htmlFor="subject">件名 *</Label>
            <Input
              id="subject"
              placeholder="例: 【{{company}}様】ご挨拶"
              {...register('subject')}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              変数例: {`{{company}}`}, {`{{name}}`}
            </p>
          </div>

          {/* 本文 */}
          <div className="space-y-2">
            <Label htmlFor="body">本文 *</Label>
            <Textarea
              id="body"
              placeholder={`例:
{{name}}様

お世話になっております。
{{company}}の{{sender_name}}です。

...`}
              rows={12}
              {...register('body')}
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              利用可能な変数: {`{{name}}`}, {`{{company}}`}, {`{{email}}`},{' '}
              {`{{sender_name}}`} など
            </p>
          </div>

          {/* 設定 */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>有効</Label>
              <p className="text-sm text-muted-foreground">
                無効にするとテンプレート選択に表示されません
              </p>
            </div>
            <Switch
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>デフォルト</Label>
              <p className="text-sm text-muted-foreground">
                メール作成時に最初に選択されます
              </p>
            </div>
            <Switch
              checked={watch('isDefault')}
              onCheckedChange={(checked) => setValue('isDefault', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
