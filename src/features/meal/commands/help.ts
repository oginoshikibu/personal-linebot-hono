import type { User } from "@prisma/client";
import { MESSAGES } from "../../../constants";
import { logger } from "../../../utils/logger";
import { sendTextMessage } from "../../line/client";

/**
 * ヘルプコマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
export const handleHelpCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  logger.info(`ヘルプコマンド実行: ${user.name}`, { args });

  // 特定のコマンドのヘルプを表示
  if (args.length > 0) {
    const command = args[0].toLowerCase();
    switch (command) {
      case "register":
        await sendTextMessage(user.lineId, MESSAGES.HELP.REGISTER_COMMAND);
        return;
      case "check":
        await sendTextMessage(user.lineId, MESSAGES.HELP.CHECK_COMMAND);
        return;
      case "cal":
        await sendTextMessage(user.lineId, MESSAGES.HELP.CALENDAR_COMMAND);
        return;
      default:
        await sendTextMessage(
          user.lineId,
          `未知のコマンド: ${command}\n${MESSAGES.HELP.COMMAND_LIST}`,
        );
        return;
    }
  }

  // 一般的なヘルプを表示
  await sendTextMessage(user.lineId, MESSAGES.HELP.GENERAL);
};
