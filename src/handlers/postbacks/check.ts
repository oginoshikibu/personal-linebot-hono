import type { MealParticipation, User } from "@prisma/client";
import { MealType } from "@prisma/client";
import { MESSAGES } from "../../constants";
import { sendTextMessage } from "../../services/line";
import { getAllUsers, getMealPlan } from "../../services/meal";
import type { MealPlanWithRelations } from "../../types/prisma";
import { formatDateJP } from "../../utils/date";
import { logger } from "../../utils/logger";
import { getPreparationTypeText, parseDate } from "../../utils/meal";

/**
 * 予定確認のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handleCheckPostback = async (
  data: string,
  user: User,
): Promise<void> => {
  try {
    logger.debug(`確認ポストバックデータ処理: ${data}, ユーザー: ${user.name}`);

    // データをパースして日付と食事タイプを取得
    const params = parsePostbackData(data);
    
    if (!params) {
      logger.warn(`不正な確認ポストバックデータ: ${data}`);
      await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_DATE);
      return;
    }

    const { date, mealType } = params;

    // 指定された食事タイプの予定を取得するか、両方を取得
    const [lunch, dinner, users] = await Promise.all([
      !mealType || mealType === MealType.LUNCH 
        ? getMealPlan(date, MealType.LUNCH) 
        : null,
      !mealType || mealType === MealType.DINNER 
        ? getMealPlan(date, MealType.DINNER) 
        : null,
      getAllUsers(),
    ]);

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
      message += "◆ 昼食\n";
      message += formatMealPlanDetails(lunch, users);
      message += "\n";
    }

    if (dinner) {
      message += "◆ 夕食\n";
      message += formatMealPlanDetails(dinner, users);
    }

    await sendTextMessage(user.lineId, message);
  } catch (error) {
    logger.error(`確認ポストバックデータ処理エラー: ${data}`, error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * ポストバックデータをパースする
 * @param data ポストバックデータ
 * @returns パース済みのパラメータ
 */
const parsePostbackData = (data: string): { date: Date; mealType?: MealType } | null => {
  // action=check_meal&date=2024-01-01&mealType=DINNER 形式
  if (data.startsWith("action=check_meal")) {
    const params = new URLSearchParams(data.substring(data.indexOf("?")));
    const dateStr = params.get("date");
    const mealTypeStr = params.get("mealType");
    
    if (!dateStr) return null;
    
    const date = parseDate(dateStr);
    if (!date) return null;
    
    const mealType = mealTypeStr === "LUNCH" ? MealType.LUNCH : 
                    mealTypeStr === "DINNER" ? MealType.DINNER : undefined;
    
    return { date, mealType };
  }

  // date_2024-01-01 形式
  if (data.startsWith("date_")) {
    const dateStr = data.substring(5);
    const date = parseDate(dateStr);
    if (!date) return null;
    return { date };
  }

  // meal 形式（今日の予定）
  if (data === "meal") {
    const today = new Date();
    return { date: today };
  }

  // today 形式
  if (data === "today") {
    const today = new Date();
    return { date: today };
  }

  // tomorrow 形式
  if (data === "tomorrow") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { date: tomorrow };
  }

  // その他のケース - 日付として解析を試行
  const date = parseDate(data);
  if (date) {
    return { date };
  }

  return null;
};

/**
 * オブジェクトがMealPlanWithRelations型かどうかを判定する型ガード
 * @param obj 判定対象のオブジェクト
 * @returns MealPlanWithRelations型かどうか
 */
const isMealPlanWithRelations = (
  obj: unknown,
): obj is MealPlanWithRelations => {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  try {
    // 型アサーションを避けるために、プロパティアクセスを安全に行う
    const hasId = "id" in obj;
    const hasPreparationType = "preparationType" in obj;
    const hasParticipations = "participations" in obj;

    if (!hasId || !hasPreparationType || !hasParticipations) {
      return false;
    }

    // 型アサーションを避けて、プロパティの型を安全にチェック
    const idType = typeof (obj as any).id;
    const prepType = typeof (obj as any).preparationType;
    const participationsIsArray = Array.isArray((obj as any).participations);

    return (
      idType === "string" && prepType === "string" && participationsIsArray
    );
  } catch {
    return false;
  }
};

/**
 * 食事予定の詳細をフォーマット
 * @param mealPlan 食事予定
 * @param users ユーザー一覧
 * @returns フォーマット済みの文字列
 */
const formatMealPlanDetails = (mealPlan: unknown, users: User[]): string => {
  let details = "";

  // Type guard to ensure mealPlan has expected properties
  if (!isMealPlanWithRelations(mealPlan)) {
    return "食事予定の情報が正しく取得できませんでした。";
  }

  for (const u of users) {
    // participationsプロパティは型ガードで確認済み
    const participation = mealPlan.participations.find(
      (p: MealParticipation) => p.userId === u.id,
    );
    details += `${u.name}: ${participation?.isAttending ? "参加" : "不参加"}\n`;
  }

  details += `準備: ${getPreparationTypeText(mealPlan.preparationType)}\n`;

  if (mealPlan.cookerId) {
    const cooker = users.find((u) => u.id === mealPlan.cookerId);
    if (cooker) {
      details += `調理担当: ${cooker.name}\n`;
    }
  }

  return details;
};
