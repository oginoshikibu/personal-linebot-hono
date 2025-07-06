import type { User } from "@prisma/client";
import { sendTextMessage } from "../../services/line";
import { MESSAGES } from "../../constants";

/**
 * ヘルプコマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
export const handleHelpCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  await sendTextMessage(user.lineId, MESSAGES.HELP.COMMAND_LIST);
};