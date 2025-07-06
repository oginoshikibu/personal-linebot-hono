import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../../../src/utils/logger";

describe("ロガーユーティリティ", () => {
  beforeEach(() => {
    // コンソール出力をモック
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    // モックをリセット
    vi.restoreAllMocks();
  });

  describe("info関数", () => {
    it("メッセージのみの場合、正しくフォーマットされたログを出力すること", () => {
      logger.info("テストメッセージ");
      expect(console.log).toHaveBeenCalledWith("[INFO] テストメッセージ", "");
    });

    it("追加データがある場合、メッセージと共に出力すること", () => {
      const data = { id: 1, name: "テスト" };
      logger.info("テストメッセージ", data);
      expect(console.log).toHaveBeenCalledWith("[INFO] テストメッセージ", data);
    });
  });

  describe("warn関数", () => {
    it("メッセージのみの場合、正しくフォーマットされた警告を出力すること", () => {
      logger.warn("警告メッセージ");
      expect(console.warn).toHaveBeenCalledWith("[WARN] 警告メッセージ", "");
    });

    it("追加データがある場合、メッセージと共に出力すること", () => {
      const data = { id: 1, name: "テスト" };
      logger.warn("警告メッセージ", data);
      expect(console.warn).toHaveBeenCalledWith("[WARN] 警告メッセージ", data);
    });
  });

  describe("error関数", () => {
    it("メッセージのみの場合、正しくフォーマットされたエラーを出力すること", () => {
      logger.error("エラーメッセージ");
      expect(console.error).toHaveBeenCalledWith("[ERROR] エラーメッセージ");
    });

    it("Errorオブジェクトがある場合、スタックトレースを出力すること", () => {
      const error = new Error("テストエラー");
      logger.error("エラーメッセージ", error);
      
      expect(console.error).toHaveBeenCalledWith("[ERROR] エラーメッセージ");
      expect(console.error).toHaveBeenCalledWith(error.stack);
    });

    it("Errorオブジェクト以外のデータがある場合、そのデータを出力すること", () => {
      const data = { code: 500, message: "サーバーエラー" };
      logger.error("エラーメッセージ", data);
      
      expect(console.error).toHaveBeenCalledWith("[ERROR] エラーメッセージ");
      expect(console.error).toHaveBeenCalledWith(data);
    });
  });

  describe("debug関数", () => {
    it("開発環境の場合、デバッグログを出力すること", () => {
      // 環境変数をモック
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      
      logger.debug("デバッグメッセージ");
      expect(console.debug).toHaveBeenCalledWith("[DEBUG] デバッグメッセージ", "");
      
      // 環境変数を元に戻す
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("本番環境の場合、デバッグログを出力しないこと", () => {
      // 環境変数をモック
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      
      logger.debug("デバッグメッセージ");
      expect(console.debug).not.toHaveBeenCalled();
      
      // 環境変数を元に戻す
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("追加データがある場合、メッセージと共に出力すること（開発環境）", () => {
      // 環境変数をモック
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      
      const data = { id: 1, name: "テスト" };
      logger.debug("デバッグメッセージ", data);
      expect(console.debug).toHaveBeenCalledWith("[DEBUG] デバッグメッセージ", data);
      
      // 環境変数を元に戻す
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
}); 