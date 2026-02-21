/**
 * Iyasaka Flow 型定義
 * BtoB向け顧客管理に特化した型定義
 */

// ============================================
// 企業アカウント関連の型
// ============================================

/**
 * 企業アカウント
 * BtoB特化: 企業単位で顧客を管理
 */
export interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  employeeCount?: number;
  annualRevenue?: number;
  /** 取引先種別（顧客・下請け・外注・フリーランス等） */
  accountType?: AccountType | null;
  status: AccountStatus;
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  ownerId?: string;
  parentAccountId?: string;
  /** 最終活動日（直近インタラクション日） */
  lastActivityAt?: string | null;
  /** 直近の反応・アウトカム */
  lastOutcome?: string | null;
  /** 直近のネクストアクション */
  nextAction?: string | null;
  /** ネクストアクション予定日 */
  nextActionDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 取引先種別 */
export type AccountType =
  | 'customer'       // 顧客
  | 'prospect'      // 見込み
  | 'subcontractor' // 下請け
  | 'outsource'     // 外注先
  | 'freelancer'    // フリーランス・個人
  | 'partner'       // パートナー
  | 'other';        // その他

/**
 * アカウントステータス
 */
export type AccountStatus =
  | 'prospect'
  | 'trial'
  | 'customer'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'churned'
  | 'partner';

/**
 * アカウント詳細（連絡先・取引含む）
 */
export interface AccountWithRelations extends Account {
  contacts: Contact[];
  deals: Deal[];
  interactions: Interaction[];
  contactCount: number;
  dealCount: number;
  totalDealValue: number;
}

// ============================================
// 連絡先関連の型
// ============================================

/**
 * 連絡先（担当者）
 */
export interface Contact {
  id: string;
  accountId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  role?: string;
  department?: string;
  company?: string;
  influenceLevel?: InfluenceLevel;
  status: ContactStatus;
  tags?: string[];
  notes?: string;
  socialProfiles?: SocialProfiles;
  customFields?: Record<string, any>;
  ownerId?: string;
  lastContactDate?: string;
  /** 直近の反応・アウトカム */
  lastOutcome?: string | null;
  /** 直近のネクストアクション */
  nextAction?: string | null;
  /** ネクストアクション予定日 */
  nextActionDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 連絡先の影響力レベル
 * BtoB特化: 意思決定プロセスでの役割
 */
export type InfluenceLevel = 
  | 'decision_maker'  // 意思決定者
  | 'influencer'      // 影響者
  | 'user'            // ユーザー
  | 'gatekeeper'      // ゲートキーパー
  | 'other';          // その他

/**
 * 連絡先ステータス
 */
export type ContactStatus = 
  | 'active'      // アクティブ
  | 'inactive'    // 非アクティブ
  | 'bounced';    // メール不達

/**
 * SNSプロファイル
 */
export interface SocialProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
}

/**
 * 連絡先詳細（所属企業・インタラクション含む）
 */
export interface ContactWithRelations extends Contact {
  account?: Account;
  interactions: Interaction[];
}

// ============================================
// 取引（Deal）関連の型
// ============================================

/**
 * 取引/案件
 */
export interface Deal {
  id: string;
  accountId: string;
  contactId?: string;
  name: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  description?: string;
  tags?: string[];
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 取引ステージ
 * パイプライン管理用
 */
export type DealStage = 
  | 'lead'          // リード
  | 'qualified'     // 見込み評価済み
  | 'proposal'      // 提案
  | 'negotiation'   // 交渉
  | 'closed_won'    // 成約
  | 'closed_lost';  // 失注

// ============================================
// 案件（Opportunity / SFA）関連の型
// ============================================

/**
 * 案件ステージ（SFA Kanban用）
 */
export type OpportunityStage =
  | 'lead'         // リード
  | 'proposal'     // 提案
  | 'negotiation'  // 交渉
  | 'won'          // 成約
  | 'lost';        // 失注

/**
 * 案件
 */
export interface Opportunity {
  id: string;
  name: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  expectedCloseDate?: string | null;
  notes?: string | null;
  accountId: string;
  contactId?: string | null;
  ownerId?: string | null;
  account?: { id: string; name: string };
  contact?: { id: string; name: string } | null;
  owner?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// インタラクション（活動履歴）関連の型
// ============================================

/**
 * インタラクション（営業活動履歴）
 */
export interface Interaction {
  id: string;
  accountId?: string;
  contactId?: string;
  dealId?: string;
  type: InteractionType;
  subject?: string;
  note?: string;
  date: string;
  duration?: number;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * インタラクションタイプ
 */
export type InteractionType = 
  | 'call'      // 電話
  | 'email'     // メール
  | 'meeting'   // ミーティング
  | 'note'      // メモ
  | 'task';     // タスク

// ============================================
// タスク関連の型
// ============================================

/**
 * タスク
 */
export interface Task {
  id: string;
  accountId?: string;
  contactId?: string;
  dealId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * タスク優先度
 */
export type TaskPriority = 
  | 'low'       // 低
  | 'medium'    // 中
  | 'high'      // 高
  | 'urgent';   // 緊急

/**
 * タスクステータス
 */
export type TaskStatus = 
  | 'pending'       // 未着手
  | 'in_progress'   // 進行中
  | 'completed'     // 完了
  | 'cancelled';    // キャンセル

// ============================================
// メール関連の型
// ============================================

/**
 * メールステータス
 */
export type EmailStatus =
  | 'draft'       // 下書き
  | 'scheduled'   // 予約済み
  | 'sending'     // 送信中
  | 'sent'        // 送信済み
  | 'delivered'   // 配信済み
  | 'opened'      // 開封済み
  | 'clicked'     // クリック済み
  | 'bounced'     // バウンス
  | 'failed';     // 失敗

/**
 * メール
 */
export interface Email {
  id: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  toAddresses: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  fromAddress: string;
  fromName?: string;
  replyTo?: string;
  status: EmailStatus;
  sentAt?: string;
  scheduledAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  bounceReason?: string;
  templateId?: string;
  accountId?: string;
  contactId?: string;
  dealId?: string;
  createdById: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * メール（リレーション含む）
 */
export interface EmailWithRelations extends Email {
  template?: EmailTemplate;
  account?: { id: string; name: string };
  contact?: { id: string; name: string; email?: string };
  deal?: { id: string; name: string };
  createdBy?: { id: string; name: string };
}

/**
 * メールテンプレート
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  category?: string;
  tags?: string[];
  variables?: string[];
  isActive: boolean;
  isDefault: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * メール送信リクエスト
 */
export interface SendEmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  replyTo?: string;
  templateId?: string;
  accountId?: string;
  contactId?: string;
  dealId?: string;
  scheduledAt?: string;
  variables?: Record<string, string>;
}

// ============================================
// キャンペーン関連の型
// ============================================

/**
 * キャンペーン種別
 */
export type CampaignType = 'email' | 'event' | 'landing' | 'other';

/**
 * キャンペーンステータス
 */
export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'completed'
  | 'cancelled';

/**
 * ターゲットセグメント
 */
export interface CampaignTargetSegment {
  accountIds?: string[];
  contactIds?: string[];
  filters?: Record<string, unknown>;
}

/**
 * キャンペーン
 */
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  targetSegment?: CampaignTargetSegment;
  templateId?: string;
  tags?: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * キャンペーン（リレーション含む）
 */
export interface CampaignWithRelations extends Campaign {
  template?: { id: string; name: string };
  createdBy?: { id: string; name: string };
}

// ============================================
// ユーザー関連の型
// ============================================

/**
 * ユーザー
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * ユーザーロール（RBAC）
 */
export type UserRole = 
  | 'admin'     // 管理者
  | 'manager'   // マネージャー
  | 'member'    // メンバー
  | 'viewer';   // 閲覧者

// ============================================
// API関連の型
// ============================================

/**
 * ページネーションレスポンス
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * APIレスポンス
 */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

/**
 * クエリパラメータ
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}
