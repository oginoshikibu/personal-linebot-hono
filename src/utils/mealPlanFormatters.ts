/**
 * 食事計画の表示フォーマット関連のユーティリティ
 */

import { USERS } from "../constants/users";
import type {
  ParticipationStatus,
  PreparationRole,
} from "../domain/entities/MealPlan";

// メンション用プレースホルダー定数
const PLACEHOLDER_ALICE = `{${USERS.ALICE.placeholder}}`;
const PLACEHOLDER_BOB = `{${USERS.BOB.placeholder}}`;

/**
 * 参加状況を日本語テキストに変換
 */
export const formatParticipationStatus = (
  status: ParticipationStatus,
): string => {
  switch (status) {
    case "WILL_PARTICIPATE":
      return "参加";
    case "WILL_NOT_PARTICIPATE":
      return "不参加";
    case "UNDECIDED":
      return "未定";
    default:
      throw new Error(`Unknown ParticipationStatus: ${status}`);
  }
};

/**
 * 準備担当を日本語テキストに変換
 */
export const formatPreparationRole = (role: PreparationRole): string => {
  switch (role) {
    case "ALICE":
      return `${PLACEHOLDER_ALICE}が作る`;
    case "BOB":
      return `${PLACEHOLDER_BOB}が作る`;
    case "NONE":
      return "なし";
    default:
      throw new Error(`Unknown PreparationRole: ${role}`);
  }
};

/**
 * 準備担当を表示用テキストに変換（メンション置換なし）
 */
export const formatPreparationRoleForDisplay = (
  role: PreparationRole,
): string => {
  switch (role) {
    case "ALICE":
      return `${USERS.ALICE.name}が作る`;
    case "BOB":
      return `${USERS.BOB.name}が作る`;
    case "NONE":
      return "なし";
    default:
      throw new Error(`Unknown PreparationRole: ${role}`);
  }
};
