import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { contactSchema } from '@/lib/validations/contact';
import { Prisma } from '@prisma/client';

/**
 * GET /api/contacts
 * 連絡先一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータの取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const accountId = searchParams.get('accountId') || '';
    const influenceLevel = searchParams.get('influenceLevel') || '';
    const contactSource = searchParams.get('contactSource') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // WHERE条件を構築
    const where: Prisma.ContactWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { account: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    if (accountId) {
      where.accountId = accountId;
    }
    
    if (influenceLevel) {
      where.influenceLevel = influenceLevel.toUpperCase() as any;
    }
    
    if (contactSource) {
      where.contactSource = contactSource;
    }
    
    if (status) {
      where.status = status.toUpperCase() as any;
    }
    
    // 総件数を取得
    const total = await prisma.contact.count({ where });
    
    // データを取得
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            interactions: true,
            deals: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const contactIds = contacts.map((c) => c.id);
    const latestByContact = contactIds.length
      ? await prisma.interaction.findMany({
          where: { contactId: { in: contactIds } },
          orderBy: { date: 'desc' },
          select: {
            contactId: true,
            outcome: true,
            nextAction: true,
            nextActionDate: true,
          },
        })
      : [];
    const latestMap = new Map<string, (typeof latestByContact)[0]>();
    for (const i of latestByContact) {
      if (i.contactId && !latestMap.has(i.contactId)) {
        latestMap.set(i.contactId, i);
      }
    }
    
    // レスポンス用にデータを整形
    const formattedContacts = contacts.map((contact) => {
      const latest = latestMap.get(contact.id);
      return {
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
        socialProfiles: contact.socialProfiles as Record<string, string> | null,
        influenceLevel: contact.influenceLevel.toLowerCase(),
        contactSource: contact.contactSource,
        status: contact.status.toLowerCase(),
        tags: contact.tags,
        notes: contact.notes,
        lastContactDate: contact.lastContactDate?.toISOString() || null,
        account: contact.account,
        owner: contact.owner,
        interactionCount: contact._count.interactions,
        dealCount: contact._count.deals,
        lastOutcome: latest?.outcome ?? null,
        nextAction: latest?.nextAction ?? null,
        nextActionDate: latest?.nextActionDate?.toISOString() ?? null,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
      };
    });
    
    return NextResponse.json({
      data: formattedContacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: '連絡先の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * 新規連絡先を作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = contactSchema.parse(body);
    
    // アカウントの存在確認
    const account = await prisma.account.findUnique({
      where: { id: validatedData.accountId },
    });
    
    if (!account) {
      return NextResponse.json(
        { error: '指定された企業アカウントが見つかりません' },
        { status: 400 }
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
    
    // 連絡先を作成
    const newContact = await prisma.contact.create({
      data: {
        name: validatedData.name,
        firstName: validatedData.firstName || null,
        lastName: validatedData.lastName || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        mobile: validatedData.mobile || null,
        website: validatedData.website || null,
        role: validatedData.role || null,
        department: validatedData.department || null,
        accountId: validatedData.accountId,
        influenceLevel: influenceLevelMap[validatedData.influenceLevel || 'other'] || 'OTHER',
        contactSource: validatedData.contactSource || null,
        status: statusMap[validatedData.status] || 'ACTIVE',
        tags: validatedData.tags || [],
        notes: validatedData.notes || null,
        socialProfiles: validatedData.socialProfiles || {},
        customFields: validatedData.customFields || {},
        ownerId: validatedData.ownerId || null,
      },
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
      id: newContact.id,
      name: newContact.name,
      email: newContact.email,
      role: newContact.role,
      account: newContact.account,
      influenceLevel: newContact.influenceLevel.toLowerCase(),
      status: newContact.status.toLowerCase(),
      createdAt: newContact.createdAt.toISOString(),
    };
    
    return NextResponse.json(
      { data: responseData, message: '連絡先を作成しました' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: '連絡先の作成に失敗しました' },
      { status: 500 }
    );
  }
}
