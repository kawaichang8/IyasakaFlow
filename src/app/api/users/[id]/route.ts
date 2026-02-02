import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { updateUserSchema } from '@/lib/validations/team';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/users/[id]
 * 特定のユーザーを取得
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const user = await prisma.user.findUnique({
      where: { id },
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
            assignedTasks: true,
            interactions: true,
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    const responseData = {
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
        tasks: user._count.assignedTasks,
        interactions: user._count.interactions,
      },
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'ユーザーの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * ユーザーを更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // 部分バリデーション
    const validatedData = updateUserSchema.parse(body);
    
    // 既存のユーザーを確認
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    // ロールをenumに変換
    const roleMap: Record<string, 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'> = {
      admin: 'ADMIN',
      manager: 'MANAGER',
      member: 'MEMBER',
      viewer: 'VIEWER',
    };
    
    // 更新データを構築
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.role !== undefined) {
      updateData.role = roleMap[validatedData.role] || existingUser.role;
    }
    if (validatedData.teamId !== undefined) {
      updateData.teamId = validatedData.teamId || null;
    }
    
    // ユーザーを更新
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
    
    return NextResponse.json({
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role.toLowerCase(),
        team: updatedUser.team,
      },
      message: 'ユーザーを更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'ユーザーの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * ユーザーを削除（無効化）
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // 既存のユーザーを確認
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    // 管理者は削除不可（最低1人は必要）
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: '最後の管理者は削除できません' },
          { status: 400 }
        );
      }
    }
    
    // ユーザーを削除
    // 注意: 関連データの扱いを検討（カスケード削除 or 無効化）
    await prisma.user.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: 'ユーザーを削除しました',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'ユーザーの削除に失敗しました' },
      { status: 500 }
    );
  }
}
