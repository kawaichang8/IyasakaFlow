import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { interactionSchema } from '@/lib/validations/interaction';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/interactions/[id]
 * 特定のインタラクションを取得
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const interaction = await prisma.interaction.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
            value: true,
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
    
    if (!interaction) {
      return NextResponse.json(
        { error: '活動が見つかりません' },
        { status: 404 }
      );
    }
    
    // レスポンス用に整形
    const responseData = {
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
        value: Number(interaction.deal.value),
        stage: interaction.deal.stage.toLowerCase(),
      } : null,
      createdBy: interaction.createdBy,
      createdAt: interaction.createdAt.toISOString(),
      updatedAt: interaction.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching interaction:', error);
    return NextResponse.json(
      { error: '活動の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/interactions/[id]
 * インタラクションを更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // 部分バリデーション
    const validatedData = interactionSchema.partial().parse(body);
    
    // 既存のインタラクションを確認
    const existingInteraction = await prisma.interaction.findUnique({
      where: { id },
    });
    
    if (!existingInteraction) {
      return NextResponse.json(
        { error: '活動が見つかりません' },
        { status: 404 }
      );
    }
    
    // タイプをenumに変換
    const typeMap: Record<string, 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK'> = {
      call: 'CALL',
      email: 'EMAIL',
      meeting: 'MEETING',
      note: 'NOTE',
      task: 'TASK',
    };
    
    // 更新データを構築
    const updateData: any = {};
    
    if (validatedData.type !== undefined) {
      updateData.type = typeMap[validatedData.type] || existingInteraction.type;
    }
    if (validatedData.subject !== undefined) updateData.subject = validatedData.subject || null;
    if (validatedData.note !== undefined) updateData.note = validatedData.note;
    if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date);
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration || null;
    if (validatedData.outcome !== undefined) updateData.outcome = validatedData.outcome || null;
    if (validatedData.accountId !== undefined) updateData.accountId = validatedData.accountId || null;
    if (validatedData.contactId !== undefined) updateData.contactId = validatedData.contactId || null;
    if (validatedData.dealId !== undefined) updateData.dealId = validatedData.dealId || null;
    
    // インタラクションを更新
    const updatedInteraction = await prisma.interaction.update({
      where: { id },
      data: updateData,
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
      id: updatedInteraction.id,
      type: updatedInteraction.type.toLowerCase(),
      subject: updatedInteraction.subject,
      account: updatedInteraction.account,
      contact: updatedInteraction.contact,
      updatedAt: updatedInteraction.updatedAt.toISOString(),
    };
    
    return NextResponse.json({
      data: responseData,
      message: '活動を更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating interaction:', error);
    return NextResponse.json(
      { error: '活動の更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/interactions/[id]
 * インタラクションを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // 既存のインタラクションを確認
    const existingInteraction = await prisma.interaction.findUnique({
      where: { id },
    });
    
    if (!existingInteraction) {
      return NextResponse.json(
        { error: '活動が見つかりません' },
        { status: 404 }
      );
    }
    
    // インタラクションを削除
    await prisma.interaction.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: '活動を削除しました',
    });
  } catch (error) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json(
      { error: '活動の削除に失敗しました' },
      { status: 500 }
    );
  }
}
