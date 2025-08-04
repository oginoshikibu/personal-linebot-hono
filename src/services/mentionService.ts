/**
 * メンション機能を提供するサービス
 */

import { ALL_USERS, USERS } from "../constants/users";
import type { MentionInfo, TextV2Message } from "../types/line";

/**
 * メンション付きTextV2メッセージを作成
 */
export const createMentionMessage = (
  text: string,
  mentions: MentionInfo[],
): TextV2Message => {
  const substitution: TextV2Message["substitution"] = {};

  mentions.forEach(({ placeholder, userId }) => {
    substitution[placeholder] = {
      type: "mention",
      mentionee: {
        type: "user",
        userId,
      },
    };
  });

  return {
    type: "textV2",
    text,
    substitution,
  };
};

/**
 * 全ユーザーに対するメンション情報を生成
 */
export const createAllUserMentions = (): MentionInfo[] => {
  return ALL_USERS.map((user) => ({
    placeholder: user.placeholder,
    userId: user.lineId,
  }));
};

/**
 * 特定のユーザーに対するメンション情報を生成
 */
export const createUserMention = (
  userName: keyof typeof USERS,
): MentionInfo => {
  const user = USERS[userName];
  return {
    placeholder: user.placeholder,
    userId: user.lineId,
  };
};

/**
 * 複数のユーザーに対するメンション情報を生成
 */
export const createUserMentions = (
  userNames: (keyof typeof USERS)[],
): MentionInfo[] => {
  return userNames.map((userName) => createUserMention(userName));
};
