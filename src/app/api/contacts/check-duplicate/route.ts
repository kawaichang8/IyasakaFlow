import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildContactFullName } from '@/lib/contact-name';

/**
 * GET /api/contacts/check-duplicate?accountId=&lastName=&firstName=&excludeId=
 * 同一企業内で同じ氏名（姓+名、または表示名）の連絡先があるか
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId')?.trim() ?? '';
    const lastName = searchParams.get('lastName')?.trim() ?? '';
    const firstName = searchParams.get('firstName')?.trim() ?? '';
    const excludeId = searchParams.get('excludeId')?.trim() || undefined;

    if (!accountId || !lastName || !firstName) {
      return NextResponse.json({
        duplicate: false,
        matches: [] as { id: string; name: string }[],
      });
    }

    const displayName = buildContactFullName(lastName, firstName);

    const matches = await prisma.contact.findMany({
      where: {
        accountId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          {
            AND: [
              { lastName: { equals: lastName, mode: 'insensitive' } },
              { firstName: { equals: firstName, mode: 'insensitive' } },
            ],
          },
          ...(displayName
            ? [{ name: { equals: displayName, mode: 'insensitive' as const } }]
            : []),
        ],
      },
      select: { id: true, name: true },
      take: 10,
    });

    return NextResponse.json({
      duplicate: matches.length > 0,
      matches,
    });
  } catch (error) {
    console.error('contacts check-duplicate:', error);
    return NextResponse.json({ error: '重複確認に失敗しました' }, { status: 500 });
  }
}
