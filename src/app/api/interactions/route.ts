import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { interactionSchema } from '@/lib/validations/interaction';
import { Prisma } from '@prisma/client';

/**
 * GET /api/interactions
 * インタラクション一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータの取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const accountId = searchParams.get('accountId') || '';
    const contactId = searchParams.get('contactId') || '';
    const dealId = searchParams.get('dealId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // WHERE条件を構築
    const where: Prisma.InteractionWhereInput = {};
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
        { account: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    if (type) {
      where.type = type.toUpperCase() as any;
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
    
    if (dateFrom) {
      where.date = {
        ...((where.date as any) || {}),
        gte: new Date(dateFrom),
      };
    }
    
    if (dateTo) {
      where.date = {
        ...((where.date as any) || {}),
        lte: new Date(dateTo),
      };
    }
    
    // 総件数を取得
    const total = await prisma.interaction.count({ where });
    
    // データを取得
    const interactions = await prisma.interaction.findMany({
      where,
      include: {
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
            stage: true,
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
    const formattedInteractions = interactions.map((interaction) => ({
      id: interaction.id,
      type: interaction.type.toLowerCase(),
      subject: interaction.subject,
      note: interaction.note,
      date: interaction.date.toISOString(),
      duration: interaction.duration,
      outcome: interaction.outcome,
      account: interaction.account,
      contact: interaction.contact,
      deal: interaction.deal ? {
        ...interaction.deal,
        stage: interaction.deal.stage.toLowerCase(),
      } : null,
      createdBy: interaction.createdBy,
      createdAt: interaction.createdAt.toISOString(),
      updatedAt: interaction.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({
      data: formattedInteractions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'インタラクションの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/interactions
 * 新規インタラクションを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = interactionSchema.parse(body);
    
    // タイプをenumに変換
    const typeMap: Record<string, 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK'> = {
      call: 'CALL',
      email: 'EMAIL',
      meeting: 'MEETING',
      note: 'NOTE',
      task: 'TASK',
    };
    
    // インタラクションを作成
    const newInteraction = await prisma.interaction.create({
      data: {
        type: typeMap[validatedData.type] || 'NOTE',
        subject: validatedData.subject || null,
        note: validatedData.note,
        date: new Date(validatedData.date),
        duration: validatedData.duration || null,
        outcome: validatedData.outcome || null,
        accountId: validatedData.accountId || null,
        contactId: validatedData.contactId || null,
        dealId: validatedData.dealId || null,
        createdById: null, // TODO: 認証ユーザーから取得
      },
      include: {
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
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // レスポンス用に整形
    const responseData = {
      id: newInteraction.id,
      type: newInteraction.type.toLowerCase(),
      subject: newInteraction.subject,
      note: newInteraction.note,
      date: newInteraction.date.toISOString(),
      account: newInteraction.account,
      contact: newInteraction.contact,
      deal: newInteraction.deal,
      createdAt: newInteraction.createdAt.toISOString(),
    };
    
    return NextResponse.json(
      { data: responseData, message: '活動を記録しました' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { error: 'インタラクションの作成に失敗しました' },
      { status: 500 }
    );
  }
}
