import { MESSAGES } from "../../../constants";
import { logger } from "../../../lib/logger";
import { replyTemplateMessage, replyTextMessage } from "../../line/client";
import { createCheckMenuTemplate } from "../../line/messages/templates";

/**
 * 確認コマンドを処理
 * @param args コマンド引数
 * @param userName ユーザー名
 * @param replyToken 応答トークン（指定された場合は応答メッセージとして送信）
 */
export const handleCheckCommand = async (
  args: string[],
  userName: string,
  replyToken?: string,
): Promise<void> => {
  logger.info(`確認コマンド実行: ${userName}`, { args });

  // 引数がない場合は確認オプションを表示
  if (args.length === 0) {
    const template = createCheckMenuTemplate();

    if (replyToken) {
      await replyTemplateMessage(replyToken, template, "予定確認");
    } else {
      // TODO: ユーザー名からLINE IDを取得するロジックを実装
      // await sendTemplateMessage(userLineId, template, "予定確認");
      logger.warn("プッシュメッセージの送信は現在無効化されています。");
    }
    return;
  }

  // 引数が不正な場合はヘルプを表示
  const message = `不正な引数です。\n${MESSAGES.HELP.CHECK_COMMAND}`;

  if (replyToken) {
    await replyTextMessage(replyToken, message);
  } else {
    // TODO: ユーザー名からLINE IDを取得するロジックを実装
    // await sendTextMessage(userLineId, message);
    logger.warn("プッシュメッセージの送信は現在無効化されています。");
  }
};
