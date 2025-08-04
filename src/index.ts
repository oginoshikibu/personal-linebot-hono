import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { config } from "./config";
import { initializeLineNotification } from "./features/line/client";
import { setupCronJobs } from "./features/notification/cron";
import { globalErrorHandler } from "./utils/error";
import { logger } from "./lib/logger";
import { setupRoutes } from "./routes";

/**
 * アプリケーションを起動
 */
const startServer = async () => {
  const port = config.server.port;
  logger.info(`サーバーを起動しています（ポート: ${port}）...`);

  try {
    // Honoアプリケーションを作成
    const app = new Hono();

    // ミドルウェアを設定
    app.use("*", honoLogger());
    app.use("*", globalErrorHandler);
    app.use("/api/*", cors());

    // ルートを設定
    setupRoutes(app);

    // LINE通知を初期化
    await initializeLineNotification();

    // サーバーを起動
    serve(
      {
        fetch: app.fetch,
        port,
      },
      (info) => {
        logger.info(
          `サーバーが起動しました: http://${config.server.host}:${info.port}`,
        );

        // 定期実行タスクを設定
        setupCronJobs();
      },
    );
  } catch (error) {
    logger.error("サーバーの起動に失敗しました", error);
    process.exit(1);
  }
};

// アプリケーションを起動
startServer();
