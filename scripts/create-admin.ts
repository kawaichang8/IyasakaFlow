/**
 * 管理者ユーザーを1件だけ作成するスクリプト
 * ログインできない場合: npx tsx scripts/create-admin.ts を実行後、admin@crm-app.example.com / Admin123! でログイン
 */
import { config } from 'dotenv';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

config(); // .env を読む（未設定時は何もしない）。GitHub Actions では DATABASE_URL が env で渡る
const raw = process.env.DATABASE_URL;
if (raw && (raw.startsWith('"') || raw.startsWith("'"))) {
  process.env.DATABASE_URL = raw.replace(/^["']|["']$/g, '');
}

const prisma = new PrismaClient();

async function main() {
  console.log('管理者ユーザーを作成しています...');
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'admin@crm-app.example.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@crm-app.example.com',
      name: '管理者',
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log('✓ 作成完了:', user.email);
  console.log('  ログイン: admin@crm-app.example.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('エラー:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
