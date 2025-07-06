import type { MessageEvent, PostbackEvent, WebhookEvent } from "@line/bot-sdk";
import type { Context } from "hono";
import { handleTextMessage } from "../handlers/messageHandler";
import { handlePostbackData } from "../handlers/postbackHandler";
import { sendTextMessage } from "../services/line";
import { getUserByLineId } from "../services/meal";
import { lineSignatureMiddleware } from "../utils/auth";
import { asyncHandler } from "../utils/error";
import { logger } from "../utils/logger";

/**
 * LINE Webhookハンドラ
 * @param c Honoコンテキスト
 * @returns レスポンス
 */
export const webhookHandler = asyncHandler(
  async (c: Context): Promise<Response> => {
    const body = c.get("lineRequestBody");
    logger.info("Webhookリクエストを受信", {
      events: body.events?.length || 0,
      destination: body.destination,
    });
    logger.debug("Webhookリクエスト詳細", body);

    if (body.events && body.events.length > 0) {
      const events = body.events;
      logger.info(`${events.length}件のイベントを処理開始`);

      for (const event of events) {
        try {
          logger.info(`イベント処理: ${event.type}`, {
            timestamp: event.timestamp,
            sourceType: event.source.type,
            userId: event.source.userId,
          });

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
              logger.info(`未対応のイベントタイプ: ${event.type}`);
          }

          logger.info(`イベント処理完了: ${event.type}`);
        } catch (error) {
          logger.error(`イベント処理エラー: ${event.type}`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      }

      logger.info(`全イベント処理完了: ${events.length}件`);
    } else {
      logger.info("イベントなしのWebhookリクエスト");
    }

    // LINEプラットフォームへのレスポンス
    logger.debug("Webhookレスポンス送信: 200 OK");
    return new Response("OK", { status: 200 });
  },
);

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

  logger.info(`メッセージイベント処理開始: ${userId}`, {
    messageType: event.message.type,
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
      await sendTextMessage(
        userId,
        "申し訳ありませんが、システムに登録されていません。管理者に連絡してください。",
      );
      logger.info(`未登録ユーザーへの通知送信完了: ${userId}`);
      return;
    }

    // メッセージタイプに応じて処理
    switch (event.message.type) {
      case "text": {
        const textMessage = event.message;
        logger.info(`テキストメッセージ処理: ${userId}`, {
          text:
            textMessage.text.substring(0, 20) +
            (textMessage.text.length > 20 ? "..." : ""),
        });
        await handleTextMessage(textMessage, user);
        logger.info(`テキストメッセージ処理完了: ${userId}`);
        break;
      }
      default:
        logger.info(`未対応のメッセージタイプ: ${event.message.type}`, {
          userId,
        });
        await sendTextMessage(userId, "テキストメッセージのみ対応しています。");
        logger.info(`未対応メッセージタイプの通知送信完了: ${userId}`);
        break;
    }
  } catch (error) {
    logger.error(`メッセージイベント処理エラー: ${userId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    try {
      await sendTextMessage(
        userId,
        "メッセージの処理中にエラーが発生しました。もう一度お試しください。",
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

  logger.info(`ポストバックイベント処理開始: ${userId}`);

  try {
    const user = await getUserByLineId(userId);
    logger.debug(`ポストバックユーザー情報取得: ${userId}`, { found: !!user });

    // ユーザーが登録されていない場合
    if (!user) {
      logger.warn(`未登録ユーザーからのポストバック: ${userId}`);
      await sendTextMessage(
        userId,
        "申し訳ありませんが、システムに登録されていません。管理者に連絡してください。",
      );
      logger.info(`未登録ポストバックユーザーへの通知送信完了: ${userId}`);
      return;
    }

    // ポストバックデータを処理
    const { data } = event.postback;
    logger.info(`ポストバックデータを受信: ${userId}`, { data });

    // ポストバックデータに応じた処理を実装
    await handlePostbackData(data, user);
    logger.info(`ポストバックデータ処理完了: ${userId}`, { data });
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
      logger.info(`ポストバックエラー通知送信完了: ${userId}`);
    } catch (sendError) {
      logger.error(`エラーメッセージの送信に失敗しました: ${userId}`, {
        error:
          sendError instanceof Error ? sendError.message : String(sendError),
      });
    }
  }
};

// Webhookルートを作成
export const webhookRoute = {
  post: [lineSignatureMiddleware, webhookHandler],
};
