import fs from "node:fs";
import path from "node:path";
import { Client } from "@line/bot-sdk";
import { config } from "../src/config";
import { logger } from "../src/lib/logger";

// LINE Client初期化
const lineClient = new Client({
  channelSecret: config.line.channelSecret,
  channelAccessToken: config.line.channelAccessToken,
});

/**
 * デフォルトのリッチメニュープロパティ
 */
export const getDefaultRichMenuProperties = (): {
  size: { width: number; height: number };
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: Array<{
    bounds: { x: number; y: number; width: number; height: number };
    action: { type: "message"; text: string };
  }>;
} => {
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
        action: { type: "message" as const, text: "今日の予定" },
      },
      {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: "message" as const, text: "明日の予定" },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: "message" as const, text: "今週の予定" },
      },
      {
        bounds: { x: 0, y: 843, width: 1250, height: 843 },
        action: { type: "message" as const, text: "今後の予定" },
      },
      {
        bounds: { x: 1250, y: 843, width: 1250, height: 843 },
        action: { type: "message" as const, text: "ヘルプ" },
      },
    ],
  };
};

/**
 * 既存のリッチメニュー画像を読み込み
 */
const loadExistingRichMenuImage = (): Buffer => {
  try {
    const imagePath = path.resolve(process.cwd(), "assets/images/richmenu.png");

    if (fs.existsSync(imagePath)) {
      logger.info("既存のリッチメニュー画像を読み込みました");
      return fs.readFileSync(imagePath);
    }
    logger.warn("リッチメニュー画像が見つかりません。透明画像を生成します");
    return generateTransparentImage();
  } catch (error) {
    logger.error("リッチメニュー画像の読み込みに失敗しました", error);
    return generateTransparentImage();
  }
};

/**
 * 透明な画像を生成（フォールバック）
 */
const generateTransparentImage = (): Buffer => {
  // 1x1の透明PNG画像のBase64エンコードデータ
  const transparentPngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  return Buffer.from(transparentPngBase64, "base64");
};

/**
 * リッチメニュー画像を生成
 */
const generateRichMenuImage = (): Buffer => {
  try {
    logger.info("リッチメニュー画像を生成します");
    return loadExistingRichMenuImage();
  } catch (error) {
    logger.error("リッチメニュー画像の生成に失敗しました", error);
    return generateTransparentImage();
  }
};

/**
 * リッチメニュー一覧を取得
 */
const getRichMenuList = async (): Promise<string[]> => {
  try {
    const richMenus = await lineClient.getRichMenuList();
    return richMenus.map((menu: { richMenuId: string }) => menu.richMenuId);
  } catch (error) {
    logger.error("リッチメニュー一覧取得エラー", error);
    throw new Error("リッチメニュー一覧の取得に失敗しました");
  }
};

/**
 * リッチメニューを削除
 */
const deleteRichMenu = async (richMenuId: string): Promise<void> => {
  try {
    await lineClient.deleteRichMenu(richMenuId);
    logger.info(`リッチメニューを削除しました: ${richMenuId}`);
  } catch (error) {
    logger.error(`リッチメニュー削除エラー: ${richMenuId}`, error);
    throw new Error(`リッチメニューの削除に失敗しました: ${richMenuId}`);
  }
};

/**
 * 既存のリッチメニューを全て削除
 */
const deleteAllRichMenus = async (): Promise<void> => {
  try {
    const richMenuIds = await getRichMenuList();

    for (const richMenuId of richMenuIds) {
      await deleteRichMenu(richMenuId);
    }

    logger.info(`${richMenuIds.length}個のリッチメニューを削除しました`);
  } catch (error) {
    logger.error("リッチメニュー全削除エラー", error);
    throw new Error("既存リッチメニューの削除に失敗しました");
  }
};

/**
 * リッチメニューを作成
 */
const createRichMenu = async (): Promise<string> => {
  try {
    const richMenuProperties = getDefaultRichMenuProperties();
    const response = await lineClient.createRichMenu(richMenuProperties);
    const richMenuId =
      typeof response === "string" ? response : String(response);
    logger.info(`リッチメニューを作成しました: ${richMenuId}`);
    return richMenuId;
  } catch (error) {
    logger.error("リッチメニュー作成エラー", error);
    throw new Error("リッチメニューの作成に失敗しました");
  }
};

/**
 * リッチメニュー画像をアップロード
 */
const uploadRichMenuImage = async (
  richMenuId: string,
  imageBuffer: Buffer,
  contentType = "image/png",
): Promise<void> => {
  try {
    await lineClient.setRichMenuImage(richMenuId, imageBuffer, contentType);
    logger.info(`リッチメニュー画像をアップロードしました: ${richMenuId}`);
  } catch (error) {
    logger.error(`リッチメニュー画像アップロードエラー: ${richMenuId}`, error);
    throw new Error(
      `リッチメニュー画像のアップロードに失敗しました: ${richMenuId}`,
    );
  }
};

/**
 * デフォルトリッチメニューを設定
 */
const setDefaultRichMenu = async (richMenuId: string): Promise<void> => {
  try {
    await lineClient.setDefaultRichMenu(richMenuId);
    logger.info(`デフォルトリッチメニューを設定しました: ${richMenuId}`);
  } catch (error) {
    logger.error(`デフォルトリッチメニュー設定エラー: ${richMenuId}`, error);
    throw new Error(
      `デフォルトリッチメニューの設定に失敗しました: ${richMenuId}`,
    );
  }
};

/**
 * リッチメニューをセットアップ（総合処理）
 */
const setupRichMenu = async (imageBuffer: Buffer): Promise<string> => {
  try {
    logger.info("リッチメニューのセットアップを開始します");

    // 1. 既存のリッチメニューを削除
    await deleteAllRichMenus();

    // 2. 新しいリッチメニューを作成
    const richMenuId = await createRichMenu();

    // 3. リッチメニュー画像をアップロード
    await uploadRichMenuImage(richMenuId, imageBuffer);

    // 4. デフォルトリッチメニューとして設定
    await setDefaultRichMenu(richMenuId);

    logger.info(`リッチメニューのセットアップが完了しました: ${richMenuId}`);
    return richMenuId;
  } catch (error) {
    logger.error("リッチメニューセットアップエラー", error);
    throw new Error("リッチメニューのセットアップに失敗しました");
  }
};

/**
 * リッチメニューをセットアップするスクリプト
 */
async function main() {
  try {
    logger.info("リッチメニューのセットアップを開始します");

    // リッチメニュー画像を生成
    const imageBuffer = generateRichMenuImage();
    logger.info("リッチメニュー画像を生成しました");

    // リッチメニューをセットアップ
    const richMenuId = await setupRichMenu(imageBuffer);
    logger.info(`リッチメニューのセットアップが完了しました: ${richMenuId}`);

    return richMenuId;
  } catch (error) {
    logger.error("リッチメニューのセットアップに失敗しました", error);
    throw error;
  } finally {
    // プロセスを終了
    process.exit(0);
  }
}

// スクリプトを実行
main().catch((error) => {
  logger.error("スクリプト実行エラー:", error);
  process.exit(1);
});
