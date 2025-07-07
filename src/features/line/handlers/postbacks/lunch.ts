import type { User } from "@prisma/client";
import { logger } from "../../../../utils/logger";
import { parseDate } from "../../../../utils/date";
import { sendTemplateMessage, sendTextMessage } from "../../client";
import { createDinnerOptionsTemplate } from "../../messages/templates";
import { formatDateText } from "../../../../utils/formatter";

/**
 * 昼食の予定質問のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handleLunchPostback = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.info(`昼食ポストバック処理: ${data}`, { userId: user.lineId });
    
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
    
    // 昼食の予定を保存
    const action = data.substring("action=".length).split("&")[0];
    const attendance = action.replace("lunch_", "");
    
    // TODO: 昼食の予定をデータベースに保存する処理を追加
    logger.info(`昼食の予定を保存: ${dateStr}, ${attendance}`, { userId: user.lineId });
    
    // 昼食の予定を保存した旨のメッセージを送信
    const dateText = formatDateText(date);
    await sendTextMessage(user.lineId, `${dateText}の昼食: ${getAttendanceText(attendance)}`);
    
    // 夕食の予定質問を表示
    const dinnerTemplate = createDinnerOptionsTemplate(dateStr);
    await sendTemplateMessage(user.lineId, dinnerTemplate, "夕食の予定");
    
  } catch (error) {
    logger.error("昼食ポストバック処理エラー", error);
    await sendTextMessage(
      user.lineId,
      "処理中にエラーが発生しました。もう一度お試しください。"
    );
  }
};

/**
 * 参加状態のテキストを取得
 * @param attendance 参加状態
 * @returns 参加状態のテキスト
 */
const getAttendanceText = (attendance: string): string => {
  switch (attendance) {
    case "attend":
      return "参加";
    case "absent":
      return "不参加";
    case "cook":
      return "自分が作る";
    case "undecided":
      return "未定";
    default:
      return "不明";
  }
}; 