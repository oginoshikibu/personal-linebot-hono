import { describe, it, expect, vi, beforeEach } from "vitest";

// PrismaClientをモック
vi.mock("@prisma/client", () => {
  const PrismaClient = vi.fn(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  }));
  return { PrismaClient };
});

describe("Prismaクライアントのシングルトンパターン", () => {
  beforeEach(() => {
    // グローバルのprismaClientをクリア
    vi.resetModules();
    global.prismaClient = undefined;
  });

  it("開発環境でグローバル変数にPrismaClientが保存されること", async () => {
    // 環境変数をモック
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    // モジュールをインポート
    const { prisma } = await import("../../../src/lib/prisma");

    // グローバル変数に保存されていることを確認
    expect(global.prismaClient).toBeDefined();
    expect(global.prismaClient).toBe(prisma);

    // 環境変数を元に戻す
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("本番環境でグローバル変数にPrismaClientが保存されないこと", async () => {
    // 環境変数をモック
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    // モジュールをインポート
    await import("../../../src/lib/prisma");

    // グローバル変数に保存されていないことを確認
    expect(global.prismaClient).toBeUndefined();

    // 環境変数を元に戻す
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("同じインスタンスが返されること", async () => {
    // 環境変数をモック
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    
    // 1回目のインポート
    const { prisma: prisma1 } = await import("../../../src/lib/prisma");
    
    // モジュールをリセット
    vi.resetModules();
    
    // グローバル変数にインスタンスを設定
    global.prismaClient = prisma1;
    
    // 2回目のインポート
    const { prisma: prisma2 } = await import("../../../src/lib/prisma");
    
    // 同じインスタンスであることを確認
    expect(prisma2).toBe(prisma1);
    
    // 環境変数を元に戻す
    process.env.NODE_ENV = originalNodeEnv;
  });
}); 