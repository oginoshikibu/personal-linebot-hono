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
  logger.info(`ポストバックデータ処理: ${userName}`, { data });

  // TODO: ユーザー名からLINE IDを取得するロジックを実装し、以下の処理を有効化
  logger.warn(
    "ポストバックハンドラーは現在無効化されています。ユーザー名からLINE IDへのマッピングが必要です。",
  );

  /*
  // シンプルな形式のポストバック
  if (
    [
      "register_today_lunch",
      "register_today_dinner",
      "register_tomorrow_lunch",
      "register_tomorrow_dinner",
    ].includes(data)
  ) {
    logger.debug(`ポストバックデータ処理: ${data}, ユーザー: ${userName} `);
    // 実際の登録処理はここに実装
    await sendTextMessage(userLineId, `${data}の処理を実行しました。`);
    return;
  }

  // クエリパラメータ形式のポストバック
  if (data.startsWith("confirm_registration")) {
    logger.debug(`ポストバックデータ処理: ${data}, ユーザー: ${userName} `);
    // 実際の確認処理はここに実装
    await sendTextMessage(userLineId, `${data}の処理を実行しました。`);
    return;
  }

  // action=xxx形式のポストバック
  try {
    const params = new URLSearchParams(data);
    const action = params.get("action");

    if (action === "register_meal") {
      // 食事登録処理
      await sendTextMessage(userLineId, "食事予定を登録しました。");
      return;
    }

    if (action === "check_meal") {
      // 食事確認処理
      await sendTextMessage(userLineId, "食事予定を確認しました。");
      return;
    }
  } catch {
    // URLSearchParamsでパースできない場合は何もしない
  }

  // 未知のポストバックデータの場合
  logger.warn(`未知のポストバックデータ: ${data}`, { userName });
  await sendTextMessage(
    userLineId,
    "不明な操作が行われました。もう一度お試しください。",
  );
  */
};
