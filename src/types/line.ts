/**
 * LINE Messaging API関連の型定義
 */

import type { Message, TextMessage } from "@line/bot-sdk";

// TextV2メッセージの型定義
export interface TextV2Message {
  type: "textV2";
  text: string;
  substitution: Record<string, MentionSubstitution>;
}

// LINE SDK用の拡張メッセージ型（textV2をサポート）
export type LinePushMessage = TextMessage | TextV2Message;

// LINE SDKのMessage型を拡張してTextV2Messageをサポート
export type ExtendedMessage = Message | TextV2Message;

// メンション置換情報の型定義
export interface MentionSubstitution {
  type: "mention";
  mentionee: {
    type: "user";
    userId: string;
  };
}

// メンション情報の型定義
export interface MentionInfo {
  placeholder: string;
  userId: string;
}

// ユーザー情報の型定義
export interface UserInfo {
  name: string;
  lineId: string;
  placeholder: "alice" | "bob";
}

// TextV2Message型ガード関数
export const isTextV2Message = (message: unknown): message is TextV2Message => {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const msg = message as Record<string, unknown>;
  return (
    msg.type === "textV2" &&
    typeof msg.text === "string" &&
    typeof msg.substitution === "object" &&
    msg.substitution !== null
  );
};
