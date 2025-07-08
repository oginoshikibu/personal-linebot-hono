import type { User } from "@prisma/client";
import { MESSAGES } from "../../../constants";
import { logger } from "../../../utils/logger";
import {
  replyTemplateMessage,
  replyTextMessage,
  sendTemplateMessage,
  sendTextMessage,
} from "../../line/client";
import { createCheckMenuTemplate } from "../../line/messages/templates";

/**
 * 確認コマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 * @param replyToken 応答トークン（指定された場合は応答メッセージとして送信）
 */
export const handleCheckCommand = async (
  args: string[],
  user: User,
  replyToken?: string,
): Promise<void> => {
  logger.info(`確認コマンド実行: ${user.name}`, { args });

  // 引数がない場合は確認オプションを表示
  if (args.length === 0) {
    const template = createCheckMenuTemplate();

    if (replyToken) {
      await replyTemplateMessage(replyToken, template, "予定確認");
    } else {
      await sendTemplateMessage(user.lineId, template, "予定確認");
    }
    return;
  }

  // 引数が不正な場合はヘルプを表示
  const message = `不正な引数です。\n${MESSAGES.HELP.CHECK_COMMAND}`;

  if (replyToken) {
    await replyTextMessage(replyToken, message);
  } else {
    await sendTextMessage(user.lineId, message);
  }
};
