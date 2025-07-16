import type { User } from "@prisma/client";
import { MealType } from "@prisma/client";
import { logger } from "../../../../lib/logger";
import { parseDate } from "../../../../utils/date";
import { formatDateText } from "../../../../utils/formatter";
import {
  getOrCreateMealPlan,
  updateMealParticipation,
  updateMealPreparation,
} from "../../../meal/services/meal";
import { getAllUsers } from "../../../meal/services/user";
import {
  replyTemplateMessage,
  replyTextMessage,
  sendTextMessage,
} from "../../client";
import { createMainMenuTemplate } from "../../messages/templates";

/**
 * 夕食の予定質問のポストバックを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
export const handleDinnerPostback = async (
  data: string,
  user: User,
  replyToken: string,
): Promise<void> => {
  try {
    logger.info(`夕食ポストバック処理: ${data}`, { userId: user.lineId });

    // URLSearchParamsを使用してデータをパース
    const params = new URLSearchParams(data);
    const dateStr = params.get("date");

    if (!dateStr) {
      logger.warn("日付が指定されていません", { data });
      await replyTextMessage(
        replyToken,
        "日付が指定されていません。もう一度お試しください。",
      );
      return;
    }

    const date = parseDate(dateStr);
    if (!date) {
      logger.warn("無効な日付形式です", { dateStr });
      await replyTextMessage(
        replyToken,
        "無効な日付形式です。もう一度お試しください。",
      );
      return;
    }

    const dateText = formatDateText(date);
    const action = data.substring("action=".length).split("&")[0];

    // キャンセルの場合
    if (action === "dinner_cancel") {
      // 今日または明日の場合は他のユーザーに通知
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (
        date.getTime() === today.getTime() ||
        date.getTime() === tomorrow.getTime()
      ) {
        // 他のユーザーに通知（昼食のみ）
        const allUsers = await getAllUsers();
        const otherUsers = allUsers.filter((u) => u.id !== user.id);

        const dateLabel = date.getTime() === today.getTime() ? "今日" : "明日";
        const notificationMessage = `${user.name}さんが${dateLabel}(${dateText})の食事予定を更新しました。\n夕食の予定入力をキャンセルしました。`;

        // 他のユーザーに通知を送信
        for (const otherUser of otherUsers) {
          try {
            await sendTextMessage(otherUser.lineId, notificationMessage);
            logger.info(`他ユーザーに通知送信完了: ${otherUser.lineId}`, {
              fromUser: user.lineId,
              date: dateStr,
              action: "dinner_cancel",
            });
          } catch (error) {
            logger.error(
              `他ユーザーへの通知送信失敗: ${otherUser.lineId}`,
              error,
            );
          }
        }
      }

      // メインメニューを表示（キャンセルメッセージと共に）
      await replyTemplateMessage(
        replyToken,
        createMainMenuTemplate(),
        "夕食の予定入力をキャンセルしました。昼食の予定のみ保存されました。",
      );
      return;
    }

    // 夕食の予定を保存
    const attendance = action.replace("dinner_", "");

    // 夕食の食事予定を取得または作成
    const mealPlan = await getOrCreateMealPlan(date, MealType.DINNER);

    // 参加状況を更新
    const isAttending = attendance === "attend" || attendance === "cook";
    await updateMealParticipation(mealPlan.id, user.id, isAttending);

    // 調理担当の場合は準備方法を更新
    if (attendance === "cook") {
      await updateMealPreparation(mealPlan.id, "COOK_BY_SELF", user.id);
    } else if (attendance === "attend") {
      await updateMealPreparation(mealPlan.id, "BUY_TOGETHER", undefined);
    } else if (attendance === "absent") {
      await updateMealPreparation(mealPlan.id, "INDIVIDUAL", undefined);
    }

    logger.info(`夕食の予定を保存: ${dateStr}, ${attendance}`, {
      userId: user.lineId,
      mealPlanId: mealPlan.id,
    });

    // 今日または明日の場合は他のユーザーに通知
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (
      date.getTime() === today.getTime() ||
      date.getTime() === tomorrow.getTime()
    ) {
      // 他のユーザーに通知
      const allUsers = await getAllUsers();
      const otherUsers = allUsers.filter((u) => u.id !== user.id);

      const dateLabel = date.getTime() === today.getTime() ? "今日" : "明日";
      const notificationMessage = `${user.name}さんが${dateLabel}(${dateText})の食事予定を更新しました。\n夕食: ${getAttendanceText(attendance)}`;

      // 他のユーザーに通知を送信
      for (const otherUser of otherUsers) {
        try {
          await sendTextMessage(otherUser.lineId, notificationMessage);
          logger.info(`他ユーザーに通知送信完了: ${otherUser.lineId}`, {
            fromUser: user.lineId,
            date: dateStr,
            attendance,
          });
        } catch (error) {
          logger.error(
            `他ユーザーへの通知送信失敗: ${otherUser.lineId}`,
            error,
          );
        }
      }
    }

    // メインメニューを表示（登録完了メッセージと共に）
    await replyTemplateMessage(
      replyToken,
      createMainMenuTemplate(),
      `${dateText}の夕食: ${getAttendanceText(attendance)} - 食事予定の登録が完了しました。`,
    );
  } catch (error) {
    logger.error("夕食ポストバック処理エラー", error);
    await replyTextMessage(
      replyToken,
      "処理中にエラーが発生しました。もう一度お試しください。",
    );
  }
};

/**
 * 参加状態のテキストを取得
 * @param attendance 参加状態
 * @returns 参加状態のテキスト
 */
const getAttendanceText = (attendance: string): string => {
  switch (attendance) {
    case "attend":
      return "参加";
    case "absent":
      return "不参加";
    case "cook":
      return "自分が作る";
    case "undecided":
      return "未定";
    default:
      return "不明";
  }
};
