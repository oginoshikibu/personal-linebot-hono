import type { Hono } from "hono";
import { webhookRoute } from "../features/line/webhooks";
import { logger } from "../lib/logger";
import { apiRoutes } from "./api";

/**
 * アプリケーションのルートを設定
 * @param app Honoアプリケーション
 */
export const setupRoutes = (app: Hono): void => {
  try {
    // ルートパス
    app.get("/", (c) => c.text("LINE Bot Server is running!"));

    // Webhookルート
    app.post("/api/webhook", ...webhookRoute.post);

    // APIルート
    app.get("/api/health", apiRoutes.health.get);
    app.post("/api/notification/morning", apiRoutes.notification.morning.post);
    app.post("/api/notification/evening", apiRoutes.notification.evening.post);

    // リッチメニューAPIルート
    app.get("/api/richmenu/setup", apiRoutes.richmenu.setup.get);
    app.get("/api/richmenu/themes", apiRoutes.richmenu.themes.get);

    logger.info("ルートを設定しました");
  } catch (error) {
    logger.error("ルートの設定に失敗しました", error);
    throw error;
  }
};
