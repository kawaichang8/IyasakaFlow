import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { campaignSchema } from '@/lib/validations/campaign';
import { requireAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

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

/**
 * GET /api/campaigns
 * キャンペーン一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.CampaignWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type && typeMap[type]) {
      where.type = typeMap[type];
    }

    if (status && statusMap[status]) {
      where.status = statusMap[status];
    }

    const total = await prisma.campaign.count({ where });

    const campaigns = await prisma.campaign.findMany({
      where,
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
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formatted = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      type: c.type.toLowerCase(),
      status: c.status.toLowerCase(),
      startDate: c.startDate?.toISOString() ?? null,
      endDate: c.endDate?.toISOString() ?? null,
      targetSegment: (c.targetSegment as object) ?? {},
      templateId: c.templateId,
      template: c.template,
      tags: c.tags,
      createdBy: c.createdBy,
      createdById: c.createdById,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'キャンペーンの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns
 * 新規キャンペーンを作成
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validatedData = campaignSchema.parse(body);

    const targetSegment =
      validatedData.targetSegment !== null && validatedData.targetSegment !== undefined
        ? (validatedData.targetSegment as object)
        : {};

    const newCampaign = await prisma.campaign.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        type: typeMap[validatedData.type] ?? 'EMAIL',
        status: statusMap[validatedData.status] ?? 'DRAFT',
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        targetSegment,
        templateId: validatedData.templateId ?? null,
        tags: validatedData.tags ?? [],
        createdById: (user as { id?: string }).id!,
      },
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
      id: newCampaign.id,
      name: newCampaign.name,
      type: newCampaign.type.toLowerCase(),
      status: newCampaign.status.toLowerCase(),
      template: newCampaign.template,
      createdBy: newCampaign.createdBy,
      createdAt: newCampaign.createdAt.toISOString(),
    };

    return NextResponse.json(
      { data: responseData, message: 'キャンペーンを作成しました' },
      { status: 201 }
    );
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
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'キャンペーンの作成に失敗しました' },
      { status: 500 }
    );
  }
}
