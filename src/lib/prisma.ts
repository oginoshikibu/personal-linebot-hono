import { PrismaClient } from '@prisma/client';

// グローバルオブジェクトの型定義
declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

// シングルトンパターンでPrismaClientを提供
export const prisma = global.prismaClient || new PrismaClient();

// 開発環境の場合のみグローバル変数にPrismaClientを保存
if (process.env.NODE_ENV !== 'production') {
  global.prismaClient = prisma;
}

export default prisma; 