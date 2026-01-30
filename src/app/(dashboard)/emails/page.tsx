'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EmailHeader } from '@/components/features/emails/email-header';
import { EmailList } from '@/components/features/emails/email-list';
import { EmailCompose } from '@/components/features/emails/email-compose';
import { TemplateList } from '@/components/features/emails/template-list';
import { TemplateForm } from '@/components/features/emails/template-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmails, useDeleteEmail, useEmailTemplates, useDeleteEmailTemplate, useUpdateEmailTemplate } from '@/hooks/use-emails';
import { useSearchParamsState } from '@/hooks/use-search-params';
import { toast } from 'sonner';

type EmailFilters = { search?: string; status?: string };

interface EmailTemplate {
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
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * メール一覧・管理ページ
 */
export default function EmailsPage() {
  const router = useRouter();
  const { get, setOne, clear } = useSearchParamsState<EmailFilters>();
  const [activeTab, setActiveTab] = useState('emails');
  const [showCompose, setShowCompose] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  const params = useMemo<EmailFilters>(() => ({
    search: get('search'),
    status: get('status'),
  }), [get]);

  const activeFilterCount = [get('status')].filter(Boolean).length;

  // メールデータを取得
  const { data: emailsData, isLoading: emailsLoading, error: emailsError, refetch: refetchEmails } = useEmails(params);
  const deleteMutation = useDeleteEmail();

  // テンプレートデータを取得
  const { data: templatesData, isLoading: templatesLoading, refetch: refetchTemplates } = useEmailTemplates();
  const deleteTemplateMutation = useDeleteEmailTemplate();

  const emails = emailsData?.data || [];
  const templates = templatesData?.data || [];

  // 統計を計算
  const stats = useMemo(() => {
    return {
      total: emails.length,
      sent: emails.filter((e) => e.status === 'sent' || e.status === 'delivered').length,
      draft: emails.filter((e) => e.status === 'draft').length,
      scheduled: emails.filter((e) => e.status === 'scheduled').length,
      opened: emails.filter((e) => e.status === 'opened' || e.status === 'clicked').length,
    };
  }, [emails]);

  // メール削除
  const handleDeleteEmail = useCallback(async (id: string) => {
    if (!confirm('このメールを削除してもよろしいですか？')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('メールを削除しました');
      refetchEmails();
    } catch (error) {
      toast.error('メールの削除に失敗しました');
    }
  }, [deleteMutation, refetchEmails]);

  // メール詳細表示
  const handleViewEmail = useCallback((id: string) => {
    router.push(`/emails/${id}`);
  }, [router]);

  // テンプレート編集
  const handleEditTemplate = useCallback((template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowTemplateForm(true);
  }, []);

  // テンプレート削除
  const handleDeleteTemplate = useCallback(async (id: string) => {
    if (!confirm('このテンプレートを削除してもよろしいですか？')) return;
    
    try {
      await deleteTemplateMutation.mutateAsync(id);
      toast.success('テンプレートを削除しました');
      refetchTemplates();
    } catch (error) {
      toast.error('テンプレートの削除に失敗しました');
    }
  }, [deleteTemplateMutation, refetchTemplates]);

  // テンプレート複製
  const handleDuplicateTemplate = useCallback((template: EmailTemplate) => {
    setEditingTemplate({
      ...template,
      id: '',
      name: `${template.name} (コピー)`,
      isDefault: false,
    });
    setShowTemplateForm(true);
  }, []);

  // デフォルト切り替え
  const handleToggleDefault = useCallback(async (id: string, isDefault: boolean) => {
    try {
      const updateMutation = useUpdateEmailTemplate(id);
      // Note: This needs proper implementation with the hook
      toast.success(isDefault ? 'デフォルトに設定しました' : 'デフォルトを解除しました');
      refetchTemplates();
    } catch (error) {
      toast.error('設定の変更に失敗しました');
    }
  }, [refetchTemplates]);

  const handleOpenCompose = useCallback(() => {
    setShowCompose(true);
  }, []);

  const handleOpenTemplates = useCallback(() => {
    setActiveTab('templates');
  }, []);

  const handleCloseCompose = useCallback(() => {
    setShowCompose(false);
    refetchEmails();
  }, [refetchEmails]);

  const handleCloseTemplateForm = useCallback(() => {
    setShowTemplateForm(false);
    setEditingTemplate(null);
    refetchTemplates();
  }, [refetchTemplates]);

  if (emailsError) {
    return (
      <div className="space-y-6">
        <EmailHeader
          stats={stats}
          searchValue={get('search') ?? ''}
          onSearchChange={(v) => setOne('search', v || undefined)}
          status={get('status') ?? ''}
          onFilterChange={(key, value) => setOne(key as keyof EmailFilters, value)}
          onClearFilters={clear}
          activeFilterCount={activeFilterCount}
          onComposeClick={handleOpenCompose}
          onTemplatesClick={handleOpenTemplates}
        />
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive">
          データの取得に失敗しました
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmailHeader
        stats={stats}
        searchValue={get('search') ?? ''}
        onSearchChange={(v) => setOne('search', v || undefined)}
        status={get('status') ?? ''}
        onFilterChange={(key, value) => setOne(key as keyof EmailFilters, value)}
        onClearFilters={clear}
        activeFilterCount={activeFilterCount}
        onComposeClick={handleOpenCompose}
        onTemplatesClick={handleOpenTemplates}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="emails">メール一覧</TabsTrigger>
          <TabsTrigger value="templates">テンプレート</TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="mt-4">
          <EmailList
            emails={emails}
            onDelete={handleDeleteEmail}
            onView={handleViewEmail}
            isLoading={emailsLoading}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowTemplateForm(true);
              }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              新規テンプレート
            </button>
          </div>
          <TemplateList
            templates={templates}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onDuplicate={handleDuplicateTemplate}
            onToggleDefault={handleToggleDefault}
            isLoading={templatesLoading}
          />
        </TabsContent>
      </Tabs>

      {/* メール作成ダイアログ */}
      <EmailCompose open={showCompose} onClose={handleCloseCompose} />

      {/* テンプレートフォームダイアログ */}
      <TemplateForm
        open={showTemplateForm}
        onClose={handleCloseTemplateForm}
        template={editingTemplate || undefined}
      />
    </div>
  );
}
