import { config } from "../../../config";
import { DIContainer } from "../../../di/container";
import { MealType } from "../../../domain/entities/MealPlan";
import { logger } from "../../../lib/logger";
import { formatDateJP } from "../../../utils/date";
import { AppError } from "../../../utils/error";
import { sendTextMessage } from "../../line/client";
import { generateEveningNotification } from "../templates/mealPlan";
import { logNotification } from "./log";

// Alice/Bobの固定LINE ID（環境変数から取得）
const ALICE_LINE_ID = config.line.users.alice;
const BOB_LINE_ID = config.line.users.bob;

/**
 * 夜の通知を送信
 */
export const sendEveningNotification = async (): Promise<void> => {
  try {
    logger.info("夜の通知を送信します...");

    // DIコンテナからサービスを取得
    const container = DIContainer.getInstance();
    const mealService = container.mealPlanService;

    // 明日の日付を取得
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 翌日の食事予定を取得または作成
    const lunch = await mealService.getOrCreateMealPlan(
      tomorrow,
      MealType.LUNCH,
    );
    const dinner = await mealService.getOrCreateMealPlan(
      tomorrow,
      MealType.DINNER,
    );

    // 通知メッセージを生成
    const message = generateEveningNotification(lunch, dinner);

    // Alice/Bobに通知を送信
    const users = [
      { lineId: ALICE_LINE_ID, name: "Alice" },
      { lineId: BOB_LINE_ID, name: "Bob" },
    ];

    let successCount = 0;
    for (const user of users) {
      try {
        await sendTextMessage(user.lineId, message);
        successCount++;
      } catch (error) {
        logger.error(`ユーザーへの夜の通知送信エラー: ${user.name}`, error);
      }
    }

    // 通知ログを記録
    const tomorrowStr = formatDateJP(tomorrow);
    await logNotification(
      "EVENING_REMINDER",
      `明日の食事予定通知（${tomorrowStr}）`,
      "ALL",
    );

    logger.info(
      `夜の通知を送信しました: ${tomorrowStr}, 成功: ${successCount}/${users.length}`,
    );
  } catch (error) {
    logger.error("夜の通知の送信に失敗しました", error);
    throw new AppError("夜の通知の送信に失敗しました", 500);
  }
};
