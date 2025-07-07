import { formatDateJP } from "../../../utils/date";
import { AppError } from "../../../utils/error";
import { logger } from "../../../utils/logger";
import { sendFlexMessage } from "../../line/client";
import { createMealPlanFlexMessage } from "../../line/messages/flex";
import { getOrCreateTodayMealPlans } from "../../meal/services/meal";
import { getAllUsers } from "../../meal/services/user";
import { prepareMealPlanData } from "../templates/mealPlan";
import { logNotification } from "./log";

/**
 * 朝の通知を送信
 */
export const sendMorningNotification = async (): Promise<void> => {
  try {
    logger.info("朝の通知を送信します...");

    // 当日の食事予定を取得または作成
    const { lunch, dinner } = await getOrCreateTodayMealPlans();

    // 全ユーザーを取得
    const users = await getAllUsers();

    // 食事予定データを準備
    const lunchData = prepareMealPlanData(
      {
        ...lunch,
        participations: [],
        cooker: null,
      },
      users,
    );
    const dinnerData = prepareMealPlanData(
      {
        ...dinner,
        participations: [],
        cooker: null,
      },
      users,
    );

    // 日付を日本語形式で取得
    const today = formatDateJP();

    // Flexメッセージを作成
    const flexMessage = createMealPlanFlexMessage(
      `【本日の食事予定】${today}`,
      lunchData,
      dinnerData,
    );

    // 全ユーザーにFlexメッセージを送信
    let successCount = 0;
    for (const user of users) {
      try {
        await sendFlexMessage(
          user.lineId,
          flexMessage,
          `本日の食事予定（${today}）`,
        );
        successCount++;
      } catch (error) {
        logger.error(`ユーザーへの朝の通知送信エラー: ${user.name}`, error);
      }
    }

    // 通知ログを記録
    await logNotification("morning", `本日の食事予定通知（${today}）`);

    logger.info(
      `朝の通知を送信しました: ${today}, 成功: ${successCount}/${users.length}`,
    );
  } catch (error) {
    logger.error("朝の通知の送信に失敗しました", error);
    throw new AppError("朝の通知の送信に失敗しました", 500);
  }
};
