import { schedule } from "node-cron";
import { config } from "../../config";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";
import { sendEveningNotification } from "./services/evening";
import { sendMorningNotification } from "./services/morning";

/**
 * 定期実行タスクを設定
 */
export const setupCronJobs = (): void => {
  try {
    // 朝の通知（毎日7時に実行）
    schedule(
      `${config.notification.morning.minute} ${config.notification.morning.hour} * * *`,
      async () => {
        logger.info("朝の通知を実行します...");
        try {
          await sendMorningNotification();
          logger.info("朝の通知を送信しました");
        } catch (error) {
          logger.error("朝の通知の送信に失敗しました", error);
        }
      },
    );

    // 夜の通知（毎日22時に実行）
    schedule(
      `${config.notification.evening.minute} ${config.notification.evening.hour} * * *`,
      async () => {
        logger.info("夜の通知を実行します...");
        try {
          await sendEveningNotification();
          logger.info("夜の通知を送信しました");
        } catch (error) {
          logger.error("夜の通知の送信に失敗しました", error);
        }
      },
    );

    logger.info("定期実行タスクを設定しました");
    logger.info(
      `朝の通知: 毎日 ${config.notification.morning.hour}:${config.notification.morning.minute}`,
    );
    logger.info(
      `夜の通知: 毎日 ${config.notification.evening.hour}:${config.notification.evening.minute}`,
    );
  } catch (error) {
    logger.error("定期実行タスクの設定に失敗しました", error);
    throw new AppError("定期実行タスクの設定に失敗しました", 500);
  }
};
