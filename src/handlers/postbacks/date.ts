import { MealType, type User } from "@prisma/client";
import { MESSAGES } from "../../constants";
import { createMealPlanFlexMessage } from "../../features/line/messages/flex";
import { getMealPlan } from "../../features/meal/services/meal";
import { getAllUsers } from "../../features/meal/services/user";
import { prepareMealPlanData } from "../../features/notification/templates/mealPlan";
import { sendFlexMessage, sendTextMessage } from "../../services/line";
import { parseDate } from "../../utils/date";
import { formatDateText } from "../../utils/formatter";
import { logger } from "../../utils/logger";

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
    const date = parseDate(dateString);
    if (!date) {
      logger.warn("無効な日付形式です", { dateString });
      await sendTextMessage(
        user.lineId,
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

    await sendFlexMessage(user.lineId, flexMessage, `${dateText}の食事予定`);
  } catch (error) {
    logger.error("日付選択処理エラー", error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};
