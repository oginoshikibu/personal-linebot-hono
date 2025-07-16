import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";

// configのモック
vi.mock("../../../src/config", () => ({
  config: {
    line: {
      channelSecret: "testSecret",
      allowedLineIds: ["user1", "user2", "user3"],
    },
  },
}));

// loggerのモック
vi.mock("../../../src/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// prismaのモック
vi.mock("../../../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        // テスト用のユーザーデータ
        const testUsers = {
          user1: { id: "1", lineId: "user1", name: "User 1" },
          user2: { id: "2", lineId: "user2", name: "User 2" },
          user3: { id: "3", lineId: "user3", name: "User 3" },
        };
        
        // lineIdに一致するユーザーを返す
        return Promise.resolve(testUsers[where.lineId] || null);
      }),
    },
  },
}));

// auth関数をインポート - モック設定の後にインポートする
import { verifyLineSignature, isAllowedLineId, lineSignatureMiddleware } from "../../../src/utils/auth";

describe("認証ユーティリティ", () => {
  describe("verifyLineSignature関数", () => {
    it("有効な署名の場合にtrueを返すこと", () => {
      const body = JSON.stringify({ events: [{ type: "message" }] });
      const hmac = crypto.createHmac("SHA256", "testSecret");
      const signature = hmac.update(body).digest("base64");
      
      const result = verifyLineSignature(signature, body);
      
      expect(result).toBe(true);
    });

    it("無効な署名の場合にfalseを返すこと", () => {
      const body = JSON.stringify({ events: [{ type: "message" }] });
      const signature = "invalid_signature";
      
      const result = verifyLineSignature(signature, body);
      
      expect(result).toBe(false);
    });

    it("チャネルシークレットが設定されていない場合にfalseを返すこと", async () => {
      // 一時的にconfigをモック
      vi.resetModules(); // モジュールキャッシュをクリア
      
      // 空のチャネルシークレットでconfigをモック
      vi.mock("../../../src/config", () => ({
        config: {
          line: {
            channelSecret: "",
            allowedLineIds: [],
          },
        },
      }));
      
      // モック後に関数を再インポート
      const { verifyLineSignature: verifyWithEmptySecret } = await import("../../../src/utils/auth");
      
      const body = JSON.stringify({ events: [{ type: "message" }] });
      const signature = "some_signature";
      
      const result = verifyWithEmptySecret(signature, body);
      
      expect(result).toBe(false);
      
      // モジュールキャッシュをリセットして元の状態に戻す
      vi.resetModules();
      vi.mock("../../../src/config", () => ({
        config: {
          line: {
            channelSecret: "testSecret",
            allowedLineIds: ["user1", "user2", "user3"],
          },
        },
      }));
      
      // 他のテストに影響を与えないようにauth関数を再インポート
      await import("../../../src/utils/auth");
    });
  });

  describe("isAllowedLineId関数", () => {
    it("許可されたLINE IDの場合にtrueを返すこと", async () => {
      const result = await isAllowedLineId("user1");
      expect(result).toBe(true);
    });

    it("許可されていないLINE IDの場合にfalseを返すこと", async () => {
      const result = await isAllowedLineId("unknown_user");
      expect(result).toBe(false);
    });

    it("空のLINE IDの場合にfalseを返すこと", async () => {
      const result = await isAllowedLineId("");
      expect(result).toBe(false);
    });
  });

  describe("lineSignatureMiddleware関数", () => {
    let mockContext: {
      req: {
        header: ReturnType<typeof vi.fn>;
        text: ReturnType<typeof vi.fn>;
      };
      set: ReturnType<typeof vi.fn>;
    };
    let mockNext: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // モックコンテキストを作成
      mockContext = {
        req: {
          header: vi.fn(),
          text: vi.fn(),
        },
        set: vi.fn(),
      };
      
      // モック次のハンドラ
      mockNext = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    });

    it("有効な署名の場合に次のハンドラを呼び出すこと", async () => {
      const body = JSON.stringify({ events: [{ type: "message" }] });
      const hmac = crypto.createHmac("SHA256", "testSecret");
      const signature = hmac.update(body).digest("base64");
      
      mockContext.req.header.mockReturnValue(signature);
      mockContext.req.text.mockResolvedValue(body);
      
      const response = await lineSignatureMiddleware(mockContext as unknown as Context, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockContext.set).toHaveBeenCalledWith("lineRequestBody", JSON.parse(body));
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it("署名がない場合に401エラーをスローすること", async () => {
      mockContext.req.header.mockReturnValue(null);
      
      await expect(lineSignatureMiddleware(mockContext as unknown as Context, mockNext)).rejects.toThrow(HTTPException);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("無効な署名の場合に401エラーをスローすること", async () => {
      const body = JSON.stringify({ events: [{ type: "message" }] });
      
      mockContext.req.header.mockReturnValue("invalid_signature");
      mockContext.req.text.mockResolvedValue(body);
      
      await expect(lineSignatureMiddleware(mockContext as unknown as Context, mockNext)).rejects.toThrow(HTTPException);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("不正なJSONの場合に400エラーをスローすること", async () => {
      const body = "invalid json";
      const hmac = crypto.createHmac("SHA256", "testSecret");
      const signature = hmac.update(body).digest("base64");
      
      mockContext.req.header.mockReturnValue(signature);
      mockContext.req.text.mockResolvedValue(body);
      
      await expect(lineSignatureMiddleware(mockContext as unknown as Context, mockNext)).rejects.toThrow(HTTPException);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 