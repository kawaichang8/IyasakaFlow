import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createUserSchema } from '@/lib/validations/team';
import { Prisma } from '@prisma/client';

/**
 * GET /api/users
 * ユーザー一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const teamId = searchParams.get('teamId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // WHERE条件を構築
    const where: Prisma.UserWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role) {
      where.role = role.toUpperCase() as any;
    }
    
    if (teamId) {
      where.teamId = teamId;
    }
    
    // 総件数を取得
    const total = await prisma.user.count({ where });
    
    // データを取得
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ownedAccounts: true,
            ownedContacts: true,
            ownedDeals: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      image: user.image,
      emailVerified: user.emailVerified ? true : false,
      team: user.team,
      stats: {
        accounts: user._count.ownedAccounts,
        contacts: user._count.ownedContacts,
        deals: user._count.ownedDeals,
      },
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'ユーザーの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * 新規ユーザーを作成（管理者用）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = createUserSchema.parse(body);
    
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }
    
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // ロールをenumに変換
    const roleMap: Record<string, 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'> = {
      admin: 'ADMIN',
      manager: 'MANAGER',
      member: 'MEMBER',
      viewer: 'VIEWER',
    };
    
    // ユーザーを作成
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: roleMap[validatedData.role] || 'MEMBER',
        teamId: validatedData.teamId || null,
        emailVerified: new Date(), // 管理者が作成したユーザーは検証済み
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(
      { 
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role.toLowerCase(),
          team: newUser.team,
        },
        message: 'ユーザーを作成しました' 
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    );
  }
}
