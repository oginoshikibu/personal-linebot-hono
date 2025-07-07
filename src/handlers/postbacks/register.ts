import { PreparationType, type User } from "@prisma/client";
import { MESSAGES } from "../../constants";
import { sendRegistrationOptions, sendTextMessage } from "../../services/line";
import {
  createOrUpdateMealPlan,
  setMealParticipation,
} from "../../services/meal";
import { sendMealPlanChangeNotification } from "../../services/notification";
import { formatDateJP } from "../../utils/date";
import { logger } from "../../utils/logger";
import {
  getMealTypeText,
  getPreparationTypeText,
  parseAttendance,
  parseDate,
  parseMealType,
  parsePreparationType,
} from "../../utils/meal";

/**
 * 予定登録のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handleRegisterPostback = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.debug(`ポストバックデータ処理: ${data}, ユーザー: ${user.name}`);

    // register_date_lunch?date=YYYY-MM-DD 形式を処理
    if (
      data.startsWith("register_date_lunch") ||
      data.startsWith("register_date_dinner")
    ) {
      const params = new URLSearchParams(data.substring(data.indexOf("?") + 1));
      const dateStr = params.get("date");
      const mealTypeStr = data.includes("_lunch") ? "lunch" : "dinner";

      if (!dateStr) {
        await sendTextMessage(user.lineId, MESSAGES.ERRORS.MISSING_PARAMETERS);
        return;
      }

      // 日付を解析
      const date = parseDate(dateStr);
      if (!date) {
        await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_DATE);
        return;
      }

      // 食事タイプを解析
      const mealType = parseMealType(mealTypeStr);
      if (!mealType) {
        await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_MEAL_TYPE);
        return;
      }

      // 参加状態と準備方法を選択するためのオプションを表示
      await sendRegistrationOptions(
        user.lineId,
        formatDateJP(date),
        getMealTypeText(mealType),
        date.toISOString().split("T")[0],
        mealType,
      );
      return;
    }

    // 単純な文字列形式のデータを処理（register_today_lunch など）
    const parts = data.split("_");
    if (parts.length === 3) {
      const [, dateType, mealTypeStr] = parts;
      let date: Date | null = null;

      // 日付を解析
      date = parseDate(dateType);

      if (!date) {
        await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_DATE);
        return;
      }

      // 食事タイプを解析
      const mealType = parseMealType(mealTypeStr);
      if (!mealType) {
        await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_MEAL_TYPE);
        return;
      }

      // 参加状態と準備方法を選択するためのオプションを表示
      await sendRegistrationOptions(
        user.lineId,
        formatDateJP(date),
        getMealTypeText(mealType),
        date.toISOString().split("T")[0],
        mealType,
      );
      return;
    }

    // 参加状態と準備方法を含むポストバックデータを処理
    if (data.startsWith("confirm_registration")) {
      await handleConfirmRegistration(data, user);
      return;
    }

    // クエリパラメータ形式のデータをパース
    const params = new URLSearchParams(data);
    const action = params.get("action");

    if (!action) {
      await sendTextMessage(user.lineId, MESSAGES.ERRORS.MISSING_PARAMETERS);
      return;
    }

    switch (action) {
      case "register_meal":
        await handleRegisterMeal(params, user);
        break;
      default:
        await sendTextMessage(user.lineId, `未対応のアクション: ${action}`);
        break;
    }
  } catch (error) {
    logger.error(`ポストバックデータ処理エラー: ${data}`, error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 登録確認のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
const handleConfirmRegistration = async (
  data: string,
  user: User,
): Promise<void> => {
  const params = new URLSearchParams(data.substring(data.indexOf("?") + 1));
  const dateStr = params.get("date");
  const mealTypeStr = params.get("mealType");
  const attendStr = params.get("attend");
  const prepTypeStr = params.get("prepType");

  // パラメータのバリデーション
  if (!dateStr || !mealTypeStr || !attendStr || !prepTypeStr) {
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.MISSING_PARAMETERS);
    return;
  }

  // 日付を解析
  const date = parseDate(dateStr);
  if (!date) {
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_DATE);
    return;
  }

  // 食事タイプを解析
  const mealType = parseMealType(mealTypeStr);
  if (!mealType) {
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_MEAL_TYPE);
    return;
  }

  // 参加状態を解析
  const isAttending = parseAttendance(attendStr);

  // 準備方法を解析
  const preparationType = parsePreparationType(prepTypeStr);
  if (!preparationType) {
    await sendTextMessage(
      user.lineId,
      MESSAGES.ERRORS.INVALID_PREPARATION_TYPE,
    );
    return;
  }

  try {
    // 食事予定を作成または更新
    const cookerId =
      preparationType === PreparationType.COOK_BY_SELF ? user.id : undefined;
    const mealPlan = await createOrUpdateMealPlan(
      date,
      mealType,
      preparationType,
      cookerId,
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

/**
 * 食事予定登録アクションを処理
 * @param params URLSearchParamsオブジェクト
 * @param user ユーザー
 */
const handleRegisterMeal = async (
  params: URLSearchParams,
  user: User,
): Promise<void> => {
  // パラメータを取得
  const dateStr = params.get("date");
  const mealTypeStr = params.get("mealType");
  const attendStr = params.get("attend");
  const prepTypeStr = params.get("prepType");

  // パラメータのバリデーション
  if (!dateStr || !mealTypeStr || !attendStr || !prepTypeStr) {
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.MISSING_PARAMETERS);
    return;
  }

  // 日付を解析
  const date = parseDate(dateStr);
  if (!date) {
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_DATE);
    return;
  }

  // 食事タイプを解析
  const mealType = parseMealType(mealTypeStr);
  if (!mealType) {
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_MEAL_TYPE);
    return;
  }

  // 参加状態を解析
  const isAttending = parseAttendance(attendStr);

  // 準備方法を解析
  const preparationType = parsePreparationType(prepTypeStr);
  if (!preparationType) {
    await sendTextMessage(
      user.lineId,
      MESSAGES.ERRORS.INVALID_PREPARATION_TYPE,
    );
    return;
  }

  try {
    // 食事予定を作成または更新
    const cookerId =
      preparationType === PreparationType.COOK_BY_SELF ? user.id : undefined;
    const mealPlan = await createOrUpdateMealPlan(
      date,
      mealType,
      preparationType,
      cookerId,
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
