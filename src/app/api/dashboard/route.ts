import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard
 * ダッシュボード用の統計データを取得
 */
export async function GET(_request: NextRequest) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 並列でデータを取得
    const [
      // アカウント統計
      totalAccounts,
      newAccountsThisMonth,
      newAccountsLastMonth,
      
      // 取引統計
      allDeals,
      wonDealsThisMonth,
      wonDealsLastMonth,
      
      // タスク統計
      pendingTasks,
      overdueTasks,
      completedTasksThisMonth,
      
      // パイプライン統計
      pipelineByStage,
      
      // 最近のインタラクション
      recentInteractions,
      
      // 今日のタスク
      todaysTasks,
      
      // 月別成約データ（今年）
      monthlyWonDeals,
      
      // 要フォロー（7日以上連絡していない企業）
      needToFollowUpRaw,
    ] = await Promise.all([
      // アカウント
      prisma.account.count(),
      prisma.account.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.account.count({
        where: { 
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      
      // 全取引（パイプライン計算用）
      prisma.deal.findMany({
        where: {
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
        select: { value: true, probability: true, stage: true },
      }),
      
      // 今月の成約
      prisma.deal.findMany({
        where: {
          stage: 'CLOSED_WON',
          actualCloseDate: { gte: startOfMonth },
        },
        select: { value: true },
      }),
      
      // 先月の成約
      prisma.deal.findMany({
        where: {
          stage: 'CLOSED_WON',
          actualCloseDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        select: { value: true },
      }),
      
      // 未完了タスク
      prisma.task.count({
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
      
      // 期限切れタスク
      prisma.task.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lt: now },
        },
      }),
      
      // 今月完了タスク
      prisma.task.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: startOfMonth },
        },
      }),
      
      // ステージ別パイプライン
      prisma.deal.groupBy({
        by: ['stage'],
        where: { stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
        _count: { id: true },
        _sum: { value: true },
      }),
      
      // 最近のインタラクション
      prisma.interaction.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: {
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      
      // 今日のタスク
      prisma.task.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          OR: [
            {
              dueDate: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
              },
            },
            { dueDate: { lt: now } }, // 期限切れも含む
          ],
        },
        take: 10,
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        include: {
          account: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } },
        },
      }),
      
      // 月別成約（今年）
      prisma.deal.findMany({
        where: {
          stage: 'CLOSED_WON',
          actualCloseDate: { gte: startOfYear },
        },
        select: { value: true, actualCloseDate: true },
      }),
      
      // 要フォロー: 企業ごとの最終活動日を取得
      prisma.interaction.groupBy({
        by: ['accountId'],
        _max: { date: true },
        where: { accountId: { not: null } },
      }),
    ]);

    // KPI計算
    const pipelineTotal = allDeals.reduce((sum, d) => sum + Number(d.value), 0);
    const weightedPipeline = allDeals.reduce(
      (sum, d) => sum + Number(d.value) * (d.probability / 100),
      0
    );
    const wonThisMonth = wonDealsThisMonth.reduce((sum, d) => sum + Number(d.value), 0);
    const wonLastMonth = wonDealsLastMonth.reduce((sum, d) => sum + Number(d.value), 0);
    
    // 成長率計算
    const revenueGrowth = wonLastMonth > 0 
      ? ((wonThisMonth - wonLastMonth) / wonLastMonth) * 100 
      : wonThisMonth > 0 ? 100 : 0;
    const accountGrowth = newAccountsLastMonth > 0
      ? ((newAccountsThisMonth - newAccountsLastMonth) / newAccountsLastMonth) * 100
      : newAccountsThisMonth > 0 ? 100 : 0;

    // ステージ別データ整形
    const stageOrder = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'];
    const stageLabels: Record<string, string> = {
      LEAD: 'リード',
      QUALIFIED: '見込み評価済み',
      PROPOSAL: '提案',
      NEGOTIATION: '交渉',
    };
    
    const pipelineData = stageOrder.map((stage) => {
      const data = pipelineByStage.find((p) => p.stage === stage);
      return {
        stage: stageLabels[stage] || stage,
        count: data?._count.id || 0,
        value: Number(data?._sum.value || 0),
      };
    });

    // 月別成約データ整形
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i;
      const deals = monthlyWonDeals.filter((d) => {
        const closeDate = d.actualCloseDate;
        return closeDate && closeDate.getMonth() === month;
      });
      const total = deals.reduce((sum, d) => sum + Number(d.value), 0);
      return {
        month: `${month + 1}月`,
        value: total,
        count: deals.length,
      };
    });

    // 要フォロー: 7日以上連絡していない企業を最大10件
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const allAccounts = await prisma.account.findMany({
      select: { id: true, name: true },
      take: 500,
    });
    const needToFollowUp = allAccounts
      .filter((a) => {
        const maxDate = needToFollowUpRaw.find((r) => r.accountId === a.id)?._max?.date;
        return !maxDate || maxDate < sevenDaysAgo;
      })
      .slice(0, 10)
      .map((a) => {
        const maxDate = needToFollowUpRaw.find((r) => r.accountId === a.id)?._max?.date;
        return {
          id: a.id,
          name: a.name,
          lastActivityAt: maxDate?.toISOString() ?? null,
        };
      });

    // レスポンス構築
    const response = {
      needToFollowUp,
      kpi: {
        pipelineTotal,
        weightedPipeline,
        wonThisMonth,
        wonLastMonth,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        totalAccounts,
        newAccountsThisMonth,
        accountGrowth: Math.round(accountGrowth * 10) / 10,
        pendingTasks,
        overdueTasks,
        completedTasksThisMonth,
        dealCount: allDeals.length,
      },
      pipeline: pipelineData,
      monthlyRevenue: monthlyData,
      recentActivity: recentInteractions.map((i) => ({
        id: i.id,
        type: i.type.toLowerCase(),
        subject: i.subject,
        note: i.note,
        date: i.date.toISOString(),
        account: i.account,
        contact: i.contact,
        deal: i.deal,
        createdBy: i.createdBy,
      })),
      todaysTasks: todaysTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate?.toISOString() || null,
        priority: t.priority.toLowerCase(),
        status: t.status.toLowerCase(),
        account: t.account,
        deal: t.deal,
        isOverdue: t.dueDate && t.dueDate < now,
      })),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'ダッシュボードデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}
