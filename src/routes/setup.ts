import type { Hono } from "hono";
import { errorHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { apiRoutes } from "./api";
import { webhookRoute } from "./webhook";

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
    app.post("/api/webhook", ...webhookRoute.post);

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
