import { ALL_USERS } from "../../../constants/users";
import { DIContainer } from "../../../di/container";
import { logger } from "../../../lib/logger";
import { formatDateJP } from "../../../utils/date";
import { AppError } from "../../../utils/error";
import { sendMentionMessage } from "../../line/client";
import { generateMorningNotification } from "../templates/mealPlan";
import { logNotification } from "./log";

/**
 * 朝の通知を送信
 */
export const sendMorningNotification = async (): Promise<void> => {
  try {
    logger.info("朝の通知を送信します...");

    // DIコンテナからサービスを取得
    const container = DIContainer.getInstance();
    const mealService = container.mealPlanService;

    // 当日の食事予定を取得または作成
    const { lunch, dinner } = await mealService.getOrCreateTodayMealPlans();

    // 通知メッセージを生成
    const mentionMessage = generateMorningNotification(lunch, dinner);

    // 全ユーザーに通知を送信
    let successCount = 0;
    for (const user of ALL_USERS) {
      try {
        await sendMentionMessage(user.lineId, mentionMessage);
        successCount++;
      } catch (error) {
        logger.error(`ユーザーへの朝の通知送信エラー: ${user.name}`, error);
      }
    }

    // 通知ログを記録
    const today = formatDateJP();
    await logNotification(
      "MORNING_REMINDER",
      `本日の食事予定通知（${today}）`,
      "ALL",
    );

    logger.info(
      `朝の通知を送信しました: ${today}, 成功: ${successCount}/${ALL_USERS.length}`,
    );
  } catch (error) {
    logger.error("朝の通知の送信に失敗しました", error);
    throw new AppError("朝の通知の送信に失敗しました", 500);
  }
};
