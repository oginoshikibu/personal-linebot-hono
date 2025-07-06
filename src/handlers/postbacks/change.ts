import type { User } from "@prisma/client";
import { MESSAGES } from "../../constants";
import { sendTextMessage } from "../../services/line";
import { logger } from "../../utils/logger";

/**
 * 予定変更のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handleChangePostback = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.debug(`変更ポストバックデータ処理: ${data}, ユーザー: ${user.name}`);

    // TODO: 変更処理の実装
    await sendTextMessage(user.lineId, "変更機能は現在開発中です。");
  } catch (error) {
    logger.error(`変更ポストバックデータ処理エラー: ${data}`, error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};
