// Rich menu image generation functions moved inline
import { logger } from "../src/utils/logger";
import fs from "node:fs";
import path from "node:path";

/**
 * 既存のリッチメニュー画像を読み込み
 */
const loadExistingRichMenuImage = (): Buffer => {
  try {
    const imagePath = path.resolve(process.cwd(), "assets/images/richmenu.png");
    
    if (fs.existsSync(imagePath)) {
      logger.info("既存のリッチメニュー画像を読み込みました");
      return fs.readFileSync(imagePath);
    } else {
      logger.warn("リッチメニュー画像が見つかりません。透明画像を生成します");
      return generateTransparentImage();
    }
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
  const transparentPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  return Buffer.from(transparentPngBase64, 'base64');
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
 * 画像バッファのMIMEタイプを検証する関数
 * @param buffer 画像バッファ
 * @returns MIMEタイプ
 */
function detectMimeType(buffer: Buffer): string | null {
  // PNGのマジックナンバーをチェック
  if (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  
  // JPEGのマジックナンバーをチェック
  if (
    buffer.length > 3 &&
    buffer[0] === 0xFF &&
    buffer[1] === 0xD8 &&
    buffer[2] === 0xFF
  ) {
    return "image/jpeg";
  }
  
  return null;
}

// LINE APIのモック
const mockLineClient = {
  getRichMenuList: async () => {
    logger.info("モック: リッチメニュー一覧を取得しました");
    return [{ richMenuId: "mock-richmenu-1" }, { richMenuId: "mock-richmenu-2" }];
  },
  deleteRichMenu: async (richMenuId: string) => {
    logger.info(`モック: リッチメニューを削除しました: ${richMenuId}`);
    return;
  },
  createRichMenu: async () => {
    const mockRichMenuId = "mock-new-richmenu-" + Date.now();
    logger.info(`モック: リッチメニューを作成しました: ${mockRichMenuId}`);
    return mockRichMenuId;
  },
  setRichMenuImage: async (richMenuId: string, imageBuffer: Buffer, contentType: string) => {
    logger.info(`モック: リッチメニュー画像をアップロードしました: ${richMenuId}, コンテンツタイプ: ${contentType}`);
    
    // 画像のバッファを検証
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error("画像バッファが無効です");
    }
    
    // MIMEタイプを検証
    const detectedMimeType = detectMimeType(imageBuffer);
    logger.info(`モック: 検出されたMIMEタイプ: ${detectedMimeType || "不明"}`);
    
    if (!detectedMimeType) {
      logger.warn("モック: 画像のMIMEタイプが検出できませんでした。指定されたコンテンツタイプを使用します。");
    } else if (detectedMimeType !== contentType) {
      logger.warn(`モック: 指定されたコンテンツタイプ(${contentType})と検出されたMIMEタイプ(${detectedMimeType})が一致しません。`);
    }
    
    // 画像をファイルに保存（検証用）
    const outputDir = path.resolve(__dirname, "../temp");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.resolve(outputDir, `richmenu-${richMenuId}.png`);
    fs.writeFileSync(outputPath, imageBuffer);
    logger.info(`モック: 画像を保存しました: ${outputPath}`);
    
    return;
  },
  setDefaultRichMenu: async (richMenuId: string) => {
    logger.info(`モック: デフォルトリッチメニューを設定しました: ${richMenuId}`);
    return;
  }
};

/**
 * リッチメニューをモックでセットアップする関数
 * @param imageBuffer リッチメニュー画像のバッファ
 * @returns 作成されたリッチメニューID
 */
async function setupRichMenuWithMock(imageBuffer: Buffer): Promise<string> {
  try {
    // 既存のリッチメニューを取得して削除
    const richMenuList = await mockLineClient.getRichMenuList();
    for (const richMenu of richMenuList) {
      await mockLineClient.deleteRichMenu(richMenu.richMenuId);
    }

    // 新しいリッチメニューを作成
    const newRichMenuId = await mockLineClient.createRichMenu();

    // 画像をアップロード
    await mockLineClient.setRichMenuImage(newRichMenuId, imageBuffer, 'image/png');

    // デフォルトとして設定
    await mockLineClient.setDefaultRichMenu(newRichMenuId);

    logger.info(`モック: リッチメニューのセットアップが完了しました: ${newRichMenuId}`);
    return newRichMenuId;
  } catch (error) {
    logger.error("モック: リッチメニューセットアップエラー:", error);
    throw new Error("リッチメニューのセットアップに失敗しました");
  }
}

/**
 * リッチメニューをセットアップするスクリプト（モック版）
 */
async function main() {
  try {
    logger.info("リッチメニューのセットアップを開始します（モック版）");

    // リッチメニュー画像を生成
    const imageBuffer = generateRichMenuImage();
    logger.info("リッチメニュー画像を生成しました");
    
    // 画像バッファのMIMEタイプを検証
    const mimeType = detectMimeType(imageBuffer);
    logger.info(`検出されたMIMEタイプ: ${mimeType || "不明"}`);
    
    if (!mimeType) {
      logger.warn("画像のMIMEタイプが検出できませんでした。デフォルトでimage/pngを使用します。");
    }

    // リッチメニューをセットアップ（モック）
    const richMenuId = await setupRichMenuWithMock(imageBuffer);
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