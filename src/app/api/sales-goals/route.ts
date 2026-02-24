import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const upsertSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  targetRevenue: z.number().int().min(0).optional(),
  targetDealCount: z.number().int().min(0).optional(),
  targetActivity: z.number().int().min(0).optional(),
});

/**
 * GET /api/sales-goals?year=2026&month=2
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get('year') || new Date().getFullYear());
    const month = Number(searchParams.get('month') || new Date().getMonth() + 1);

    const goal = await prisma.salesGoal.findUnique({
      where: {
        userId_year_month: { userId: session.user.id, year, month },
      },
    });

    return NextResponse.json({ data: goal });
  } catch (error) {
    console.error('SalesGoal GET error:', error);
    return NextResponse.json({ error: '目標の取得に失敗しました' }, { status: 500 });
  }
}

/**
 * POST /api/sales-goals
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const data = upsertSchema.parse(body);

    const goal = await prisma.salesGoal.upsert({
      where: {
        userId_year_month: {
          userId: session.user.id,
          year: data.year,
          month: data.month,
        },
      },
      update: {
        ...(data.targetRevenue !== undefined && { targetRevenue: data.targetRevenue }),
        ...(data.targetDealCount !== undefined && { targetDealCount: data.targetDealCount }),
        ...(data.targetActivity !== undefined && { targetActivity: data.targetActivity }),
      },
      create: {
        userId: session.user.id,
        year: data.year,
        month: data.month,
        targetRevenue: data.targetRevenue ?? 0,
        targetDealCount: data.targetDealCount ?? 0,
        targetActivity: data.targetActivity ?? 0,
      },
    });

    return NextResponse.json({ data: goal, message: '目標を保存しました' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力値が正しくありません', details: error.errors }, { status: 400 });
    }
    console.error('SalesGoal POST error:', error);
    return NextResponse.json({ error: '目標の保存に失敗しました' }, { status: 500 });
  }
}
