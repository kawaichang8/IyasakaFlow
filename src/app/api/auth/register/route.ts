import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * 登録スキーマ
 */
const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * POST /api/auth/register
 * 新規ユーザー登録
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = registerSchema.parse(body);
    
    // 既存ユーザーの確認
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
    
    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json(
      {
        data: user,
        message: 'ユーザーを登録しました',
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

    // Prisma のエラーをユーザー向けメッセージに変換
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 400 }
        );
      }
      if (error.code === 'P2021' || error.code === 'P2010') {
        // テーブルが存在しない / マイグレーション未実行の可能性
        console.error('Registration error (Prisma):', error);
        return NextResponse.json(
          {
            error:
              'データベースの準備ができていません。ターミナルで npm run db:push を実行してください。',
          },
          { status: 500 }
        );
      }
      console.error('Registration error (Prisma):', error);
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'development'
              ? `データベースエラー: ${error.message}`
              : '登録に失敗しました',
        },
        { status: 500 }
      );
    }

    console.error('Registration error:', error);
    const message =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : '登録に失敗しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
