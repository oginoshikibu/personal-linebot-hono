/**
 * ユーザー関連の定数定義
 */

import { config } from "../config";
import type { UserInfo } from "../types/line";

// Re-export UserInfo for convenience
export type { UserInfo };

// ユーザーキーの型定義
export type UserKey = "ALICE" | "BOB";

// ユーザー情報の定義
export const USERS = {
  ALICE: {
    name: "Alice" as const,
    lineId: config.line.users.alice,
    placeholder: "alice" as const,
  },
  BOB: {
    name: "Bob" as const,
    lineId: config.line.users.bob,
    placeholder: "bob" as const,
  },
} as const satisfies Record<UserKey, UserInfo>;

// ユーザー名の型定義
export type UserName = (typeof USERS)[keyof typeof USERS]["name"];

// プレースホルダーの型定義
export type UserPlaceholder = (typeof USERS)[keyof typeof USERS]["placeholder"];

// 全ユーザーのリスト
export const ALL_USERS = Object.values(USERS);

// ユーザー名からユーザー情報を取得
export const getUserByName = (name: UserName): UserInfo => {
  const user = ALL_USERS.find((user) => user.name === name);
  if (!user) {
    throw new Error(`Unknown user name: ${name}`);
  }
  return user;
};

// LINE IDからユーザー情報を取得
export const getUserByLineId = (lineId: string): UserInfo => {
  const user = ALL_USERS.find((user) => user.lineId === lineId);
  if (!user) {
    throw new Error(`Unknown LINE ID: ${lineId}`);
  }
  return user;
};
