import type { User } from "@prisma/client";
import { MESSAGES } from "../../../constants";
import { logger } from "../../../utils/logger";
import { sendTextMessage } from "../../line/client";
import { sendCalendarMessage } from "../services/calendar";

/**
 * カレンダーコマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 * @param replyToken 応答トークン（指定された場合は応答メッセージとして送信）
 */
export const handleCalendarCommand = async (
  args: string[],
  user: User,
  replyToken?: string,
): Promise<void> => {
  logger.info(`カレンダーコマンド実行: ${user.name}`, { args });

  // カレンダーを表示
  if (replyToken) {
    await sendCalendarMessage(user.lineId, replyToken);

    // 応答トークンは一度しか使えないため、説明メッセージはプッシュメッセージとして送信
    await sendTextMessage(user.lineId, MESSAGES.HELP.CALENDAR_EXPLANATION);
  } else {
    await sendCalendarMessage(user.lineId);
    await sendTextMessage(user.lineId, MESSAGES.HELP.CALENDAR_EXPLANATION);
  }
};
