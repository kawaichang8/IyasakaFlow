import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { emailTemplateSchema } from '@/lib/validations/email';
import { getEmailService } from '@/lib/email';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/emails/templates/[id]
 * 特定のテンプレートを取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            emails: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: template.id,
        name: template.name,
        subject: template.subject,
        body: template.body,
        bodyHtml: template.bodyHtml,
        category: template.category,
        tags: template.tags,
        variables: template.variables,
        isActive: template.isActive,
        isDefault: template.isDefault,
        createdBy: template.createdBy,
        usageCount: template._count.emails,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/emails/templates/[id]
 * テンプレートを更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 既存のテンプレートを確認
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      );
    }

    // バリデーション
    const validatedData = emailTemplateSchema.partial().parse(body);

    // テンプレートから変数を自動抽出
    const emailService = getEmailService();
    let uniqueVariables = existingTemplate.variables;
    
    if (validatedData.subject || validatedData.body) {
      const extractedVariables = [
        ...emailService.extractVariables(validatedData.subject || existingTemplate.subject),
        ...emailService.extractVariables(validatedData.body || existingTemplate.body),
      ];
      uniqueVariables = [...new Set([
        ...(validatedData.variables || []),
        ...extractedVariables,
      ])];
    }

    // isDefaultが設定される場合、他のデフォルトを解除
    if (validatedData.isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { 
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    // 更新
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name: validatedData.name,
        subject: validatedData.subject,
        body: validatedData.body,
        bodyHtml: validatedData.bodyHtml,
        category: validatedData.category,
        tags: validatedData.tags,
        variables: uniqueVariables,
        isActive: validatedData.isActive,
        isDefault: validatedData.isDefault,
      },
    });

    return NextResponse.json({
      data: {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        variables: updatedTemplate.variables,
      },
      message: 'テンプレートを更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'テンプレートの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emails/templates/[id]
 * テンプレートを削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 既存のテンプレートを確認
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { emails: true },
        },
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      );
    }

    // 使用中のテンプレートは削除不可（オプション）
    // if (existingTemplate._count.emails > 0) {
    //   return NextResponse.json(
    //     { error: '使用中のテンプレートは削除できません' },
    //     { status: 400 }
    //   );
    // }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'テンプレートを削除しました',
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json(
      { error: 'テンプレートの削除に失敗しました' },
      { status: 500 }
    );
  }
}
