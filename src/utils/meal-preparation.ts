import { USERS } from "../constants/users";
import { PreparationRole } from "../domain/entities/MealPlan";

/**
 * 指定されたユーザーが現在の準備者かどうかを判定する
 * @param person ユーザー名 ("Alice" | "Bob")
 * @param preparationRole 現在の準備者役割
 * @returns 指定されたユーザーが準備者の場合true
 */
export const isUserPreparer = (
  person: string,
  preparationRole: PreparationRole,
): boolean => {
  return (
    (person === USERS.ALICE.name &&
      preparationRole === PreparationRole.ALICE) ||
    (person === USERS.BOB.name && preparationRole === PreparationRole.BOB)
  );
};

/**
 * 準備者を奪うボタンを表示すべきかどうかを判定する
 * @param person ユーザー名
 * @param preparationRole 現在の準備者役割
 * @returns ボタンを表示すべき場合true
 */
export const shouldShowTakePreparationButton = (
  person: string,
  preparationRole: PreparationRole,
): boolean => {
  return (
    !isUserPreparer(person, preparationRole) &&
    preparationRole !== PreparationRole.NONE
  );
};
