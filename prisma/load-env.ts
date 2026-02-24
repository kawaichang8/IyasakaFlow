/**
 * シード実行時に .env を読み込む（PrismaClient の初期化より前に実行すること）
 */
import path from 'path';
import { config } from 'dotenv';
const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });
// 一部の環境で DATABASE_URL に余分な引用符が含まれる場合があるため正規化
const raw = process.env.DATABASE_URL;
if (raw && (raw.startsWith('"') || raw.startsWith("'"))) {
  process.env.DATABASE_URL = raw.replace(/^["']|["']$/g, '');
}
