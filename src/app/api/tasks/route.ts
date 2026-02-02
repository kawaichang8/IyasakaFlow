import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { taskSchema } from '@/lib/validations/task';
import { Prisma } from '@prisma/client';

/**
 * GET /api/tasks
 * タスク一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータの取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const assigneeId = searchParams.get('assigneeId') || '';
    const accountId = searchParams.get('accountId') || '';
    const dealId = searchParams.get('dealId') || '';
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // WHERE条件を構築
    const where: Prisma.TaskWhereInput = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status.toUpperCase() as any;
    }
    
    if (priority) {
      where.priority = priority.toUpperCase() as any;
    }
    
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }
    
    if (accountId) {
      where.accountId = accountId;
    }
    
    if (dealId) {
      where.dealId = dealId;
    }
    
    // 総件数を取得
    const total = await prisma.task.count({ where });
    
    // データを取得
    const tasks = await prisma.task.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: sortBy === 'dueDate' 
        ? [
            { dueDate: { sort: sortOrder as 'asc' | 'desc', nulls: 'last' } },
            { priority: 'desc' },
          ]
        : { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // レスポンス用にデータを整形
    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate?.toISOString() || null,
      priority: task.priority.toLowerCase(),
      status: task.status.toLowerCase(),
      account: task.account,
      contact: task.contact,
      deal: task.deal,
      assignee: task.assignee,
      createdBy: task.createdBy,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({
      data: formattedTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'タスクの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * 新規タスクを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = taskSchema.parse(body);
    
    // enum変換
    const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      urgent: 'URGENT',
    };
    
    const statusMap: Record<string, 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'> = {
      pending: 'PENDING',
      in_progress: 'IN_PROGRESS',
      completed: 'COMPLETED',
      cancelled: 'CANCELLED',
    };
    
    // タスクを作成
    const newTask = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        priority: priorityMap[validatedData.priority] || 'MEDIUM',
        status: statusMap[validatedData.status] || 'PENDING',
        accountId: validatedData.accountId || null,
        contactId: validatedData.contactId || null,
        dealId: validatedData.dealId || null,
        assigneeId: validatedData.assigneeId || null,
        createdById: validatedData.assigneeId ?? (await requireAuth()).id,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    // レスポンス用に整形（include で取得したリレーション）
    const withRelations = newTask as typeof newTask & { account?: { id: string; name: string } | null; assignee?: { id: string; name: string } | null };
    const responseData = {
      id: newTask.id,
      title: newTask.title,
      priority: newTask.priority.toLowerCase(),
      status: newTask.status.toLowerCase(),
      dueDate: newTask.dueDate?.toISOString() ?? null,
      account: withRelations.account ?? null,
      assignee: withRelations.assignee ?? null,
      createdAt: newTask.createdAt.toISOString(),
    };
    
    return NextResponse.json(
      { data: responseData, message: 'タスクを作成しました' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'タスクの作成に失敗しました' },
      { status: 500 }
    );
  }
}
