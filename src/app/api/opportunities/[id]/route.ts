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

function formatOpp(o: any) {
  return {
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
  };
}

/**
 * GET /api/opportunities/:id
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const opp = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    if (!opp) {
      return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({ data: formatOpp(opp) });
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json({ error: '案件の取得に失敗しました' }, { status: 500 });
  }
}

/**
 * PATCH /api/opportunities/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 });
    }

    const validated = opportunitySchema.partial().parse(body);
    const updateData: Prisma.OpportunityUpdateInput = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.stage !== undefined) updateData.stage = STAGE_MAP[validated.stage] || existing.stage;
    if (validated.amount !== undefined) updateData.amount = new Prisma.Decimal(validated.amount);
    if (validated.probability !== undefined) updateData.probability = validated.probability;
    if (validated.expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = validated.expectedCloseDate ? new Date(validated.expectedCloseDate) : null;
    }
    if (validated.notes !== undefined) updateData.notes = validated.notes || null;
    if (validated.accountId !== undefined) updateData.account = { connect: { id: validated.accountId } };
    if (validated.contactId !== undefined) {
      updateData.contact = validated.contactId ? { connect: { id: validated.contactId } } : { disconnect: true };
    }
    if (validated.ownerId !== undefined) {
      updateData.owner = validated.ownerId ? { connect: { id: validated.ownerId } } : { disconnect: true };
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data: updateData,
      include: {
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: formatOpp(updated), message: '案件を更新しました' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'バリデーションエラー', details: error.errors }, { status: 400 });
    }
    console.error('Error updating opportunity:', error);
    return NextResponse.json({ error: '案件の更新に失敗しました' }, { status: 500 });
  }
}

/**
 * DELETE /api/opportunities/:id
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ message: '案件を削除しました' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json({ error: '案件の削除に失敗しました' }, { status: 500 });
  }
}
