import {
  MealType,
  ParticipationStatus,
  PreparationRole,
} from "../domain/entities/MealPlan";

/**
 * 準備担当者の日本語表示を取得
 * @param preparationRole 準備担当者
 * @returns 準備担当者の日本語表示
 */
export const getPreparationRoleText = (
  preparationRole: PreparationRole,
): string => {
  switch (preparationRole) {
    case PreparationRole.ALICE:
      return "Aliceが作る";
    case PreparationRole.BOB:
      return "Bobが作る";
    case PreparationRole.NONE:
      return "なし";
  }
};

/**
 * 参加状況の日本語表示を取得
 * @param status 参加状況
 * @returns 参加状況の日本語表示
 */
export const getParticipationStatusText = (
  status: ParticipationStatus,
): string => {
  switch (status) {
    case ParticipationStatus.WILL_PARTICIPATE:
      return "参加";
    case ParticipationStatus.WILL_NOT_PARTICIPATE:
      return "不参加";
    case ParticipationStatus.UNDECIDED:
      return "未定";
  }
};

/**
 * 食事タイプの日本語表示を取得
 * @param mealType 食事タイプ
 * @returns 食事タイプの日本語表示
 */
export const getMealTypeText = (mealType: MealType): string => {
  switch (mealType) {
    case MealType.LUNCH:
      return "昼食";
    case MealType.DINNER:
      return "夕食";
  }
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
 * 文字列から準備担当者を解析
 * @param roleStr 準備担当者文字列
 * @returns 準備担当者またはnull
 */
export const parsePreparationRole = (
  roleStr: string,
): PreparationRole | null => {
  const normalized = roleStr.toUpperCase();
  switch (normalized) {
    case "ALICE":
      return PreparationRole.ALICE;
    case "BOB":
      return PreparationRole.BOB;
    case "NONE":
      return PreparationRole.NONE;
    default:
      return null;
  }
};

/**
 * 文字列から参加状況を解析
 * @param statusStr 参加状況文字列
 * @returns 参加状況またはnull
 */
export const parseParticipationStatus = (
  statusStr: string,
): ParticipationStatus | null => {
  const normalized = statusStr.toLowerCase();
  switch (normalized) {
    case "will_participate":
    case "participate":
    case "yes":
    case "はい":
      return ParticipationStatus.WILL_PARTICIPATE;
    case "will_not_participate":
    case "not_participate":
    case "no":
    case "いいえ":
      return ParticipationStatus.WILL_NOT_PARTICIPATE;
    case "undecided":
    case "未定":
      return ParticipationStatus.UNDECIDED;
    default:
      return null;
  }
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
