import './load-env';
import { PrismaClient, UserRole, AccountStatus, InfluenceLevel, ContactStatus, DealStage, TaskPriority, TaskStatus, InteractionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * シードデータ
 * 開発・デモ用のサンプルデータを投入
 */
async function main() {
  console.log('🌱 シードデータの投入を開始...');

  // ==============================================
  // ユーザー作成
  // ==============================================
  console.log('👤 ユーザーを作成中...');

  // テスト用パスワード（開発環境のみ）
  // admin@crm-app.example.com / Admin123!
  // sales@crm-app.example.com / Sales123!
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const salesPassword = await bcrypt.hash('Sales123!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crm-app.example.com' },
    update: {
      password: adminPassword,
    },
    create: {
      email: 'admin@crm-app.example.com',
      name: '管理者',
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@crm-app.example.com' },
    update: {
      password: salesPassword,
    },
    create: {
      email: 'sales@crm-app.example.com',
      name: '営業 太郎',
      password: salesPassword,
      role: UserRole.MEMBER,
      emailVerified: new Date(),
    },
  });

  console.log(`  ✓ ユーザー作成完了: ${adminUser.name}, ${salesUser.name}`);
  console.log('  📧 テストアカウント:');
  console.log('     - admin@crm-app.example.com / Admin123!');
  console.log('     - sales@crm-app.example.com / Sales123!');

  // ==============================================
  // 企業アカウント作成
  // ==============================================
  console.log('🏢 企業アカウントを作成中...');

  const accounts = await Promise.all([
    prisma.account.upsert({
      where: { id: 'acc_abc_corp' },
      update: {},
      create: {
        id: 'acc_abc_corp',
        name: '株式会社ABC',
        industry: 'IT・ソフトウェア',
        website: 'https://abc-corp.example.com',
        phone: '03-1234-5678',
        email: 'info@abc-corp.example.com',
        address: '1-2-3 ABCビル5F',
        city: '渋谷区',
        state: '東京都',
        postalCode: '150-0001',
        employeeCount: 150,
        annualRevenue: BigInt(500000000),
        status: AccountStatus.ACTIVE,
        description: 'ITソリューションを提供する成長企業。クラウドサービスの導入に積極的。',
        tags: ['優良顧客', 'IT', 'クラウド'],
        ownerId: salesUser.id,
      },
    }),
    prisma.account.upsert({
      where: { id: 'acc_xyz_mfg' },
      update: {},
      create: {
        id: 'acc_xyz_mfg',
        name: 'XYZ株式会社',
        industry: '製造業',
        website: 'https://xyz-mfg.example.com',
        phone: '06-9876-5432',
        email: 'contact@xyz-mfg.example.com',
        address: '4-5-6 XYZ工業ビル',
        city: '北区',
        state: '大阪府',
        postalCode: '530-0001',
        employeeCount: 500,
        annualRevenue: BigInt(2000000000),
        status: AccountStatus.ACTIVE,
        description: '精密機器の製造メーカー。DX推進中。',
        tags: ['製造', '大企業', 'DX'],
        ownerId: salesUser.id,
      },
    }),
    prisma.account.upsert({
      where: { id: 'acc_def_trading' },
      update: {},
      create: {
        id: 'acc_def_trading',
        name: 'DEF商事株式会社',
        industry: '商社',
        website: 'https://def-trading.example.com',
        phone: '052-1111-2222',
        address: '7-8-9',
        city: '中区',
        state: '愛知県',
        postalCode: '460-0001',
        employeeCount: 80,
        annualRevenue: BigInt(300000000),
        status: AccountStatus.PROSPECT,
        description: '輸出入を専門とする商社。新規開拓中。',
        tags: ['新規', '商社'],
        ownerId: salesUser.id,
      },
    }),
    prisma.account.upsert({
      where: { id: 'acc_ghi_finance' },
      update: {},
      create: {
        id: 'acc_ghi_finance',
        name: 'GHI金融株式会社',
        industry: '金融・保険',
        phone: '03-3333-4444',
        city: '千代田区',
        state: '東京都',
        postalCode: '100-0001',
        employeeCount: 1200,
        annualRevenue: BigInt(10000000000),
        status: AccountStatus.ACTIVE,
        description: '大手金融機関。セキュリティ要件が厳しい。',
        tags: ['金融', '大企業', 'セキュリティ重視'],
        ownerId: adminUser.id,
      },
    }),
  ]);

  console.log(`  ✓ 企業アカウント作成完了: ${accounts.length}件`);

  // ==============================================
  // 連絡先作成
  // ==============================================
  console.log('👥 連絡先を作成中...');

  const contacts = await Promise.all([
    // ABC Corp の連絡先
    prisma.contact.upsert({
      where: { id: 'con_tanaka' },
      update: {},
      create: {
        id: 'con_tanaka',
        name: '田中太郎',
        firstName: '太郎',
        lastName: '田中',
        email: 'tanaka@abc-corp.example.com',
        phone: '03-1234-5678',
        mobile: '090-1234-5678',
        role: '代表取締役',
        department: '経営',
        accountId: 'acc_abc_corp',
        influenceLevel: InfluenceLevel.DECISION_MAKER,
        status: ContactStatus.ACTIVE,
        notes: '創業者。IT導入に積極的。毎週火曜日の午前中が連絡しやすい。',
        tags: ['キーパーソン', '経営層'],
        socialProfiles: JSON.stringify({ linkedin: 'https://linkedin.com/in/tanaka' }),
        ownerId: salesUser.id,
        lastContactDate: new Date('2024-01-20'),
      },
    }),
    prisma.contact.upsert({
      where: { id: 'con_suzuki' },
      update: {},
      create: {
        id: 'con_suzuki',
        name: '鈴木花子',
        firstName: '花子',
        lastName: '鈴木',
        email: 'suzuki@abc-corp.example.com',
        phone: '03-1234-5679',
        mobile: '090-2345-6789',
        role: '営業部長',
        department: '営業部',
        accountId: 'acc_abc_corp',
        influenceLevel: InfluenceLevel.INFLUENCER,
        status: ContactStatus.ACTIVE,
        notes: '日程調整は鈴木さんを通す。レスポンスが早い。',
        tags: ['営業窓口'],
        ownerId: salesUser.id,
        lastContactDate: new Date('2024-01-25'),
      },
    }),
    prisma.contact.upsert({
      where: { id: 'con_sato' },
      update: {},
      create: {
        id: 'con_sato',
        name: '佐藤健一',
        firstName: '健一',
        lastName: '佐藤',
        email: 'sato@abc-corp.example.com',
        role: 'システム部長',
        department: 'システム部',
        accountId: 'acc_abc_corp',
        influenceLevel: InfluenceLevel.USER,
        status: ContactStatus.ACTIVE,
        notes: '技術的な質問の窓口。',
        tags: ['技術担当'],
        ownerId: salesUser.id,
      },
    }),
    // XYZ の連絡先
    prisma.contact.upsert({
      where: { id: 'con_yamada' },
      update: {},
      create: {
        id: 'con_yamada',
        name: '山田一郎',
        firstName: '一郎',
        lastName: '山田',
        email: 'yamada@xyz-mfg.example.com',
        phone: '06-9876-5432',
        mobile: '080-3456-7890',
        role: '購買部長',
        department: '購買部',
        accountId: 'acc_xyz_mfg',
        influenceLevel: InfluenceLevel.DECISION_MAKER,
        status: ContactStatus.ACTIVE,
        notes: '予算管理担当。価格交渉が厳しいが、品質重視。',
        tags: ['購買決裁者'],
        ownerId: salesUser.id,
        lastContactDate: new Date('2024-02-10'),
      },
    }),
    // DEF の連絡先
    prisma.contact.upsert({
      where: { id: 'con_takahashi' },
      update: {},
      create: {
        id: 'con_takahashi',
        name: '高橋次郎',
        firstName: '次郎',
        lastName: '高橋',
        email: 'takahashi@def-trading.example.com',
        phone: '052-1111-2222',
        mobile: '070-4567-8901',
        role: '事業部長',
        department: '事業企画部',
        accountId: 'acc_def_trading',
        influenceLevel: InfluenceLevel.INFLUENCER,
        status: ContactStatus.ACTIVE,
        notes: '新規開拓中。興味あり。',
        tags: ['新規'],
        ownerId: salesUser.id,
        lastContactDate: new Date('2024-03-05'),
      },
    }),
  ]);

  console.log(`  ✓ 連絡先作成完了: ${contacts.length}件`);

  // ==============================================
  // 取引（案件）作成
  // ==============================================
  console.log('💼 取引を作成中...');

  const deals = await Promise.all([
    prisma.deal.upsert({
      where: { id: 'deal_abc_cloud' },
      update: {},
      create: {
        id: 'deal_abc_cloud',
        name: 'クラウドサービス導入',
        value: BigInt(3000000),
        currency: 'JPY',
        stage: DealStage.PROPOSAL,
        probability: 60,
        expectedCloseDate: new Date('2024-03-31'),
        description: 'ABCコーポレーションへのクラウドサービス導入提案',
        tags: ['クラウド', '新規'],
        accountId: 'acc_abc_corp',
        contactId: 'con_tanaka',
        ownerId: salesUser.id,
      },
    }),
    prisma.deal.upsert({
      where: { id: 'deal_xyz_dx' },
      update: {},
      create: {
        id: 'deal_xyz_dx',
        name: 'DX推進プロジェクト',
        value: BigInt(15000000),
        currency: 'JPY',
        stage: DealStage.NEGOTIATION,
        probability: 75,
        expectedCloseDate: new Date('2024-04-30'),
        description: 'XYZ製造のDX推進支援',
        tags: ['DX', '大型案件'],
        accountId: 'acc_xyz_mfg',
        contactId: 'con_yamada',
        ownerId: salesUser.id,
      },
    }),
    prisma.deal.upsert({
      where: { id: 'deal_def_initial' },
      update: {},
      create: {
        id: 'deal_def_initial',
        name: '初期導入提案',
        value: BigInt(500000),
        currency: 'JPY',
        stage: DealStage.LEAD,
        probability: 20,
        expectedCloseDate: new Date('2024-06-30'),
        description: 'DEF商事への初期提案',
        tags: ['新規開拓'],
        accountId: 'acc_def_trading',
        contactId: 'con_takahashi',
        ownerId: salesUser.id,
      },
    }),
  ]);

  console.log(`  ✓ 取引作成完了: ${deals.length}件`);

  // ==============================================
  // インタラクション作成
  // ==============================================
  console.log('📝 インタラクションを作成中...');

  const interactions = await Promise.all([
    prisma.interaction.create({
      data: {
        type: InteractionType.MEETING,
        subject: '初回打ち合わせ',
        note: '課題のヒアリングを実施。クラウド移行に興味あり。来月中に提案書を提出予定。',
        date: new Date('2024-01-20'),
        duration: 60,
        outcome: '好感触',
        nextAction: '提案書作成',
        nextActionDate: new Date('2024-01-31'),
        accountId: 'acc_abc_corp',
        contactId: 'con_tanaka',
        dealId: 'deal_abc_cloud',
        createdById: salesUser.id,
      },
    }),
    prisma.interaction.create({
      data: {
        type: InteractionType.EMAIL,
        subject: '提案書送付',
        note: '提案書を送付。確認後にフィードバックをいただく予定。',
        date: new Date('2024-01-25'),
        accountId: 'acc_abc_corp',
        contactId: 'con_suzuki',
        dealId: 'deal_abc_cloud',
        createdById: salesUser.id,
      },
    }),
    prisma.interaction.create({
      data: {
        type: InteractionType.CALL,
        subject: '提案書についての質問回答',
        note: '提案書についての質問に回答。概ね好意的な反応。',
        date: new Date('2024-01-28'),
        duration: 30,
        outcome: '質問解決',
        accountId: 'acc_abc_corp',
        contactId: 'con_tanaka',
        dealId: 'deal_abc_cloud',
        createdById: salesUser.id,
      },
    }),
    prisma.interaction.create({
      data: {
        type: InteractionType.MEETING,
        subject: 'DX要件ヒアリング',
        note: 'DX推進の現状と課題をヒアリング。製造ラインのデジタル化が最優先。',
        date: new Date('2024-02-10'),
        duration: 90,
        outcome: '具体的な要件が明確に',
        nextAction: '詳細見積もり作成',
        accountId: 'acc_xyz_mfg',
        contactId: 'con_yamada',
        dealId: 'deal_xyz_dx',
        createdById: salesUser.id,
      },
    }),
  ]);

  console.log(`  ✓ インタラクション作成完了: ${interactions.length}件`);

  // ==============================================
  // タスク作成
  // ==============================================
  console.log('✅ タスクを作成中...');

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'ABC社へフォローアップ電話',
        description: '提案書の検討状況を確認する',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明日
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        accountId: 'acc_abc_corp',
        contactId: 'con_tanaka',
        dealId: 'deal_abc_cloud',
        assigneeId: salesUser.id,
        createdById: salesUser.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'XYZ社 詳細見積もり作成',
        description: 'DX推進プロジェクトの詳細見積もりを作成',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        accountId: 'acc_xyz_mfg',
        dealId: 'deal_xyz_dx',
        assigneeId: salesUser.id,
        createdById: salesUser.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'DEF商事 初回アポイント設定',
        description: '興味を示しているので、初回打ち合わせを設定する',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        accountId: 'acc_def_trading',
        contactId: 'con_takahashi',
        assigneeId: salesUser.id,
        createdById: salesUser.id,
      },
    }),
  ]);

  console.log(`  ✓ タスク作成完了: ${tasks.length}件`);

  console.log('');
  console.log('🎉 シードデータの投入が完了しました！');
  console.log('');
  console.log('作成されたデータ:');
  console.log(`  - ユーザー: 2件`);
  console.log(`  - 企業アカウント: ${accounts.length}件`);
  console.log(`  - 連絡先: ${contacts.length}件`);
  console.log(`  - 取引: ${deals.length}件`);
  console.log(`  - インタラクション: ${interactions.length}件`);
  console.log(`  - タスク: ${tasks.length}件`);
}

main()
  .catch((e) => {
    console.error('❌ シードエラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
