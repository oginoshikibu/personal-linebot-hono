import type { Context } from "hono";
import { sendEveningNotification } from "../../features/notification/services/evening";
import { sendMorningNotification } from "../../features/notification/services/morning";
import { logger } from "../../lib/logger";
import type { ApiResponse } from "../../types";
import { honoAsyncHandler as asyncHandler } from "../../utils/error";

/**
 * ヘルスチェック用のエンドポイント
 * @param c Honoコンテキスト
 * @returns レスポンス
 */
export const healthCheck = asyncHandler(
  async (c: Context): Promise<Response> => {
    const response: ApiResponse = {
      status: "success",
      message: "サービスは正常に動作しています",
      data: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      },
    };

    return c.json(response);
  },
);

/**
 * 朝の通知を手動で送信するエンドポイント
 * @param c Honoコンテキスト
 * @returns レスポンス
 */
export const triggerMorningNotification = asyncHandler(
  async (c: Context): Promise<Response> => {
    logger.info("朝の通知を手動で実行します...");

    await sendMorningNotification();

    const response: ApiResponse = {
      status: "success",
      message: "朝の通知を送信しました",
    };

    return c.json(response);
  },
);

/**
 * 夜の通知を手動で送信するエンドポイント
 * @param c Honoコンテキスト
 * @returns レスポンス
 */
export const triggerEveningNotification = asyncHandler(
  async (c: Context): Promise<Response> => {
    logger.info("夜の通知を手動で実行します...");

    await sendEveningNotification();

    const response: ApiResponse = {
      status: "success",
      message: "夜の通知を送信しました",
    };

    return c.json(response);
  },
);

// APIルートをエクスポート
export const apiRoutes = {
  health: {
    get: healthCheck,
  },
  notification: {
    morning: {
      post: triggerMorningNotification,
    },
    evening: {
      post: triggerEveningNotification,
    },
  },
};
