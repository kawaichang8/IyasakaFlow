import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { emailSchema } from '@/lib/validations/email';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/emails/[id]
 * 特定のメールを取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const email = await prisma.email.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            subject: true,
            body: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            email: true,
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
            stage: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!email) {
      return NextResponse.json(
        { error: 'メールが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
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
        metadata: email.metadata,
        createdAt: email.createdAt.toISOString(),
        updatedAt: email.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'メールの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/emails/[id]
 * メールを更新（下書きのみ）
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 既存のメールを確認
    const existingEmail = await prisma.email.findUnique({
      where: { id },
    });

    if (!existingEmail) {
      return NextResponse.json(
        { error: 'メールが見つかりません' },
        { status: 404 }
      );
    }

    // 送信済みは編集不可
    if (existingEmail.status !== 'DRAFT' && existingEmail.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: '送信済みのメールは編集できません' },
        { status: 400 }
      );
    }

    // バリデーション
    const validatedData = emailSchema.partial().parse(body);

    // 更新
    const updatedEmail = await prisma.email.update({
      where: { id },
      data: {
        subject: validatedData.subject,
        body: validatedData.body,
        bodyHtml: validatedData.bodyHtml,
        toAddresses: validatedData.toAddresses,
        ccAddresses: validatedData.ccAddresses,
        bccAddresses: validatedData.bccAddresses,
        replyTo: validatedData.replyTo,
        templateId: validatedData.templateId,
        accountId: validatedData.accountId,
        contactId: validatedData.contactId,
        dealId: validatedData.dealId,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
        status: validatedData.scheduledAt ? 'SCHEDULED' : validatedData.status?.toUpperCase() as any,
      },
    });

    return NextResponse.json({
      data: {
        id: updatedEmail.id,
        status: updatedEmail.status.toLowerCase(),
      },
      message: 'メールを更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'メールの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emails/[id]
 * メールを削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 既存のメールを確認
    const existingEmail = await prisma.email.findUnique({
      where: { id },
    });

    if (!existingEmail) {
      return NextResponse.json(
        { error: 'メールが見つかりません' },
        { status: 404 }
      );
    }

    await prisma.email.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'メールを削除しました',
    });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      { error: 'メールの削除に失敗しました' },
      { status: 500 }
    );
  }
}
