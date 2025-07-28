import { MESSAGES } from "../../../constants";
import { logger } from "../../../lib/logger";
import { replyTextMessage } from "../../line/client";

/**
 * ヘルプコマンドを処理
 * @param args コマンド引数
 * @param userName ユーザー名
 * @param replyToken 応答トークン（指定された場合は応答メッセージとして送信）
 */
export const handleHelpCommand = async (
  args: string[],
  userName: string,
  replyToken?: string,
): Promise<void> => {
  logger.info(`ヘルプコマンド実行: ${userName}`, { args });

  // 特定のコマンドのヘルプを表示
  if (args.length > 0) {
    const command = args[0].toLowerCase();
    const message = getHelpMessage(command);

    if (replyToken) {
      await replyTextMessage(replyToken, message);
    } else {
      // TODO: ユーザー名からLINE IDを取得するロジックを実装
      // await sendTextMessage(userLineId, message);
      logger.warn("プッシュメッセージの送信は現在無効化されています。");
    }
    return;
  }

  // 一般的なヘルプを表示
  if (replyToken) {
    await replyTextMessage(replyToken, MESSAGES.HELP.GENERAL);
  } else {
    // TODO: ユーザー名からLINE IDを取得するロジックを実装
    // await sendTextMessage(userLineId, MESSAGES.HELP.GENERAL);
    logger.warn("プッシュメッセージの送信は現在無効化されています。");
  }
};

/**
 * コマンドに対応するヘルプメッセージを取得
 * @param command コマンド名
 * @returns ヘルプメッセージ
 */
const getHelpMessage = (command: string): string => {
  switch (command) {
    case "register":
      return MESSAGES.HELP.REGISTER_COMMAND;
    case "check":
      return MESSAGES.HELP.CHECK_COMMAND;
    case "cal":
      return MESSAGES.HELP.CALENDAR_COMMAND;
    default:
      return `未知のコマンド: ${command}\n${MESSAGES.HELP.COMMAND_LIST}`;
  }
};
