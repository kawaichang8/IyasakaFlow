import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CampaignFormData } from '@/lib/validations/campaign';

const CAMPAIGNS_QUERY_KEY = 'campaigns';

export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  targetSegment?: Record<string, unknown>;
  templateId?: string | null;
  template?: { id: string; name: string } | null;
  tags: string[];
  createdBy?: { id: string; name: string } | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignsResponse {
  data: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CampaignFilters {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * キャンペーン一覧を取得
 */
export function useCampaigns(params?: CampaignFilters) {
  return useQuery<CampaignsResponse>({
    queryKey: [CAMPAIGNS_QUERY_KEY, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.search) searchParams.set('search', params.search);
      if (params?.type) searchParams.set('type', params.type);
      if (params?.status) searchParams.set('status', params.status);

      const response = await fetch(`/api/campaigns?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('キャンペーンの取得に失敗しました');
      }
      return response.json();
    },
  });
}

/**
 * 単一のキャンペーンを取得
 */
export function useCampaign(id: string) {
  return useQuery<{ data: Campaign }>({
    queryKey: [CAMPAIGNS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${id}`);
      if (!response.ok) {
        throw new Error('キャンペーンの取得に失敗しました');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * キャンペーンを作成
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'キャンペーンの作成に失敗しました');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}

/**
 * キャンペーンを更新
 */
export function useUpdateCampaign(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CampaignFormData>) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'キャンペーンの更新に失敗しました');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY, id] });
    },
  });
}

/**
 * キャンペーンを削除
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'キャンペーンの削除に失敗しました');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}
