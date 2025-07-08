import type { User } from "@prisma/client";
import { MESSAGES } from "../../../constants";
import { logger } from "../../../utils/logger";
import { replyTextMessage, sendTextMessage } from "../../line/client";

/**
 * ヘルプコマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 * @param replyToken 応答トークン（指定された場合は応答メッセージとして送信）
 */
export const handleHelpCommand = async (
  args: string[],
  user: User,
  replyToken?: string,
): Promise<void> => {
  logger.info(`ヘルプコマンド実行: ${user.name}`, { args });

  // 特定のコマンドのヘルプを表示
  if (args.length > 0) {
    const command = args[0].toLowerCase();
    const message = getHelpMessage(command);

    if (replyToken) {
      await replyTextMessage(replyToken, message);
    } else {
      await sendTextMessage(user.lineId, message);
    }
    return;
  }

  // 一般的なヘルプを表示
  if (replyToken) {
    await replyTextMessage(replyToken, MESSAGES.HELP.GENERAL);
  } else {
    await sendTextMessage(user.lineId, MESSAGES.HELP.GENERAL);
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
