import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendTextMessage,
  sendTextMessages,
  sendFlexMessage,
  sendTemplateMessage,
  broadcastTextMessage,
  createMealPlanFlexMessage,
} from "../../../src/services/line";
import { AppError } from "../../../src/utils/error";
import type { MealPlanData } from "../../../src/types";

// LINE Clientのモック
vi.mock("@line/bot-sdk", () => ({
  Client: vi.fn().mockImplementation(() => ({
    pushMessage: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

// configのモック
vi.mock("../../../src/config", () => ({
  config: {
    line: {
      channelSecret: "test_secret",
      channelAccessToken: "test_token",
      allowedLineIds: ["user1", "user2", "user3"],
    },
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
      findMany: vi.fn().mockResolvedValue([
        { id: "1", lineId: "user1", name: "User 1" },
        { id: "2", lineId: "user2", name: "User 2" },
        { id: "3", lineId: "user3", name: "User 3" },
      ]),
    },
  },
}));

// 認証ユーティリティのモック
vi.mock("../../../src/utils/auth", () => {
  return {
    isAllowedLineId: async (id: string) => {
      if (id === "unknown_user") {
        return false;
      }
      return ["user1", "user2", "user3"].includes(id);
    },
  };
});

// ロガーのモック
vi.mock("../../../src/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("LINEサービス", () => {
  // モックのリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendTextMessage関数", () => {
    it("許可されたLINE IDにテキストメッセージを送信できること", async () => {
      const result = await sendTextMessage("user1", "テストメッセージ");
      
      expect(result).toEqual({ success: true });
    });

    it("許可されていないLINE IDに送信するとエラーになること", async () => {
      await expect(sendTextMessage("unknown_user", "テストメッセージ")).rejects.toThrow(AppError);
      await expect(sendTextMessage("unknown_user", "テストメッセージ")).rejects.toThrow(/メッセージの送信に失敗しました/);
    });
  });

  describe("sendTextMessages関数", () => {
    it("許可されたLINE IDに複数のテキストメッセージを送信できること", async () => {
      const result = await sendTextMessages("user1", ["メッセージ1", "メッセージ2"]);
      
      expect(result).toEqual({ success: true });
    });

    it("許可されていないLINE IDに送信するとエラーになること", async () => {
      await expect(sendTextMessages("unknown_user", ["メッセージ1"])).rejects.toThrow(AppError);
      await expect(sendTextMessages("unknown_user", ["メッセージ1"])).rejects.toThrow(/複数メッセージの送信に失敗しました/);
    });
  });

  describe("sendFlexMessage関数", () => {
    it("許可されたLINE IDにFlexメッセージを送信できること", async () => {
      const flexContent = { type: "bubble", body: { type: "box", layout: "vertical", contents: [] } };
      const result = await sendFlexMessage("user1", flexContent, "代替テキスト");
      
      expect(result).toEqual({ success: true });
    });

    it("許可されていないLINE IDに送信するとエラーになること", async () => {
      const flexContent = { type: "bubble", body: { type: "box", layout: "vertical", contents: [] } };
      
      await expect(sendFlexMessage("unknown_user", flexContent, "代替テキスト")).rejects.toThrow(AppError);
      await expect(sendFlexMessage("unknown_user", flexContent, "代替テキスト")).rejects.toThrow(/Flexメッセージの送信に失敗しました/);
    });
  });

  describe("sendTemplateMessage関数", () => {
    it("許可されたLINE IDにテンプレートメッセージを送信できること", async () => {
      const template = { type: "buttons", text: "テスト", actions: [] };
      const result = await sendTemplateMessage("user1", template, "代替テキスト");
      
      expect(result).toEqual({ success: true });
    });

    it("許可されていないLINE IDに送信するとエラーになること", async () => {
      const template = { type: "buttons", text: "テスト", actions: [] };
      
      await expect(sendTemplateMessage("unknown_user", template, "代替テキスト")).rejects.toThrow(AppError);
      await expect(sendTemplateMessage("unknown_user", template, "代替テキスト")).rejects.toThrow(/テンプレートメッセージの送信に失敗しました/);
    });
  });

  describe("broadcastTextMessage関数", () => {
    it("全ての登録ユーザーにメッセージをブロードキャストできること", async () => {
      const results = await broadcastTextMessage("ブロードキャストテスト");
      
      expect(results).toHaveLength(3); // 3人のユーザーにメッセージが送信される
      expect(results.every(r => r.success === true)).toBe(true);
    });
  });

  describe("createMealPlanFlexMessage関数", () => {
    it("食事予定データから正しいFlexメッセージを生成すること", () => {
      const title = "2023年10月15日（日）の食事予定";
      
      const lunchData: MealPlanData = {
        participants: [
          { name: "ユーザー1", attending: true },
          { name: "ユーザー2", attending: false },
        ],
        preparationType: "COOK_BY_SELF",
        cooker: "ユーザー1",
      };
      
      const dinnerData: MealPlanData = {
        participants: [
          { name: "ユーザー1", attending: true },
          { name: "ユーザー2", attending: true },
        ],
        preparationType: "BUY_TOGETHER",
      };
      
      const flexMessage = createMealPlanFlexMessage(title, lunchData, dinnerData);
      
      // Flexメッセージの基本構造を確認
      expect(flexMessage).toHaveProperty("type", "bubble");
      expect(flexMessage).toHaveProperty("header");
      expect(flexMessage).toHaveProperty("body");
      
      // ヘッダーにタイトルが含まれていることを確認
      const header = flexMessage.header as { type: string; layout: string; contents: Array<{ type: string; text: string; weight: string; size: string }> };
      expect(header.contents[0].text).toBe(title);
      
      // 昼食セクションの内容を確認
      const body = flexMessage.body as { type: string; layout: string; contents: Array<{ type: string; layout?: string; contents?: Array<{ type: string; text: string; weight?: string; size?: string; margin?: string }> }> };
      const lunchSection = body.contents[0];
      
      expect(lunchSection.contents?.[0].text).toBe("◆ 昼食");
      expect(lunchSection.contents?.[1].text).toBe("ユーザー1: 参加");
      expect(lunchSection.contents?.[2].text).toBe("ユーザー2: 不参加");
      expect(lunchSection.contents?.[3].text).toBe("準備: ユーザー1が作る");
      
      // 夕食セクションの内容を確認
      const dinnerSection = body.contents[2];
      
      expect(dinnerSection.contents?.[0].text).toBe("◆ 夕食");
      expect(dinnerSection.contents?.[1].text).toBe("ユーザー1: 参加");
      expect(dinnerSection.contents?.[2].text).toBe("ユーザー2: 参加");
      expect(dinnerSection.contents?.[3].text).toBe("準備: 買って一緒に食べる");
    });

    it("異なる準備方法が正しく表示されること", () => {
      const title = "テスト";
      
      const lunchData: MealPlanData = {
        participants: [],
        preparationType: "INDIVIDUAL",
      };
      
      const dinnerData: MealPlanData = {
        participants: [],
        preparationType: "UNKNOWN",
      };
      
      const flexMessage = createMealPlanFlexMessage(title, lunchData, dinnerData);
      
      // 準備方法のテキストを確認
      const body = flexMessage.body as { type: string; layout: string; contents: Array<{ type: string; layout?: string; contents?: Array<{ type: string; text: string; weight?: string; size?: string; margin?: string }> }> };
      const lunchSection = body.contents[0];
      const dinnerSection = body.contents[2];
      
      expect(lunchSection.contents?.[1].text).toBe("準備: 各自自由に");
      expect(dinnerSection.contents?.[1].text).toBe("準備: 未定");
    });
  });
}); 