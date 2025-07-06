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
): Promise<Response> => {
  try {
    // 次のミドルウェアまたはハンドラを実行
    await next();
    // デフォルトのレスポンスを返す
    return new Response("OK", { status: 200 });
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
      return new Response(JSON.stringify(response), {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 予期しないエラー
    const response: ApiResponse = {
      status: "error",
      message: "内部サーバーエラーが発生しました",
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
