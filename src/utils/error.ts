import type { Context, Next } from "hono";
import { logger } from "../lib/logger";

/**
 * HTTPステータスコードの型定義
 */
export type HttpStatusCode = 400 | 401 | 403 | 404 | 500 | 502 | 503;

/**
 * アプリケーション固有のエラークラス
 */
export class AppError extends Error {
  statusCode: HttpStatusCode;
  isOperational: boolean;
  errorCode?: string;

  constructor(
    message: string,
    statusCode: HttpStatusCode = 500,
    isOperational = true,
    errorCode?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * エラーをログに記録する
 * @param error エラーオブジェクト
 */
export const logError = (error: Error): void => {
  logger.error(`[ERROR] ${error.message}`, {
    stack: error.stack,
    name: error.name,
  });
};

/**
 * エラーレスポンス情報を生成
 * @param error エラーオブジェクト
 * @returns エラーレスポンス情報
 */
export const createErrorResponse = (
  error: unknown,
): { message: string; statusCode: HttpStatusCode; errorCode?: string } => {
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
 * 非同期関数をトライキャッチで包む高階関数
 * @param fn 非同期関数
 * @returns トライキャッチで包まれた関数
 */
export const asyncHandler = <T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
): ((...args: A) => Promise<T>) => {
  return async (...args: A): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        logError(error);
      }
      throw error;
    }
  };
};

/**
 * エラーが操作的なものかどうかを判断
 * @param error エラーオブジェクト
 * @returns 操作的なエラーの場合はtrue
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Hono用の非同期ハンドラーをラップしてエラーハンドリングを統一
 * @param handler 非同期ハンドラー関数
 * @returns ラップされたハンドラー関数
 */
export const honoAsyncHandler = <T extends Context>(
  handler: (c: T) => Promise<Response>,
): ((c: T) => Promise<Response>) => {
  return async (c: T): Promise<Response> => {
    try {
      return await handler(c);
    } catch (error) {
      const { message, statusCode, errorCode } = createErrorResponse(error);
      logger.error("リクエスト処理エラー", {
        path: c.req.path,
        method: c.req.method,
        error: message,
        statusCode,
        errorCode,
      });
      return c.json(
        { success: false, message, statusCode, errorCode },
        statusCode,
      );
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
    const { message, statusCode, errorCode } = createErrorResponse(error);
    logger.error("未処理エラー", {
      path: c.req.path,
      method: c.req.method,
      error: message,
      statusCode,
      errorCode,
    });
    return c.json({ success: false, message }, statusCode);
  }
};
