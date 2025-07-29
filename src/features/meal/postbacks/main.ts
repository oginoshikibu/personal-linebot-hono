import { logger } from "../../../lib/logger";

/**
 * ポストバックデータを処理
 * @param data ポストバックデータ
 * @param params ポストバックパラメータ
 * @param userName ユーザー名
 */
export const handlePostbackData = async (
  data: string,
  _params: Record<string, string> | undefined,
  userName: string,
): Promise<void> => {
  logger.info(`Legacy postback handler called: ${userName}`, { data });

  // This legacy handler has been replaced by the new postback system
  // in src/features/line/handlers/postback.ts which handles Alice/Bob
  // fixed user system properly. This function is kept for backward
  // compatibility but should not be used.
  logger.warn(
    "Legacy postback handler called - redirecting to new handler system",
    { data, userName },
  );
};
