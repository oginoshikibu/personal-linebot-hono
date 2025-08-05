import type { PostbackEvent } from "@line/bot-sdk";
import {
  MealType,
  ParticipationStatus,
  PreparationRole,
} from "../../../../domain/entities/MealPlan";
import { parseDate } from "../../../../utils/date";
import { getUserName } from "../../../../utils/user";
import type { MealPlanService } from "../../../meal/services/meal";
import { replyFlexMessage, replyTextMessage } from "../../client";
import { createDinnerEditFlexMessage } from "../../messages/dinner-edit";

/**
 * Handles displaying the edit screen for a dinner meal plan.
 *
 * @param event - The LINE postback event triggering the edit action.
 * @param mealService - Service for retrieving or creating meal plans.
 * @param date - The date of the meal to edit.
 * @param dateStr - The string representation of the meal date (for display).
 * @param person - The person ("Alice" or "Bob") for whom the edit UI is being shown.
 *   This determines which user's context is used in the UI flow (e.g., whose role or preferences are displayed).
 * @returns A promise that resolves when the edit message has been sent.
 */
const handleEditMeal = async (
  event: PostbackEvent,
  mealService: MealPlanService,
  date: Date,
  dateStr: string,
  person: "Alice" | "Bob",
): Promise<void> => {
  // デフォルトの準備者をBobに設定（既存のビジネスロジックに基づく）
  // 新規作成時のみ影響し、既存プランは現在の設定を維持
  const mealPlan = await mealService.getOrCreateMealPlan(
    date,
    MealType.DINNER,
    PreparationRole.BOB,
  );

  const editMessage = createDinnerEditFlexMessage(dateStr, mealPlan, person);

  await replyFlexMessage(
    event.replyToken,
    editMessage.contents,
    editMessage.altText,
  );
  console.log("[DinnerPostback] 編集メッセージ送信完了");
};

export const handleDinnerPostback = async (
  event: PostbackEvent,
  mealService: MealPlanService,
): Promise<void> => {
  console.log(`[DinnerPostback] 処理開始: ${event.postback.data}`);

  const data = new URLSearchParams(event.postback.data);
  const action = data.get("action");
  const dateStr = data.get("date");

  console.log(`[DinnerPostback] パラメータ: action=${action}, date=${dateStr}`);

  if (!dateStr) {
    throw new Error("日付が指定されていません");
  }

  const date = parseDate(dateStr);
  if (!date) {
    throw new Error("日付の解析に失敗しました");
  }
  const userId = event.source.userId;
  if (!userId) {
    throw new Error("ユーザーIDが取得できません");
  }
  const person = await getUserName(userId);

  console.log(`[DinnerPostback] ユーザー情報: ${person}, action: ${action}`);

  switch (action) {
    case "edit_meal": {
      console.log("[DinnerPostback] 編集画面表示処理");
      await handleEditMeal(event, mealService, date, dateStr, person);
      break;
    }
    case "select_role_alice":
      await mealService.getOrCreateMealPlan(
        date,
        MealType.DINNER,
        PreparationRole.ALICE,
      );
      break;
    case "select_role_bob":
      await mealService.getOrCreateMealPlan(
        date,
        MealType.DINNER,
        PreparationRole.BOB,
      );
      break;
    case "participate":
      console.log("[DinnerPostback] 参加状態更新: 参加する");
      await mealService.updateParticipation(
        date,
        MealType.DINNER,
        person,
        ParticipationStatus.WILL_PARTICIPATE,
      );
      await replyTextMessage(
        event.replyToken,
        `${dateStr} ディナーへの参加状態を「参加する」に変更しました。`,
      );
      break;
    case "not_participate":
      console.log("[DinnerPostback] 参加状態更新: 参加しない");
      await mealService.updateParticipation(
        date,
        MealType.DINNER,
        person,
        ParticipationStatus.WILL_NOT_PARTICIPATE,
      );
      await replyTextMessage(
        event.replyToken,
        `${dateStr} ディナーへの参加状態を「参加しない」に変更しました。`,
      );
      break;
    case "take_preparation": {
      console.log("[DinnerPostback] 準備担当を奪う");
      const newPreparer =
        person === "Alice" ? PreparationRole.ALICE : PreparationRole.BOB;
      
      const result = await mealService.changePreparationRole(
        date,
        MealType.DINNER,
        newPreparer,
      );
      
      if (result.isSuccess) {
        await replyTextMessage(
          event.replyToken,
          `${dateStr} ディナーの準備担当を引き受けました。`,
        );
      } else {
        await replyTextMessage(
          event.replyToken,
          `準備担当の変更に失敗しました: ${result.error}`,
        );
      }
      break;
    }
    case "quit_preparation":
      console.log("[DinnerPostback] 準備担当が辞退");
      await mealService.preparerQuits(date, MealType.DINNER);
      await replyTextMessage(
        event.replyToken,
        `${dateStr} ディナーの準備担当を辞退しました。`,
      );
      break;
  }
};
