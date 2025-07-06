import type { User, MealParticipation } from "@prisma/client";
import { MealType } from "@prisma/client";
import { sendTextMessage } from "../../services/line";
import { getMealPlan, getAllUsers } from "../../services/meal";
import { formatDateJP } from "../../utils/date";
import { logger } from "../../utils/logger";
import { parseDate, getPreparationTypeText } from "../../utils/meal";
import { MESSAGES } from "../../constants";

/**
 * 確認コマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
export const handleCheckCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  // 日付を解析
  const dateStr = args.length > 0 ? args[0] : "today";
  const date = parseDate(dateStr);
  
  if (!date) {
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.INVALID_DATE);
    return;
  }

  try {
    // 昼食と夕食の予定を取得
    const [lunch, dinner, users] = await Promise.all([
      getMealPlan(date, MealType.LUNCH),
      getMealPlan(date, MealType.DINNER),
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
    logger.error("食事予定確認エラー:", error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 食事予定の詳細をフォーマット
 * @param mealPlan 食事予定
 * @param users ユーザー一覧
 * @returns フォーマット済みの文字列
 */
const formatMealPlanDetails = (mealPlan: any, users: User[]): string => {
  let details = "";
  
  for (const u of users) {
    // participationsプロパティは型定義上は存在するが、実行時には存在する
    // @ts-expect-error - getMealPlan includes participations in the query but TypeScript doesn't know this
    const participation = mealPlan.participations?.find(
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