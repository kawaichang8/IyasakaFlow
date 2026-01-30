/**
 * データベース関連のエクスポート
 */

export { prisma, checkDbConnection, disconnectDb } from './prisma';

// Prisma型のre-export（コンポーネントで使用する場合）
export type {
  User,
  Team,
  Account,
  Contact,
  Deal,
  Interaction,
  Task,
} from '@prisma/client';
