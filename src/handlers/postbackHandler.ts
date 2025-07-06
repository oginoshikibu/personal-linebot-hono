import { MealType, PreparationType, type User } from "@prisma/client";
import {
  createChangeMenuTemplate,
  createMainMenuTemplate,
  sendRegistrationOptions,
  sendTemplateMessage,
  sendTextMessage,
} from "../services/line";
import {
  createOrUpdateMealPlan,
  getMealPlan,
  setMealParticipation,
} from "../services/meal";
import { sendMealPlanChangeNotification } from "../services/notification";
import type { MealPlanWithRelations } from "../types/prisma";
import { addDays, formatDateJP } from "../utils/date";
import { logger } from "../utils/logger";

/**
 * ポストバックデータを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handlePostbackData = async (
  data: string,
  user: User,
): Promise<void> => {
  logger.info(`ポストバックデータ処理: ${user.lineId}`, { data });

  // 日付選択のポストバック
  if (data.startsWith("date_")) {
    await handleDateSelection(data.substring(5), user);
    return;
  }

  // 予定登録のポストバック
  if (data.startsWith("register_")) {
    await handleRegisterPostback(data.substring(9), user);
    return;
  }

  // 予定変更のポストバック
  if (data.startsWith("change_")) {
    await handleChangePostback(data.substring(7), user);
    return;
  }

  // 予定確認のポストバック
  if (data.startsWith("check_")) {
    await handleCheckPostback(data.substring(6), user);
    return;
  }

  // 未知のポストバック
  logger.warn(`未知のポストバックデータ: ${data}`, { userId: user.lineId });
  await sendTextMessage(
    user.lineId,
    "不明な操作です。もう一度お試しください。",
  );
  await sendTemplateMessage(
    user.lineId,
    createMainMenuTemplate(),
    "メインメニュー",
  );
};

/**
 * 日付選択のポストバックを処理
 * @param dateString 日付文字列 (YYYY-MM-DD)
 * @param user ユーザー
 */
const handleDateSelection = async (
  dateString: string,
  user: User,
): Promise<void> => {
  try {
    const selectedDate = new Date(dateString);
    if (Number.isNaN(selectedDate.getTime())) {
      throw new Error("無効な日付形式です");
    }

    // 選択された日付の食事予定を確認
    const lunch = await getMealPlan(selectedDate, MealType.LUNCH);
    const dinner = await getMealPlan(selectedDate, MealType.DINNER);

    // 日付選択後のメニューを表示
    await sendTextMessage(
      user.lineId,
      `${formatDateJP(selectedDate)}が選択されました。\n` +
        `昼食: ${lunch ? "予定あり" : "予定なし"}\n` +
        `夕食: ${dinner ? "予定あり" : "予定なし"}`,
    );

    // 予定変更メニューを表示
    await sendTemplateMessage(
      user.lineId,
      createChangeMenuTemplate(),
      "予定変更",
    );
  } catch (error) {
    logger.error("日付選択処理エラー:", error);
    await sendTextMessage(
      user.lineId,
      "日付の処理中にエラーが発生しました。もう一度お試しください。",
    );
    await sendTemplateMessage(
      user.lineId,
      createMainMenuTemplate(),
      "メインメニュー",
    );
  }
};

/**
 * 予定登録のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
const handleRegisterPostback = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.debug(`ポストバックデータ処理: ${data}, ユーザー: ${user.name}`);

    // 単純な文字列形式のデータを処理（register_today_lunch など）
    if (data.startsWith("register_")) {
      const parts = data.split("_");
      if (parts.length === 3) {
        const [, dateType, mealTypeStr] = parts;
        let date: Date;
        let mealType: MealType;

        // 日付を解析
        if (dateType === "today") {
          date = new Date();
        } else if (dateType === "tomorrow") {
          date = addDays(1);
        } else {
          await sendTextMessage(
            user.lineId,
            "無効な日付タイプです。もう一度お試しください。",
          );
          return;
        }

        // 食事タイプを解析
        if (mealTypeStr === "lunch") {
          mealType = MealType.LUNCH;
        } else if (mealTypeStr === "dinner") {
          mealType = MealType.DINNER;
        } else {
          await sendTextMessage(
            user.lineId,
            "無効な食事タイプです。もう一度お試しください。",
          );
          return;
        }

        // 参加状態と準備方法を選択するためのオプションを表示
        await sendRegistrationOptions(
          user.lineId,
          formatDateJP(date),
          mealType === MealType.LUNCH ? "昼食" : "夕食",
          date.toISOString().split("T")[0],
          mealType,
        );
        return;
      }
    }

    // 参加状態と準備方法を含むポストバックデータを処理
    if (data.startsWith("confirm_registration")) {
      const params = new URLSearchParams(data.substring(data.indexOf("?") + 1));
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
          preparationType === PreparationType.COOK_BY_SELF
            ? user.id
            : undefined;
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
      return;
    }

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

/**
 * 予定変更のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
const handleChangePostback = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.debug(`予定変更ポストバック処理: ${data}, ユーザー: ${user.name}`);

    // 単純な文字列形式のデータを処理（change_today_lunch など）
    const parts = data.split("_");
    if (parts.length === 3) {
      const [, dateType, mealTypeStr] = parts;
      let date: Date;
      let mealType: MealType;

      // 日付を解析
      if (dateType === "today") {
        date = new Date();
      } else if (dateType === "tomorrow") {
        date = addDays(1);
      } else {
        await sendTextMessage(
          user.lineId,
          "無効な日付タイプです。もう一度お試しください。",
        );
        return;
      }

      // 食事タイプを解析
      if (mealTypeStr === "lunch") {
        mealType = MealType.LUNCH;
      } else if (mealTypeStr === "dinner") {
        mealType = MealType.DINNER;
      } else {
        await sendTextMessage(
          user.lineId,
          "無効な食事タイプです。もう一度お試しください。",
        );
        return;
      }

      // 参加状態と準備方法を選択するためのオプションを表示
      await sendRegistrationOptions(
        user.lineId,
        formatDateJP(date),
        mealType === MealType.LUNCH ? "昼食" : "夕食",
        date.toISOString().split("T")[0],
        mealType,
      );
    } else {
      await sendTextMessage(
        user.lineId,
        "無効なポストバックデータです。もう一度お試しください。",
      );
    }
  } catch (error) {
    logger.error(`予定変更ポストバック処理エラー: ${data}`, error);
    await sendTextMessage(
      user.lineId,
      "予定変更の処理中にエラーが発生しました。もう一度お試しください。",
    );
  }
};

/**
 * 予定確認のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
const handleCheckPostback = async (data: string, user: User): Promise<void> => {
  try {
    logger.debug(`予定確認ポストバック処理: ${data}, ユーザー: ${user.name}`);

    // 単純な文字列形式のデータを処理（check_today など）
    let date: Date;

    if (data === "today") {
      date = new Date();
    } else if (data === "tomorrow") {
      date = addDays(1);
    } else {
      try {
        date = new Date(data);
        if (Number.isNaN(date.getTime())) {
          throw new Error("Invalid date");
        }
      } catch (_error) {
        await sendTextMessage(
          user.lineId,
          "無効な日付形式です。もう一度お試しください。",
        );
        return;
      }
    }

    // 昼食の予定を取得
    const lunch = await getMealPlan(date, MealType.LUNCH);

    // 夕食の予定を取得
    const dinner = await getMealPlan(date, MealType.DINNER);

    // 予定がない場合のメッセージ
    if (!lunch && !dinner) {
      await sendTextMessage(
        user.lineId,
        `${formatDateJP(date)}の食事予定はまだ登録されていません。`,
      );
      return;
    }

    // 予定を表示
    let message = `【${formatDateJP(date)}の食事予定】\n\n`;

    if (lunch) {
      message += await formatMealPlanMessage(lunch, "昼食");
    } else {
      message += "◆ 昼食: 予定なし\n\n";
    }

    if (dinner) {
      message += await formatMealPlanMessage(dinner, "夕食");
    } else {
      message += "◆ 夕食: 予定なし\n";
    }

    await sendTextMessage(user.lineId, message);
  } catch (error) {
    logger.error(`予定確認ポストバック処理エラー: ${data}`, error);
    await sendTextMessage(
      user.lineId,
      "予定確認の処理中にエラーが発生しました。もう一度お試しください。",
    );
  }
};

/**
 * 食事予定のメッセージをフォーマット
 * @param mealPlan 食事予定
 * @param mealTypeLabel 食事タイプのラベル
 * @returns フォーマットされたメッセージ
 */
const formatMealPlanMessage = async (
  mealPlan: unknown,
  mealTypeLabel: string,
): Promise<string> => {
  if (!isMealPlanWithRelations(mealPlan)) {
    return `◆ ${mealTypeLabel}: 予定情報の取得に失敗\n\n`;
  }

  let message = `◆ ${mealTypeLabel}:\n`;
  message += `  準備: ${getPreparationTypeText(mealPlan.preparationType)}`;

  if (mealPlan.cookerId) {
    const cooker = mealPlan.cooker;
    if (cooker) {
      message += ` (${cooker.name})`;
    }
  }

  message += "\n  参加者:";

  if (mealPlan.participations.length === 0) {
    message += " なし";
  } else {
    for (const participation of mealPlan.participations) {
      const userName = participation.user.name;
      message += ` ${userName}(${participation.isAttending ? "○" : "×"})`;
    }
  }

  message += "\n\n";
  return message;
};
