import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { campaignSchema } from '@/lib/validations/campaign';
import { requireAuth } from '@/lib/auth';

const typeMap: Record<string, 'EMAIL' | 'EVENT' | 'LANDING' | 'OTHER'> = {
  email: 'EMAIL',
  event: 'EVENT',
  landing: 'LANDING',
  other: 'OTHER',
};

const statusMap: Record<string, 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED'> = {
  draft: 'DRAFT',
  scheduled: 'SCHEDULED',
  running: 'RUNNING',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/[id]
 * キャンペーン詳細を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            subject: true,
            category: true,
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

    if (!campaign) {
      return NextResponse.json(
        { error: 'キャンペーンが見つかりません' },
        { status: 404 }
      );
    }

    const responseData = {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      type: campaign.type.toLowerCase(),
      status: campaign.status.toLowerCase(),
      startDate: campaign.startDate?.toISOString() ?? null,
      endDate: campaign.endDate?.toISOString() ?? null,
      targetSegment: (campaign.targetSegment as object) ?? {},
      templateId: campaign.templateId,
      template: campaign.template,
      tags: campaign.tags,
      createdBy: campaign.createdBy,
      createdById: campaign.createdById,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'キャンペーンの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/campaigns/[id]
 * キャンペーンを更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const validatedData = campaignSchema.partial().parse(body);

    const existing = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'キャンペーンが見つかりません' },
        { status: 404 }
      );
    }

    const updateData: {
      name?: string;
      description?: string | null;
      type?: 'EMAIL' | 'EVENT' | 'LANDING' | 'OTHER';
      status?: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
      startDate?: Date | null;
      endDate?: Date | null;
      targetSegment?: object;
      templateId?: string | null;
      tags?: string[];
    } = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description ?? null;
    if (validatedData.type !== undefined) updateData.type = typeMap[validatedData.type] ?? existing.type;
    if (validatedData.status !== undefined) updateData.status = statusMap[validatedData.status] ?? existing.status;
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    }
    if (validatedData.targetSegment !== undefined) {
      updateData.targetSegment = validatedData.targetSegment as object ?? {};
    }
    if (validatedData.templateId !== undefined) updateData.templateId = validatedData.templateId ?? null;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;

    const updated = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        template: {
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
    });

    const responseData = {
      id: updated.id,
      name: updated.name,
      type: updated.type.toLowerCase(),
      status: updated.status.toLowerCase(),
      template: updated.template,
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({
      data: responseData,
      message: 'キャンペーンを更新しました',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'キャンペーンの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]
 * キャンペーンを削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const existing = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'キャンペーンが見つかりません' },
        { status: 404 }
      );
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'キャンペーンを削除しました',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'キャンペーンの削除に失敗しました' },
      { status: 500 }
    );
  }
}
