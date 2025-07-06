import {
  type MealParticipation,
  type MealPlan,
  MealType,
  PreparationType,
  type User,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/error";
import { logger } from "../utils/logger";
import { addDays, getEndOfDay, getStartOfDay } from "../utils/date";

/**
 * ユーザーを取得
 * @param lineId LINE ユーザーID
 * @returns ユーザーオブジェクト
 */
export const getUserByLineId = async (lineId: string): Promise<User | null> => {
  try {
    return await prisma.user.findUnique({
      where: { lineId },
    });
  } catch (error) {
    logger.error(`ユーザー取得エラー: ${lineId}`, error);
    throw new AppError(`ユーザー取得に失敗しました: ${lineId}`, 500);
  }
};

/**
 * 指定された日付の食事予定を取得
 * @param date 日付
 * @returns 食事予定の配列
 */
export const getMealPlansByDate = async (date: Date): Promise<MealPlan[]> => {
  try {
    const startOfDay = getStartOfDay(date);
    const endOfDay = getEndOfDay(date);

    return await prisma.mealPlan.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        cooker: true,
        participations: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        mealType: "asc",
      },
    });
  } catch (error) {
    logger.error(`食事予定取得エラー: ${date}`, error);
    throw new AppError(`食事予定の取得に失敗しました: ${date}`, 500);
  }
};

/**
 * 指定された日付と食事タイプの食事予定を取得
 * @param date 日付
 * @param mealType 食事タイプ
 * @returns 食事予定
 */
export const getMealPlan = async (
  date: Date,
  mealType: MealType,
): Promise<MealPlan | null> => {
  try {
    const startOfDay = getStartOfDay(date);
    const endOfDay = getEndOfDay(date);

    return await prisma.mealPlan.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        mealType,
      },
      include: {
        cooker: true,
        participations: {
          include: {
            user: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`食事予定取得エラー: ${date}, ${mealType}`, error);
    throw new AppError(`食事予定の取得に失敗しました: ${date}, ${mealType}`, 500);
  }
};

/**
 * 食事予定を作成または更新
 * @param date 日付
 * @param mealType 食事タイプ
 * @param preparationType 準備方法
 * @param cookerId 調理担当者ID（自炊の場合）
 * @returns 作成または更新された食事予定
 */
export const createOrUpdateMealPlan = async (
  date: Date,
  mealType: MealType,
  preparationType: PreparationType,
  cookerId?: string,
): Promise<MealPlan> => {
  try {
    const startOfDay = getStartOfDay(date);
    const endOfDay = getEndOfDay(date);

    // 既存の食事予定を検索
    const existingMealPlan = await prisma.mealPlan.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        mealType,
      },
    });

    // 既存の予定があれば更新、なければ新規作成
    if (existingMealPlan) {
      return await prisma.mealPlan.update({
        where: { id: existingMealPlan.id },
        data: {
          preparationType,
          cookerId:
            preparationType === PreparationType.COOK_BY_SELF ? cookerId : null,
        },
      });
    }
    return await prisma.mealPlan.create({
      data: {
        date: startOfDay,
        mealType,
        preparationType,
        cookerId:
          preparationType === PreparationType.COOK_BY_SELF ? cookerId : null,
      },
    });
  } catch (error) {
    logger.error(`食事予定作成/更新エラー: ${date}, ${mealType}`, error);
    throw new AppError(`食事予定の作成/更新に失敗しました: ${date}, ${mealType}`, 500);
  }
};

/**
 * 食事参加状態を設定
 * @param mealPlanId 食事予定ID
 * @param userId ユーザーID
 * @param isAttending 参加するかどうか
 * @returns 作成または更新された食事参加
 */
export const setMealParticipation = async (
  mealPlanId: string,
  userId: string,
  isAttending: boolean,
): Promise<MealParticipation> => {
  try {
    // 既存の参加状態を検索
    const existingParticipation = await prisma.mealParticipation.findFirst({
      where: {
        mealPlanId,
        userId,
      },
    });

    // 既存の参加状態があれば更新、なければ新規作成
    if (existingParticipation) {
      return await prisma.mealParticipation.update({
        where: { id: existingParticipation.id },
        data: { isAttending },
      });
    }
    return await prisma.mealParticipation.create({
      data: {
        mealPlanId,
        userId,
        isAttending,
      },
    });
  } catch (error) {
    logger.error(`食事参加設定エラー: ${mealPlanId}, ${userId}`, error);
    throw new AppError(`食事参加の設定に失敗しました: ${mealPlanId}, ${userId}`, 500);
  }
};

/**
 * 翌日の食事予定を取得または作成
 * @returns 昼食と夕食の予定
 */
export const getOrCreateNextDayMealPlans = async (): Promise<{
  lunch: MealPlan;
  dinner: MealPlan;
}> => {
  try {
    const tomorrow = addDays(1);

    // 昼食の予定を取得または作成
    let lunch = await getMealPlan(tomorrow, MealType.LUNCH);
    if (!lunch) {
      lunch = await createOrUpdateMealPlan(
        tomorrow,
        MealType.LUNCH,
        PreparationType.INDIVIDUAL,
      );
    }

    // 夕食の予定を取得または作成
    let dinner = await getMealPlan(tomorrow, MealType.DINNER);
    if (!dinner) {
      dinner = await createOrUpdateMealPlan(
        tomorrow,
        MealType.DINNER,
        PreparationType.INDIVIDUAL,
      );
    }

    return { lunch, dinner };
  } catch (error) {
    logger.error("翌日の食事予定取得/作成エラー", error);
    throw new AppError("翌日の食事予定の取得/作成に失敗しました", 500);
  }
};

/**
 * 当日の食事予定を取得または作成
 * @returns 昼食と夕食の予定
 */
export const getOrCreateTodayMealPlans = async (): Promise<{
  lunch: MealPlan;
  dinner: MealPlan;
}> => {
  try {
    const today = new Date();

    // 昼食の予定を取得または作成
    let lunch = await getMealPlan(today, MealType.LUNCH);
    if (!lunch) {
      lunch = await createOrUpdateMealPlan(
        today,
        MealType.LUNCH,
        PreparationType.INDIVIDUAL,
      );
    }

    // 夕食の予定を取得または作成
    let dinner = await getMealPlan(today, MealType.DINNER);
    if (!dinner) {
      dinner = await createOrUpdateMealPlan(
        today,
        MealType.DINNER,
        PreparationType.INDIVIDUAL,
      );
    }

    return { lunch, dinner };
  } catch (error) {
    logger.error("当日の食事予定取得/作成エラー", error);
    throw new AppError("当日の食事予定の取得/作成に失敗しました", 500);
  }
};

/**
 * 全てのユーザーを取得
 * @returns ユーザーの配列
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await prisma.user.findMany();
  } catch (error) {
    logger.error("全ユーザー取得エラー", error);
    throw new AppError("全ユーザーの取得に失敗しました", 500);
  }
};
