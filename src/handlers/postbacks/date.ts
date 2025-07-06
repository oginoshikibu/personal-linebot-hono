import type { TemplateContent } from "@line/bot-sdk";
import { MealType, type User } from "@prisma/client";
import { MESSAGES } from "../../constants";
import {
  createMainMenuTemplate,
  sendTemplateMessage,
  sendTextMessage,
} from "../../services/line";
import { getMealPlan } from "../../services/meal";
import { formatDateJP } from "../../utils/date";
import { logger } from "../../utils/logger";
import { parseDate } from "../../utils/meal";

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
    const selectedDate = parseDate(dateString);
    if (!selectedDate) {
      throw new Error("無効な日付形式です");
    }

    // 選択された日付の食事予定を確認
    const [lunch, dinner] = await Promise.all([
      getMealPlan(selectedDate, MealType.LUNCH),
      getMealPlan(selectedDate, MealType.DINNER),
    ]);

    // 日付選択後のメッセージを表示
    await sendTextMessage(
      user.lineId,
      `${formatDateJP(selectedDate)}が選択されました。\n` +
        `昼食: ${lunch ? "予定あり" : "予定なし"}\n` +
        `夕食: ${dinner ? "予定あり" : "予定なし"}`,
    );

    // 日付選択後のオプションを表示
    const template: TemplateContent = {
      type: "buttons",
      title: `${formatDateJP(selectedDate)}の予定`,
      text: "操作を選択してください",
      actions: [
        {
          type: "postback",
          label: "昼食を登録",
          data: `register_date_lunch?date=${dateString}`,
          displayText: `${formatDateJP(selectedDate)}の昼食を登録`,
        },
        {
          type: "postback",
          label: "夕食を登録",
          data: `register_date_dinner?date=${dateString}`,
          displayText: `${formatDateJP(selectedDate)}の夕食を登録`,
        },
        {
          type: "postback",
          label: "予定を確認",
          data: `check_date?date=${dateString}`,
          displayText: `${formatDateJP(selectedDate)}の予定を確認`,
        },
        {
          type: "message",
          label: "メインメニューへ",
          text: "メインメニュー",
        },
      ],
    };

    await sendTemplateMessage(
      user.lineId,
      template,
      `${formatDateJP(selectedDate)}の予定`,
    );
  } catch (error) {
    logger.error("日付選択処理エラー:", error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
    await sendTemplateMessage(
      user.lineId,
      createMainMenuTemplate(),
      "メインメニュー",
    );
  }
};
