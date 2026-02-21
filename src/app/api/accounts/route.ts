import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { accountSchema } from '@/lib/validations/account';
import { Prisma } from '@prisma/client';

/**
 * GET /api/accounts
 * 企業アカウント一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータの取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry') || '';
    const accountType = searchParams.get('accountType') || '';
    const status = searchParams.get('status') || '';
    const needFollowUp = searchParams.get('needFollowUp') === '1' || searchParams.get('needFollowUp') === 'true';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // クエリの accountType / status はフロントから小文字で来るため、Prisma enum の大文字に変換
    const accountTypeUpper = accountType ? accountType.toUpperCase() : '';
    const statusUpper = status ? status.toUpperCase() : '';
    
    // WHERE条件を構築
    const where: Prisma.AccountWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (industry) {
      where.industry = industry;
    }
    if (accountTypeUpper) {
      where.accountType = accountTypeUpper as any;
    }
    if (statusUpper) {
      where.status = statusUpper as any;
    }
    
    // 要フォロー: 7日以上連絡していない企業に絞る
    if (needFollowUp) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = await prisma.interaction.findMany({
        where: { date: { gte: sevenDaysAgo }, accountId: { not: null } },
        select: { accountId: true },
        distinct: ['accountId'],
      });
      const recentAccountIds = recent.map((r) => r.accountId).filter((id): id is string => id != null);
      where.id = recentAccountIds.length > 0 ? { notIn: recentAccountIds } : undefined;
    }
    
    // 総件数を取得
    const total = await prisma.account.count({ where });
    
    // データを取得（連絡先数と取引情報も含む）
    const accounts = await prisma.account.findMany({
      where,
      include: {
        _count: {
          select: {
            contacts: true,
            deals: true,
          },
        },
        deals: {
          select: {
            value: true,
            stage: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const accountIds = accounts.map((a) => a.id);
    // 企業ごとの直近インタラクション（最終連絡日・反応・ネクストアクション）
    const latestByAccount = accountIds.length
      ? await prisma.interaction.findMany({
          where: { accountId: { in: accountIds } },
          orderBy: { date: 'desc' },
          select: {
            accountId: true,
            date: true,
            outcome: true,
            nextAction: true,
            nextActionDate: true,
          },
        })
      : [];
    const latestMap = new Map<string, (typeof latestByAccount)[0]>();
    for (const i of latestByAccount) {
      if (i.accountId && !latestMap.has(i.accountId)) {
        latestMap.set(i.accountId, i);
      }
    }
    
    // レスポンス用にデータを整形
    const formattedAccounts = accounts.map((account) => {
      const totalDealValue = account.deals.reduce(
        (sum, deal) => sum + Number(deal.value),
        0
      );
      const latest = latestMap.get(account.id);
      return {
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
        accountType: account.accountType?.toLowerCase() ?? null,
        status: account.status.toLowerCase(),
        description: account.description,
        tags: account.tags,
        contactCount: account._count.contacts,
        dealCount: account._count.deals,
        totalDealValue,
        owner: account.owner,
        lastActivityAt: latest?.date?.toISOString() ?? null,
        lastOutcome: latest?.outcome ?? null,
        nextAction: latest?.nextAction ?? null,
        nextActionDate: latest?.nextActionDate?.toISOString() ?? null,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      };
    });
    
    return NextResponse.json({
      data: formattedAccounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching accounts:', error);
    const message = error instanceof Error ? error.message : '';
    const isSchemaError =
      typeof message === 'string' &&
      (message.includes('column') ||
        message.includes('does not exist') ||
        message.includes('Unknown arg') ||
        (error as { code?: string })?.code === 'P2010');
    if (isSchemaError) {
      return NextResponse.json(
        {
          error: 'データベースのスキーマがアプリと一致していません。本番環境で「npx prisma db push」を実行してマイグレーションを適用してください。',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'アカウントの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounts
 * 新規企業アカウントを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = accountSchema.parse(body);
    
    // ステータス・種別をenumに変換
    const statusMap: Record<string, 'PROSPECT' | 'TRIAL' | 'CUSTOMER' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CHURNED' | 'PARTNER'> = {
      prospect: 'PROSPECT',
      trial: 'TRIAL',
      customer: 'CUSTOMER',
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      suspended: 'SUSPENDED',
      churned: 'CHURNED',
      partner: 'PARTNER',
    };
    const accountTypeMap: Record<string, 'CUSTOMER' | 'PROSPECT' | 'SUBCONTRACTOR' | 'OUTSOURCE' | 'FREELANCER' | 'PARTNER' | 'OTHER'> = {
      customer: 'CUSTOMER',
      prospect: 'PROSPECT',
      subcontractor: 'SUBCONTRACTOR',
      outsource: 'OUTSOURCE',
      freelancer: 'FREELANCER',
      partner: 'PARTNER',
      other: 'OTHER',
    };
    
    // アカウントを作成
    const newAccount = await prisma.account.create({
      data: {
        name: validatedData.name,
        industry: validatedData.industry || null,
        website: validatedData.website || null,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        postalCode: validatedData.postalCode || null,
        country: validatedData.country || '日本',
        employeeCount: validatedData.employeeCount || null,
        annualRevenue: validatedData.annualRevenue ? BigInt(validatedData.annualRevenue) : null,
        accountType: validatedData.accountType ? accountTypeMap[validatedData.accountType] ?? null : null,
        status: statusMap[validatedData.status] || 'PROSPECT',
        description: validatedData.description || null,
        tags: validatedData.tags || [],
        customFields: validatedData.customFields || {},
        ownerId: validatedData.ownerId || null,
        parentAccountId: validatedData.parentAccountId || null,
      },
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
      id: newAccount.id,
      name: newAccount.name,
      industry: newAccount.industry,
      website: newAccount.website,
      phone: newAccount.phone,
      email: newAccount.email,
      accountType: newAccount.accountType?.toLowerCase() ?? null,
      status: newAccount.status.toLowerCase(),
      owner: newAccount.owner,
      createdAt: newAccount.createdAt.toISOString(),
      updatedAt: newAccount.updatedAt.toISOString(),
    };
    
    return NextResponse.json(
      { data: responseData, message: 'アカウントを作成しました' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'アカウントの作成に失敗しました' },
      { status: 500 }
    );
  }
}
