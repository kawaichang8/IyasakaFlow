import { PrismaClient } from '@prisma/client';

/**
 * Prismaクライアントのシングルトン
 * 開発環境でのホットリロード対策
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * データベース接続チェック
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * データベース切断（テスト用）
 */
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
