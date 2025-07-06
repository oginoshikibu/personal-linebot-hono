import {
  type MealParticipation,
  PreparationType,
  type User,
} from "@prisma/client";
import { MESSAGES } from "../../constants";
import { sendRegistrationOptions, sendTextMessage } from "../../services/line";
import {
  createOrUpdateMealPlan,
  getMealPlan,
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
 * 予定変更のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handleChangePostback = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.debug(`変更ポストバックデータ処理: ${data}, ユーザー: ${user.name}`);

    // 変更確認のポストバックデータを処理
    if (data.startsWith("confirm_change")) {
      await handleConfirmChange(data, user);
      return;
    }

    // 単純な文字列形式のデータを処理（today_lunch など）
    const parts = data.split("_");
    if (parts.length === 2) {
      const [dateType, mealTypeStr] = parts;

      // 日付を解析
      const date = parseDate(dateType);
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

      // 既存の食事予定を取得
      const existingMealPlan = await getMealPlan(date, mealType);

      if (!existingMealPlan) {
        await sendTextMessage(
          user.lineId,
          `${formatDateJP(date)}の${getMealTypeText(mealType)}予定はまだ登録されていません。\n` +
            "「予定登録」から新しい予定を作成してください。",
        );
        return;
      }

      // 現在の参加状態を確認
      // @ts-expect-error - getMealPlan returns MealPlan with participations included
      const currentParticipation = existingMealPlan.participations.find(
        (p: MealParticipation) => p.userId === user.id,
      );

      const currentStatus = currentParticipation
        ? currentParticipation.isAttending
          ? "参加中"
          : "不参加"
        : "未設定";

      // 変更オプションを表示
      await sendChangeOptions(
        user.lineId,
        formatDateJP(date),
        getMealTypeText(mealType),
        date.toISOString().split("T")[0],
        mealType,
        currentStatus,
        getPreparationTypeText(existingMealPlan.preparationType),
      );
      return;
    }

    // その他の形式のデータ処理
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.UNKNOWN_POSTBACK);
  } catch (error) {
    logger.error(`変更ポストバックデータ処理エラー: ${data}`, error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 変更確認のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
const handleConfirmChange = async (data: string, user: User): Promise<void> => {
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
    // 既存の食事予定を取得
    const existingMealPlan = await getMealPlan(date, mealType);

    if (!existingMealPlan) {
      await sendTextMessage(
        user.lineId,
        `${formatDateJP(date)}の${getMealTypeText(mealType)}予定が見つかりません。`,
      );
      return;
    }

    // 食事予定を更新（準備方法が変更された場合）
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
      `${formatDateJP(date)}の${getMealTypeText(mealType)}予定を変更しました。\n` +
        `参加: ${isAttending ? "はい" : "いいえ"}\n` +
        `準備: ${getPreparationTypeText(preparationType)}`,
    );

    // 他のユーザーに通知
    await sendMealPlanChangeNotification(user.id, mealPlan);
  } catch (error) {
    logger.error("食事予定変更エラー:", error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 変更オプションを送信
 * @param to 送信先ユーザーID
 * @param dateText 日付の表示テキスト
 * @param mealTypeText 食事タイプの表示テキスト
 * @param dateStr ISO形式の日付文字列
 * @param mealType 食事タイプ
 * @param currentStatus 現在の参加状態
 * @param currentPreparation 現在の準備方法
 */
const sendChangeOptions = async (
  to: string,
  dateText: string,
  mealTypeText: string,
  dateStr: string,
  mealType: import("@prisma/client").MealType,
  currentStatus: string,
  currentPreparation: string,
): Promise<void> => {
  try {
    await sendTextMessage(
      to,
      `${dateText}の${mealTypeText}予定を変更します。\n\n` +
        `現在の状態：${currentStatus}\n` +
        `現在の準備方法：${currentPreparation}`,
    );

    // 変更オプションを送信（既存の登録オプション関数を再利用）
    await sendRegistrationOptions(
      to,
      dateText,
      mealTypeText,
      dateStr,
      mealType,
    );
  } catch (error) {
    logger.error("変更オプション送信エラー:", error);
    throw error;
  }
};
