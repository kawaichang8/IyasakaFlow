import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/search
 * グローバル検索: 企業・連絡先・案件を横断検索
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
    const types = (searchParams.get('types') || 'accounts,contacts,deals').split(',');

    if (!q || q.length < 2) {
      return NextResponse.json({
        data: {
          accounts: [],
          contacts: [],
          deals: [],
        },
      });
    }

    const searchMode = { contains: q, mode: 'insensitive' as const };

    const [accounts, contacts, deals] = await Promise.all([
      types.includes('accounts')
        ? prisma.account.findMany({
            where: {
              OR: [
                { name: searchMode },
                { industry: searchMode },
                { email: searchMode },
              ],
            },
            select: {
              id: true,
              name: true,
              industry: true,
              status: true,
            },
            take: limit,
            orderBy: { name: 'asc' },
          })
        : [],
      types.includes('contacts')
        ? prisma.contact.findMany({
            where: {
              OR: [
                { name: searchMode },
                { email: searchMode },
                { role: searchMode },
                { account: { name: searchMode } },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              account: { select: { id: true, name: true } },
            },
            take: limit,
            orderBy: { name: 'asc' },
          })
        : [],
      types.includes('deals')
        ? prisma.deal.findMany({
            where: {
              OR: [
                { name: searchMode },
                { account: { name: searchMode } },
              ],
            },
            select: {
              id: true,
              name: true,
              value: true,
              stage: true,
              account: { select: { id: true, name: true } },
            },
            take: limit,
            orderBy: { updatedAt: 'desc' },
          })
        : [],
    ]);

    const data = {
      accounts: accounts.map((a) => ({
        id: a.id,
        type: 'account' as const,
        name: a.name,
        subtitle: a.industry || undefined,
        status: a.status?.toLowerCase(),
        href: `/accounts/${a.id}`,
      })),
      contacts: contacts.map((c) => ({
        id: c.id,
        type: 'contact' as const,
        name: c.name,
        subtitle: c.account?.name || c.email || c.role || undefined,
        href: `/contacts/${c.id}`,
      })),
      deals: deals.map((d) => ({
        id: d.id,
        type: 'deal' as const,
        name: d.name,
        subtitle: d.account?.name || undefined,
        stage: d.stage?.toLowerCase(),
        value: Number(d.value),
        href: `/deals/${d.id}`,
      })),
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in global search:', error);
    return NextResponse.json(
      { error: '検索に失敗しました' },
      { status: 500 }
    );
  }
}
