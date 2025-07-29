import { DIContainer } from "../../../../di/container";
import {
  MealType,
  PreparationRole,
} from "../../../../domain/entities/MealPlan";
import { logger } from "../../../../lib/logger";
import { parseDate } from "../../../../utils/date";
import { replyFlexMessage, replyTextMessage } from "../../client";
import { createMealPlanFlexMessage } from "../../messages/flex";

/**
 * 日付選択のポストバックを処理
 * @param dateString 日付文字列 (YYYY-MM-DD)
 * @param userName ユーザー名
 * @param replyToken 応答トークン
 */
export const handleDateSelection = async (
  dateString: string,
  userName: string,
  replyToken: string,
): Promise<void> => {
  try {
    logger.info(`日付選択処理: ${dateString}`, { userName });

    const date = parseDate(dateString);
    if (!date) {
      logger.warn("無効な日付形式です", { dateString });
      await replyTextMessage(
        replyToken,
        "無効な日付形式です。もう一度お試しください。",
      );
      return;
    }

    // DIコンテナからサービスを取得
    const container = DIContainer.getInstance();
    const mealService = container.mealPlanService;

    // 選択日の昼食と夕食の予定を取得
    const lunch = await mealService.getOrCreateMealPlan(date, MealType.LUNCH);
    const dinner = await mealService.getOrCreateMealPlan(
      date,
      MealType.DINNER,
      PreparationRole.BOB,
    );

    // Flexメッセージを作成して送信
    const flexMessage = createMealPlanFlexMessage(date, lunch, dinner);

    await replyFlexMessage(
      replyToken,
      flexMessage.contents,
      flexMessage.altText,
    );
  } catch (error) {
    logger.error("日付選択処理エラー", error);
    await replyTextMessage(
      replyToken,
      "処理中にエラーが発生しました。もう一度お試しください。",
    );
  }
};
