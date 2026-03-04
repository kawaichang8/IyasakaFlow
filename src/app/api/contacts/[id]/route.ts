import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { contactSchema } from '@/lib/validations/contact';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/contacts/[id]
 * 特定の連絡先を取得（詳細情報付き）
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
            phone: true,
          },
        },
        deals: {
          select: {
            id: true,
            name: true,
            value: true,
            stage: true,
            expectedCloseDate: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        interactions: {
          select: {
            id: true,
            type: true,
            subject: true,
            note: true,
            date: true,
            outcome: true,
            nextAction: true,
            nextActionDate: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 20,
        },
        tasks: {
          where: {
            status: {
              in: ['PENDING', 'IN_PROGRESS'],
            },
          },
          select: {
            id: true,
            title: true,
            dueDate: true,
            priority: true,
            status: true,
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            interactions: true,
            deals: true,
            tasks: true,
          },
        },
      },
    });
    
    if (!contact) {
      return NextResponse.json(
        { error: '連絡先が見つかりません' },
        { status: 404 }
      );
    }
    
    // レスポンス用に整形
    const responseData = {
      id: contact.id,
      accountId: contact.accountId,
      name: contact.name,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,
      website: contact.website,
      role: contact.role,
      department: contact.department,
      company: contact.account.name,
      influenceLevel: contact.influenceLevel.toLowerCase(),
      contactSource: contact.contactSource,
      status: contact.status.toLowerCase(),
      tags: contact.tags,
      notes: contact.notes,
      socialProfiles: contact.socialProfiles,
      customFields: contact.customFields,
      lastContactDate: contact.lastContactDate?.toISOString() || null,
      account: contact.account,
      owner: contact.owner,
      deals: contact.deals.map((d) => ({
        ...d,
        value: Number(d.value),
        stage: d.stage.toLowerCase(),
        expectedCloseDate: d.expectedCloseDate?.toISOString() || null,
      })),
      interactions: contact.interactions.map((i) => ({
        ...i,
        type: i.type.toLowerCase(),
        date: i.date.toISOString(),
        nextActionDate: i.nextActionDate?.toISOString() || null,
      })),
      tasks: contact.tasks.map((t) => ({
        ...t,
        priority: t.priority.toLowerCase(),
        status: t.status.toLowerCase(),
        dueDate: t.dueDate?.toISOString() || null,
      })),
      interactionCount: contact._count.interactions,
      dealCount: contact._count.deals,
      taskCount: contact._count.tasks,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: '連絡先の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 * 連絡先を更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // 部分バリデーション
    const validatedData = contactSchema.partial().parse(body);
    
    // 既存の連絡先を確認
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    });
    
    if (!existingContact) {
      return NextResponse.json(
        { error: '連絡先が見つかりません' },
        { status: 404 }
      );
    }
    
    // enumマッピング
    const influenceLevelMap: Record<string, 'DECISION_MAKER' | 'INFLUENCER' | 'USER' | 'GATEKEEPER' | 'OTHER'> = {
      decision_maker: 'DECISION_MAKER',
      influencer: 'INFLUENCER',
      user: 'USER',
      gatekeeper: 'GATEKEEPER',
      other: 'OTHER',
    };
    
    const statusMap: Record<string, 'ACTIVE' | 'INACTIVE' | 'BOUNCED'> = {
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      bounced: 'BOUNCED',
    };
    
    // 更新データを構築
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.firstName !== undefined) updateData.firstName = validatedData.firstName || null;
    if (validatedData.lastName !== undefined) updateData.lastName = validatedData.lastName || null;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
    if (validatedData.mobile !== undefined) updateData.mobile = validatedData.mobile || null;
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null;
    if (validatedData.role !== undefined) updateData.role = validatedData.role || null;
    if (validatedData.department !== undefined) updateData.department = validatedData.department || null;
    if (validatedData.accountId !== undefined) updateData.accountId = validatedData.accountId;
    if (validatedData.influenceLevel !== undefined) {
      updateData.influenceLevel = influenceLevelMap[validatedData.influenceLevel] || existingContact.influenceLevel;
    }
    if (validatedData.contactSource !== undefined) updateData.contactSource = validatedData.contactSource || null;
    if (validatedData.status !== undefined) {
      updateData.status = statusMap[validatedData.status] || existingContact.status;
    }
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;
    if (validatedData.socialProfiles !== undefined) updateData.socialProfiles = validatedData.socialProfiles;
    if (validatedData.customFields !== undefined) updateData.customFields = validatedData.customFields;
    if (validatedData.ownerId !== undefined) updateData.ownerId = validatedData.ownerId || null;
    
    // 連絡先を更新
    const updatedContact = await prisma.contact.update({
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
    
    // レスポンス用に整形
    const responseData = {
      id: updatedContact.id,
      name: updatedContact.name,
      email: updatedContact.email,
      account: updatedContact.account,
      influenceLevel: updatedContact.influenceLevel.toLowerCase(),
      status: updatedContact.status.toLowerCase(),
      updatedAt: updatedContact.updatedAt.toISOString(),
    };
    
    return NextResponse.json({
      data: responseData,
      message: '連絡先を更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: '連絡先の更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 * 連絡先を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // 既存の連絡先を確認
    const existingContact = await prisma.contact.findUnique({
      where: { id },
    });
    
    if (!existingContact) {
      return NextResponse.json(
        { error: '連絡先が見つかりません' },
        { status: 404 }
      );
    }
    
    // 連絡先を削除
    await prisma.contact.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: '連絡先を削除しました',
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: '連絡先の削除に失敗しました' },
      { status: 500 }
    );
  }
}
