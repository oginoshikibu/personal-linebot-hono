import type { User } from "@prisma/client";
import { logger } from "../../../../utils/logger";
import { parseDate } from "../../../../utils/date";
import { sendTemplateMessage, sendTextMessage } from "../../client";
import { createLunchOptionsTemplate } from "../../messages/templates";

/**
 * 編集ポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handleEditPostback = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.info(`編集ポストバック処理: ${data}`, { userId: user.lineId });
    
    // URLSearchParamsを使用してデータをパース
    const params = new URLSearchParams(data);
    const dateStr = params.get("date");
    
    if (!dateStr) {
      logger.warn("日付が指定されていません", { data });
      await sendTextMessage(user.lineId, "日付が指定されていません。もう一度お試しください。");
      return;
    }
    
    const date = parseDate(dateStr);
    if (!date) {
      logger.warn("無効な日付形式です", { dateStr });
      await sendTextMessage(user.lineId, "無効な日付形式です。もう一度お試しください。");
      return;
    }
    
    // 昼食の予定質問を表示
    const lunchTemplate = createLunchOptionsTemplate(dateStr);
    await sendTemplateMessage(user.lineId, lunchTemplate, "昼食の予定");
    
  } catch (error) {
    logger.error("編集ポストバック処理エラー", error);
    await sendTextMessage(
      user.lineId,
      "処理中にエラーが発生しました。もう一度お試しください。"
    );
  }
}; 