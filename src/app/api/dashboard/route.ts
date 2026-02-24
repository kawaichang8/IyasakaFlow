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
      
      // 案件（Opportunity）統計
      opportunitiesActive,

      // 連絡先の総数（はじめにガイド用）
      totalContacts,

      // 今月の活動数
      activityCountThisMonth,
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
      
      // 全取引（パイプライン計算用 + 次のアクション提案用）
      prisma.deal.findMany({
        where: {
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        },
        select: { id: true, name: true, value: true, probability: true, stage: true, expectedCloseDate: true },
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
      
      // 案件: 進行中（WON/LOST 以外）
      prisma.opportunity.findMany({
        where: { stage: { notIn: ['WON', 'LOST'] } },
        select: { amount: true, probability: true, stage: true },
      }),

      // 連絡先の総数
      prisma.contact.count(),

      // 今月の活動数（目標進捗用）
      prisma.interaction.count({
        where: { date: { gte: startOfMonth } },
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

    // 案件サマリー計算
    const oppTotalAmount = opportunitiesActive.reduce((s, o) => s + Number(o.amount), 0);
    const oppAvgProbability = opportunitiesActive.length
      ? Math.round(opportunitiesActive.reduce((s, o) => s + o.probability, 0) / opportunitiesActive.length)
      : 0;
    const oppWeightedAmount = opportunitiesActive.reduce(
      (s, o) => s + Number(o.amount) * (o.probability / 100), 0,
    );

    // 次のアクション提案用パイプライン
    const activePipeline = allDeals.map((d) => ({
      id: d.id,
      name: d.name,
      stage: d.stage,
      value: Number(d.value),
      expectedCloseDate: d.expectedCloseDate?.toISOString() ?? null,
    }));

    // レスポンス構築
    const response = {
      stepCounts: {
        accounts: totalAccounts,
        contacts: totalContacts,
        deals: allDeals.length,
        tasks: pendingTasks + completedTasksThisMonth,
      },
      activePipeline,
      goalActuals: {
        wonThisMonth,
        wonDealCount: wonDealsThisMonth.length,
        activityCount: activityCountThisMonth,
      },
      needToFollowUp,
      opportunitySummary: {
        activeCount: opportunitiesActive.length,
        totalAmount: oppTotalAmount,
        avgProbability: oppAvgProbability,
        weightedAmount: Math.round(oppWeightedAmount),
      },
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
  } catch (error: unknown) {
    console.error('Error fetching dashboard data:', error);
    const message = error instanceof Error ? error.message : '';
    const isSchemaError =
      typeof message === 'string' &&
      (message.includes('column') ||
        message.includes('does not exist') ||
        message.includes('Unknown arg') ||
        (error as { code?: string })?.code === 'P2010');
    if (isSchemaError) {
      return NextResponse.json(
        {
          error: 'データベースのスキーマがアプリと一致していません。本番環境で「npx prisma db push」を実行してマイグレーションを適用してください。',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'ダッシュボードデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}
