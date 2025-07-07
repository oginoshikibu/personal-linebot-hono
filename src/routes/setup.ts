import type { Context } from "hono";
import { setupRichMenu } from "../features/line/richmenu";
import { asyncHandler } from "../lib/errors";
import { logger } from "../lib/logger";
import { generateRichMenuImage } from "../utils/richMenuImage";

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
