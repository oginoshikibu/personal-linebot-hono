import { MealType, PreparationType } from "@prisma/client";
import { PREPARATION_TYPE_TEXT, MEAL_TYPE_TEXT } from "../constants";

/**
 * 準備方法の日本語表示を取得
 * @param preparationType 準備方法
 * @returns 準備方法の日本語表示
 */
export const getPreparationTypeText = (preparationType: PreparationType): string => {
  return PREPARATION_TYPE_TEXT[preparationType as keyof typeof PREPARATION_TYPE_TEXT] || "未定";
};

/**
 * 食事タイプの日本語表示を取得
 * @param mealType 食事タイプ
 * @returns 食事タイプの日本語表示
 */
export const getMealTypeText = (mealType: MealType): string => {
  return MEAL_TYPE_TEXT[mealType as keyof typeof MEAL_TYPE_TEXT] || "未定";
};

/**
 * 文字列から食事タイプを解析
 * @param mealTypeStr 食事タイプ文字列
 * @returns 食事タイプまたはnull
 */
export const parseMealType = (mealTypeStr: string): MealType | null => {
  const normalized = mealTypeStr.toUpperCase();
  if (normalized === "LUNCH") return MealType.LUNCH;
  if (normalized === "DINNER") return MealType.DINNER;
  return null;
};

/**
 * 文字列から準備方法を解析
 * @param prepTypeStr 準備方法文字列
 * @returns 準備方法またはnull
 */
export const parsePreparationType = (prepTypeStr: string): PreparationType | null => {
  const normalized = prepTypeStr.toUpperCase();
  switch (normalized) {
    case "COOK_BY_SELF":
    case "COOK":
      return PreparationType.COOK_BY_SELF;
    case "BUY_TOGETHER":
    case "BUY":
      return PreparationType.BUY_TOGETHER;
    case "INDIVIDUAL":
      return PreparationType.INDIVIDUAL;
    default:
      return null;
  }
};

/**
 * 参加状態を解析
 * @param attendStr 参加状態文字列
 * @returns 参加状態
 */
export const parseAttendance = (attendStr: string): boolean => {
  const normalized = attendStr.toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "はい";
};

/**
 * 日付文字列を解析
 * @param dateStr 日付文字列
 * @returns 日付オブジェクトまたはnull
 */
export const parseDate = (dateStr: string): Date | null => {
  if (dateStr.toLowerCase() === "today") {
    return new Date();
  }
  if (dateStr.toLowerCase() === "tomorrow") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
};