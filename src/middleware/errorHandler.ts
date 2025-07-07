import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ApiResponse } from "../types";
import { AppError } from "../utils/error";
import { logger } from "../utils/logger";

/**
 * グローバルエラーハンドリングミドルウェア
 * @param c コンテキスト
 * @param next 次のハンドラ
 * @returns レスポンス
 */
export const errorHandler = async (
  c: Context,
  next: Next,
): Promise<Response | undefined> => {
  try {
    // 次のミドルウェアまたはハンドラを実行
    await next();
  } catch (error) {
    // エラーをログに記録
    logger.error("リクエスト処理中にエラーが発生しました", error);

    // エラーの種類に応じたレスポンスを返す
    if (error instanceof HTTPException) {
      // Honoの標準エラー
      const response: ApiResponse = {
        status: "error",
        message: error.message || "エラーが発生しました",
      };
      return c.json(response, error.status);
    }

    if (error instanceof AppError) {
      // アプリケーション固有のエラー
      const response: ApiResponse = {
        status: "error",
        message: error.message,
      };
      return c.json(response, error.statusCode);
    }

    // 予期しないエラー
    const response: ApiResponse = {
      status: "error",
      message: "内部サーバーエラーが発生しました",
    };
    return c.json(response, 500);
  }
};
