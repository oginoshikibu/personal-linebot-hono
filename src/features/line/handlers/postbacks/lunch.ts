import type { PostbackEvent } from "@line/bot-sdk";
import {
  MealType,
  ParticipationStatus,
} from "../../../../domain/entities/MealPlan";
import { parseDate } from "../../../../utils/date";
import { getUserName } from "../../../../utils/user";
import { replyFlexMessage } from "../../client";
import type { MealPlanService } from "../../../meal/services/meal";

export const handleLunchPostback = async (
  event: PostbackEvent,
  mealService: MealPlanService,
): Promise<void> => {
  console.log(`[LunchPostback] 処理開始: ${event.postback.data}`);
  
  const data = new URLSearchParams(event.postback.data);
  const action = data.get("action");
  const dateStr = data.get("date");

  console.log(`[LunchPostback] パラメータ: action=${action}, date=${dateStr}`);

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

  console.log(`[LunchPostbook] ユーザー情報: ${person}, action: ${action}`);

  switch (action) {
    case "edit_meal":
      console.log(`[LunchPostback] 編集画面表示処理`);
      // 編集画面を表示
      const mealPlan = await mealService.getOrCreateMealPlan(date, MealType.LUNCH);
      
      // 編集用のFlexメッセージを作成（簡単な実装）
      const editMessage = {
        type: "flex" as const,
        altText: `${dateStr} ランチの編集`,
        contents: {
          type: "bubble" as const,
          header: {
            type: "box" as const,
            layout: "vertical" as const,
            contents: [
              {
                type: "text" as const,
                text: `${dateStr} ランチの編集`,
                weight: "bold" as const,
                size: "lg" as const,
              },
            ],
          },
          body: {
            type: "box" as const,
            layout: "vertical" as const,
            contents: [
              {
                type: "text" as const,
                text: `現在の状態:\nAlice: ${mealPlan.aliceParticipation}\nBob: ${mealPlan.bobParticipation}\n準備担当: ${mealPlan.preparationRole}`,
                wrap: true,
              },
              {
                type: "button" as const,
                action: {
                  type: "postback" as const,
                  label: "参加する",
                  data: `action=participate&date=${dateStr}&mealType=LUNCH`,
                },
                style: "primary" as const,
              },
              {
                type: "button" as const,
                action: {
                  type: "postback" as const,
                  label: "参加しない",
                  data: `action=not_participate&date=${dateStr}&mealType=LUNCH`,
                },
                style: "secondary" as const,
              },
            ],
          },
        },
      };
      
      await replyFlexMessage(
        event.replyToken,
        editMessage.contents,
        editMessage.altText,
      );
      console.log(`[LunchPostback] 編集メッセージ送信完了`);
      break;
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
