/**
 * メール送信サービス
 * Nodemailer（SMTP）またはResend APIに対応
 */

import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  from?: {
    name?: string;
    email: string;
  };
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * メール送信プロバイダーのインターフェース
 */
interface EmailProvider {
  send(options: EmailOptions): Promise<EmailResult>;
}

/**
 * Nodemailer（SMTP）プロバイダー
 */
class NodemailerProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const fromEmail = options.from?.email || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
      const fromName = options.from?.name || process.env.SMTP_FROM_NAME || 'CRM App';

      const result = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Nodemailer send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'メール送信に失敗しました',
      };
    }
  }
}

/**
 * Resend APIプロバイダー
 */
class ResendProvider implements EmailProvider {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const fromEmail = options.from?.email || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const fromName = options.from?.name || process.env.RESEND_FROM_NAME || 'CRM App';

      const result = await this.resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        replyTo: options.replyTo,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      console.error('Resend send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'メール送信に失敗しました',
      };
    }
  }
}

/**
 * メールサービス（シングルトン）
 */
class EmailService {
  private provider: EmailProvider;

  constructor() {
    // 環境変数でプロバイダーを切り替え
    const providerType = process.env.EMAIL_PROVIDER || 'nodemailer';

    if (providerType === 'resend' && process.env.RESEND_API_KEY) {
      this.provider = new ResendProvider();
      console.log('Email provider: Resend');
    } else {
      this.provider = new NodemailerProvider();
      console.log('Email provider: Nodemailer (SMTP)');
    }
  }

  /**
   * メールを送信
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    return this.provider.send(options);
  }

  /**
   * テンプレート変数を置換
   */
  replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      // {{variable}} 形式をサポート
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }

  /**
   * テンプレートから変数を抽出
   */
  extractVariables(template: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    return variables;
  }
}

// シングルトンインスタンス
let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}

export { EmailService };
