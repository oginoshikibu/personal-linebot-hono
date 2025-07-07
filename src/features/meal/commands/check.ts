import type { User } from "@prisma/client";
import { MESSAGES } from "../../../constants";
import { logger } from "../../../utils/logger";
import { sendTemplateMessage, sendTextMessage } from "../../line/client";
import { createCheckMenuTemplate } from "../../line/messages/templates";

/**
 * 確認コマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
export const handleCheckCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  logger.info(`確認コマンド実行: ${user.name}`, { args });

  // 引数がない場合は確認オプションを表示
  if (args.length === 0) {
    const template = createCheckMenuTemplate();
    await sendTemplateMessage(user.lineId, template, "食事予定確認");
    return;
  }

  // 引数が不正な場合はヘルプを表示
  await sendTextMessage(
    user.lineId,
    `不正な引数です。\n${MESSAGES.HELP.CHECK_COMMAND}`,
  );
};
