import type { Context, Next } from "hono";
import { logger } from "./logger";

/**
 * アプリケーションエラークラス
 */
export class AppError extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(message: string, statusCode = 500, errorCode?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * エラーレスポンスを生成
 * @param error エラーオブジェクト
 * @returns エラーレスポンス情報
 */
export const errorHandler = (
  error: unknown,
): { message: string; statusCode: number; errorCode?: string } => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
    };
  }

  return {
    message: error instanceof Error ? error.message : "Unknown error occurred",
    statusCode: 500,
  };
};

/**
 * 非同期ハンドラーをラップしてエラーハンドリングを統一
 * @param handler 非同期ハンドラー関数
 * @returns ラップされたハンドラー関数
 */
export const asyncHandler = <T extends Context>(
  handler: (c: T) => Promise<Response>,
): ((c: T) => Promise<Response>) => {
  return async (c: T): Promise<Response> => {
    try {
      return await handler(c);
    } catch (error) {
      const { message, statusCode } = errorHandler(error);
      logger.error("リクエスト処理エラー", {
        path: c.req.path,
        method: c.req.method,
        error: message,
        statusCode,
      });
      return c.json({ success: false, message });
    }
  };
};

/**
 * グローバルエラーハンドラーミドルウェア
 * @param c Honoコンテキスト
 * @param next 次のミドルウェア
 */
export const globalErrorHandler = async (
  c: Context,
  next: Next,
): Promise<Response | undefined> => {
  try {
    await next();
  } catch (error) {
    const { message, statusCode } = errorHandler(error);
    logger.error("未処理エラー", {
      path: c.req.path,
      method: c.req.method,
      error: message,
      statusCode,
    });
    return c.json({ success: false, message });
  }
};
