import type {
  MealParticipation,
  MealPlan,
  MealType,
  PreparationType,
  User,
} from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/error";
import { logger } from "../../../utils/logger";

/**
 * 当日の食事予定を取得または作成
 * @returns 昼食と夕食の予定
 */
export const getOrCreateTodayMealPlans = async (): Promise<{
  lunch: MealPlan & {
    participations: (MealParticipation & { user: User })[];
    cooker: User | null;
  };
  dinner: MealPlan & {
    participations: (MealParticipation & { user: User })[];
    cooker: User | null;
  };
}> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 昼食の予定を取得または作成
    const lunch = await getOrCreateMealPlan(today, "LUNCH");

    // 夕食の予定を取得または作成
    const dinner = await getOrCreateMealPlan(today, "DINNER");

    return { lunch, dinner };
  } catch (error) {
    logger.error("当日の食事予定取得エラー", error);
    throw new AppError("当日の食事予定の取得に失敗しました", 500);
  }
};

/**
 * 翌日の食事予定を取得または作成
 * @returns 昼食と夕食の予定
 */
export const getOrCreateNextDayMealPlans = async (): Promise<{
  lunch: MealPlan & {
    participations: (MealParticipation & { user: User })[];
    cooker: User | null;
  };
  dinner: MealPlan & {
    participations: (MealParticipation & { user: User })[];
    cooker: User | null;
  };
}> => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 昼食の予定を取得または作成
    const lunch = await getOrCreateMealPlan(tomorrow, "LUNCH");

    // 夕食の予定を取得または作成
    const dinner = await getOrCreateMealPlan(tomorrow, "DINNER");

    return { lunch, dinner };
  } catch (error) {
    logger.error("翌日の食事予定取得エラー", error);
    throw new AppError("翌日の食事予定の取得に失敗しました", 500);
  }
};

/**
 * 指定日の食事予定を取得または作成
 * @param date 日付
 * @param mealType 食事タイプ
 * @returns 食事予定
 */
export const getOrCreateMealPlan = async (
  date: Date,
  mealType: MealType,
): Promise<
  MealPlan & {
    participations: (MealParticipation & { user: User })[];
    cooker: User | null;
  }
> => {
  try {
    // 既存の食事予定を検索
    let mealPlan = await prisma.mealPlan.findUnique({
      where: {
        date_mealType: {
          date,
          mealType,
        },
      },
      include: {
        participations: {
          include: {
            user: true,
          },
        },
        cooker: true,
      },
    });

    // 存在しない場合は新規作成
    if (!mealPlan) {
      mealPlan = await prisma.mealPlan.create({
        data: {
          date,
          mealType,
          preparationType: "INDIVIDUAL", // デフォルトは各自自由
        },
        include: {
          participations: {
            include: {
              user: true,
            },
          },
          cooker: true,
        },
      });

      logger.info(
        `食事予定を新規作成しました: ${date.toISOString()}, ${mealType}`,
      );
    }

    return mealPlan;
  } catch (error) {
    logger.error(
      `食事予定取得/作成エラー: ${date.toISOString()}, ${mealType}`,
      error,
    );
    throw new AppError("食事予定の取得/作成に失敗しました", 500);
  }
};

/**
 * 食事予定の参加状況を更新
 * @param mealPlanId 食事予定ID
 * @param userId ユーザーID
 * @param isAttending 参加するかどうか
 * @returns 更新された参加情報
 */
export const updateMealParticipation = async (
  mealPlanId: string,
  userId: string,
  isAttending: boolean,
): Promise<MealParticipation> => {
  try {
    // 既存の参加情報を検索
    const existingParticipation = await prisma.mealParticipation.findUnique({
      where: {
        mealPlanId_userId: {
          mealPlanId,
          userId,
        },
      },
    });

    // 存在する場合は更新、存在しない場合は作成
    if (existingParticipation) {
      return await prisma.mealParticipation.update({
        where: {
          id: existingParticipation.id,
        },
        data: {
          isAttending,
        },
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
    logger.error(
      `食事参加状況更新エラー: ${mealPlanId}, ${userId}, ${isAttending}`,
      error,
    );
    throw new AppError("食事参加状況の更新に失敗しました", 500);
  }
};

/**
 * 食事予定の準備方法を更新
 * @param mealPlanId 食事予定ID
 * @param preparationType 準備タイプ
 * @param cookerId 調理担当者ID（自炊の場合のみ）
 * @returns 更新された食事予定
 */
export const updateMealPreparation = async (
  mealPlanId: string,
  preparationType: PreparationType,
  cookerId?: string,
): Promise<MealPlan> => {
  try {
    return await prisma.mealPlan.update({
      where: {
        id: mealPlanId,
      },
      data: {
        preparationType,
        cookerId: preparationType === "COOK_BY_SELF" ? cookerId : null,
      },
    });
  } catch (error) {
    logger.error(
      `食事準備方法更新エラー: ${mealPlanId}, ${preparationType}, ${cookerId}`,
      error,
    );
    throw new AppError("食事準備方法の更新に失敗しました", 500);
  }
};

/**
 * 指定日の食事予定を取得
 * @param date 日付
 * @param mealType 食事タイプ
 * @returns 食事予定（存在しない場合はnull）
 */
export const getMealPlan = async (
  date: Date,
  mealType: MealType,
): Promise<
  | (MealPlan & {
      participations: (MealParticipation & { user: User })[];
      cooker: User | null;
    })
  | null
> => {
  try {
    return await prisma.mealPlan.findUnique({
      where: {
        date_mealType: {
          date,
          mealType,
        },
      },
      include: {
        participations: {
          include: {
            user: true,
          },
        },
        cooker: true,
      },
    });
  } catch (error) {
    logger.error(
      `食事予定取得エラー: ${date.toISOString()}, ${mealType}`,
      error,
    );
    return null;
  }
};
