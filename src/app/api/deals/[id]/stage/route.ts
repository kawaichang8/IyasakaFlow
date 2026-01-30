import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { dealStageUpdateSchema } from '@/lib/validations/deal';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/deals/[id]/stage
 * 取引のステージを更新（Kanbanドラッグ＆ドロップ用）
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // バリデーション
    const { stage } = dealStageUpdateSchema.parse(body);
    
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
    
    // ステージに応じた確率を設定
    const probabilityMap: Record<string, number> = {
      lead: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0,
    };
    
    const updateData: any = {
      stage: stageMap[stage],
      probability: probabilityMap[stage],
    };
    
    // 成約/失注の場合は実際のクローズ日を設定
    if (stage === 'closed_won' || stage === 'closed_lost') {
      updateData.actualCloseDate = new Date();
    }
    
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
    
    return NextResponse.json({
      data: {
        id: updatedDeal.id,
        name: updatedDeal.name,
        stage: updatedDeal.stage.toLowerCase(),
        probability: updatedDeal.probability,
      },
      message: 'ステージを更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating deal stage:', error);
    return NextResponse.json(
      { error: 'ステージの更新に失敗しました' },
      { status: 500 }
    );
  }
}
