import type { PostbackEvent } from "@line/bot-sdk";
import {
  MealType,
  ParticipationStatus,
} from "../../../../domain/entities/MealPlan";
import { logger } from "../../../../lib/logger";
import { parseDate } from "../../../../utils/date";
import { AppError } from "../../../../utils/error";
import { getUserName } from "../../../../utils/user";
import type { MealPlanService } from "../../../meal/services/meal";
import { replyFlexMessage, replyTextMessage } from "../../client";

export const handleLunchPostback = async (
  event: PostbackEvent,
  mealService: MealPlanService,
): Promise<void> => {
  try {
    logger.info(`[LunchPostback] 処理開始: ${event.postback.data}`);

    const data = new URLSearchParams(event.postback.data);
    const action = data.get("action");
    const dateStr = data.get("date");

    logger.debug(`[LunchPostback] パラメータ: action=${action}, date=${dateStr}`);

    if (!dateStr) {
      throw new AppError("日付が指定されていません", 400);
    }

    const date = parseDate(dateStr);
    if (!date) {
      throw new AppError("日付の解析に失敗しました", 400);
    }
    const userId = event.source.userId;
    if (!userId) {
      throw new AppError("ユーザーIDが取得できません", 400);
    }
    const person = await getUserName(userId);

    logger.debug(`[LunchPostbook] ユーザー情報: ${person}, action: ${action}`);

  switch (action) {
    case "edit_meal": {
      logger.debug("[LunchPostback] 編集画面表示処理");
      // 編集画面を表示
      const mealPlan = await mealService.getOrCreateMealPlan(
        date,
        MealType.LUNCH,
      );

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
      logger.debug("[LunchPostback] 編集メッセージ送信完了");
      break;
    }
    case "participate":
      logger.debug("[LunchPostback] 参加状態更新: 参加する");
      await mealService.updateParticipation(
        date,
        MealType.LUNCH,
        person,
        ParticipationStatus.WILL_PARTICIPATE,
      );
      await replyTextMessage(
        event.replyToken,
        `${dateStr} ランチへの参加状態を「参加する」に変更しました。`,
      );
      break;
    case "not_participate":
      logger.debug("[LunchPostback] 参加状態更新: 参加しない");
      await mealService.updateParticipation(
        date,
        MealType.LUNCH,
        person,
        ParticipationStatus.WILL_NOT_PARTICIPATE,
      );
      await replyTextMessage(
        event.replyToken,
        `${dateStr} ランチへの参加状態を「参加しない」に変更しました。`,
      );
      break;
    case "undecided":
      logger.debug("[LunchPostback] 参加状態更新: 未定");
      if (person === "Bob") {
        await mealService.updateParticipation(
          date,
          MealType.LUNCH,
          person,
          ParticipationStatus.UNDECIDED,
        );
        await replyTextMessage(
          event.replyToken,
          `${dateStr} ランチへの参加状態を「未定」に変更しました。`,
        );
      }
      break;
    case "quit_preparation":
      logger.debug("[LunchPostback] 準備担当が辞退");
      await mealService.preparerQuits(date, MealType.LUNCH);
      await replyTextMessage(
        event.replyToken,
        `${dateStr} ランチの準備担当を辞退しました。`,
      );
      break;
    default:
      throw new AppError(`未知のアクション: ${action}`, 400);
  }
  } catch (error) {
    logger.error("[LunchPostback] エラーが発生しました", {
      postbackData: event.postback.data,
      userId: event.source.userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    try {
      await replyTextMessage(
        event.replyToken,
        "ランチの設定処理中にエラーが発生しました。もう一度お試しください。",
      );
    } catch (replyError) {
      logger.error("[LunchPostback] 応答メッセージ送信エラー", {
        error: replyError instanceof Error ? replyError.message : String(replyError),
      });
    }

    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("ランチの設定処理に失敗しました", 500);
  }
};
