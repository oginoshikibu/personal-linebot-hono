import type { User } from "@prisma/client";
import { parseDate } from "../../../../utils/date";
import { formatDateText } from "../../../../utils/formatter";
import { logger } from "../../../../utils/logger";
import { replyTemplateMessage, replyTextMessage } from "../../client";
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
        // TODO: 他のユーザーに通知する処理を追加
        logger.info(`他のユーザーに通知: ${dateStr}, 昼食のみ`, {
          userId: user.lineId,
        });
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

    // TODO: 夕食の予定をデータベースに保存する処理を追加
    logger.info(`夕食の予定を保存: ${dateStr}, ${attendance}`, {
      userId: user.lineId,
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
      // TODO: 他のユーザーに通知する処理を追加
      logger.info(`他のユーザーに通知: ${dateStr}, 昼食と夕食`, {
        userId: user.lineId,
      });
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
