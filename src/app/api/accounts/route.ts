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
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
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
    
    if (status) {
      where.status = status as any;
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
    
    // レスポンス用にデータを整形
    const formattedAccounts = accounts.map((account) => {
      // 取引総額を計算（BigIntをNumberに変換）
      const totalDealValue = account.deals.reduce(
        (sum, deal) => sum + Number(deal.value),
        0
      );
      
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
        status: account.status.toLowerCase(),
        description: account.description,
        tags: account.tags,
        contactCount: account._count.contacts,
        dealCount: account._count.deals,
        totalDealValue,
        owner: account.owner,
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
  } catch (error) {
    console.error('Error fetching accounts:', error);
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
    
    // ステータスをenumに変換
    const statusMap: Record<string, 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'CHURNED'> = {
      prospect: 'PROSPECT',
      active: 'ACTIVE',
      inactive: 'INACTIVE',
      churned: 'CHURNED',
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
