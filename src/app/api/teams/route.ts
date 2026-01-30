import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { teamSchema } from '@/lib/validations/team';

/**
 * GET /api/teams
 * チーム一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    const teams = await prisma.team.findMany({
      where: search ? {
        name: { contains: search, mode: 'insensitive' },
      } : undefined,
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team._count.members,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({ data: formattedTeams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'チームの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams
 * 新規チームを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = teamSchema.parse(body);
    
    // チームを作成
    const newTeam = await prisma.team.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
      },
    });
    
    return NextResponse.json(
      { 
        data: {
          id: newTeam.id,
          name: newTeam.name,
          description: newTeam.description,
        },
        message: 'チームを作成しました' 
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
    
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'チームの作成に失敗しました' },
      { status: 500 }
    );
  }
}
