'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Send, Save, FileText, Plus, Code, Type, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { getContactSalutationLastName } from '@/lib/contact-name';

/**
 * カンマ区切りの文字列をメールアドレス配列に変換
 */
function parseEmailAddresses(input: string): string[] {
  return input
    .split(/[,;]/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

/**
 * メールアドレス配列を検証
 */
function validateEmailAddresses(emails: string[]): { valid: boolean; invalid: string[] } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalid = emails.filter((email) => !emailRegex.test(email));
  return { valid: invalid.length === 0, invalid };
}

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
  const [useHtmlMode, setUseHtmlMode] = useState(false);
  const [bodyHtml, setBodyHtml] = useState<string>('');
  const [toError, setToError] = useState<string | null>(null);

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
    getValues,
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

  // テンプレート選択時に内容を適用（bodyHtml も含む）
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (template) {
        setValue('subject', template.subject);
        setValue('body', template.body);
        // テンプレートに bodyHtml があれば HTML モードを有効化
        if (template.bodyHtml) {
          setBodyHtml(template.bodyHtml);
          setUseHtmlMode(true);
        }
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
      setUseHtmlMode(false);
      setBodyHtml('');
      setToError(null);
    }
  }, [open, reset]);

  const onSubmit = async (data: SendEmailFormData) => {
    try {
      setToError(null);

      // 宛先をカンマ区切りから配列に変換
      const toStr = typeof data.to === 'string' ? data.to : (data.to as string[]).join(',');
      const toAddresses = parseEmailAddresses(toStr);

      if (toAddresses.length === 0) {
        setToError('宛先を入力してください');
        return;
      }

      // メールアドレスの形式を検証
      const { valid, invalid } = validateEmailAddresses(toAddresses);
      if (!valid) {
        setToError(`無効なメールアドレス: ${invalid.join(', ')}`);
        return;
      }

      // CC/BCC も同様に配列に変換
      const ccStr = typeof data.cc === 'string' ? data.cc : (data.cc as string[] | undefined)?.join(',');
      const ccAddresses = ccStr ? parseEmailAddresses(ccStr) : undefined;
      const bccStr = typeof data.bcc === 'string' ? data.bcc : (data.bcc as string[] | undefined)?.join(',');
      const bccAddresses = bccStr ? parseEmailAddresses(bccStr) : undefined;

      // 送信データを構築（bodyHtml を含む）
      const sendData: SendEmailFormData = {
        ...data,
        to: toAddresses,
        cc: ccAddresses,
        bcc: bccAddresses,
        bodyHtml: useHtmlMode && bodyHtml ? bodyHtml : undefined,
      };

      await sendMutation.mutateAsync(sendData);
      toast.success(`${toAddresses.length}件のメールを送信しました`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'メール送信に失敗しました');
    }
  };

  const handleSaveDraft = async () => {
    const data = watch();
    try {
      // カンマ区切りを配列に変換
      const toStr = typeof data.to === 'string' ? data.to : (data.to as string[])?.join(',') || '';
      const toAddresses = parseEmailAddresses(toStr);
      const ccStr = typeof data.cc === 'string' ? data.cc : (data.cc as string[] | undefined)?.join(',');
      const ccAddresses = ccStr ? parseEmailAddresses(ccStr) : [];
      const bccStr = typeof data.bcc === 'string' ? data.bcc : (data.bcc as string[] | undefined)?.join(',');
      const bccAddresses = bccStr ? parseEmailAddresses(bccStr) : [];

      await saveDraftMutation.mutateAsync({
        subject: data.subject,
        body: data.body,
        bodyHtml: useHtmlMode && bodyHtml ? bodyHtml : undefined,
        toAddresses,
        ccAddresses,
        bccAddresses,
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

  // 連絡先選択時にメールアドレスを自動入力。本文が空なら「姓 様」で挨拶のたたき台を入れる
  const handleContactChange = (contactId: string) => {
    setValue('contactId', contactId || undefined);
    const contact = contacts.find((c) => c.id === contactId);
    if (contact?.email) {
      setValue('to', contact.email);
    }
    if (contact && contactId) {
      const last = getContactSalutationLastName({
        lastName: contact.lastName,
        name: contact.name,
      });
      const body = (getValues('body') as string) ?? '';
      if (last && !body.trim()) {
        setValue('body', `${last} 様\n\n`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新規メール作成</DialogTitle>
          <DialogDescription>
            メールを作成して送信します。連絡先は姓・名で登録されていると、選択時に本文へ「〇〇 様」を入れやすくなります。
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

          {/* 宛先（カンマ区切りで複数入力可能） */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="to">宛先 *</Label>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  カンマ区切りで複数入力可
                </span>
              </div>
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
              type="text"
              placeholder="user1@example.com, user2@example.com"
              {...register('to')}
            />
            {(errors.to || toError) && (
              <p className="text-sm text-destructive">{toError || errors.to?.message}</p>
            )}
          </div>

          {/* CC（カンマ区切りで複数入力可能） */}
          {showCc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="cc">CC</Label>
                  <span className="text-xs text-muted-foreground">カンマ区切りで複数入力可</span>
                </div>
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
                type="text"
                placeholder="cc1@email.com, cc2@email.com"
                {...register('cc')}
              />
            </div>
          )}

          {/* BCC（カンマ区切りで複数入力可能） */}
          {showBcc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="bcc">BCC</Label>
                  <span className="text-xs text-muted-foreground">カンマ区切りで複数入力可</span>
                </div>
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
                type="text"
                placeholder="bcc1@email.com, bcc2@email.com"
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
            <div className="flex items-center justify-between">
              <Label htmlFor="body">本文 *</Label>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {useHtmlMode ? <Code className="h-3 w-3" /> : <Type className="h-3 w-3" />}
                  {useHtmlMode ? 'HTML' : 'テキスト'}
                </span>
                <Switch
                  checked={useHtmlMode}
                  onCheckedChange={setUseHtmlMode}
                  aria-label="HTMLモード切り替え"
                />
              </div>
            </div>
            <Textarea
              id="body"
              placeholder="メール本文を入力..."
              rows={useHtmlMode ? 6 : 10}
              {...register('body')}
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
          </div>

          {/* HTML本文（HTMLモード時のみ表示） */}
          {useHtmlMode && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="bodyHtml">
                  <Code className="mr-1 inline h-4 w-4" />
                  HTML本文
                </Label>
                <span className="text-xs text-muted-foreground">
                  HTMLタグを使用してリッチなメールを作成できます
                </span>
              </div>
              <Textarea
                id="bodyHtml"
                placeholder="<html><body><h1>件名</h1><p>本文...</p></body></html>"
                rows={8}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                ※ テキスト本文はHTML非対応メーラー用のフォールバックとして使用されます
              </p>
            </div>
          )}

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
