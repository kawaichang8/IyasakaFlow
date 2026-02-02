'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Send, Save, FileText, Plus } from 'lucide-react';
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
import { sendEmailSchema, type SendEmailFormData } from '@/lib/validations/email';
import { useSendEmail, useSaveDraft, useEmailTemplates } from '@/hooks/use-emails';
import { useAccounts } from '@/hooks/use-accounts';
import { useContacts } from '@/hooks/use-contacts';
import { toast } from 'sonner';

interface EmailComposeProps {
  open: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultAccountId?: string;
  defaultContactId?: string;
  defaultDealId?: string;
}

/**
 * メール作成ダイアログ
 */
export function EmailCompose({
  open,
  onClose,
  defaultTo,
  defaultAccountId,
  defaultContactId,
  defaultDealId,
}: EmailComposeProps) {
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const sendMutation = useSendEmail();
  const saveDraftMutation = useSaveDraft();
  const { data: templatesData } = useEmailTemplates({ isActive: true });
  const { data: accountsData } = useAccounts({ limit: 100 });
  const { data: contactsData } = useContacts({ limit: 100 });

  const templates = templatesData?.data || [];
  const accounts = accountsData?.data || [];
  const contacts = contactsData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendEmailFormData>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: {
      to: defaultTo || '',
      subject: '',
      body: '',
      accountId: defaultAccountId,
      contactId: defaultContactId,
      dealId: defaultDealId,
    },
  });

  const watchAccountId = watch('accountId');

  // テンプレート選択時に内容を適用
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (template) {
        setValue('subject', template.subject);
        setValue('body', template.body);
      }
    }
  }, [selectedTemplate, templates, setValue]);

  // ダイアログが閉じたらリセット
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedTemplate('');
      setShowCc(false);
      setShowBcc(false);
    }
  }, [open, reset]);

  const onSubmit = async (data: SendEmailFormData) => {
    try {
      await sendMutation.mutateAsync(data);
      toast.success('メールを送信しました');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'メール送信に失敗しました');
    }
  };

  const handleSaveDraft = async () => {
    const data = watch();
    try {
      await saveDraftMutation.mutateAsync({
        subject: data.subject,
        body: data.body,
        toAddresses: data.to ? (Array.isArray(data.to) ? data.to : [data.to]) : [],
        ccAddresses: data.cc ? (Array.isArray(data.cc) ? data.cc : [data.cc]) : [],
        bccAddresses: data.bcc ? (Array.isArray(data.bcc) ? data.bcc : [data.bcc]) : [],
        accountId: data.accountId,
        contactId: data.contactId,
        dealId: data.dealId,
      });
      toast.success('下書きを保存しました');
      onClose();
    } catch (error) {
      toast.error('下書きの保存に失敗しました');
    }
  };

  // 連絡先選択時にメールアドレスを自動入力
  const handleContactChange = (contactId: string) => {
    setValue('contactId', contactId);
    const contact = contacts.find((c) => c.id === contactId);
    if (contact?.email) {
      setValue('to', contact.email);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規メール作成</DialogTitle>
          <DialogDescription>
            メールを作成して送信します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* テンプレート選択 */}
          <div className="space-y-2">
            <Label>テンプレート</Label>
            <Select value={selectedTemplate || '__none__'} onValueChange={(v) => setSelectedTemplate(v === '__none__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="テンプレートを選択..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">テンプレートなし</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 関連先 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>企業アカウント</Label>
              <Select
                value={watchAccountId || '__none__'}
                onValueChange={(v) => setValue('accountId', v === '__none__' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択..." />
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
            <div className="space-y-2">
              <Label>連絡先</Label>
              <Select
                value={watch('contactId') || '__none__'}
                onValueChange={(v) => handleContactChange(v === '__none__' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">なし</SelectItem>
                  {contacts
                    .filter((c) => !watchAccountId || c.accountId === watchAccountId)
                    .map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                        {contact.email && (
                          <span className="ml-2 text-muted-foreground">
                            ({contact.email})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 宛先 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="to">宛先 *</Label>
              <div className="flex gap-2">
                {!showCc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCc(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    CC
                  </Button>
                )}
                {!showBcc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBcc(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    BCC
                  </Button>
                )}
              </div>
            </div>
            <Input
              id="to"
              type="email"
              placeholder="example@email.com"
              {...register('to')}
            />
            {errors.to && (
              <p className="text-sm text-destructive">{errors.to.message}</p>
            )}
          </div>

          {/* CC */}
          {showCc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cc">CC</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setShowCc(false);
                    setValue('cc', undefined);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="cc"
                type="email"
                placeholder="cc@email.com"
                {...register('cc')}
              />
            </div>
          )}

          {/* BCC */}
          {showBcc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bcc">BCC</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setShowBcc(false);
                    setValue('bcc', undefined);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="bcc"
                type="email"
                placeholder="bcc@email.com"
                {...register('bcc')}
              />
            </div>
          )}

          {/* 件名 */}
          <div className="space-y-2">
            <Label htmlFor="subject">件名 *</Label>
            <Input
              id="subject"
              placeholder="件名を入力..."
              {...register('subject')}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          {/* 本文 */}
          <div className="space-y-2">
            <Label htmlFor="body">本文 *</Label>
            <Textarea
              id="body"
              placeholder="メール本文を入力..."
              rows={10}
              {...register('body')}
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saveDraftMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              下書き保存
            </Button>
            <Button type="submit" disabled={isSubmitting || sendMutation.isPending}>
              <Send className="mr-2 h-4 w-4" />
              送信
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
