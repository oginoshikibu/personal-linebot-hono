import { Client } from "@line/bot-sdk";
import { config } from "../config";
import { AppError } from "../utils/error";
import { logger } from "../utils/logger";

// LINE Client初期化（遅延初期化）
let lineClient: Client | null = null;

const getLineClient = (): Client => {
  if (!lineClient) {
    if (!config.line.channelSecret || !config.line.channelAccessToken) {
      throw new AppError(
        "LINE APIの設定が不足しています。環境変数を確認してください。",
        500,
      );
    }
    lineClient = new Client({
      channelSecret: config.line.channelSecret,
      channelAccessToken: config.line.channelAccessToken,
    });
  }
  return lineClient;
};

/**
 * リッチメニューのプロパティ
 */
export interface RichMenuProperties {
  size: {
    width: number;
    height: number;
  };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: Array<{
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    action: {
      type: string;
      text?: string;
      data?: string;
    };
  }>;
}

/**
 * デフォルトのリッチメニュープロパティを取得
 */
export const getDefaultRichMenuProperties = (): RichMenuProperties => {
  return {
    size: {
      width: 2500,
      height: 1686,
    },
    selected: false,
    name: "食事予定管理メニュー",
    chatBarText: "メニュー",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: "message", text: "予定登録" },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "message", text: "予定変更" },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "message", text: "予定確認" },
      },
      {
        bounds: { x: 0, y: 843, width: 1250, height: 843 },
        action: { type: "message", text: "今後の予定" },
      },
      {
        bounds: { x: 1250, y: 843, width: 1250, height: 843 },
        action: { type: "message", text: "ヘルプ" },
      },
    ],
  };
};

/**
 * リッチメニュー一覧を取得
 */
export const getRichMenuList = async (): Promise<string[]> => {
  try {
    const client = getLineClient();
    const richMenus = await client.getRichMenuList();
    return richMenus.map((menu: { richMenuId: string }) => menu.richMenuId);
  } catch (error) {
    logger.error("リッチメニュー一覧取得エラー", error);
    throw new AppError("リッチメニュー一覧の取得に失敗しました", 500);
  }
};

/**
 * リッチメニューを削除
 */
export const deleteRichMenu = async (richMenuId: string): Promise<void> => {
  try {
    const client = getLineClient();
    await client.deleteRichMenu(richMenuId);
    logger.info(`リッチメニューを削除しました: ${richMenuId}`);
  } catch (error) {
    logger.error(`リッチメニュー削除エラー: ${richMenuId}`, error);
    throw new AppError(
      `リッチメニューの削除に失敗しました: ${richMenuId}`,
      500,
    );
  }
};

/**
 * 既存のリッチメニューを全て削除
 */
export const deleteAllRichMenus = async (): Promise<void> => {
  try {
    const richMenuIds = await getRichMenuList();

    for (const richMenuId of richMenuIds) {
      await deleteRichMenu(richMenuId);
    }

    logger.info(`${richMenuIds.length}個のリッチメニューを削除しました`);
  } catch (error) {
    logger.error("リッチメニュー全削除エラー", error);
    throw new AppError("既存リッチメニューの削除に失敗しました", 500);
  }
};

/**
 * リッチメニューを作成
 */
export const createRichMenu = async (
  properties?: Partial<RichMenuProperties>,
): Promise<string> => {
  try {
    const richMenuProperties = {
      ...getDefaultRichMenuProperties(),
      ...properties,
    };

    const client = getLineClient();
    const response = await client.createRichMenu(richMenuProperties);
    logger.info(`リッチメニューを作成しました: ${response.richMenuId}`);
    return response.richMenuId;
  } catch (error) {
    logger.error("リッチメニュー作成エラー", error);
    throw new AppError("リッチメニューの作成に失敗しました", 500);
  }
};

/**
 * リッチメニュー画像をアップロード
 */
export const uploadRichMenuImage = async (
  richMenuId: string,
  imageBuffer: Buffer,
  contentType = "image/png",
): Promise<void> => {
  try {
    const client = getLineClient();
    await client.setRichMenuImage(richMenuId, imageBuffer, contentType);
    logger.info(`リッチメニュー画像をアップロードしました: ${richMenuId}`);
  } catch (error) {
    logger.error(`リッチメニュー画像アップロードエラー: ${richMenuId}`, error);
    throw new AppError(
      `リッチメニュー画像のアップロードに失敗しました: ${richMenuId}`,
      500,
    );
  }
};

/**
 * デフォルトリッチメニューを設定
 */
export const setDefaultRichMenu = async (richMenuId: string): Promise<void> => {
  try {
    const client = getLineClient();
    await client.setDefaultRichMenu(richMenuId);
    logger.info(`デフォルトリッチメニューを設定しました: ${richMenuId}`);
  } catch (error) {
    logger.error(`デフォルトリッチメニュー設定エラー: ${richMenuId}`, error);
    throw new AppError(
      `デフォルトリッチメニューの設定に失敗しました: ${richMenuId}`,
      500,
    );
  }
};

/**
 * ユーザーにリッチメニューを紐付け
 */
export const linkRichMenuToUser = async (
  userId: string,
  richMenuId: string,
): Promise<void> => {
  try {
    const client = getLineClient();
    await client.linkRichMenuToUser(userId, richMenuId);
    logger.info(
      `ユーザーにリッチメニューを紐付けました: ${userId} -> ${richMenuId}`,
    );
  } catch (error) {
    logger.error(`リッチメニューユーザー紐付けエラー: ${userId}`, error);
    throw new AppError(
      `リッチメニューのユーザー紐付けに失敗しました: ${userId}`,
      500,
    );
  }
};

/**
 * リッチメニューをセットアップ（総合処理）
 */
export const setupRichMenu = async (
  imageBuffer: Buffer,
  properties?: Partial<RichMenuProperties>,
): Promise<string> => {
  try {
    logger.info("リッチメニューのセットアップを開始します");

    // 1. 既存のリッチメニューを削除
    await deleteAllRichMenus();

    // 2. 新しいリッチメニューを作成
    const richMenuId = await createRichMenu(properties);

    // 3. リッチメニュー画像をアップロード
    await uploadRichMenuImage(richMenuId, imageBuffer);

    // 4. デフォルトリッチメニューとして設定
    await setDefaultRichMenu(richMenuId);

    logger.info(`リッチメニューのセットアップが完了しました: ${richMenuId}`);
    return richMenuId;
  } catch (error) {
    logger.error("リッチメニューセットアップエラー", error);
    throw new AppError("リッチメニューのセットアップに失敗しました", 500);
  }
};
