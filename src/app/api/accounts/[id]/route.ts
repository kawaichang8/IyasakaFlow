import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { accountSchema } from '@/lib/validations/account';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/accounts/[id]
 * 特定の企業アカウントを取得（詳細情報付き）
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            department: true,
            influenceLevel: true,
            status: true,
            lastContactDate: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        deals: {
          select: {
            id: true,
            name: true,
            value: true,
            stage: true,
            probability: true,
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
            contact: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
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
          take: 5,
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
            contacts: true,
            deals: true,
            interactions: true,
          },
        },
      },
    });
    
    if (!account) {
      return NextResponse.json(
        { error: 'アカウントが見つかりません' },
        { status: 404 }
      );
    }
    
    // 取引総額を計算
    const totalDealValue = account.deals.reduce(
      (sum, deal) => sum + Number(deal.value),
      0
    );
    
    // レスポンス用に整形
    const responseData = {
      id: account.id,
      name: account.name,
      industry: account.industry,
      website: account.website,
      phone: account.phone,
      email: account.email,
      address: account.address,
      city: account.city,
      state: account.state,
      postalCode: account.postalCode,
      country: account.country,
      employeeCount: account.employeeCount,
      annualRevenue: account.annualRevenue ? Number(account.annualRevenue) : null,
      status: account.status.toLowerCase(),
      description: account.description,
      tags: account.tags,
      customFields: account.customFields,
      owner: account.owner,
      contacts: account.contacts.map((c) => ({
        ...c,
        influenceLevel: c.influenceLevel.toLowerCase(),
        status: c.status.toLowerCase(),
        lastContactDate: c.lastContactDate?.toISOString() || null,
      })),
      deals: account.deals.map((d) => ({
        ...d,
        value: Number(d.value),
        stage: d.stage.toLowerCase(),
        expectedCloseDate: d.expectedCloseDate?.toISOString() || null,
      })),
      interactions: account.interactions.map((i) => ({
        ...i,
        type: i.type.toLowerCase(),
        date: i.date.toISOString(),
      })),
      tasks: account.tasks.map((t) => ({
        ...t,
        priority: t.priority.toLowerCase(),
        status: t.status.toLowerCase(),
        dueDate: t.dueDate?.toISOString() || null,
      })),
      contactCount: account._count.contacts,
      dealCount: account._count.deals,
      interactionCount: account._count.interactions,
      totalDealValue,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'アカウントの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/accounts/[id]
 * 企業アカウントを更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // 部分バリデーション
    const validatedData = accountSchema.partial().parse(body);
    
    // 既存のアカウントを確認
    const existingAccount = await prisma.account.findUnique({
      where: { id },
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'アカウントが見つかりません' },
        { status: 404 }
      );
    }
    
    // ステータスをenumに変換
    const statusMap: Record<string, 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'CHURNED'> = {
      prospect: 'PROSPECT',
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      churned: 'CHURNED',
    };
    
    // 更新データを構築
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.industry !== undefined) updateData.industry = validatedData.industry || null;
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.address !== undefined) updateData.address = validatedData.address || null;
    if (validatedData.city !== undefined) updateData.city = validatedData.city || null;
    if (validatedData.state !== undefined) updateData.state = validatedData.state || null;
    if (validatedData.postalCode !== undefined) updateData.postalCode = validatedData.postalCode || null;
    if (validatedData.country !== undefined) updateData.country = validatedData.country || null;
    if (validatedData.employeeCount !== undefined) updateData.employeeCount = validatedData.employeeCount || null;
    if (validatedData.annualRevenue !== undefined) {
      updateData.annualRevenue = validatedData.annualRevenue ? BigInt(validatedData.annualRevenue) : null;
    }
    if (validatedData.status !== undefined) updateData.status = statusMap[validatedData.status] || existingAccount.status;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.customFields !== undefined) updateData.customFields = validatedData.customFields;
    if (validatedData.ownerId !== undefined) updateData.ownerId = validatedData.ownerId || null;
    if (validatedData.parentAccountId !== undefined) updateData.parentAccountId = validatedData.parentAccountId || null;
    
    // アカウントを更新
    const updatedAccount = await prisma.account.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // レスポンス用に整形
    const responseData = {
      id: updatedAccount.id,
      name: updatedAccount.name,
      industry: updatedAccount.industry,
      status: updatedAccount.status.toLowerCase(),
      owner: updatedAccount.owner,
      updatedAt: updatedAccount.updatedAt.toISOString(),
    };
    
    return NextResponse.json({
      data: responseData,
      message: 'アカウントを更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'アカウントの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/accounts/[id]
 * 企業アカウントを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // 既存のアカウントを確認
    const existingAccount = await prisma.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contacts: true,
            deals: true,
          },
        },
      },
    });
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'アカウントが見つかりません' },
        { status: 404 }
      );
    }
    
    // 関連データがある場合は警告（Cascadeで削除される）
    if (existingAccount._count.contacts > 0 || existingAccount._count.deals > 0) {
      console.warn(
        `Deleting account ${id} with ${existingAccount._count.contacts} contacts and ${existingAccount._count.deals} deals`
      );
    }
    
    // アカウントを削除（関連する連絡先・取引もCascadeで削除）
    await prisma.account.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: 'アカウントを削除しました',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'アカウントの削除に失敗しました' },
      { status: 500 }
    );
  }
}
