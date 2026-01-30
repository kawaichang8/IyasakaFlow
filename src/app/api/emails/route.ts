import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { emailSchema, sendEmailSchema } from '@/lib/validations/email';
import { getEmailService } from '@/lib/email';
import { Prisma } from '@prisma/client';

/**
 * GET /api/emails
 * メール一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータの取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const accountId = searchParams.get('accountId') || '';
    const contactId = searchParams.get('contactId') || '';
    const dealId = searchParams.get('dealId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // WHERE条件を構築
    const where: Prisma.EmailWhereInput = {};
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { toAddresses: { hasSome: [search] } },
      ];
    }
    
    if (status) {
      where.status = status.toUpperCase() as any;
    }
    
    if (accountId) {
      where.accountId = accountId;
    }
    
    if (contactId) {
      where.contactId = contactId;
    }
    
    if (dealId) {
      where.dealId = dealId;
    }
    
    // 総件数を取得
    const total = await prisma.email.count({ where });
    
    // データを取得
    const emails = await prisma.email.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // レスポンス用にデータを整形
    const formattedEmails = emails.map((email) => ({
      id: email.id,
      subject: email.subject,
      body: email.body,
      bodyHtml: email.bodyHtml,
      toAddresses: email.toAddresses,
      ccAddresses: email.ccAddresses,
      bccAddresses: email.bccAddresses,
      fromAddress: email.fromAddress,
      fromName: email.fromName,
      replyTo: email.replyTo,
      status: email.status.toLowerCase(),
      sentAt: email.sentAt?.toISOString() || null,
      scheduledAt: email.scheduledAt?.toISOString() || null,
      openedAt: email.openedAt?.toISOString() || null,
      clickedAt: email.clickedAt?.toISOString() || null,
      bouncedAt: email.bouncedAt?.toISOString() || null,
      bounceReason: email.bounceReason,
      template: email.template,
      account: email.account,
      contact: email.contact,
      deal: email.deal,
      createdBy: email.createdBy,
      createdAt: email.createdAt.toISOString(),
      updatedAt: email.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({
      data: formattedEmails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'メールの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails
 * 新規メールを作成（下書き保存または送信）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body; // 'draft' | 'send'
    
    // TODO: 認証から取得
    const userId = body.userId || 'demo-user-id';
    const userEmail = body.userEmail || 'demo@example.com';
    const userName = body.userName || 'Demo User';
    
    if (action === 'send') {
      // 送信の場合はsendEmailSchemaでバリデーション
      const validatedData = sendEmailSchema.parse(body);
      
      // メールサービスで送信
      const emailService = getEmailService();
      
      // テンプレート変数の置換
      let subject = validatedData.subject;
      let bodyText = validatedData.body;
      let bodyHtml = validatedData.bodyHtml;
      
      if (validatedData.variables) {
        subject = emailService.replaceVariables(subject, validatedData.variables);
        bodyText = emailService.replaceVariables(bodyText, validatedData.variables);
        if (bodyHtml) {
          bodyHtml = emailService.replaceVariables(bodyHtml, validatedData.variables);
        }
      }
      
      const toAddresses = Array.isArray(validatedData.to) ? validatedData.to : [validatedData.to];
      const ccAddresses = validatedData.cc 
        ? (Array.isArray(validatedData.cc) ? validatedData.cc : [validatedData.cc])
        : [];
      const bccAddresses = validatedData.bcc 
        ? (Array.isArray(validatedData.bcc) ? validatedData.bcc : [validatedData.bcc])
        : [];
      
      // メール送信
      const result = await emailService.send({
        to: toAddresses,
        cc: ccAddresses.length > 0 ? ccAddresses : undefined,
        bcc: bccAddresses.length > 0 ? bccAddresses : undefined,
        subject,
        text: bodyText,
        html: bodyHtml,
        replyTo: validatedData.replyTo,
        from: {
          email: userEmail,
          name: userName,
        },
      });
      
      // DBに保存
      const newEmail = await prisma.email.create({
        data: {
          subject,
          body: bodyText,
          bodyHtml: bodyHtml || null,
          toAddresses,
          ccAddresses,
          bccAddresses,
          fromAddress: userEmail,
          fromName: userName,
          replyTo: validatedData.replyTo || null,
          status: result.success ? 'SENT' : 'FAILED',
          sentAt: result.success ? new Date() : null,
          templateId: validatedData.templateId || null,
          accountId: validatedData.accountId || null,
          contactId: validatedData.contactId || null,
          dealId: validatedData.dealId || null,
          createdById: userId,
          metadata: result.messageId ? { messageId: result.messageId } : {},
        },
        include: {
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true, email: true } },
        },
      });
      
      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error || 'メール送信に失敗しました',
            data: {
              id: newEmail.id,
              status: 'failed',
            },
          },
          { status: 500 }
        );
      }
      
      // インタラクションとして記録
      if (validatedData.accountId || validatedData.contactId || validatedData.dealId) {
        await prisma.interaction.create({
          data: {
            type: 'EMAIL',
            subject,
            note: bodyText.substring(0, 500),
            date: new Date(),
            accountId: validatedData.accountId || null,
            contactId: validatedData.contactId || null,
            dealId: validatedData.dealId || null,
            createdById: userId,
          },
        });
      }
      
      return NextResponse.json(
        { 
          data: {
            id: newEmail.id,
            status: 'sent',
            messageId: result.messageId,
          },
          message: 'メールを送信しました' 
        },
        { status: 201 }
      );
    } else {
      // 下書き保存
      const validatedData = emailSchema.parse(body);
      
      const newEmail = await prisma.email.create({
        data: {
          subject: validatedData.subject || '',
          body: validatedData.body || '',
          bodyHtml: validatedData.bodyHtml || null,
          toAddresses: validatedData.toAddresses || [],
          ccAddresses: validatedData.ccAddresses || [],
          bccAddresses: validatedData.bccAddresses || [],
          fromAddress: userEmail,
          fromName: userName,
          replyTo: validatedData.replyTo || null,
          status: validatedData.scheduledAt ? 'SCHEDULED' : 'DRAFT',
          scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
          templateId: validatedData.templateId || null,
          accountId: validatedData.accountId || null,
          contactId: validatedData.contactId || null,
          dealId: validatedData.dealId || null,
          createdById: userId,
        },
      });
      
      return NextResponse.json(
        { 
          data: {
            id: newEmail.id,
            status: newEmail.status.toLowerCase(),
          },
          message: '下書きを保存しました' 
        },
        { status: 201 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating email:', error);
    return NextResponse.json(
      { error: 'メールの作成に失敗しました' },
      { status: 500 }
    );
  }
}
