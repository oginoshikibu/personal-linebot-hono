import type { Context } from "hono";
import { sendEveningNotification } from "../../features/notification/services/evening";
import { sendMorningNotification } from "../../features/notification/services/morning";
import { asyncHandler } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { setupRichMenu } from "../../services/richmenu";
import type { ApiResponse } from "../../types";
import {
  generateThemedRichMenuImage,
  PREDEFINED_THEMES,
  saveRichMenuImageToTemp,
} from "../../utils/richMenuImage";

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

/**
 * リッチメニューをセットアップするエンドポイント
 * @param c Honoコンテキスト
 * @returns レスポンス
 */
export const setupRichMenuEndpoint = asyncHandler(
  async (c: Context): Promise<Response> => {
    logger.info("リッチメニューのセットアップを開始します...");

    try {
      // クエリパラメータからテーマを取得（デフォルトは "default"）
      const theme = c.req.query("theme") || "default";
      const saveTemp = c.req.query("save") === "true";

      // テーマが有効かチェック
      if (!Object.prototype.hasOwnProperty.call(PREDEFINED_THEMES, theme)) {
        const response: ApiResponse = {
          status: "error",
          message: `無効なテーマです: ${theme}。利用可能なテーマ: ${Object.keys(PREDEFINED_THEMES).join(", ")}`,
        };
        return c.json(response, 400);
      }

      // テーマに基づいてリッチメニュー画像を生成
      const imageBuffer = generateThemedRichMenuImage(theme);

      // 一時ファイルとして保存（オプション）
      let tempFilePath: string | undefined;
      if (saveTemp) {
        tempFilePath = saveRichMenuImageToTemp(
          imageBuffer,
          `richmenu-${theme}-${Date.now()}.png`,
        );
      }

      // リッチメニューをセットアップ
      const richMenuId = await setupRichMenu(imageBuffer);

      const response: ApiResponse = {
        status: "success",
        message: `リッチメニューのセットアップが完了しました (テーマ: ${theme})`,
        data: {
          richMenuId,
          theme,
          tempFilePath,
          availableThemes: Object.keys(PREDEFINED_THEMES),
        },
      };

      return c.json(response);
    } catch (error) {
      logger.error("リッチメニューセットアップエラー", error);

      const response: ApiResponse = {
        status: "error",
        message: `リッチメニューのセットアップに失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
      };

      return c.json(response, 500);
    }
  },
);

/**
 * 利用可能なリッチメニューテーマ一覧を取得するエンドポイント
 * @param c Honoコンテキスト
 * @returns レスポンス
 */
export const getRichMenuThemes = asyncHandler(
  async (c: Context): Promise<Response> => {
    const response: ApiResponse = {
      status: "success",
      message: "利用可能なリッチメニューテーマ一覧",
      data: {
        themes: Object.keys(PREDEFINED_THEMES),
        themeDetails: PREDEFINED_THEMES,
      },
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
  richmenu: {
    setup: {
      get: setupRichMenuEndpoint,
    },
    themes: {
      get: getRichMenuThemes,
    },
  },
};
