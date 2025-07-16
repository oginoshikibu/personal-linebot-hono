import { logger } from "../../../lib/logger";
import { formatDateJP } from "../../../utils/date";
import { AppError } from "../../../utils/error";
import { sendFlexMessage } from "../../line/client";
import { createMealPlanFlexMessage } from "../../line/messages/flex";
import { getOrCreateNextDayMealPlans } from "../../meal/services/meal";
import { getAllUsers } from "../../meal/services/user";
import { prepareMealPlanData } from "../templates/mealPlan";
import { logNotification } from "./log";

/**
 * 夜の通知を送信
 */
export const sendEveningNotification = async (): Promise<void> => {
  try {
    logger.info("夜の通知を送信します...");

    // 翌日の食事予定を取得または作成
    const { lunch, dinner } = await getOrCreateNextDayMealPlans();

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

    // 明日の日付を日本語形式で取得
    const tomorrow = formatDateJP(new Date(Date.now() + 24 * 60 * 60 * 1000));

    // Flexメッセージを作成
    const flexMessage = createMealPlanFlexMessage(
      `【明日の食事予定確認】${tomorrow}`,
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
          `明日の食事予定（${tomorrow}）`,
        );
        successCount++;
      } catch (error) {
        logger.error(`ユーザーへの夜の通知送信エラー: ${user.name}`, error);
      }
    }

    // 通知ログを記録
    await logNotification("evening", `明日の食事予定通知（${tomorrow}）`);

    logger.info(
      `夜の通知を送信しました: ${tomorrow}, 成功: ${successCount}/${users.length}`,
    );
  } catch (error) {
    logger.error("夜の通知の送信に失敗しました", error);
    throw new AppError("夜の通知の送信に失敗しました", 500);
  }
};
