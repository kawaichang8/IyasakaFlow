import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { taskSchema } from '@/lib/validations/task';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/tasks/[id]
 * 特定のタスクを取得
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
            value: true,
            stage: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!task) {
      return NextResponse.json(
        { error: 'タスクが見つかりません' },
        { status: 404 }
      );
    }
    
    // レスポンス用に整形
    const responseData = {
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate?.toISOString() || null,
      priority: task.priority.toLowerCase(),
      status: task.status.toLowerCase(),
      account: task.account,
      contact: task.contact,
      deal: task.deal ? {
        ...task.deal,
        value: Number(task.deal.value),
        stage: task.deal.stage.toLowerCase(),
      } : null,
      assignee: task.assignee,
      createdBy: task.createdBy,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
    
    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'タスクの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id]
 * タスクを更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // 部分バリデーション
    const validatedData = taskSchema.partial().parse(body);
    
    // 既存のタスクを確認
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: 'タスクが見つかりません' },
        { status: 404 }
      );
    }
    
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
    
    // 更新データを構築
    const updateData: any = {};
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }
    if (validatedData.priority !== undefined) {
      updateData.priority = priorityMap[validatedData.priority] || existingTask.priority;
    }
    if (validatedData.status !== undefined) {
      updateData.status = statusMap[validatedData.status] || existingTask.status;
    }
    if (validatedData.accountId !== undefined) updateData.accountId = validatedData.accountId || null;
    if (validatedData.contactId !== undefined) updateData.contactId = validatedData.contactId || null;
    if (validatedData.dealId !== undefined) updateData.dealId = validatedData.dealId || null;
    if (validatedData.assigneeId !== undefined) updateData.assigneeId = validatedData.assigneeId || null;
    
    // タスクを更新
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
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
    
    // レスポンス用に整形
    const responseData = {
      id: updatedTask.id,
      title: updatedTask.title,
      priority: updatedTask.priority.toLowerCase(),
      status: updatedTask.status.toLowerCase(),
      account: updatedTask.account,
      assignee: updatedTask.assignee,
      updatedAt: updatedTask.updatedAt.toISOString(),
    };
    
    return NextResponse.json({
      data: responseData,
      message: 'タスクを更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'タスクの更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * タスクを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // 既存のタスクを確認
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });
    
    if (!existingTask) {
      return NextResponse.json(
        { error: 'タスクが見つかりません' },
        { status: 404 }
      );
    }
    
    // タスクを削除
    await prisma.task.delete({
      where: { id },
    });
    
    return NextResponse.json({
      message: 'タスクを削除しました',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'タスクの削除に失敗しました' },
      { status: 500 }
    );
  }
}
