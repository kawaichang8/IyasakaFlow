import { NextResponse } from 'next/server';
import { prisma, checkDbConnection } from '@/lib/db';

/**
 * GET /api/health
 * ヘルスチェックエンドポイント
 * アプリケーションとデータベースの接続状態を確認
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // データベース接続チェック
    const dbConnected = await checkDbConnection();
    
    // データベースの統計情報（接続成功時のみ）
    let dbStats = null;
    if (dbConnected) {
      const [accountCount, contactCount, dealCount] = await Promise.all([
        prisma.account.count(),
        prisma.contact.count(),
        prisma.deal.count(),
      ]);
      
      dbStats = {
        accounts: accountCount,
        contacts: contactCount,
        deals: dealCount,
      };
    }
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: dbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '0.1.0',
      services: {
        database: {
          status: dbConnected ? 'connected' : 'disconnected',
          type: 'postgresql',
          stats: dbStats,
        },
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        error: 'Health check failed',
        services: {
          database: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      },
      { status: 503 }
    );
  }
}
