/**
 * シンプルなロギングユーティリティ
 */
export const logger = {
  /**
   * 情報ログ
   * @param message メッセージ
   * @param data 追加データ
   */
  info: (message: string, data?: unknown): void => {
    console.log(`[INFO] ${message}`, data !== undefined ? data : '');
  },

  /**
   * 警告ログ
   * @param message メッセージ
   * @param data 追加データ
   */
  warn: (message: string, data?: unknown): void => {
    console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
  },

  /**
   * エラーログ
   * @param message メッセージ
   * @param error エラーオブジェクト
   */
  error: (message: string, error?: unknown): void => {
    console.error(`[ERROR] ${message}`);
    if (error instanceof Error) {
      console.error(error.stack);
    } else if (error !== undefined) {
      console.error(error);
    }
  },

  /**
   * デバッグログ（開発環境のみ）
   * @param message メッセージ
   * @param data 追加データ
   */
  debug: (message: string, data?: unknown): void => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
  },
}; 