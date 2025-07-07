import type { User } from "@prisma/client";
import { MESSAGES } from "../../../constants";
import { logger } from "../../../utils/logger";
import { sendTextMessage } from "../../line/client";
import { sendCalendarMessage } from "../services/calendar";

/**
 * カレンダーコマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
export const handleCalendarCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  logger.info(`カレンダーコマンド実行: ${user.name}`, { args });

  // カレンダーを表示
  await sendCalendarMessage(user.lineId);

  // 説明メッセージを送信
  await sendTextMessage(user.lineId, MESSAGES.HELP.CALENDAR_EXPLANATION);
};
