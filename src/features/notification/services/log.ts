import { logger } from "../../../lib/logger";
import { prisma } from "../../../lib/prisma";

/**
 * 通知ログを記録
 * @param type 通知タイプ
 * @param content 通知内容
 */
export const logNotification = async (
  type: string,
  content: string,
): Promise<void> => {
  try {
    await prisma.notificationLog.create({
      data: {
        type,
        content,
      },
    });
    logger.info(`通知ログを記録しました: ${type}`);
  } catch (error) {
    logger.error(`通知ログ記録エラー: ${type}`, error);
    // 通知ログの記録失敗は致命的ではないのでエラーをスローしない
  }
};
