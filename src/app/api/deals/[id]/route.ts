import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { dealSchema } from '@/lib/validations/deal';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/deals/[id]
 * 特定の取引を取得
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
            phone: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            influenceLevel: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        interactions: {
          select: {
            id: true,
            type: true,
            subject: true,
            note: true,
            date: true,
            outcome: true,
            contact: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 20,
        },
        tasks: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            priority: true,
            status: true,
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
        _count: {
          select: {
            interactions: true,
            tasks: true,
          },
        },
      },
    });
    
    if (!deal) {
      return NextResponse.json(
        { error: '取引が見つかりません' },
        { status: 404 }
      );
    }
    
    // レスポンス用に整形
    const responseData = {
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
      contact: deal.contact ? {
        ...deal.contact,
        influenceLevel: deal.contact.influenceLevel.toLowerCase(),
      } : null,
      owner: deal.owner,
      interactions: deal.interactions.map((i) => ({
        ...i,
        type: i.type.toLowerCase(),
        date: i.date.toISOString(),
      })),
      tasks: deal.tasks.map((t) => ({
        ...t,
        priority: t.priority.toLowerCase(),
        status: t.status.toLowerCase(),
        dueDate: t.dueDate?.toISOString() || null,
      })),
      interactionCount: deal._count.interactions,
      taskCount: deal._count.tasks,
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      { error: '取引の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/deals/[id]
 * 取引を更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // 部分バリデーション
    const validatedData = dealSchema.partial().parse(body);
    
    // 既存の取引を確認
    const existingDeal = await prisma.deal.findUnique({
      where: { id },
    });
    
    if (!existingDeal) {
      return NextResponse.json(
        { error: '取引が見つかりません' },
        { status: 404 }
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
    
    // 更新データを構築
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.accountId !== undefined) updateData.accountId = validatedData.accountId;
    if (validatedData.contactId !== undefined) updateData.contactId = validatedData.contactId || null;
    if (validatedData.value !== undefined) updateData.value = BigInt(validatedData.value);
    if (validatedData.currency !== undefined) updateData.currency = validatedData.currency;
    if (validatedData.stage !== undefined) {
      updateData.stage = stageMap[validatedData.stage] || existingDeal.stage;
      
      // 成約/失注の場合は実際のクローズ日を設定
      if (validatedData.stage === 'closed_won' || validatedData.stage === 'closed_lost') {
        updateData.actualCloseDate = new Date();
      }
    }
    if (validatedData.probability !== undefined) updateData.probability = validatedData.probability;
    if (validatedData.expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = validatedData.expectedCloseDate 
        ? new Date(validatedData.expectedCloseDate) 
        : null;
    }
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.ownerId !== undefined) updateData.ownerId = validatedData.ownerId || null;
    
    // 取引を更新
    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // レスポンス用に整形
    const responseData = {
      id: updatedDeal.id,
      name: updatedDeal.name,
      value: Number(updatedDeal.value),
      stage: updatedDeal.stage.toLowerCase(),
      account: updatedDeal.account,
      updatedAt: updatedDeal.updatedAt.toISOString(),
    };
    
    return NextResponse.json({
      data: responseData,
      message: '取引を更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { error: '取引の更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/deals/[id]
 * 取引を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // 既存の取引を確認
    const existingDeal = await prisma.deal.findUnique({
      where: { id },
    });
    
    if (!existingDeal) {
      return NextResponse.json(
        { error: '取引が見つかりません' },
        { status: 404 }
      );
    }
    
    // 取引を削除
    await prisma.deal.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: '取引を削除しました',
    });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { error: '取引の削除に失敗しました' },
      { status: 500 }
    );
  }
}
