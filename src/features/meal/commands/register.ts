import { MESSAGES } from "../../../constants";
import { logger } from "../../../lib/logger";
import { replyTemplateMessage, replyTextMessage } from "../../line/client";
import { createRegistrationOptionsTemplate } from "../../line/messages/templates";

/**
 * 登録コマンドを処理
 * @param args コマンド引数
 * @param userName ユーザー名
 * @param replyToken 応答トークン（指定された場合は応答メッセージとして送信）
 */
export const handleRegisterCommand = async (
  args: string[],
  userName: string,
  replyToken?: string,
): Promise<void> => {
  logger.info(`登録コマンド実行: ${userName}`, { args });

  // 引数がない場合は登録オプションを表示
  if (args.length === 0) {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const template = createRegistrationOptionsTemplate(
      "今日",
      "昼食",
      dateStr,
      "LUNCH",
    );

    if (replyToken) {
      await replyTemplateMessage(replyToken, template, "予定登録");
    } else {
      // TODO: ユーザー名からLINE IDを取得するロジックを実装
      // await sendTemplateMessage(userLineId, template, "予定登録");
      logger.warn("プッシュメッセージの送信は現在無効化されています。");
    }
    return;
  }

  // 引数が不正な場合はヘルプを表示
  const message = `不正な引数です。\n${MESSAGES.HELP.REGISTER_COMMAND}`;

  if (replyToken) {
    await replyTextMessage(replyToken, message);
  } else {
    // TODO: ユーザー名からLINE IDを取得するロジックを実装
    // await sendTextMessage(userLineId, message);
    logger.warn("プッシュメッセージの送信は現在無効化されています。");
  }
};
