/**
 * LINE Messaging API関連の型定義
 */

import type { TextMessage } from "@line/bot-sdk";

// TextV2メッセージの型定義
export interface TextV2Message {
  type: "textV2";
  text: string;
  substitution: Record<string, MentionSubstitution>;
}

// LINE SDK用の拡張メッセージ型（textV2をサポート）
export type LinePushMessage = TextMessage | TextV2Message;

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
  name: "Alice" | "Bob";
  lineId: string;
  placeholder: "alice" | "bob";
}
