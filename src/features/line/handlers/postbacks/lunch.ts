import type { PostbackEvent } from "@line/bot-sdk";
import {
  MealType,
  ParticipationStatus,
} from "../../../../domain/entities/MealPlan";
import { parseDate } from "../../../../utils/date";
import { getUserName } from "../../../../utils/user";
import type { MealPlanService } from "../../../meal/services/meal";

export const handleLunchPostback = async (
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
    case "participate":
      await mealService.updateParticipation(
        date,
        MealType.LUNCH,
        person,
        ParticipationStatus.WILL_PARTICIPATE,
      );
      break;
    case "not_participate":
      await mealService.updateParticipation(
        date,
        MealType.LUNCH,
        person,
        ParticipationStatus.WILL_NOT_PARTICIPATE,
      );
      break;
    case "undecided":
      if (person === "Bob") {
        await mealService.updateParticipation(
          date,
          MealType.LUNCH,
          person,
          ParticipationStatus.UNDECIDED,
        );
      }
      break;
    case "quit_preparation":
      await mealService.preparerQuits(date, MealType.LUNCH);
      break;
  }

  // 更新後の状態を取得（今後の実装で使用予定）
  await mealService.getOrCreateMealPlan(date, MealType.LUNCH);
};
