import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports
 * レポート用の統計データを取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 期間パラメータ
    const period = searchParams.get('period') || 'month'; // day, week, month, quarter, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // 期間の計算
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;
    
    if (startDate && endDate) {
      periodStart = new Date(startDate);
      periodEnd = new Date(endDate);
    } else {
      switch (period) {
        case 'day':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          periodStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1);
          break;
        case 'month':
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    // 前期間の計算（比較用）
    const periodLength = periodEnd.getTime() - periodStart.getTime();
    const prevPeriodStart = new Date(periodStart.getTime() - periodLength);
    const prevPeriodEnd = new Date(periodStart.getTime() - 1);

    // データを並列取得
    const [
      // 売上関連
      wonDeals,
      prevWonDeals,
      lostDeals,
      
      // パイプライン
      pipelineDeals,
      dealsByStage,
      
      // 活動関連
      interactions,
      prevInteractions,
      interactionsByType,
      
      // タスク関連
      completedTasks,
      prevCompletedTasks,
      
      // アカウント関連
      newAccounts,
      prevNewAccounts,
      
      // 連絡先関連
      newContacts,
      prevNewContacts,
      
      // ユーザー別成績
      userPerformance,
      
      // 日別データ（売上推移）
      dailyDeals,
    ] = await Promise.all([
      // 今期の成約
      prisma.deal.findMany({
        where: {
          stage: 'CLOSED_WON',
          actualCloseDate: { gte: periodStart, lte: periodEnd },
        },
        select: { value: true, actualCloseDate: true, ownerId: true },
      }),
      
      // 前期の成約
      prisma.deal.findMany({
        where: {
          stage: 'CLOSED_WON',
          actualCloseDate: { gte: prevPeriodStart, lte: prevPeriodEnd },
        },
        select: { value: true },
      }),
      
      // 今期の失注
      prisma.deal.findMany({
        where: {
          stage: 'CLOSED_LOST',
          actualCloseDate: { gte: periodStart, lte: periodEnd },
        },
        select: { value: true },
      }),
      
      // パイプライン
      prisma.deal.findMany({
        where: {
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
        select: { value: true, probability: true, stage: true, expectedCloseDate: true },
      }),
      
      // ステージ別
      prisma.deal.groupBy({
        by: ['stage'],
        _count: { id: true },
        _sum: { value: true },
      }),
      
      // 今期のインタラクション
      prisma.interaction.findMany({
        where: {
          date: { gte: periodStart, lte: periodEnd },
        },
        select: { type: true, date: true, createdById: true },
      }),
      
      // 前期のインタラクション
      prisma.interaction.count({
        where: {
          date: { gte: prevPeriodStart, lte: prevPeriodEnd },
        },
      }),
      
      // タイプ別インタラクション
      prisma.interaction.groupBy({
        by: ['type'],
        where: {
          date: { gte: periodStart, lte: periodEnd },
        },
        _count: { id: true },
      }),
      
      // 今期の完了タスク
      prisma.task.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      
      // 前期の完了タスク
      prisma.task.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
        },
      }),
      
      // 今期の新規アカウント
      prisma.account.count({
        where: {
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      
      // 前期の新規アカウント
      prisma.account.count({
        where: {
          createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
        },
      }),
      
      // 今期の新規連絡先
      prisma.contact.count({
        where: {
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      
      // 前期の新規連絡先
      prisma.contact.count({
        where: {
          createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
        },
      }),
      
      // ユーザー別成績
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          ownedDeals: {
            where: {
              stage: 'CLOSED_WON',
              actualCloseDate: { gte: periodStart, lte: periodEnd },
            },
            select: { value: true },
          },
          interactions: {
            where: {
              date: { gte: periodStart, lte: periodEnd },
            },
            select: { id: true },
          },
        },
      }),
      
      // 日別成約データ
      prisma.deal.findMany({
        where: {
          stage: 'CLOSED_WON',
          actualCloseDate: { gte: periodStart, lte: periodEnd },
        },
        select: { value: true, actualCloseDate: true },
        orderBy: { actualCloseDate: 'asc' },
      }),
    ]);

    // 集計処理
    const totalWon = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);
    const prevTotalWon = prevWonDeals.reduce((sum, d) => sum + Number(d.value), 0);
    const totalLost = lostDeals.reduce((sum, d) => sum + Number(d.value), 0);
    
    const pipelineTotal = pipelineDeals.reduce((sum, d) => sum + Number(d.value), 0);
    const weightedPipeline = pipelineDeals.reduce(
      (sum, d) => sum + Number(d.value) * (d.probability / 100), 0
    );

    // 成長率計算
    const revenueGrowth = prevTotalWon > 0 
      ? ((totalWon - prevTotalWon) / prevTotalWon) * 100 
      : totalWon > 0 ? 100 : 0;

    // 成約率計算
    const winRate = (wonDeals.length + lostDeals.length) > 0
      ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
      : 0;

    // ステージ別データ整形
    const stageLabels: Record<string, string> = {
      LEAD: 'リード',
      QUALIFIED: '見込み評価済み',
      PROPOSAL: '提案',
      NEGOTIATION: '交渉',
      CLOSED_WON: '成約',
      CLOSED_LOST: '失注',
    };
    
    const pipelineByStage = dealsByStage.map((s) => ({
      stage: stageLabels[s.stage] || s.stage,
      stageKey: s.stage.toLowerCase(),
      count: s._count.id,
      value: Number(s._sum.value || 0),
    }));

    // インタラクションタイプ別
    const typeLabels: Record<string, string> = {
      CALL: '電話',
      EMAIL: 'メール',
      MEETING: 'ミーティング',
      NOTE: 'メモ',
      TASK: 'タスク',
    };
    
    const activityByType = interactionsByType.map((i) => ({
      type: typeLabels[i.type] || i.type,
      typeKey: i.type.toLowerCase(),
      count: i._count.id,
    }));

    // ユーザー別ランキング
    const leaderboard = userPerformance
      .map((u) => {
        const user = u as typeof u & { ownedDeals: { value: bigint }[]; interactions: { id: string }[] };
        return {
          id: u.id,
          name: u.name,
          revenue: user.ownedDeals.reduce((sum: number, d: { value: bigint }) => sum + Number(d.value), 0),
          dealCount: user.ownedDeals.length,
          activityCount: user.interactions.length,
        };
      })
      .filter((u) => u.revenue > 0 || u.activityCount > 0)
      .sort((a, b) => b.revenue - a.revenue);

    // 日別推移データ（グラフ用）
    const dailyData: Record<string, { date: string; value: number; count: number }> = {};
    dailyDeals.forEach((deal) => {
      if (deal.actualCloseDate) {
        const dateKey = deal.actualCloseDate.toISOString().split('T')[0];
        if (dateKey === undefined) return;
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { date: dateKey, value: 0, count: 0 };
        }
        dailyData[dateKey].value += Number(deal.value);
        dailyData[dateKey].count += 1;
      }
    });
    const dailyTrend = Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // レスポンス構築
    const response = {
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        label: period,
      },
      summary: {
        revenue: {
          current: totalWon,
          previous: prevTotalWon,
          growth: Math.round(revenueGrowth * 10) / 10,
          wonCount: wonDeals.length,
          lostCount: lostDeals.length,
          lostValue: totalLost,
          winRate: Math.round(winRate * 10) / 10,
        },
        pipeline: {
          total: pipelineTotal,
          weighted: weightedPipeline,
          count: pipelineDeals.length,
        },
        activity: {
          current: interactions.length,
          previous: prevInteractions,
          growth: prevInteractions > 0 
            ? Math.round(((interactions.length - prevInteractions) / prevInteractions) * 1000) / 10
            : interactions.length > 0 ? 100 : 0,
          completedTasks,
          prevCompletedTasks,
        },
        acquisition: {
          newAccounts,
          prevNewAccounts,
          newContacts,
          prevNewContacts,
        },
      },
      charts: {
        pipelineByStage,
        activityByType,
        dailyTrend,
      },
      leaderboard,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'レポートの取得に失敗しました' },
      { status: 500 }
    );
  }
}
