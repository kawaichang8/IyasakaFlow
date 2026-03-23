import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/accounts/check-duplicate?name=...&excludeId=...
 * 取引先名の重複有無を返す（編集時は excludeId で自身を除外）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name')?.trim() ?? '';
    const excludeId = searchParams.get('excludeId')?.trim() || undefined;

    if (name.length < 1) {
      return NextResponse.json({ duplicate: false, matches: [] as { id: string; name: string }[] });
    }

    const matches = await prisma.account.findMany({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, name: true },
      take: 10,
    });

    return NextResponse.json({
      duplicate: matches.length > 0,
      matches,
    });
  } catch (error) {
    console.error('check-duplicate:', error);
    return NextResponse.json({ error: '重複確認に失敗しました' }, { status: 500 });
  }
}
