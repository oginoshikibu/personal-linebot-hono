import type { PostbackEvent } from "@line/bot-sdk";
import {
  MealType,
  ParticipationStatus,
  PreparationRole,
} from "../../../../domain/entities/MealPlan";
import { parseDate } from "../../../../utils/date";
import { getUserName } from "../../../../utils/user";
import { replyFlexMessage, replyTextMessage } from "../../client";
import type { MealPlanService } from "../../../meal/services/meal";

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
    case "edit_meal":
      console.log(`[DinnerPostback] 編集画面表示処理`);
      // 編集画面を表示
      const mealPlan = await mealService.getOrCreateMealPlan(date, MealType.DINNER, PreparationRole.BOB);
      
      // 編集用のFlexeメッセージを作成（簡単な実装）
      const editMessage = {
        type: "flex" as const,
        altText: `${dateStr} ディナーの編集`,
        contents: {
          type: "bubble" as const,
          header: {
            type: "box" as const,
            layout: "vertical" as const,
            contents: [
              {
                type: "text" as const,
                text: `${dateStr} ディナーの編集`,
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
                  data: `action=participate&date=${dateStr}&mealType=DINNER`,
                },
                style: "primary" as const,
              },
              {
                type: "button" as const,
                action: {
                  type: "postback" as const,
                  label: "参加しない",
                  data: `action=not_participate&date=${dateStr}&mealType=DINNER`,
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
      console.log(`[DinnerPostback] 編集メッセージ送信完了`);
      break;
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
      console.log(`[DinnerPostback] 参加状態更新: 参加する`);
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
      console.log(`[DinnerPostback] 参加状態更新: 参加しない`);
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
    case "quit_preparation":
      console.log(`[DinnerPostback] 準備担当が辞退`);
      await mealService.preparerQuits(date, MealType.DINNER);
      await replyTextMessage(
        event.replyToken,
        `${dateStr} ディナーの準備担当を辞退しました。`,
      );
      break;
  }
};
