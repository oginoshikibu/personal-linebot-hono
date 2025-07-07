import type { PostbackEvent } from "@line/bot-sdk";
import { handlePostbackData } from "../../../handlers/postbacks/main";
import { logger } from "../../../utils/logger";
import { getUserByLineId } from "../../meal/services/user";
import { sendTextMessage } from "../client";

/**
 * ポストバックイベントを処理
 * @param event ポストバックイベント
 */
export const handlePostbackEvent = async (
  event: PostbackEvent,
): Promise<void> => {
  const userId = event.source.userId ?? "";
  if (!userId) {
    logger.error("ポストバックイベント: ユーザーIDが取得できませんでした");
    return;
  }

  logger.info(`ポストバックイベント処理開始: ${userId}`, {
    data: event.postback.data,
  });

  try {
    // ユーザー情報を取得
    const user = await getUserByLineId(userId);
    logger.debug(`ポストバックユーザー情報取得: ${userId}`, { found: !!user });

    // ユーザーが登録されていない場合
    if (!user) {
      logger.warn(`ユーザーがデータベースに登録されていません: ${userId}`);
      await sendTextMessage(
        userId,
        "申し訳ありませんが、システムに登録されていません。管理者に連絡してください。",
      );
      logger.info(`未登録ユーザーへの通知送信完了: ${userId}`);
      return;
    }

    // action=registerで始まるポストバックデータの場合、日付選択ピッカーからの応答を処理
    if (
      event.postback.data.startsWith("action=register") &&
      event.postback.params &&
      "date" in event.postback.params
    ) {
      logger.debug(`日付選択ピッカーからのポストバック: ${userId}`, {
        data: event.postback.data,
        params: event.postback.params,
      });

      // 日付選択ピッカーからの日付を取得してデータに追加
      const date = event.postback.params.date;
      if (date) {
        // 日付情報をポストバックデータに追加
        const updatedData = `${event.postback.data}&date=${date}`;
        logger.debug(`更新されたポストバックデータ: ${updatedData}`);

        // 更新されたデータで処理
        await handlePostbackData(updatedData, user);
        logger.info(`日付選択ポストバックイベント処理完了: ${userId}`);
        return;
      }
    }

    // 通常のポストバックデータを処理
    await handlePostbackData(event.postback.data, user);
    logger.info(`ポストバックイベント処理完了: ${userId}`);
  } catch (error) {
    logger.error(`ポストバックイベント処理エラー: ${userId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    try {
      await sendTextMessage(
        userId,
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
