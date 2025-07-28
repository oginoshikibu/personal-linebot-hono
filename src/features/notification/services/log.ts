import { logger } from "../../../lib/logger";
import { prisma } from "../../../lib/prisma";

/**
 * 通知ログを記録
 * @param type 通知タイプ
 * @param content 通知内容
 * @param targetUser 対象ユーザー
 * @param relatedMealPlanId 関連する食事予定ID
 */
export const logNotification = async (
  type: string,
  content: string,
  targetUser = "ALL",
  relatedMealPlanId?: string,
): Promise<void> => {
  try {
    await prisma.notificationLog.create({
      data: {
        type,
        content,
        targetUser,
        relatedMealPlanId,
        status: "SENT",
        sentAt: new Date(),
      },
    });
    logger.info(`通知ログを記録しました: ${type}`);
  } catch (error) {
    logger.error(`通知ログ記録エラー: ${type}`, error);
    // 通知ログの記録失敗は致命的ではないのでエラーをスローしない
  }
};
