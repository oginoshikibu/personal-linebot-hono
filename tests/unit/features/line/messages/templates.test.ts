import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock config before any imports
vi.mock("../../../../../src/config", () => ({
  config: {
    line: {
      users: {
        alice: "alice_test_id",
        bob: "bob_test_id",
      },
      userNames: {
        alice: "Alice",
        bob: "Bob",
      },
    },
  },
}));

import { createEditOptionsTemplate } from "../../../../../src/features/line/messages/templates";
import { MealPlan, MealType, PreparationRole, ParticipationStatus } from "../../../../../src/domain/entities/MealPlan";
import { createMentionMessage } from "../../../../../src/services/mentionService";

describe("メッセージテンプレート", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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
    it("メンションメッセージが正しく生成される", () => {
      const text = `【本日の食事予定】
◆ 昼食
{alice}: 不参加
{bob}: 参加
準備: {bob}が作る

◆ 夕食
{alice}: 参加
{bob}: 参加
準備: {alice}が作る

予定を変更する場合はメニューから「予定変更」を選択してください。`;
      
      const mentions = [
        { placeholder: 'alice', userId: 'test-alice-id' },
        { placeholder: 'bob', userId: 'test-bob-id' }
      ];
      
      const mentionMessage = createMentionMessage(text, mentions);
      
      expect(mentionMessage.type).toBe('textV2');
      expect(mentionMessage.text).toContain('【本日の食事予定】');
      expect(mentionMessage.text).toContain('{alice}: 不参加');
      expect(mentionMessage.text).toContain('{bob}: 参加');
      expect(mentionMessage.text).toContain('準備: {bob}が作る');
      expect(mentionMessage.text).toContain('準備: {alice}が作る');
      expect(mentionMessage.substitution).toHaveProperty('alice');
      expect(mentionMessage.substitution).toHaveProperty('bob');
      expect(mentionMessage.substitution.alice.mentionee.userId).toBe('test-alice-id');
      expect(mentionMessage.substitution.bob.mentionee.userId).toBe('test-bob-id');
    });
  });
}); 