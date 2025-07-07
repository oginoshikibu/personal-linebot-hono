import type { User } from "@prisma/client";
import { MESSAGES } from "../../constants";
import { sendTextMessage } from "../../services/line";

/**
 * ヘルプコマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
export const handleHelpCommand = async (
  _args: string[],
  user: User,
): Promise<void> => {
  await sendTextMessage(user.lineId, MESSAGES.HELP.COMMAND_LIST);
};
