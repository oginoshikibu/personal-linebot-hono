import type { User } from "@prisma/client";
import { MESSAGES } from "../../constants";
import { sendTextMessage } from "../../services/line";
import { logger } from "../../utils/logger";

/**
 * 予定確認のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handleCheckPostback = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.debug(`確認ポストバックデータ処理: ${data}, ユーザー: ${user.name}`);

    // TODO: 確認処理の実装
    await sendTextMessage(user.lineId, "確認機能は現在開発中です。");
  } catch (error) {
    logger.error(`確認ポストバックデータ処理エラー: ${data}`, error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};
