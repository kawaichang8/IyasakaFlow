import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { taskStatusSchema } from '@/lib/validations/task';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/tasks/[id]/status
 * タスクのステータスを更新（クイック完了用）
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // バリデーション
    const statusSchema = z.object({
      status: taskStatusSchema,
    });
    const { status } = statusSchema.parse(body);
    
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
    
    // ステータスをenumに変換
    const statusMap: Record<string, 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'> = {
      pending: 'PENDING',
      in_progress: 'IN_PROGRESS',
      completed: 'COMPLETED',
      cancelled: 'CANCELLED',
    };
    
    // タスクを更新
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: statusMap[status],
      },
    });
    
    return NextResponse.json({
      data: {
        id: updatedTask.id,
        title: updatedTask.title,
        status: updatedTask.status.toLowerCase(),
      },
      message: 'ステータスを更新しました',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { error: 'ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }
}
