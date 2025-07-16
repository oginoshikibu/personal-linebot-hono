import type { User } from "@prisma/client";
import { MealType } from "@prisma/client";
import { parseDate } from "../../../../utils/date";
import { formatDateText } from "../../../../utils/formatter";
import { logger } from "../../../../utils/logger";
import { getMealPlan } from "../../../meal/services/meal";
import { getAllUsers } from "../../../meal/services/user";
import { prepareMealPlanData } from "../../../notification/templates/mealPlan";
import {
  replyFlexMessage,
  replyTemplateMessage,
  replyTextMessage,
} from "../../client";
import { createMealPlanFlexMessage } from "../../messages/flex";
import { createDateSelectionOptionsTemplate } from "../../messages/templates";

/**
 * 日付選択のポストバックを処理
 * @param dateString 日付文字列 (YYYY-MM-DD)
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
export const handleDateSelection = async (
  dateString: string,
  user: User,
  replyToken: string,
): Promise<void> => {
  try {
    logger.info(`日付選択処理: ${dateString}`, { userId: user.lineId });

    const date = parseDate(dateString);
    if (!date) {
      logger.warn("無効な日付形式です", { dateString });
      await replyTextMessage(
        replyToken,
        "無効な日付形式です。もう一度お試しください。",
      );
      return;
    }

    const dateText = formatDateText(date);

    // 選択日の昼食と夕食の予定を取得
    const [lunch, dinner, users] = await Promise.all([
      getMealPlan(date, MealType.LUNCH),
      getMealPlan(date, MealType.DINNER),
      getAllUsers(),
    ]);

    // 予定がない場合のメッセージ
    if (!lunch && !dinner) {
      // テンプレートメッセージを作成して送信
      const template = createDateSelectionOptionsTemplate(dateText, dateString);
      await replyTemplateMessage(
        replyToken,
        template,
        `${dateText}の予定はまだ登録されていません`,
      );
      return;
    }

    // Flexメッセージ用のデータを準備
    const lunchData = lunch
      ? prepareMealPlanData(lunch, users)
      : { participants: [], preparationType: "UNDECIDED" };

    const dinnerData = dinner
      ? prepareMealPlanData(dinner, users)
      : { participants: [], preparationType: "UNDECIDED" };

    // 編集ボタン付きのFlexメッセージを作成して送信
    const flexMessage = createMealPlanFlexMessage(
      `【${dateText}の食事予定】`,
      lunchData,
      dinnerData,
      dateString, // 編集用の日付文字列を渡す
    );

    await replyFlexMessage(replyToken, flexMessage, `${dateText}の食事予定`);
  } catch (error) {
    logger.error("日付選択処理エラー", error);
    await replyTextMessage(
      replyToken,
      "処理中にエラーが発生しました。もう一度お試しください。",
    );
  }
};
