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
    
    // バリデーション（メールは前後空白除去・小文字化で統一）
    const raw = registerSchema.parse(body);
    const email = raw.email.trim().toLowerCase();
    const name = raw.name.trim();
    
    // 既存ユーザーの確認
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }
    
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(raw.password, 12);
    
    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        name: name || email,
        email,
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
            errorCode: error.code,
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
          errorCode: error.code,
        },
        { status: 500 }
      );
    }

    console.error('Registration error:', error);
    const message =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : '登録に失敗しました';
    const errorCode =
      error instanceof Error && 'code' in error
        ? String((error as NodeJS.ErrnoException).code)
        : undefined;
    return NextResponse.json(
      { error: message, ...(errorCode && { errorCode }) },
      { status: 500 }
    );
  }
}
