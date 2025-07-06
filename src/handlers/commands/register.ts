import type { User } from "@prisma/client";
import { PreparationType } from "@prisma/client";
import { sendTextMessage } from "../../services/line";
import { createOrUpdateMealPlan, setMealParticipation } from "../../services/meal";
import { sendMealPlanChangeNotification } from "../../services/notification";
import { formatDateJP } from "../../utils/date";
import { logger } from "../../utils/logger";
import { 
  parseDate, 
  parseMealType, 
  parsePreparationType, 
  parseAttendance,
  getPreparationTypeText,
  getMealTypeText
} from "../../utils/meal";
import { MESSAGES } from "../../constants";

/**
 * 登録コマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
export const handleRegisterCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  // 引数が足りない場合
  if (args.length < 3) {
    await sendTextMessage(user.lineId, MESSAGES.HELP.REGISTER_USAGE);
    return;
  }

  // 日付を解析
  const date = parseDate(args[0]);
  if (!date) {
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_DATE);
    return;
  }

  // 食事タイプを解析
  const mealType = parseMealType(args[1]);
  if (!mealType) {
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_MEAL_TYPE);
    return;
  }

  // 参加状態を解析
  const isAttending = parseAttendance(args[2]);

  // 準備方法を解析（オプション）
  let preparationType: PreparationType = PreparationType.INDIVIDUAL;
  if (args.length >= 4) {
    const parsed = parsePreparationType(args[3]);
    if (parsed) {
      preparationType = parsed;
    } else {
      await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_PREPARATION_TYPE);
      return;
    }
  }

  try {
    // 食事予定を作成または更新
    const mealPlan = await createOrUpdateMealPlan(
      date,
      mealType,
      preparationType,
      preparationType === PreparationType.COOK_BY_SELF ? user.id : undefined,
    );

    // 参加状態を設定
    await setMealParticipation(mealPlan.id, user.id, isAttending);

    // 確認メッセージを送信
    await sendTextMessage(
      user.lineId,
      `${formatDateJP(date)}の${getMealTypeText(mealType)}予定を登録しました。\n` +
        `参加: ${isAttending ? "はい" : "いいえ"}\n` +
        `準備: ${getPreparationTypeText(preparationType)}`,
    );

    // 他のユーザーに通知
    await sendMealPlanChangeNotification(user.id, mealPlan);
  } catch (error) {
    logger.error("食事予定登録エラー:", error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.REGISTRATION_FAILED);
  }
};