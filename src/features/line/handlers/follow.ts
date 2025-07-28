import type { WebhookEvent } from "@line/bot-sdk";
import { logger } from "../../../lib/logger";
import { isAllowedLineId } from "../../../utils/auth";
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
    // Alice/Bobの固定LINE IDと照合
    const isAllowed = await isAllowedLineId(userId);

    // ユーザーが許可されていない場合
    if (!isAllowed) {
      logger.info(`未許可ユーザーのフォロー: ${userId}`);
      await sendTextMessage(
        userId,
        "フォローありがとうございます！このボットは家庭用食事管理ボットです。\n" +
          "ご利用には管理者による登録が必要です。管理者に連絡してください。",
      );
      logger.info(`未許可フォローユーザーへの通知送信完了: ${userId}`);
      return;
    }

    // Alice/Bobの場合はユーザー名を取得
    const ALICE_LINE_ID = process.env.ALICE_LINE_ID || "alice_line_id";
    const BOB_LINE_ID = process.env.BOB_LINE_ID || "bob_line_id";

    const userName =
      userId === ALICE_LINE_ID
        ? "Alice"
        : userId === BOB_LINE_ID
          ? "Bob"
          : "ユーザー";

    // 許可済みユーザーの場合
    logger.info(`許可済みユーザーのフォロー: ${userId}`, {
      userName,
    });
    await sendTextMessage(
      userId,
      `こんにちは、${userName}さん！\n` +
        "このボットは家庭用食事管理ボットです。\n" +
        "食事予定の登録や確認ができます。",
    );
    logger.info(`許可済みフォローユーザーへの通知送信完了: ${userId}`);
  } catch (error) {
    logger.error(`フォローイベント処理エラー: ${userId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
};
