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

  constructor(
    message: string,
    statusCode: HttpStatusCode = 500,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * エラーをログに記録する
 * @param error エラーオブジェクト
 */
export const logError = (error: Error): void => {
  console.error(`[ERROR] ${error.message}`);
  console.error(error.stack);
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
