import type { Logger } from "pino";
import * as pino from "pino";

// 環境変数からログレベルを取得（デフォルトはinfo）
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// 開発環境用の設定
const DEV_CONFIG = {
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
};

// 本番環境用の設定
const PROD_CONFIG = {
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
};

// 環境に応じた設定を選択
const config = process.env.NODE_ENV === "production" ? PROD_CONFIG : DEV_CONFIG;

/**
 * アプリケーションロガー
 */
export const logger = pino.default({
  level: LOG_LEVEL,
  ...config,
});

/**
 * 特定のコンテキスト用のロガーを作成
 * @param context ロギングコンテキスト
 * @returns コンテキスト付きロガー
 */
export const createContextLogger = (context: string): Logger => {
  return logger.child({ context });
};

export default logger;
