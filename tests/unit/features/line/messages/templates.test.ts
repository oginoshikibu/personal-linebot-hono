import { describe, expect, it } from "vitest";
import { createEditOptionsTemplate } from "../../../../../src/features/line/messages/templates";
import { MealPlan, MealType, PreparationRole, ParticipationStatus } from "../../../../../src/domain/entities/MealPlan";
import { generateMorningNotification } from "../../../../../src/features/notification/templates/mealPlan";

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

  describe("通知テンプレート", () => {
    it("朝の通知メッセージが正しく生成される", () => {
      const lunch = new MealPlan(
        '1', new Date(), MealType.LUNCH, PreparationRole.BOB,
        ParticipationStatus.WILL_NOT_PARTICIPATE, ParticipationStatus.WILL_PARTICIPATE,
        2, new Date(), new Date()
      );
      
      const dinner = new MealPlan(
        '2', new Date(), MealType.DINNER, PreparationRole.ALICE,
        ParticipationStatus.WILL_PARTICIPATE, ParticipationStatus.WILL_PARTICIPATE,
        3, new Date(), new Date()
      );

      const message = generateMorningNotification(lunch, dinner);
      
      expect(message).toContain('【本日の食事予定】');
      expect(message).toContain('Alice: 不参加');
      expect(message).toContain('Bob: 参加');
      expect(message).toContain('準備: Bobが作る');
      expect(message).toContain('準備: Aliceが作る');
    });
  });
}); 