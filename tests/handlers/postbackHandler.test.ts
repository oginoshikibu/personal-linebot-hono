import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { handlePostbackData } from "../../src/handlers/postbackHandler";
import * as lineService from "../../src/services/line";
import * as mealService from "../../src/services/meal";
import * as newMealService from "../../src/features/meal/services/meal";
import * as notificationService from "../../src/services/notification";
import * as userService from "../../src/features/meal/services/user";
import * as mealPlanService from "../../src/features/notification/templates/mealPlan";
import { MealType, PreparationType, User } from "@prisma/client";
import type { MessageAPIResponseBase } from "@line/bot-sdk";

// モックの設定
vi.mock("../../src/services/line");
vi.mock("../../src/services/meal");
vi.mock("../../src/services/notification");
vi.mock("../../src/utils/logger");
vi.mock("../../src/features/meal/services/user");
vi.mock("../../src/features/meal/services/meal");
vi.mock("../../src/features/notification/templates/mealPlan");

describe("postbackHandler", () => {
  // テスト用ユーザー
  const testUser: User = {
    id: "1",
    name: "テストユーザー",
    lineId: "test-line-id",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // モック関数の戻り値を設定
    vi.mocked(lineService.sendTextMessage).mockResolvedValue({} as MessageAPIResponseBase);
    vi.mocked(lineService.sendTemplateMessage).mockResolvedValue({} as MessageAPIResponseBase);
    vi.mocked(lineService.sendFlexMessage).mockResolvedValue({} as MessageAPIResponseBase);
    vi.mocked(lineService.sendRegistrationOptions).mockResolvedValue({} as MessageAPIResponseBase);
    vi.mocked(userService.getAllUsers).mockResolvedValue([]);
    vi.mocked(mealPlanService.prepareMealPlanData).mockReturnValue({
      participants: [],
      preparationType: "UNDECIDED"
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("handlePostbackData", () => {
    it("should handle register_today_lunch postback correctly", async () => {
      // モック設定
      const sendRegistrationOptionsMock = vi.spyOn(lineService, "sendRegistrationOptions");
      
      // テスト実行
      await handlePostbackData("register_today_lunch", testUser);
      
      // 検証
      expect(sendRegistrationOptionsMock).toHaveBeenCalledTimes(1);
      expect(sendRegistrationOptionsMock).toHaveBeenCalledWith(
        testUser.lineId,
        expect.any(String), // 日付文字列
        "昼食",
        expect.any(String), // ISO日付文字列
        MealType.LUNCH
      );
    });

    it("should handle register_tomorrow_dinner postback correctly", async () => {
      // モック設定
      const sendRegistrationOptionsMock = vi.spyOn(lineService, "sendRegistrationOptions");
      
      // テスト実行
      await handlePostbackData("register_tomorrow_dinner", testUser);
      
      // 検証
      expect(sendRegistrationOptionsMock).toHaveBeenCalledTimes(1);
      expect(sendRegistrationOptionsMock).toHaveBeenCalledWith(
        testUser.lineId,
        expect.any(String), // 日付文字列
        "夕食",
        expect.any(String), // ISO日付文字列
        MealType.DINNER
      );
    });

    it("should handle confirm_registration postback correctly", async () => {
      // モック設定
      const sendTextMessageMock = vi.spyOn(lineService, "sendTextMessage");
      const createOrUpdateMealPlanMock = vi.spyOn(mealService, "createOrUpdateMealPlan").mockResolvedValue({
        id: "1",
        date: new Date(),
        mealType: MealType.LUNCH,
        preparationType: PreparationType.COOK_BY_SELF,
        cookerId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const setMealParticipationMock = vi.spyOn(mealService, "setMealParticipation").mockResolvedValue({
        id: "1",
        mealPlanId: "1",
        userId: "1",
        isAttending: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const sendMealPlanChangeNotificationMock = vi.spyOn(notificationService, "sendMealPlanChangeNotification").mockResolvedValue();
      
      // テスト実行
      const today = new Date().toISOString().split("T")[0];
      await handlePostbackData(`confirm_registration?date=${today}&mealType=LUNCH&attend=true&prepType=COOK_BY_SELF`, testUser);
      
      // 検証
      expect(createOrUpdateMealPlanMock).toHaveBeenCalledTimes(1);
      expect(setMealParticipationMock).toHaveBeenCalledTimes(1);
      expect(sendTextMessageMock).toHaveBeenCalledTimes(1);
      expect(sendMealPlanChangeNotificationMock).toHaveBeenCalledTimes(1);
    });

    it("should handle date selection postback correctly", async () => {
      // モック設定
      const sendFlexMessageMock = vi.spyOn(lineService, "sendFlexMessage");
      const getMealPlanMock = vi.spyOn(newMealService, "getMealPlan").mockResolvedValue(null);
      
      // テスト実行
      const today = new Date().toISOString().split("T")[0];
      await handlePostbackData(`date_${today}`, testUser);
      
      // 検証
      expect(getMealPlanMock).toHaveBeenCalledTimes(2);
      expect(sendFlexMessageMock).toHaveBeenCalledTimes(1);
    });

    it("should handle register_date_lunch postback correctly", async () => {
      // モック設定
      const sendRegistrationOptionsMock = vi.spyOn(lineService, "sendRegistrationOptions");
      
      // テスト実行
      const today = new Date().toISOString().split("T")[0];
      await handlePostbackData(`register_date_lunch?date=${today}`, testUser);
      
      // 検証
      expect(sendRegistrationOptionsMock).toHaveBeenCalledTimes(1);
      expect(sendRegistrationOptionsMock).toHaveBeenCalledWith(
        testUser.lineId,
        expect.any(String), // 日付文字列
        "昼食",
        expect.any(String), // ISO日付文字列
        MealType.LUNCH
      );
    });

    it("should handle check_date postback correctly", async () => {
      // モック設定
      const sendTextMessageMock = vi.spyOn(lineService, "sendTextMessage");
      const getMealPlanMock = vi.spyOn(mealService, "getMealPlan").mockResolvedValue(null);
      
      // テスト実行
      const today = new Date().toISOString().split("T")[0];
      await handlePostbackData(`check_date?date=${today}`, testUser);
      
      // 検証
      expect(getMealPlanMock).toHaveBeenCalledTimes(2);
      expect(sendTextMessageMock).toHaveBeenCalledTimes(1);
      expect(sendTextMessageMock).toHaveBeenCalledWith(
        testUser.lineId,
        expect.stringContaining("食事予定はまだ登録されていません")
      );
    });
  });
}); 