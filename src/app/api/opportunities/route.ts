import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { opportunitySchema } from '@/lib/validations/opportunity';
import { Prisma } from '@prisma/client';

const STAGE_MAP: Record<string, 'LEAD' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'> = {
  lead: 'LEAD',
  proposal: 'PROPOSAL',
  negotiation: 'NEGOTIATION',
  won: 'WON',
  lost: 'LOST',
};

/**
 * GET /api/opportunities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const stage = searchParams.get('stage') || '';
    const accountId = searchParams.get('accountId') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Prisma.OpportunityWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { account: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (stage) {
      where.stage = stage.toUpperCase() as any;
    }
    if (accountId) {
      where.accountId = accountId;
    }

    const [total, opportunities] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        include: {
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const formatted = opportunities.map((o) => ({
      id: o.id,
      name: o.name,
      stage: o.stage.toLowerCase(),
      amount: Number(o.amount),
      probability: o.probability,
      expectedCloseDate: o.expectedCloseDate?.toISOString() ?? null,
      notes: o.notes,
      accountId: o.accountId,
      contactId: o.contactId,
      ownerId: o.ownerId,
      account: o.account,
      contact: o.contact,
      owner: o.owner,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: '案件の取得に失敗しました' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/opportunities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = opportunitySchema.parse(body);

    const stageEnum = STAGE_MAP[data.stage] || 'LEAD';

    const created = await prisma.opportunity.create({
      data: {
        name: data.name,
        stage: stageEnum,
        amount: data.amount ? new Prisma.Decimal(data.amount) : new Prisma.Decimal(0),
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        notes: data.notes || null,
        accountId: data.accountId,
        contactId: data.contactId || null,
        ownerId: data.ownerId || null,
      },
      include: {
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        data: {
          id: created.id,
          name: created.name,
          stage: created.stage.toLowerCase(),
          amount: Number(created.amount),
          probability: created.probability,
          expectedCloseDate: created.expectedCloseDate?.toISOString() ?? null,
          notes: created.notes,
          accountId: created.accountId,
          contactId: created.contactId,
          ownerId: created.ownerId,
          account: created.account,
          contact: created.contact,
          owner: created.owner,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        },
        message: '案件を作成しました',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 },
      );
    }
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: '案件の作成に失敗しました' },
      { status: 500 },
    );
  }
}
