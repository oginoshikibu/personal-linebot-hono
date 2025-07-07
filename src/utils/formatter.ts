import type { MealPlan, MealType } from "@prisma/client";

/**
 * 日付をフォーマットして表示用のテキストを生成
 * @param date 日付
 * @returns フォーマットされた日付テキスト
 */
export const formatDateText = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 日付の0時に設定
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // 曜日の配列
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
  
  // 今日、明日、それ以外で表示を分ける
  if (targetDate.getTime() === today.getTime()) {
    return "今日";
  }
  
  if (targetDate.getTime() === tomorrow.getTime()) {
    return "明日";
  }
  
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  const weekday = dayOfWeek[targetDate.getDay()];
  return `${month}月${day}日(${weekday})`;
};

/**
 * 食事タイプをフォーマットして表示用のテキストを生成
 * @param mealType 食事タイプ
 * @returns フォーマットされた食事タイプテキスト
 */
export const formatMealTypeText = (mealType: MealType): string => {
  switch (mealType) {
    case "LUNCH":
      return "昼食";
    case "DINNER":
      return "夕食";
    default:
      return "不明な食事";
  }
};

/**
 * 参加状態をフォーマットして表示用のテキストを生成
 * @param attendance 参加状態
 * @returns フォーマットされた参加状態テキスト
 */
export const formatAttendanceText = (attendance: string): string => {
  switch (attendance) {
    case "ATTEND":
      return "参加";
    case "ABSENT":
      return "不参加";
    case "COOK":
      return "自分が作る";
    case "BUY":
      return "買って食べる";
    case "UNDECIDED":
      return "未定";
    default:
      return "不明";
  }
};

/**
 * 食事予定をフォーマットして表示用のテキストを生成
 * @param mealPlans 食事予定の配列
 * @returns フォーマットされた食事予定テキスト
 */
export const formatMealPlans = (mealPlans: MealPlan[]): string => {
  if (mealPlans.length === 0) {
    return "予定はありません";
  }
  
  // 食事タイプごとにグループ化
  const lunchPlans = mealPlans.filter(plan => plan.mealType === "LUNCH");
  const dinnerPlans = mealPlans.filter(plan => plan.mealType === "DINNER");
  
  let result = "";
  
  // 昼食の予定をフォーマット
  if (lunchPlans.length > 0) {
    result += "【昼食】\n";
    lunchPlans.forEach(plan => {
      result += `- ${plan.userName}: ${formatAttendanceText(plan.attendance)}\n`;
    });
  }
  
  // 夕食の予定をフォーマット
  if (dinnerPlans.length > 0) {
    if (result.length > 0) {
      result += "\n";
    }
    result += "【夕食】\n";
    dinnerPlans.forEach(plan => {
      result += `- ${plan.userName}: ${formatAttendanceText(plan.attendance)}\n`;
    });
  }
  
  return result;
}; 