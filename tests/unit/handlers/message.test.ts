import { describe, expect, it, vi, beforeEach } from "vitest";
import * as lineService from "../../../src/features/line/client";
import * as calendarService from "../../../src/features/meal/services/calendar";

// 環境変数のモック
const originalEnv = process.env;

// configのモック
vi.mock("../../../src/config", () => ({
  config: {
    line: {
      users: {
        alice: "alice_test_id",
        bob: "bob_test_id",
      },
    },
  },
}));

// DIコンテナのモック
const mockMealPlanService = {
  getOrCreateTodayMealPlans: vi.fn(),
  getOrCreateMealPlan: vi.fn()
};

vi.mock("../../../src/di/container", () => ({
  DIContainer: {
    getInstance: vi.fn(() => ({
      mealPlanService: mockMealPlanService
    }))
  }
}));

// 必要な型をimport
import { MealPlan, MealType, PreparationRole, ParticipationStatus } from "../../../src/domain/entities/MealPlan";
import { handleTextMessage } from "../../../src/features/line/handlers/message";

// モック
vi.mock("../../../src/features/line/client", () => ({
  replyFlexMessage: vi.fn().mockResolvedValue({}),
  replyTemplateMessage: vi.fn().mockResolvedValue({}),
  replyTextMessage: vi.fn().mockResolvedValue({}),
}));
vi.mock("../../../src/features/meal/services/calendar", () => ({
  send7DayCalendarMessage: vi.fn().mockResolvedValue({}),
  sendCalendarMessage: vi.fn().mockResolvedValue({})
}));
vi.mock("../../../src/features/notification/templates/mealPlan", () => ({
  prepareMealPlanData: vi.fn().mockReturnValue({
    participants: [],
    preparationType: "ALICE"
  })
}));

vi.mock("../../../src/features/line/messages/flex", () => ({
  createMealPlanFlexMessage: vi.fn().mockReturnValue({
    type: "flex",
    altText: "食事予定",
    contents: {}
  })
}));

vi.mock("../../../src/utils/date", () => ({
  formatDate: vi.fn().mockReturnValue("2023-01-01"),
  formatDateJP: vi.fn().mockReturnValue("2023年1月1日")
}));

vi.mock("../../../src/utils/formatter", () => ({
  formatDateText: vi.fn().mockReturnValue("1月1日")
}));

describe("メッセージハンドラー", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 環境変数のセットアップ
    process.env = {
      ...originalEnv,
      ALICE_LINE_ID: "alice_test_id",
      BOB_LINE_ID: "bob_test_id",  
      DATABASE_URL: "file:./test.db",
      LINE_CHANNEL_SECRET: "test_secret",
      LINE_CHANNEL_ACCESS_TOKEN: "test_token",
      ALLOWED_LINE_IDS: "alice_test_id,bob_test_id",
      MORNING_NOTIFICATION_HOUR: "7",
      MORNING_NOTIFICATION_MINUTE: "0", 
      EVENING_NOTIFICATION_HOUR: "18",
      EVENING_NOTIFICATION_MINUTE: "0",
    };
    
    // モックの初期化
    mockMealPlanService.getOrCreateTodayMealPlans.mockResolvedValue({
      lunch: new MealPlan("1", new Date(), MealType.LUNCH, PreparationRole.ALICE, ParticipationStatus.WILL_PARTICIPATE, ParticipationStatus.WILL_PARTICIPATE, 1, new Date(), new Date()),
      dinner: new MealPlan("2", new Date(), MealType.DINNER, PreparationRole.BOB, ParticipationStatus.WILL_PARTICIPATE, ParticipationStatus.WILL_PARTICIPATE, 1, new Date(), new Date())
    });
    
    mockMealPlanService.getOrCreateMealPlan.mockResolvedValue(
      new MealPlan("1", new Date(), MealType.LUNCH, PreparationRole.ALICE, ParticipationStatus.WILL_PARTICIPATE, ParticipationStatus.WILL_PARTICIPATE, 1, new Date(), new Date())
    );
  });

  it("「今日の予定」メッセージを処理できること", async () => {
    const replyFlexMessageMock = vi.spyOn(lineService, "replyFlexMessage");
    const mockUserName = "Alice";
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "今日の予定", id: "test-message-id", quoteToken: "test-quote-token" }, mockUserName, mockReplyToken);
    expect(replyFlexMessageMock).toHaveBeenCalledWith(
      mockReplyToken,
      expect.anything(),
      expect.stringContaining("食事予定")
    );
  });

  it("「明日の予定」メッセージを処理できること", async () => {
    const replyFlexMessageMock = vi.spyOn(lineService, "replyFlexMessage");
    const mockUserName = "Alice";
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "明日の予定", id: "test-message-id", quoteToken: "test-quote-token" }, mockUserName, mockReplyToken);
    expect(replyFlexMessageMock).toHaveBeenCalledWith(
      mockReplyToken,
      expect.anything(),
      expect.stringContaining("食事予定")
    );
  });

  it("「今週の予定」メッセージを処理できること", async () => {
    const send7DayCalendarMessageMock = vi.spyOn(calendarService, "send7DayCalendarMessage");
    const mockUserName = "Alice";
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "今週の予定", id: "test-message-id", quoteToken: "test-quote-token" }, mockUserName, mockReplyToken);
    expect(send7DayCalendarMessageMock).toHaveBeenCalledWith(
      "alice_test_id",
      mockReplyToken,
      expect.any(Date)
    );
  });

  it("「今後の予定」メッセージを処理できること", async () => {
    // モックのセットアップ
    const sendCalendarMessageMock = vi.spyOn(calendarService, "sendCalendarMessage");
    
    // テスト対象の実行
    const mockUserName = "Alice";
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "今後の予定", id: "test-message-id", quoteToken: "test-quote-token" }, mockUserName, mockReplyToken);
    
    // 検証 - 月間カレンダーが表示される
    expect(sendCalendarMessageMock).toHaveBeenCalledWith(
      "alice_test_id",
      mockReplyToken,
      expect.any(Date)
    );
  });
}); 