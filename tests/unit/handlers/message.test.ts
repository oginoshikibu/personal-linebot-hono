import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleTextMessage } from "../../../src/features/line/handlers/message";
import * as lineService from "../../../src/features/line/client";
import * as calendarService from "../../../src/features/meal/services/calendar";

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
vi.mock("../../../src/features/meal/services/meal", () => ({
  getMealPlan: vi.fn().mockResolvedValue(null),
  getAllUsers: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../../src/features/meal/services/user", () => ({
  getAllUsers: vi.fn().mockResolvedValue([])
}));
vi.mock("../../../src/features/notification/templates/mealPlan", () => ({
  prepareMealPlanData: vi.fn().mockReturnValue({
    participants: [],
    preparationType: "UNDECIDED"
  })
}));

describe("メッセージハンドラー", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("「今日の予定」メッセージを処理できること", async () => {
    const replyTemplateMessageMock = vi.spyOn(lineService, "replyTemplateMessage");
    const mockUser = { lineId: "test-user-id", name: "Test User", id: 1 };
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "今日の予定", id: "test-message-id", quoteToken: "test-quote-token" }, mockUser, mockReplyToken);
    expect(replyTemplateMessageMock).toHaveBeenCalledWith(
      mockReplyToken,
      expect.anything(),
      expect.stringContaining("予定はまだ登録されていません")
    );
  });

  it("「明日の予定」メッセージを処理できること", async () => {
    const replyTemplateMessageMock = vi.spyOn(lineService, "replyTemplateMessage");
    const mockUser = { lineId: "test-user-id", name: "Test User", id: 1 };
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "明日の予定", id: "test-message-id", quoteToken: "test-quote-token" }, mockUser, mockReplyToken);
    expect(replyTemplateMessageMock).toHaveBeenCalledWith(
      mockReplyToken,
      expect.anything(),
      expect.stringContaining("予定はまだ登録されていません")
    );
  });

  it("「今週の予定」メッセージを処理できること", async () => {
    const send7DayCalendarMessageMock = vi.spyOn(calendarService, "send7DayCalendarMessage");
    const mockUser = { lineId: "test-user-id", name: "Test User", id: 1 };
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "今週の予定", id: "test-message-id", quoteToken: "test-quote-token" }, mockUser, mockReplyToken);
    expect(send7DayCalendarMessageMock).toHaveBeenCalledWith(
      mockUser.lineId,
      mockReplyToken,
      expect.any(Date)
    );
  });

  it("「今後の予定」メッセージを処理できること", async () => {
    // モックのセットアップ
    const sendCalendarMessageMock = vi.spyOn(calendarService, "sendCalendarMessage");
    
    // テスト対象の実行
    const mockUser = { lineId: "test-user-id", name: "Test User", id: 1 };
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "今後の予定", id: "test-message-id", quoteToken: "test-quote-token" }, mockUser, mockReplyToken);
    
    // 検証 - 月間カレンダーが表示される
    expect(sendCalendarMessageMock).toHaveBeenCalledWith(
      mockUser.lineId,
      mockReplyToken,
      expect.any(Date)
    );
  });
}); 