import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { teamSchema } from '@/lib/validations/team';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/teams/[id]
 * 特定のチームを取得
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
    
    if (!team) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }
    
    const responseData = {
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team._count.members,
      members: team.members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role.toLowerCase(),
        image: m.image,
        createdAt: m.createdAt.toISOString(),
      })),
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'チームの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/[id]
 * チームを更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // 部分バリデーション
    const validatedData = teamSchema.partial().parse(body);
    
    // 既存のチームを確認
    const existingTeam = await prisma.team.findUnique({
      where: { id },
    });
    
    if (!existingTeam) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }
    
    // チームを更新
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
      },
    });
    
    return NextResponse.json({
      data: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        description: updatedTeam.description,
      },
      message: 'チームを更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'チームの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]
 * チームを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // 既存のチームを確認
    const existingTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
    
    if (!existingTeam) {
      return NextResponse.json(
        { error: 'チームが見つかりません' },
        { status: 404 }
      );
    }
    
    // メンバーがいる場合は削除不可
    if (existingTeam._count.members > 0) {
      return NextResponse.json(
        { error: 'メンバーがいるチームは削除できません。先にメンバーを別のチームに移動してください。' },
        { status: 400 }
      );
    }
    
    // チームを削除
    await prisma.team.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: 'チームを削除しました',
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'チームの削除に失敗しました' },
      { status: 500 }
    );
  }
}
