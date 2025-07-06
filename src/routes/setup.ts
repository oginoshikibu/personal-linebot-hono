import type { Context, Hono } from "hono";
import { errorHandler } from "../middleware/errorHandler";
import { setupRichMenu } from "../services/richmenu";
import { asyncHandler } from "../utils/error";
import { logger } from "../utils/logger";
import { generateRichMenuImage } from "../utils/richMenuImage";
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

/**
 * リッチメニューのセットアップハンドラ
 * @param c Honoコンテキスト
 * @returns レスポンス
 */
export const setupRichMenuHandler = asyncHandler(
  async (c: Context): Promise<Response> => {
    try {
      logger.info("リッチメニューのセットアップを開始します");

      // リッチメニュー画像を生成
      const imageBuffer = generateRichMenuImage();

      // リッチメニューをセットアップ
      const richMenuId = await setupRichMenu(imageBuffer);

      return c.json({
        success: true,
        message: "リッチメニューのセットアップが完了しました",
        richMenuId,
      });
    } catch (error) {
      logger.error("リッチメニューのセットアップに失敗しました", error);
      return c.json(
        {
          success: false,
          message: "リッチメニューのセットアップに失敗しました",
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  },
);
