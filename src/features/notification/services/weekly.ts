import { logger } from "../../../lib/logger";
import { send7DayCalendarMessage } from "../../meal/services/calendar";
import { getAllUsers } from "../../meal/services/user";

/**
 * 週間予定入力リマインダーを送信
 */
export const sendWeeklyPlanReminder = async (): Promise<void> => {
  try {
    logger.info("週間予定入力リマインダーの送信を開始します");

    // 全ユーザーを取得
    const users = await getAllUsers();

    // 来週の月曜日を開始日として設定
    const nextMonday = getNextMonday();

    // 各ユーザーに7日間カレンダーを送信
    for (const user of users) {
      try {
        // リマインダーメッセージと7日間カレンダーを送信
        await send7DayCalendarMessage(user.lineId, undefined, nextMonday);

        logger.info(`週間予定入力リマインダー送信完了: ${user.lineId}`, {
          userName: user.name,
          startDate: nextMonday.toISOString(),
        });
      } catch (error) {
        logger.error(`週間予定入力リマインダー送信失敗: ${user.lineId}`, {
          error: error instanceof Error ? error.message : String(error),
          userName: user.name,
        });
      }
    }

    logger.info("週間予定入力リマインダーの送信が完了しました", {
      totalUsers: users.length,
    });
  } catch (error) {
    logger.error("週間予定入力リマインダーの送信でエラーが発生しました", error);
    throw error;
  }
};

/**
 * 来週の月曜日の日付を取得
 * @returns 来週の月曜日の日付
 */
const getNextMonday = (): Date => {
  const today = new Date();
  const currentDay = today.getDay(); // 0: 日曜日, 1: 月曜日, ..., 6: 土曜日

  // 来週の月曜日までの日数を計算
  // 今日が日曜日(0)の場合は1日後が月曜日
  // それ以外の場合は8から現在の曜日を引いた日数で次の月曜日
  // 例: 今日が月曜日(1)なら8-1=7日後、火曜日(2)なら8-2=6日後
  const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);
  nextMonday.setHours(0, 0, 0, 0);

  return nextMonday;
};
