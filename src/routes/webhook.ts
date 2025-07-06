import type { MessageEvent, WebhookEvent, PostbackEvent } from "@line/bot-sdk";
import type { Context } from "hono";
import { handleTextMessage } from "../handlers/messageHandler";
import { sendTextMessage } from "../services/line";
import { getUserByLineId } from "../services/meal";
import { lineSignatureMiddleware } from "../utils/auth";
import { logger } from "../utils/logger";
import { AppError } from "../utils/error";
import { asyncHandler } from "../utils/error";

/**
 * LINE Webhookハンドラ
 * @param c Honoコンテキスト
 * @returns レスポンス
 */
export const webhookHandler = asyncHandler(async (c: Context): Promise<Response> => {
  const body = await c.req.json();
  logger.debug("Webhookリクエストを受信", body);

  if (body.events && body.events.length > 0) {
    const events = body.events;

    for (const event of events) {
      try {
        switch (event.type) {
          case "message":
            await handleMessageEvent(event);
            break;
          case "follow":
            await handleFollowEvent(event);
            break;
          case "postback":
            await handlePostbackEvent(event);
            break;
          default:
            logger.debug(`未対応のイベントタイプ: ${event.type}`);
        }
      } catch (error) {
        logger.error(`イベント処理エラー: ${event.type}`, error);
      }
    }
  }

  // LINEプラットフォームへのレスポンス
  return new Response("OK", { status: 200 });
});

/**
 * メッセージイベントを処理
 * @param event メッセージイベント
 */
const handleMessageEvent = async (event: MessageEvent): Promise<void> => {
  // ユーザー情報を取得
  const userId = event.source.userId ?? "";
  if (!userId) {
    logger.error("ユーザーIDが取得できませんでした");
    return;
  }

  try {
    const user = await getUserByLineId(userId);

    // ユーザーが登録されていない場合
    if (!user) {
      logger.warn(`ユーザーがデータベースに登録されていません: ${userId}`);
      await sendTextMessage(
        userId,
        "申し訳ありませんが、システムに登録されていません。管理者に連絡してください。",
      );
      return;
    }

    // メッセージタイプに応じて処理
    switch (event.message.type) {
      case "text": {
        const textMessage = event.message;
        await handleTextMessage(textMessage, user);
        break;
      }
      default:
        await sendTextMessage(userId, "テキストメッセージのみ対応しています。");
        break;
    }
  } catch (error) {
    logger.error(`メッセージイベント処理エラー: ${userId}`, error);
    try {
      await sendTextMessage(
        userId,
        "メッセージの処理中にエラーが発生しました。もう一度お試しください。",
      );
    } catch (sendError) {
      logger.error(`エラーメッセージの送信に失敗しました: ${userId}`, sendError);
    }
  }
};

/**
 * フォローイベントを処理
 * @param event フォローイベント
 */
const handleFollowEvent = async (event: WebhookEvent): Promise<void> => {
  const userId = event.source.userId ?? "";
  if (!userId) {
    logger.error("フォローイベント: ユーザーIDが取得できませんでした");
    return;
  }

  try {
    // ユーザー情報を取得
    const user = await getUserByLineId(userId);

    // ユーザーが登録されていない場合
    if (!user) {
      await sendTextMessage(
        userId,
        "フォローありがとうございます！このボットは家庭用食事管理ボットです。\n" +
          "ご利用には管理者による登録が必要です。管理者に連絡してください。",
      );
      return;
    }

    // 登録済みユーザーの場合
    await sendTextMessage(
      userId,
      `こんにちは、${user.name}さん！\n` +
        "このボットは家庭用食事管理ボットです。\n" +
        "食事予定の登録や確認ができます。",
    );
  } catch (error) {
    logger.error(`フォローイベント処理エラー: ${userId}`, error);
  }
};

/**
 * ポストバックイベントを処理
 * @param event ポストバックイベント
 */
const handlePostbackEvent = async (event: PostbackEvent): Promise<void> => {
  const userId = event.source.userId ?? "";
  if (!userId) {
    logger.error("ポストバックイベント: ユーザーIDが取得できませんでした");
    return;
  }

  try {
    const user = await getUserByLineId(userId);

    // ユーザーが登録されていない場合
    if (!user) {
      await sendTextMessage(
        userId,
        "申し訳ありませんが、システムに登録されていません。管理者に連絡してください。",
      );
      return;
    }

    // ポストバックデータを処理
    const { data } = event.postback;
    logger.debug(`ポストバックデータを受信: ${data}`);

    // TODO: ポストバックデータに応じた処理を実装
    await sendTextMessage(userId, `ポストバックを受け取りました: ${data}`);
  } catch (error) {
    logger.error(`ポストバックイベント処理エラー: ${userId}`, error);
    try {
      await sendTextMessage(
        userId,
        "ポストバックの処理中にエラーが発生しました。もう一度お試しください。",
      );
    } catch (sendError) {
      logger.error(`エラーメッセージの送信に失敗しました: ${userId}`, sendError);
    }
  }
};

// Webhookルートを作成
export const webhookRoute = {
  post: [lineSignatureMiddleware, webhookHandler],
};
