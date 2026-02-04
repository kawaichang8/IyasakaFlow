import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { emailTemplateSchema } from '@/lib/validations/email';
import { getEmailService } from '@/lib/email';
import { Prisma } from '@prisma/client';

/**
 * GET /api/emails/templates
 * メールテンプレート一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータの取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isActive = searchParams.get('isActive');
    
    // WHERE条件を構築
    const where: Prisma.EmailTemplateWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    // 総件数を取得
    const total = await prisma.emailTemplate.count({ where });
    
    // データを取得
    const templates = await prisma.emailTemplate.findMany({
      where,
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
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // レスポンス用にデータを整形
    const formattedTemplates = templates.map((template) => ({
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
    }));
    
    return NextResponse.json({
      data: formattedTemplates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails/templates
 * 新規メールテンプレートを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await auth();
    const userId = session?.user?.id ?? body.userId ?? null;
    if (!userId) {
      return NextResponse.json(
        { error: 'テンプレートの作成にはログインが必要です' },
        { status: 401 }
      );
    }
    
    // バリデーション
    const validatedData = emailTemplateSchema.parse(body);
    
    // テンプレートから変数を自動抽出
    const emailService = getEmailService();
    const extractedVariables = [
      ...emailService.extractVariables(validatedData.subject),
      ...emailService.extractVariables(validatedData.body),
    ];
    const uniqueVariables = [...new Set([
      ...(validatedData.variables || []),
      ...extractedVariables,
    ])];
    
    // isDefaultが設定される場合、他のデフォルトを解除
    if (validatedData.isDefault) {
      await prisma.emailTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    
    // テンプレートを作成
    const newTemplate = await prisma.emailTemplate.create({
      data: {
        name: validatedData.name,
        subject: validatedData.subject,
        body: validatedData.body,
        bodyHtml: validatedData.bodyHtml || null,
        category: validatedData.category || null,
        tags: validatedData.tags || [],
        variables: uniqueVariables,
        isActive: validatedData.isActive ?? true,
        isDefault: validatedData.isDefault ?? false,
        createdById: userId,
      },
    });
    
    return NextResponse.json(
      { 
        data: {
          id: newTemplate.id,
          name: newTemplate.name,
          variables: newTemplate.variables,
        },
        message: 'テンプレートを作成しました' 
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'テンプレートの作成に失敗しました' },
      { status: 500 }
    );
  }
}
