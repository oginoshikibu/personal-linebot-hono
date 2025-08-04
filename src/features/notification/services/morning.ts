import { config } from "../../../config";
import { DIContainer } from "../../../di/container";
import { logger } from "../../../lib/logger";
import { formatDateJP } from "../../../utils/date";
import { AppError } from "../../../utils/error";
import { sendTextMessage } from "../../line/client";
import { generateMorningNotification } from "../templates/mealPlan";
import { logNotification } from "./log";

// Alice/Bobの固定LINE ID（環境変数から取得）
const ALICE_LINE_ID = config.line.users.alice;
const BOB_LINE_ID = config.line.users.bob;

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
    const message = generateMorningNotification(lunch, dinner);

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
      `朝の通知を送信しました: ${today}, 成功: ${successCount}/${users.length}`,
    );
  } catch (error) {
    logger.error("朝の通知の送信に失敗しました", error);
    throw new AppError("朝の通知の送信に失敗しました", 500);
  }
};
