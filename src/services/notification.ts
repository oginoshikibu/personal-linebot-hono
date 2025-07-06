import type { MealParticipation, MealPlan, User } from "@prisma/client";
import { MealType, PreparationType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { MealPlanData } from "../types";
import { formatDateJP } from "../utils/date";
import { AppError } from "../utils/error";
import { logger } from "../utils/logger";
import { createMealPlanFlexMessage, sendFlexMessage } from "./line";
import {
  getAllUsers,
  getOrCreateNextDayMealPlans,
  getOrCreateTodayMealPlans,
} from "./meal";

/**
 * 通知ログを記録
 * @param type 通知タイプ
 * @param content 通知内容
 */
const logNotification = async (
  type: string,
  content: string,
): Promise<void> => {
  try {
    await prisma.notificationLog.create({
      data: {
        type,
        content,
      },
    });
    logger.info(`通知ログを記録しました: ${type}`);
  } catch (error) {
    logger.error(`通知ログ記録エラー: ${type}`, error);
    // 通知ログの記録失敗は致命的ではないのでエラーをスローしない
  }
};

/**
 * 食事予定データからFlexメッセージ用のデータを作成
 * @param mealPlan 食事予定
 * @param users 全ユーザー
 * @returns Flexメッセージ用のデータ
 */
const prepareMealPlanData = (
  mealPlan: MealPlan & {
    participations: (MealParticipation & { user: User })[];
    cooker?: User | null;
  },
  users: User[],
): MealPlanData => {
  // 参加者データを準備
  const participants = users.map((user) => {
    const participation = mealPlan.participations.find(
      (p) => p.userId === user.id,
    );
    return {
      name: user.name,
      attending: participation ? participation.isAttending : false,
    };
  });

  // 調理担当者の名前を取得
  let cookerName: string | undefined;
  if (mealPlan.cookerId) {
    const cooker = users.find((u) => u.id === mealPlan.cookerId);
    if (cooker) {
      cookerName = cooker.name;
    }
  }

  return {
    participants,
    preparationType: mealPlan.preparationType,
    cooker: cookerName,
  };
};

/**
 * 朝の通知を送信
 */
export const sendMorningNotification = async (): Promise<void> => {
  try {
    logger.info("朝の通知を送信します...");

    // 当日の食事予定を取得または作成
    const { lunch, dinner } = await getOrCreateTodayMealPlans();

    // 全ユーザーを取得
    const users = await getAllUsers();

    // 食事予定データを準備
    const lunchData = prepareMealPlanData(
      {
        ...lunch,
        participations: [],
        cooker: null,
      },
      users,
    );
    const dinnerData = prepareMealPlanData(
      {
        ...dinner,
        participations: [],
        cooker: null,
      },
      users,
    );

    // 日付を日本語形式で取得
    const today = formatDateJP();

    // Flexメッセージを作成
    const flexMessage = createMealPlanFlexMessage(
      `【本日の食事予定】${today}`,
      lunchData,
      dinnerData,
    );

    // 全ユーザーにFlexメッセージを送信
    let successCount = 0;
    for (const user of users) {
      try {
        await sendFlexMessage(
          user.lineId,
          flexMessage,
          `本日の食事予定（${today}）`,
        );
        successCount++;
      } catch (error) {
        logger.error(`ユーザーへの朝の通知送信エラー: ${user.name}`, error);
      }
    }

    // 通知ログを記録
    await logNotification("morning", `本日の食事予定通知（${today}）`);

    logger.info(
      `朝の通知を送信しました: ${today}, 成功: ${successCount}/${users.length}`,
    );
  } catch (error) {
    logger.error("朝の通知の送信に失敗しました", error);
    throw new AppError("朝の通知の送信に失敗しました", 500);
  }
};

/**
 * 夜の通知を送信
 */
export const sendEveningNotification = async (): Promise<void> => {
  try {
    logger.info("夜の通知を送信します...");

    // 翌日の食事予定を取得または作成
    const { lunch, dinner } = await getOrCreateNextDayMealPlans();

    // 全ユーザーを取得
    const users = await getAllUsers();

    // 食事予定データを準備
    const lunchData = prepareMealPlanData(
      {
        ...lunch,
        participations: [],
        cooker: null,
      },
      users,
    );
    const dinnerData = prepareMealPlanData(
      {
        ...dinner,
        participations: [],
        cooker: null,
      },
      users,
    );

    // 明日の日付を日本語形式で取得
    const tomorrow = formatDateJP(new Date(Date.now() + 24 * 60 * 60 * 1000));

    // Flexメッセージを作成
    const flexMessage = createMealPlanFlexMessage(
      `【明日の食事予定確認】${tomorrow}`,
      lunchData,
      dinnerData,
    );

    // 全ユーザーにFlexメッセージを送信
    let successCount = 0;
    for (const user of users) {
      try {
        await sendFlexMessage(
          user.lineId,
          flexMessage,
          `明日の食事予定（${tomorrow}）`,
        );
        successCount++;
      } catch (error) {
        logger.error(`ユーザーへの夜の通知送信エラー: ${user.name}`, error);
      }
    }

    // 通知ログを記録
    await logNotification("evening", `明日の食事予定通知（${tomorrow}）`);

    logger.info(
      `夜の通知を送信しました: ${tomorrow}, 成功: ${successCount}/${users.length}`,
    );
  } catch (error) {
    logger.error("夜の通知の送信に失敗しました", error);
    throw new AppError("夜の通知の送信に失敗しました", 500);
  }
};

/**
 * 食事予定変更通知を送信
 * @param userId 変更したユーザーID
 * @param mealPlan 変更された食事予定
 */
export const sendMealPlanChangeNotification = async (
  userId: string,
  mealPlan: MealPlan,
): Promise<void> => {
  try {
    // 変更したユーザーを取得
    const changer = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!changer) {
      throw new AppError(`ユーザーが見つかりません: ${userId}`, 404);
    }

    // 全ユーザーを取得
    const users = await getAllUsers();

    // 変更したユーザー以外のユーザーにのみ通知
    const otherUsers = users.filter((user) => user.id !== userId);

    // 日付と食事タイプを取得
    const date = formatDateJP(mealPlan.date);
    const mealType = mealPlan.mealType === "LUNCH" ? "昼食" : "夕食";

    // 基本の食事予定データを準備
    const baseMealPlan = {
      id: "",
      date: new Date(),
      mealType:
        mealPlan.mealType === "LUNCH" ? MealType.LUNCH : MealType.DINNER,
      preparationType: PreparationType.INDIVIDUAL,
      cookerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      participations: [],
      cooker: null,
    };

    // 変更された食事予定データを準備
    const updatedMealPlan = {
      ...mealPlan,
      participations: [],
      cooker: changer,
    };

    // 昼食と夕食のデータを準備
    const lunchData = prepareMealPlanData(
      mealPlan.mealType === "LUNCH" ? updatedMealPlan : baseMealPlan,
      users,
    );

    const dinnerData = prepareMealPlanData(
      mealPlan.mealType === "DINNER" ? updatedMealPlan : baseMealPlan,
      users,
    );

    // 他のユーザーに通知
    let successCount = 0;
    for (const user of otherUsers) {
      try {
        await sendFlexMessage(
          user.lineId,
          createMealPlanFlexMessage(
            `【食事予定変更通知】${date}`,
            lunchData,
            dinnerData,
          ),
          `食事予定変更通知（${date}）`,
        );
        successCount++;
      } catch (error) {
        logger.error(`ユーザーへの変更通知送信エラー: ${user.name}`, error);
      }
    }

    // 通知ログを記録
    await logNotification("change", `食事予定変更通知（${date}の${mealType}）`);

    logger.info(
      `食事予定変更通知を送信しました: ${date}の${mealType}, 成功: ${successCount}/${otherUsers.length}`,
    );
  } catch (error) {
    logger.error("食事予定変更通知の送信に失敗しました", error);
    throw new AppError("食事予定変更通知の送信に失敗しました", 500);
  }
};
