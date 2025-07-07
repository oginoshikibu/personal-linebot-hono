import { generateRichMenuImage } from "../src/utils/richMenuImage";
import { setupRichMenu } from "../src/services/richmenu";
import { logger } from "../src/utils/logger";

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