import { describe, it, expect, vi } from "vitest";
import { AppError, asyncHandler } from "../../../src/utils/error";

// ロガーのモック
vi.mock("../../../src/utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("エラーユーティリティ", () => {
  describe("AppErrorクラス", () => {
    it("デフォルト値でエラーが正しく作成されること", () => {
      const error = new AppError("テストエラー");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("テストエラー");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it("カスタムステータスコードでエラーが作成されること", () => {
      const error = new AppError("テストエラー", 400);
      
      expect(error.message).toBe("テストエラー");
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it("カスタムステータスコードと運用フラグでエラーが作成されること", () => {
      const error = new AppError("テストエラー", 400, false);
      
      expect(error.message).toBe("テストエラー");
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(false);
    });

    it("スタックトレースが取得されること", () => {
      const error = new AppError("テストエラー");
      expect(error.stack).toBeDefined();
    });
  });

  describe("asyncHandler関数", () => {
    it("正常に実行される関数をラップすること", async () => {
      const mockFn = vi.fn().mockResolvedValue("成功");
      const wrappedFn = asyncHandler(mockFn);
      
      const result = await wrappedFn("引数1", "引数2");
      
      expect(result).toBe("成功");
      expect(mockFn).toHaveBeenCalledWith("引数1", "引数2");
    });

    it("エラーが発生した場合、エラーをスローすること", async () => {
      const testError = new Error("テストエラー");
      const mockFn = vi.fn().mockRejectedValue(testError);
      const wrappedFn = asyncHandler(mockFn);
      
      await expect(wrappedFn()).rejects.toThrow("テストエラー");
    });
  });
}); 