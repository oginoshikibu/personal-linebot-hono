import { MealType, PreparationType, type User } from "@prisma/client";
import { sendTextMessage } from "../services/line";
import {
  createOrUpdateMealPlan,
  getMealPlan,
  setMealParticipation,
} from "../services/meal";
import { sendMealPlanChangeNotification } from "../services/notification";
import type { MealPlanWithRelations } from "../types/prisma";
import { formatDateJP } from "../utils/date";
import { logger } from "../utils/logger";

/**
 * ポストバックデータを処理する
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handlePostbackData = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.debug(`ポストバックデータ処理: ${data}, ユーザー: ${user.name}`);

    // クエリパラメータ形式のデータをパース
    const params = new URLSearchParams(data);
    const action = params.get("action");

    if (!action) {
      await sendTextMessage(
        user.lineId,
        "無効なポストバックデータです。もう一度お試しください。",
      );
      return;
    }

    switch (action) {
      case "register_meal":
        await handleRegisterMeal(params, user);
        break;

      case "check_meal":
        await handleCheckMeal(params, user);
        break;

      default:
        await sendTextMessage(user.lineId, `未対応のアクション: ${action}`);
        break;
    }
  } catch (error) {
    logger.error(`ポストバックデータ処理エラー: ${data}`, error);
    await sendTextMessage(
      user.lineId,
      "ポストバックデータの処理中にエラーが発生しました。もう一度お試しください。",
    );
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
    await sendTextMessage(
      user.lineId,
      "必要なパラメータが不足しています。もう一度お試しください。",
    );
    return;
  }

  // 日付を解析
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    await sendTextMessage(
      user.lineId,
      "無効な日付形式です。もう一度お試しください。",
    );
    return;
  }

  // 食事タイプを解析
  let mealType: MealType;
  if (mealTypeStr === "LUNCH") {
    mealType = MealType.LUNCH;
  } else if (mealTypeStr === "DINNER") {
    mealType = MealType.DINNER;
  } else {
    await sendTextMessage(
      user.lineId,
      "無効な食事タイプです。もう一度お試しください。",
    );
    return;
  }

  // 参加状態を解析
  const isAttending = attendStr === "true";

  // 準備方法を解析
  let preparationType: PreparationType;
  switch (prepTypeStr) {
    case "COOK_BY_SELF":
      preparationType = PreparationType.COOK_BY_SELF;
      break;
    case "BUY_TOGETHER":
      preparationType = PreparationType.BUY_TOGETHER;
      break;
    case "INDIVIDUAL":
      preparationType = PreparationType.INDIVIDUAL;
      break;
    default:
      await sendTextMessage(
        user.lineId,
        "無効な準備方法です。もう一度お試しください。",
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
      `${formatDateJP(date)}の${mealType === MealType.LUNCH ? "昼食" : "夕食"}予定を登録しました。\n` +
        `参加: ${isAttending ? "はい" : "いいえ"}\n` +
        `準備: ${getPreparationTypeText(preparationType)}`,
    );

    // 他のユーザーに通知
    await sendMealPlanChangeNotification(user.id, mealPlan);
  } catch (error) {
    logger.error("食事予定登録エラー:", error);
    await sendTextMessage(
      user.lineId,
      "予定の登録中にエラーが発生しました。もう一度お試しください。",
    );
  }
};

/**
 * MealPlanオブジェクトがMealPlanWithRelations型かどうかを判定する型ガード
 * @param mealPlan 判定対象のオブジェクト
 * @returns MealPlanWithRelations型かどうか
 */
function isMealPlanWithRelations(
  mealPlan: unknown,
): mealPlan is MealPlanWithRelations {
  if (!mealPlan || typeof mealPlan !== "object") {
    return false;
  }

  // participationsプロパティの存在とその型を確認
  // 型安全なチェック方法を使用
  const hasParticipations = Object.hasOwn(mealPlan, "participations");
  if (!hasParticipations) {
    return false;
  }

  // participationsが配列かどうかチェック
  // 安全にアクセスするため、インデックスシグネチャを使わず、型ガードを利用
  return Array.isArray(
    Object.getOwnPropertyDescriptor(mealPlan, "participations")?.value,
  );
}

/**
 * 食事予定確認アクションを処理
 * @param params URLSearchParamsオブジェクト
 * @param user ユーザー
 */
const handleCheckMeal = async (
  params: URLSearchParams,
  user: User,
): Promise<void> => {
  // パラメータを取得
  const dateStr = params.get("date");
  const mealTypeStr = params.get("mealType");

  // パラメータのバリデーション
  if (!dateStr || !mealTypeStr) {
    await sendTextMessage(
      user.lineId,
      "必要なパラメータが不足しています。もう一度お試しください。",
    );
    return;
  }

  // 日付を解析
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    await sendTextMessage(
      user.lineId,
      "無効な日付形式です。もう一度お試しください。",
    );
    return;
  }

  // 食事タイプを解析
  let mealType: MealType;
  if (mealTypeStr === "LUNCH") {
    mealType = MealType.LUNCH;
  } else if (mealTypeStr === "DINNER") {
    mealType = MealType.DINNER;
  } else {
    await sendTextMessage(
      user.lineId,
      "無効な食事タイプです。もう一度お試しください。",
    );
    return;
  }

  try {
    // 食事予定を取得
    const mealPlan = await getMealPlan(date, mealType);

    if (!mealPlan) {
      await sendTextMessage(
        user.lineId,
        `${formatDateJP(date)}の${mealType === MealType.LUNCH ? "昼食" : "夕食"}予定はまだ登録されていません。`,
      );
      return;
    }

    // 型ガードを使用して拡張型かどうかを確認
    if (!isMealPlanWithRelations(mealPlan)) {
      await sendTextMessage(
        user.lineId,
        "食事予定の取得中に問題が発生しました。もう一度お試しください。",
      );
      return;
    }

    // 参加者情報を整形
    const participants = mealPlan.participations
      .map((p) => `${p.user.name}: ${p.isAttending ? "参加" : "不参加"}`)
      .join("\n");

    // 準備方法を取得
    const prepType = getPreparationTypeText(mealPlan.preparationType);

    // 調理担当者情報を取得
    let cookerInfo = "";
    if (
      mealPlan.cooker &&
      typeof mealPlan.cooker === "object" &&
      "name" in mealPlan.cooker
    ) {
      cookerInfo = `(${mealPlan.cooker.name}が担当)`;
    }

    // メッセージを送信
    await sendTextMessage(
      user.lineId,
      `【${formatDateJP(date)}の${mealType === MealType.LUNCH ? "昼食" : "夕食"}予定】\n` +
        `準備: ${prepType}${cookerInfo}\n\n` +
        `【参加者】\n${participants || "まだ参加者がいません"}`,
    );
  } catch (error) {
    logger.error("食事予定確認エラー:", error);
    await sendTextMessage(
      user.lineId,
      "予定の確認中にエラーが発生しました。もう一度お試しください。",
    );
  }
};

/**
 * 準備方法のテキスト表現を取得
 * @param preparationType 準備方法
 * @returns 準備方法のテキスト表現
 */
const getPreparationTypeText = (preparationType: PreparationType): string => {
  switch (preparationType) {
    case PreparationType.COOK_BY_SELF:
      return "自炊";
    case PreparationType.INDIVIDUAL:
      return "各自自由に";
    case PreparationType.BUY_TOGETHER:
      return "買って一緒に食べる";
    default:
      return "未定";
  }
};
