import type { PostbackEvent } from "@line/bot-sdk";
import {
  MealType,
  ParticipationStatus,
  PreparationRole,
} from "../../../../domain/entities/MealPlan";
import { parseDate } from "../../../../utils/date";
import { getUserName } from "../../../../utils/user";
import type { MealPlanService } from "../../../meal/services/meal";

export const handleDinnerPostback = async (
  event: PostbackEvent,
  mealService: MealPlanService,
): Promise<void> => {
  const data = new URLSearchParams(event.postback.data);
  const action = data.get("action");
  const dateStr = data.get("date");

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

  switch (action) {
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
      await mealService.updateParticipation(
        date,
        MealType.DINNER,
        person,
        ParticipationStatus.WILL_PARTICIPATE,
      );
      break;
    case "not_participate":
      await mealService.updateParticipation(
        date,
        MealType.DINNER,
        person,
        ParticipationStatus.WILL_NOT_PARTICIPATE,
      );
      break;
    case "quit_preparation":
      await mealService.preparerQuits(date, MealType.DINNER);
      break;
  }
};
