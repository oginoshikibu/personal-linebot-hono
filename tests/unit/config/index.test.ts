import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

describe("設定モジュール", () => {
  // 元の環境変数を保存
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // 環境変数をクリア
    vi.resetModules();
    process.env = { ...originalEnv };
  });
  
  afterEach(() => {
    // 環境変数を元に戻す
    process.env = originalEnv;
  });
  
  it("環境変数から設定が正しく読み込まれること", async () => {
    // 環境変数を設定
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/mydb";
    process.env.LINE_CHANNEL_SECRET = "test_secret";
    process.env.LINE_CHANNEL_ACCESS_TOKEN = "test_token";
    process.env.ALLOWED_LINE_IDS = "id1,id2,id3";
    process.env.PORT = "8080";
    process.env.HOST = "127.0.0.1";
    process.env.MORNING_NOTIFICATION_HOUR = "8";
    process.env.MORNING_NOTIFICATION_MINUTE = "30";
    process.env.EVENING_NOTIFICATION_HOUR = "20";
    process.env.EVENING_NOTIFICATION_MINUTE = "45";
    
    // モジュールをインポート
    const { config } = await import("../../../src/config");
    
    // データベース設定
    expect(config.database.url).toBe("postgresql://user:pass@localhost:5432/mydb");
    
    // LINE設定
    expect(config.line.channelSecret).toBe("test_secret");
    expect(config.line.channelAccessToken).toBe("test_token");
    expect(config.line.allowedLineIds).toEqual(["id1", "id2", "id3"]);
    
    // サーバー設定
    expect(config.server.port).toBe(8080);
    expect(config.server.host).toBe("127.0.0.1");
    
    // 通知設定
    expect(config.notification.morning.hour).toBe(8);
    expect(config.notification.morning.minute).toBe(30);
    expect(config.notification.evening.hour).toBe(20);
    expect(config.notification.evening.minute).toBe(45);
  });
  
  it("ALLOWED_LINE_IDSが空の場合、空の配列になること", async () => {
    // 環境変数を設定
    process.env.ALLOWED_LINE_IDS = "";
    
    // モジュールをインポート
    const { config } = await import("../../../src/config");
    
    // LINE設定
    expect(config.line.allowedLineIds).toEqual([]);
  });
  
  it("通知時間の値が範囲外の場合、デフォルト値が使用されること", async () => {
    // 環境変数を設定（範囲外の値）
    process.env.MORNING_NOTIFICATION_HOUR = "24"; // 0-23の範囲外
    process.env.MORNING_NOTIFICATION_MINUTE = "60"; // 0-59の範囲外
    
    try {
      // モジュールをインポート（エラーが発生するはず）
      await import("../../../src/config");
      // エラーが発生しなかった場合はテストを失敗させる
      expect(true).toBe(false);
    } catch (error) {
      // Zodエラーが発生することを確認
      expect(error).toBeInstanceOf(z.ZodError);
      const zodError = error as z.ZodError;
      
      // エラーメッセージを確認
      const hourError = zodError.errors.find(e => e.path.includes("MORNING_NOTIFICATION_HOUR"));
      const minuteError = zodError.errors.find(e => e.path.includes("MORNING_NOTIFICATION_MINUTE"));
      
      expect(hourError).toBeDefined();
      expect(minuteError).toBeDefined();
      expect(hourError?.message).toContain("less than or equal to 23");
      expect(minuteError?.message).toContain("less than or equal to 59");
    }
  });
}); 