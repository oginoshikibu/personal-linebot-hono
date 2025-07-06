import { describe, expect, it, vi } from "vitest";
import type { PostbackEvent } from "@line/bot-sdk";
import { MealType, PreparationType, type MealPlan } from "@prisma/client";
import { handlePostbackData } from "../../../src/handlers/postbackHandler";
import * as mealService from "../../../src/services/meal";
import * as lineService from "../../../src/services/line";
import * as notificationService from "../../../src/services/notification";

// モック
vi.mock("../../../src/services/meal", () => ({
  createOrUpdateMealPlan: vi.fn(),
  setMealParticipation: vi.fn(),
  getMealPlan: vi.fn(),
}));

vi.mock("../../../src/services/line", () => ({
  sendTextMessage: vi.fn(),
}));

vi.mock("../../../src/services/notification", () => ({
  sendMealPlanChangeNotification: vi.fn(),
}));

describe("ポストバックハンドラー", () => {
  const mockUser = {
    id: "user1",
    name: "テストユーザー",
    lineId: "U123456789",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("handlePostbackData関数", () => {
    it("不正なデータ形式の場合エラーメッセージを送信すること", async () => {
      // テスト準備
      const data = "invalid_data";
      
      // 関数実行
      await handlePostbackData(data, mockUser);
      
      // 検証
      expect(lineService.sendTextMessage).toHaveBeenCalledWith(
        mockUser.lineId,
        expect.stringContaining("無効なポストバックデータ")
      );
    });

    it("register_mealアクションの場合、食事予定を登録すること", async () => {
      // テスト準備
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const data = `action=register_meal&date=${dateStr}&mealType=LUNCH&attend=true&prepType=COOK_BY_SELF`;
      
      const mockMealPlan = { id: "meal1" } as MealPlan;
      vi.mocked(mealService.createOrUpdateMealPlan).mockResolvedValue(mockMealPlan);
      vi.mocked(notificationService.sendMealPlanChangeNotification).mockResolvedValue();
      
      // 関数実行
      await handlePostbackData(data, mockUser);
      
      // 検証
      expect(mealService.createOrUpdateMealPlan).toHaveBeenCalledWith(
        expect.any(Date),
        MealType.LUNCH,
        PreparationType.COOK_BY_SELF,
        mockUser.id
      );
      
      expect(mealService.setMealParticipation).toHaveBeenCalledWith(
        mockMealPlan.id,
        mockUser.id,
        true
      );
      
      expect(lineService.sendTextMessage).toHaveBeenCalledWith(
        mockUser.lineId,
        expect.stringContaining("予定を登録しました")
      );
    });

    it("check_mealアクションの場合、食事予定を確認すること", async () => {
      // テスト準備
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const data = `action=check_meal&date=${dateStr}&mealType=DINNER`;
      
      const mockMealPlan = {
        id: "meal1",
        mealType: MealType.DINNER,
        date: today,
        preparationType: PreparationType.COOK_BY_SELF,
        participations: [
          { user: { name: "テストユーザー" }, isAttending: true }
        ],
        cooker: { name: "テストユーザー" }
      } as MealPlan & { 
        participations: Array<{ user: { name: string }, isAttending: boolean }>,
        cooker: { name: string } 
      };
      
      vi.mocked(mealService.getMealPlan).mockResolvedValue(mockMealPlan);
      
      // 関数実行
      await handlePostbackData(data, mockUser);
      
      // 検証
      expect(mealService.getMealPlan).toHaveBeenCalledWith(
        expect.any(Date),
        MealType.DINNER
      );
      
      expect(lineService.sendTextMessage).toHaveBeenCalledWith(
        mockUser.lineId,
        expect.stringMatching(/夕食予定/)
      );
    });

    it("未知のアクションの場合エラーメッセージを送信すること", async () => {
      // テスト準備
      const data = "action=unknown_action";
      
      // 関数実行
      await handlePostbackData(data, mockUser);
      
      // 検証
      expect(lineService.sendTextMessage).toHaveBeenCalledWith(
        mockUser.lineId,
        expect.stringContaining("未対応のアクション")
      );
    });
  });
}); 