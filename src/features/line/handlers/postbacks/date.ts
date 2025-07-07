import type { User } from "@prisma/client";
import { logger } from "../../../../utils/logger";
import { parseDate } from "../../../../utils/date";
import { sendTemplateMessage, sendTextMessage } from "../../client";
import { createDateSelectionOptionsTemplate } from "../../messages/templates";
import { formatDateText } from "../../../../utils/formatter";

/**
 * 日付選択のポストバックを処理
 * @param dateString 日付文字列 (YYYY-MM-DD)
 * @param user ユーザー
 */
export const handleDateSelection = async (
  dateString: string,
  user: User,
): Promise<void> => {
  try {
    logger.info(`日付選択処理: ${dateString}`, { userId: user.lineId });
    
    const date = parseDate(dateString);
    if (!date) {
      logger.warn("無効な日付形式です", { dateString });
      await sendTextMessage(user.lineId, "無効な日付形式です。もう一度お試しください。");
      return;
    }
    
    const dateText = formatDateText(date);
    
    // 選択された日付の予定表示と編集オプションを表示
    const template = createDateSelectionOptionsTemplate(dateText, dateString);
    await sendTemplateMessage(user.lineId, template, `${dateText}の予定`);
    
  } catch (error) {
    logger.error("日付選択処理エラー", error);
    await sendTextMessage(
      user.lineId,
      "処理中にエラーが発生しました。もう一度お試しください。"
    );
  }
}; 