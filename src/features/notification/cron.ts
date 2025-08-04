import { schedule } from "node-cron";
import { config } from "../../config";
import { logger } from "../../lib/logger";
import { AppError } from "../../utils/error";
import { sendEveningNotification } from "./services/evening";
import { sendMorningNotification } from "./services/morning";
import { sendWeeklyPlanReminder } from "./services/weekly";

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

    // 週間予定入力リマインダー
    schedule(
      `${config.notification.weekly.minute} ${config.notification.weekly.hour} * * ${config.notification.weekly.day}`,
      async () => {
        logger.info("週間予定入力リマインダーを実行します...");
        try {
          await sendWeeklyPlanReminder();
          logger.info("週間予定入力リマインダーを送信しました");
        } catch (error) {
          logger.error("週間予定入力リマインダーの送信に失敗しました", error);
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
    const dayName = ["日", "月", "火", "水", "木", "金", "土"][config.notification.weekly.day];
    logger.info(
      `週間予定入力リマインダー: ${dayName}曜日 ${config.notification.weekly.hour}:${String(config.notification.weekly.minute).padStart(2, "0")}`,
    );
  } catch (error) {
    logger.error("定期実行タスクの設定に失敗しました", error);
    throw new AppError("定期実行タスクの設定に失敗しました", 500);
  }
};
