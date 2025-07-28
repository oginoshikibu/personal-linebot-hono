import { logger } from "../../../lib/logger";

/**
 * カレンダーコマンドを処理
 * @param args コマンド引数
 * @param userName ユーザー名
 * @param replyToken 応答トークン（指定された場合は応答メッセージとして送信）
 */
export const handleCalendarCommand = async (
  args: string[],
  userName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _replyToken?: string,
): Promise<void> => {
  logger.info(`カレンダーコマンド実行: ${userName}`, { args });

  // 現在の実装ではAlice/Bobの固定LINE IDを使用するため、実際のLINE IDが必要
  // ここではコメントアウトして、必要に応じてユーザー名からLINE IDを解決するロジックを追加
  // TODO: ユーザー名からLINE IDを取得するロジックを実装
  /*
  if (replyToken) {
    await sendCalendarMessage(userLineId, replyToken);
    await sendTextMessage(userLineId, MESSAGES.HELP.CALENDAR_EXPLANATION);
  } else {
    await sendCalendarMessage(userLineId);
    await sendTextMessage(userLineId, MESSAGES.HELP.CALENDAR_EXPLANATION);
  }
  */

  logger.warn(
    "カレンダーコマンドは現在無効化されています。ユーザー名からLINE IDへのマッピングが必要です。",
  );
};
