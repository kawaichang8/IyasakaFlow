import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { dealSchema } from '@/lib/validations/deal';
import { Prisma } from '@prisma/client';

/**
 * GET /api/deals
 * 取引一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータの取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const accountId = searchParams.get('accountId') || '';
    const stage = searchParams.get('stage') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // WHERE条件を構築
    const where: Prisma.DealWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { account: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    if (accountId) {
      where.accountId = accountId;
    }
    
    if (stage) {
      where.stage = stage.toUpperCase() as any;
    }
    
    // 総件数を取得
    const total = await prisma.deal.count({ where });
    
    // データを取得
    const deals = await prisma.deal.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            interactions: true,
            tasks: true,
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
    const formattedDeals = deals.map((deal) => ({
      id: deal.id,
      name: deal.name,
      value: Number(deal.value),
      currency: deal.currency,
      stage: deal.stage.toLowerCase(),
      probability: deal.probability,
      expectedCloseDate: deal.expectedCloseDate?.toISOString() || null,
      actualCloseDate: deal.actualCloseDate?.toISOString() || null,
      description: deal.description,
      tags: deal.tags,
      account: deal.account,
      contact: deal.contact,
      owner: deal.owner,
      interactionCount: deal._count.interactions,
      taskCount: deal._count.tasks,
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({
      data: formattedDeals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: '取引の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deals
 * 新規取引を作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = dealSchema.parse(body);
    
    // アカウントの存在確認
    const account = await prisma.account.findUnique({
      where: { id: validatedData.accountId },
    });
    
    if (!account) {
      return NextResponse.json(
        { error: '指定された企業アカウントが見つかりません' },
        { status: 400 }
      );
    }
    
    // ステージをenumに変換
    const stageMap: Record<string, 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST'> = {
      lead: 'LEAD',
      qualified: 'QUALIFIED',
      proposal: 'PROPOSAL',
      negotiation: 'NEGOTIATION',
      closed_won: 'CLOSED_WON',
      closed_lost: 'CLOSED_LOST',
    };
    
    // 取引を作成
    const newDeal = await prisma.deal.create({
      data: {
        name: validatedData.name,
        accountId: validatedData.accountId,
        contactId: validatedData.contactId || null,
        value: BigInt(validatedData.value),
        currency: validatedData.currency,
        stage: stageMap[validatedData.stage] || 'LEAD',
        probability: validatedData.probability,
        expectedCloseDate: validatedData.expectedCloseDate 
          ? new Date(validatedData.expectedCloseDate) 
          : null,
        description: validatedData.description || null,
        tags: validatedData.tags || [],
        ownerId: validatedData.ownerId || null,
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
      },
    });
    
    // レスポンス用に整形
    const responseData = {
      id: newDeal.id,
      name: newDeal.name,
      value: Number(newDeal.value),
      stage: newDeal.stage.toLowerCase(),
      account: newDeal.account,
      contact: newDeal.contact,
      createdAt: newDeal.createdAt.toISOString(),
    };
    
    return NextResponse.json(
      { data: responseData, message: '取引を作成しました' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: '取引の作成に失敗しました' },
      { status: 500 }
    );
  }
}
