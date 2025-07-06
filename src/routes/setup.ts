import type { Hono } from "hono";
import { webhookRoute } from "./webhook";
import { apiRoutes } from "./api";
import { logger } from "../utils/logger";
import { errorHandler } from "../middleware/errorHandler";
import { lineSignatureMiddleware } from "../utils/auth";
import { webhookHandler } from "./webhook";

/**
 * アプリケーションのルートを設定
 * @param app Honoアプリケーション
 */
export const setupRoutes = (app: Hono): void => {
  try {
    // グローバルミドルウェアを設定
    app.use("*", errorHandler);

    // ルートパス
    app.get("/", (c) => c.text("LINE Bot Server is running!"));

    // Webhookルート
    app.post("/webhook", lineSignatureMiddleware, webhookHandler);

    // APIルート
    app.get("/api/health", apiRoutes.health.get);
    app.post("/api/notification/morning", apiRoutes.notification.morning.post);
    app.post("/api/notification/evening", apiRoutes.notification.evening.post);

    logger.info("ルートを設定しました");
  } catch (error) {
    logger.error("ルートの設定に失敗しました", error);
    throw error;
  }
};
