import type { WebhookEvent } from "@line/bot-sdk";
import { logger } from "../../../lib/logger";
import { getUserByLineId } from "../../meal/services/user";
import { sendTextMessage } from "../client";

/**
 * フォローイベントを処理
 * @param event フォローイベント
 */
export const handleFollowEvent = async (event: WebhookEvent): Promise<void> => {
  const userId = event.source.userId ?? "";
  if (!userId) {
    logger.error("フォローイベント: ユーザーIDが取得できませんでした");
    return;
  }

  logger.info(`フォローイベント処理開始: ${userId}`);

  try {
    // ユーザー情報を取得
    const user = await getUserByLineId(userId);
    logger.debug(`フォローユーザー情報取得: ${userId}`, { found: !!user });

    // ユーザーが登録されていない場合
    if (!user) {
      logger.info(`未登録ユーザーのフォロー: ${userId}`);
      await sendTextMessage(
        userId,
        "フォローありがとうございます！このボットは家庭用食事管理ボットです。\n" +
          "ご利用には管理者による登録が必要です。管理者に連絡してください。",
      );
      logger.info(`未登録フォローユーザーへの通知送信完了: ${userId}`);
      return;
    }

    // 登録済みユーザーの場合
    logger.info(`登録済みユーザーのフォロー: ${userId}`, {
      userName: user.name,
    });
    await sendTextMessage(
      userId,
      `こんにちは、${user.name}さん！\n` +
        "このボットは家庭用食事管理ボットです。\n" +
        "食事予定の登録や確認ができます。",
    );
    logger.info(`登録済みフォローユーザーへの通知送信完了: ${userId}`);
  } catch (error) {
    logger.error(`フォローイベント処理エラー: ${userId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
};
