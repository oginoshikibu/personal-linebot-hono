import type { MealParticipation, MealPlan, User } from "@prisma/client";
import type { MealPlanData } from "../../../types";

/**
 * 食事予定データからFlexメッセージ用のデータを作成
 * @param mealPlan 食事予定
 * @param users 全ユーザー
 * @returns Flexメッセージ用のデータ
 */
export const prepareMealPlanData = (
  mealPlan: MealPlan & {
    participations: (MealParticipation & { user: User })[];
    cooker?: User | null;
  },
  users: User[],
): MealPlanData => {
  // 参加者データを準備
  const participants = users.map((user) => {
    const participation = mealPlan.participations.find(
      (p) => p.userId === user.id,
    );
    return {
      name: user.name,
      attending: participation ? participation.isAttending : false,
    };
  });

  // 調理担当者の名前を取得
  let cookerName: string | undefined;
  if (mealPlan.cookerId) {
    const cooker = users.find((u) => u.id === mealPlan.cookerId);
    if (cooker) {
      cookerName = cooker.name;
    }
  }

  return {
    participants,
    preparationType: mealPlan.preparationType,
    cooker: cookerName,
  };
};
