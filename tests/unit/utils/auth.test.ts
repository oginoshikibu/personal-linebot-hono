import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";
import { verifyLineSignature, isAllowedLineId, lineSignatureMiddleware } from "../../../src/utils/auth";
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
vi.mock("../../../src/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

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

    it("チャネルシークレットが設定されていない場合にfalseを返すこと", () => {
      // 一時的にconfigをモック
      const originalConfig = vi.importActual("../../../src/config");
      vi.doMock("../../../src/config", () => ({
        config: {
          line: {
            channelSecret: "",
            allowedLineIds: [],
          },
        },
      }));

      const body = JSON.stringify({ events: [{ type: "message" }] });
      const signature = "some_signature";
      
      const result = verifyLineSignature(signature, body);
      
      expect(result).toBe(false);
      
      // モックを元に戻す
      vi.doMock("../../../src/config", () => originalConfig);
    });
  });

  describe("isAllowedLineId関数", () => {
    it("許可されたLINE IDの場合にtrueを返すこと", () => {
      const result = isAllowedLineId("user1");
      expect(result).toBe(true);
    });

    it("許可されていないLINE IDの場合にfalseを返すこと", () => {
      const result = isAllowedLineId("unknown_user");
      expect(result).toBe(false);
    });

    it("空のLINE IDの場合にfalseを返すこと", () => {
      const result = isAllowedLineId("");
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