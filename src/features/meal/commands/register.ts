import type { User } from "@prisma/client";
import { MESSAGES } from "../../../constants";
import { logger } from "../../../utils/logger";
import { sendTemplateMessage, sendTextMessage } from "../../line/client";
import { createRegistrationOptionsTemplate } from "../../line/messages/templates";

/**
 * 登録コマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
export const handleRegisterCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  logger.info(`登録コマンド実行: ${user.name}`, { args });

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
    await sendTemplateMessage(user.lineId, template, "食事予定登録");
    return;
  }

  // 引数が不正な場合はヘルプを表示
  await sendTextMessage(
    user.lineId,
    `不正な引数です。\n${MESSAGES.HELP.REGISTER_COMMAND}`,
  );
};
