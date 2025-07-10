import type { PostbackEvent } from "@line/bot-sdk";
import { logger } from "../../../utils/logger";
import { getUserByLineId } from "../../meal/services/user";
import { replyTextMessage } from "../client";
import { handleDateSelection } from "./postbacks/date";
import { handleDinnerPostback } from "./postbacks/dinner";
import { handleEditPostback } from "./postbacks/edit";
import { handleLunchPostback } from "./postbacks/lunch";

/**
 * ポストバックイベントを処理
 * @param event ポストバックイベント
 */
export const handlePostbackEvent = async (
  event: PostbackEvent,
): Promise<void> => {
  // ユーザー情報を取得
  const userId = event.source.userId ?? "";
  if (!userId) {
    logger.error("ユーザーIDが取得できませんでした");
    return;
  }

  logger.info(`ポストバックイベント処理開始: ${userId}`, {
    data: event.postback.data,
  });

  try {
    const user = await getUserByLineId(userId);
    logger.debug(`ユーザー情報取得: ${userId}`, {
      found: !!user,
      userName: user?.name,
    });

    // ユーザーが登録されていない場合
    if (!user) {
      logger.warn(`ユーザーがデータベースに登録されていません: ${userId}`);
      await replyTextMessage(
        event.replyToken,
        "申し訳ありませんが、システムに登録されていません。管理者に連絡してください。",
      );
      logger.info(`未登録ユーザーへの通知送信完了: ${userId}`);
      return;
    }

    // ポストバックデータを処理
    const data = event.postback.data;

    // 日付選択のポストバック
    if (data.startsWith("date_")) {
      await handleDateSelection(data.substring(5), user, event.replyToken);
      return;
    }

    // 編集のポストバック
    if (data.startsWith("action=edit")) {
      await handleEditPostback(data, user, event.replyToken);
      return;
    }

    // 昼食の予定質問のポストバック
    if (data.startsWith("action=lunch_")) {
      await handleLunchPostback(data, user, event.replyToken);
      return;
    }

    // 夕食の予定質問のポストバック
    if (data.startsWith("action=dinner_")) {
      await handleDinnerPostback(data, user, event.replyToken);
      return;
    }

    // その他のポストバック
    logger.warn(`未対応のポストバックデータ: ${data}`);
    await replyTextMessage(
      event.replyToken,
      "この操作はまだ対応していません。",
    );
  } catch (error) {
    logger.error(`ポストバックイベント処理エラー: ${userId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    try {
      await replyTextMessage(
        event.replyToken,
        "ポストバックの処理中にエラーが発生しました。もう一度お試しください。",
      );
      logger.info(`エラー通知送信完了: ${userId}`);
    } catch (sendError) {
      logger.error(`エラーメッセージの送信に失敗しました: ${userId}`, {
        error:
          sendError instanceof Error ? sendError.message : String(sendError),
      });
    }
  }
};
