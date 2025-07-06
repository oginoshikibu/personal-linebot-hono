import type { User } from "@prisma/client";
import { sendCalendarMessage, sendTextMessage } from "../../services/line";
import { logger } from "../../utils/logger";
import { parseDate } from "../../utils/meal";
import { MESSAGES } from "../../constants";

/**
 * カレンダーコマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
export const handleCalendarCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  try {
    // 選択日付の指定がある場合
    let selectedDate: Date | undefined;
    if (args.length > 0) {
      const parsed = parseDate(args[0]);
      if (parsed) {
        selectedDate = parsed;
      }
    }

    // カレンダーを送信
    await sendCalendarMessage(user.lineId, selectedDate);
  } catch (error) {
    logger.error("カレンダー表示エラー:", error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};