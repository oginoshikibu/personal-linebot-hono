import { logger } from "../../../../lib/logger";
import { parseDate } from "../../../../utils/date";
import { replyTemplateMessage, replyTextMessage } from "../../client";
import { createLunchOptionsTemplate } from "../../messages/templates";

/**
 * 編集ポストバックを処理
 * @param data ポストバックデータ
 * @param userName ユーザー名
 * @param replyToken 応答トークン
 */
export const handleEditPostback = async (
  data: string,
  userName: string,
  replyToken: string,
): Promise<void> => {
  try {
    logger.info(`編集ポストバック処理: ${data}`, { userName });

    // URLSearchParamsを使用してデータをパース
    const params = new URLSearchParams(data);
    const dateStr = params.get("date");

    if (!dateStr) {
      logger.warn("日付が指定されていません", { data });
      await replyTextMessage(
        replyToken,
        "日付が指定されていません。もう一度お試しください。",
      );
      return;
    }

    const date = parseDate(dateStr);
    if (!date) {
      logger.warn("無効な日付形式です", { dateStr });
      await replyTextMessage(
        replyToken,
        "無効な日付形式です。もう一度お試しください。",
      );
      return;
    }

    // 昼食の予定質問を表示
    const lunchTemplate = createLunchOptionsTemplate(dateStr);
    await replyTemplateMessage(replyToken, lunchTemplate, "昼食の予定");
  } catch (error) {
    logger.error("編集ポストバック処理エラー", error);
    await replyTextMessage(
      replyToken,
      "処理中にエラーが発生しました。もう一度お試しください。",
    );
  }
};
