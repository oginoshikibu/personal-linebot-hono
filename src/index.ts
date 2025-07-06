import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { schedule } from "node-cron";
import { config } from "./config";
import { setupRoutes } from "./routes/setup";
import { initializeLineNotification } from "./services/line";
import {
  sendEveningNotification,
  sendMorningNotification,
} from "./services/notification";
import { AppError } from "./utils/error";
import { logger } from "./utils/logger";

// Honoアプリケーションを作成
const app = new Hono();

// ミドルウェアを設定
app.use("*", honoLogger());
app.use("/api/*", cors());

// ルートを設定
setupRoutes(app);

/**
 * 定期実行タスクを設定
 */
const setupCronJobs = () => {
  try {
    // 朝の通知（毎日7時に実行）
    schedule(
      `${config.notification.morning.minute} ${config.notification.morning.hour} * * *`,
      async () => {
        logger.info("朝の通知を実行します...");
        try {
          await sendMorningNotification();
          logger.info("朝の通知を送信しました");
        } catch (error) {
          logger.error("朝の通知の送信に失敗しました", error);
        }
      },
    );

    // 夜の通知（毎日22時に実行）
    schedule(
      `${config.notification.evening.minute} ${config.notification.evening.hour} * * *`,
      async () => {
        logger.info("夜の通知を実行します...");
        try {
          await sendEveningNotification();
          logger.info("夜の通知を送信しました");
        } catch (error) {
          logger.error("夜の通知の送信に失敗しました", error);
        }
      },
    );

    logger.info("定期実行タスクを設定しました");
    logger.info(
      `朝の通知: 毎日 ${config.notification.morning.hour}:${config.notification.morning.minute}`,
    );
    logger.info(
      `夜の通知: 毎日 ${config.notification.evening.hour}:${config.notification.evening.minute}`,
    );
  } catch (error) {
    logger.error("定期実行タスクの設定に失敗しました", error);
    throw new AppError("定期実行タスクの設定に失敗しました", 500);
  }
};

/**
 * アプリケーションを起動
 */
const startServer = async () => {
  const port = config.server.port;
  logger.info(`サーバーを起動しています（ポート: ${port}）...`);

  try {
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
