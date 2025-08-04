/**
 * 食事計画の表示フォーマット関連のユーティリティ
 */

import type {
  ParticipationStatus,
  PreparationRole,
} from "../domain/entities/MealPlan";

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
      return "不明";
  }
};

/**
 * 準備担当を日本語テキストに変換
 */
export const formatPreparationRole = (role: PreparationRole): string => {
  switch (role) {
    case "ALICE":
      return "{alice}が作る";
    case "BOB":
      return "{bob}が作る";
    case "NONE":
      return "なし";
    default:
      return "不明";
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
      return "Aliceが作る";
    case "BOB":
      return "Bobが作る";
    case "NONE":
      return "なし";
    default:
      return "不明";
  }
};
