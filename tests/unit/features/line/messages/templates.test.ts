import { describe, expect, it } from "vitest";
import { createEditOptionsTemplate } from "../../../../../src/features/line/messages/templates";

describe("メッセージテンプレート", () => {
  describe("編集オプションテンプレート", () => {
    it("編集オプションのテンプレートが正しく生成されること", () => {
      const dateText = "今日";
      const dateStr = "2023-05-01";
      
      const template = createEditOptionsTemplate(dateText, dateStr);
      
      expect(template).toEqual({
        type: "buttons",
        text: `${dateText}の予定を編集しますか？`,
        actions: [
          {
            type: "postback",
            label: "はい",
            data: `action=edit&date=${dateStr}`,
            displayText: `${dateText}の予定を編集します`,
          },
          {
            type: "message",
            label: "いいえ",
            text: "キャンセル",
          },
        ],
      });
    });
  });
}); 