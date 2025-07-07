import type { WebhookEvent } from "@line/bot-sdk";
import type { Context } from "hono";
import { asyncHandler } from "../../utils/error";
import { logger } from "../../utils/logger";
import { handleFollowEvent } from "./handlers/follow";
import { handleMessageEvent } from "./handlers/message";
import { handlePostbackEvent } from "./handlers/postback";

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

          await processEvent(event);

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
 * イベントタイプに応じた処理を実行
 * @param event Webhookイベント
 */
export const processEvent = async (event: WebhookEvent): Promise<void> => {
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
};

// Webhookルート設定用の配列
export const webhookRoute = {
  post: [webhookHandler],
};
