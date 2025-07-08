import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleTextMessage } from "../../../src/features/line/handlers/message";
import * as lineService from "../../../src/features/line/client";
import * as calendarService from "../../../src/features/meal/services/calendar";

// モック
vi.mock("../../../src/features/line/client");
vi.mock("../../../src/features/meal/services/calendar");
vi.mock("../../../src/features/meal/services/meal", () => ({
  getMealPlans: vi.fn().mockResolvedValue([])
}));

describe("メッセージハンドラー", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("「今日の予定」メッセージを処理できること", async () => {
    // モックのセットアップ
    const replyTextMessageMock = vi.spyOn(lineService, "replyTextMessage");
    const sendTemplateMessageMock = vi.spyOn(lineService, "sendTemplateMessage");
    
    // テスト対象の実行
    const mockUser = { lineId: "test-user-id", name: "Test User", id: 1 };
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "今日の予定" }, mockUser, mockReplyToken);
    
    // 検証
    expect(replyTextMessageMock).toHaveBeenCalledWith(mockReplyToken, expect.any(String));
    expect(sendTemplateMessageMock).toHaveBeenCalled();
  });

  it("「明日の予定」メッセージを処理できること", async () => {
    // モックのセットアップ
    const replyTextMessageMock = vi.spyOn(lineService, "replyTextMessage");
    const sendTemplateMessageMock = vi.spyOn(lineService, "sendTemplateMessage");
    
    // テスト対象の実行
    const mockUser = { lineId: "test-user-id", name: "Test User", id: 1 };
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "明日の予定" }, mockUser, mockReplyToken);
    
    // 検証
    expect(replyTextMessageMock).toHaveBeenCalledWith(mockReplyToken, expect.any(String));
    expect(sendTemplateMessageMock).toHaveBeenCalled();
  });

  it("「今週の予定」メッセージを処理できること", async () => {
    // モックのセットアップ
    const sendCalendarMessageMock = vi.spyOn(calendarService, "sendCalendarMessage");
    
    // テスト対象の実行
    const mockUser = { lineId: "test-user-id", name: "Test User", id: 1 };
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "今週の予定" }, mockUser, mockReplyToken);
    
    // 検証
    expect(sendCalendarMessageMock).toHaveBeenCalledWith(mockUser.lineId, mockReplyToken);
  });

  it("「今後の予定」メッセージを処理できること", async () => {
    // モックのセットアップ
    const send7DayCalendarMessageMock = vi.spyOn(calendarService, "send7DayCalendarMessage");
    const sendTextMessageMock = vi.spyOn(lineService, "sendTextMessage");
    
    // テスト対象の実行
    const mockUser = { lineId: "test-user-id", name: "Test User", id: 1 };
    const mockReplyToken = "test-reply-token";
    await handleTextMessage({ type: "text", text: "今後の予定" }, mockUser, mockReplyToken);
    
    // 検証
    expect(send7DayCalendarMessageMock).toHaveBeenCalledWith(mockUser.lineId, mockReplyToken);
    expect(sendTextMessageMock).toHaveBeenCalledWith(mockUser.lineId, expect.any(String));
  });
}); 