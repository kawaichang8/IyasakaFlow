import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SendEmailFormData, EmailFormData, EmailTemplateFormData } from '@/lib/validations/email';

/**
 * メール関連のカスタムフック
 */

const EMAILS_QUERY_KEY = 'emails';
const TEMPLATES_QUERY_KEY = 'email-templates';

interface Email {
  id: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  fromAddress: string;
  fromName?: string;
  replyTo?: string;
  status: string;
  sentAt?: string;
  scheduledAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  bounceReason?: string;
  template?: { id: string; name: string };
  account?: { id: string; name: string };
  contact?: { id: string; name: string; email?: string };
  deal?: { id: string; name: string };
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

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
  createdBy?: { id: string; name: string };
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface EmailsResponse {
  data: Email[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TemplatesResponse {
  data: EmailTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface EmailFilters {
  search?: string;
  status?: string;
  accountId?: string;
  contactId?: string;
  dealId?: string;
  page?: number;
  limit?: number;
}

interface TemplateFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ==============================================
// メール関連フック
// ==============================================

/**
 * メール一覧を取得
 */
export function useEmails(params?: EmailFilters) {
  return useQuery<EmailsResponse>({
    queryKey: [EMAILS_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.accountId) searchParams.set('accountId', params.accountId);
      if (params?.contactId) searchParams.set('contactId', params.contactId);
      if (params?.dealId) searchParams.set('dealId', params.dealId);
      
      const response = await fetch(`/api/emails?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('メールの取得に失敗しました');
      }
      
      return response.json();
    },
  });
}

/**
 * 単一のメールを取得
 */
export function useEmail(id: string) {
  return useQuery<{ data: Email }>({
    queryKey: [EMAILS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/emails/${id}`);
      
      if (!response.ok) {
        throw new Error('メールの取得に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * メールを送信
 */
export function useSendEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SendEmailFormData) => {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, action: 'send' }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'メール送信に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
}

/**
 * メールの下書きを保存
 */
export function useSaveDraft() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: EmailFormData) => {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, action: 'draft' }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '下書きの保存に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY] });
    },
  });
}

/**
 * メールを更新
 */
export function useUpdateEmail(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EmailFormData>) => {
      const response = await fetch(`/api/emails/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'メールの更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY, id] });
    },
  });
}

/**
 * メールを削除
 */
export function useDeleteEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/emails/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'メールの削除に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAILS_QUERY_KEY] });
    },
  });
}

// ==============================================
// テンプレート関連フック
// ==============================================

/**
 * テンプレート一覧を取得
 */
export function useEmailTemplates(params?: TemplateFilters) {
  return useQuery<TemplatesResponse>({
    queryKey: [TEMPLATES_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
      
      const response = await fetch(`/api/emails/templates?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('テンプレートの取得に失敗しました');
      }
      
      return response.json();
    },
  });
}

/**
 * 単一のテンプレートを取得
 */
export function useEmailTemplate(id: string) {
  return useQuery<{ data: EmailTemplate }>({
    queryKey: [TEMPLATES_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/emails/templates/${id}`);
      
      if (!response.ok) {
        throw new Error('テンプレートの取得に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * テンプレートを作成
 */
export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: EmailTemplateFormData) => {
      const response = await fetch('/api/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'テンプレートの作成に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
    },
  });
}

/**
 * テンプレートを更新
 */
export function useUpdateEmailTemplate(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<EmailTemplateFormData>) => {
      const response = await fetch(`/api/emails/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'テンプレートの更新に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, id] });
    },
  });
}

/**
 * テンプレートを削除
 */
export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/emails/templates/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'テンプレートの削除に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
    },
  });
}
