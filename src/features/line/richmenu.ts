import type { RichMenu as LineRichMenu } from "@line/bot-sdk";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { lineClient } from "./client";

// 拡張したRichMenu型を定義
interface RichMenu extends LineRichMenu {
  richMenuId?: string;
}

/**
 * リッチメニューを設定
 * @param imageBuffer リッチメニュー画像のバッファ
 * @returns 作成されたリッチメニューID
 */
export const setupRichMenu = async (imageBuffer: Buffer): Promise<string> => {
  try {
    logger.info("リッチメニューの作成を開始します");

    // リッチメニューを作成
    const richMenu = await createRichMenu();
    logger.info(`リッチメニューを作成しました: ${richMenu.richMenuId}`);

    // リッチメニュー画像をアップロード
    const richMenuId = richMenu.richMenuId;
    if (!richMenuId) {
      throw new AppError("リッチメニューIDが取得できませんでした", 500);
    }
    await uploadRichMenuImage(richMenuId, imageBuffer);
    logger.info(`リッチメニュー画像をアップロードしました: ${richMenuId}`);

    // リッチメニューをデフォルトに設定
    await setDefaultRichMenu(richMenuId);
    logger.info(`リッチメニューをデフォルトに設定しました: ${richMenuId}`);

    return richMenuId;
  } catch (error) {
    logger.error("リッチメニューの設定に失敗しました", error);
    throw new AppError("リッチメニューの設定に失敗しました", 500);
  }
};

/**
 * リッチメニューを作成
 * @returns 作成されたリッチメニュー
 */
const createRichMenu = async (): Promise<RichMenu> => {
  try {
    // リッチメニューの定義
    const richMenuObject: RichMenu = {
      size: {
        width: 2500,
        height: 1686,
      },
      selected: true,
      name: "メインメニュー",
      chatBarText: "メニュー",
      areas: [
        {
          bounds: {
            x: 0,
            y: 0,
            width: 833,
            height: 843,
          },
          action: {
            type: "message",
            text: "予定登録",
          },
        },
        {
          bounds: {
            x: 833,
            y: 0,
            width: 833,
            height: 843,
          },
          action: {
            type: "message",
            text: "予定変更",
          },
        },
        {
          bounds: {
            x: 1666,
            y: 0,
            width: 834,
            height: 843,
          },
          action: {
            type: "message",
            text: "予定確認",
          },
        },
        {
          bounds: {
            x: 0,
            y: 843,
            width: 833,
            height: 843,
          },
          action: {
            type: "message",
            text: "今後の予定",
          },
        },
        {
          bounds: {
            x: 833,
            y: 843,
            width: 833,
            height: 843,
          },
          action: {
            type: "message",
            text: "ヘルプ",
          },
        },
        {
          bounds: {
            x: 1666,
            y: 843,
            width: 834,
            height: 843,
          },
          action: {
            type: "uri",
            uri: "https://github.com/yourusername/personal-linebot-hono",
            label: "リポジトリ",
          },
        },
      ],
    };

    // リッチメニューを作成
    const richMenuId = await lineClient.createRichMenu(richMenuObject);
    return { ...richMenuObject, richMenuId };
  } catch (error) {
    logger.error("リッチメニューの作成に失敗しました", error);
    throw new AppError("リッチメニューの作成に失敗しました", 500);
  }
};

/**
 * リッチメニュー画像をアップロード
 * @param richMenuId リッチメニューID
 * @param imageBuffer 画像バッファ
 */
const uploadRichMenuImage = async (
  richMenuId: string,
  imageBuffer: Buffer,
): Promise<void> => {
  try {
    await lineClient.setRichMenuImage(richMenuId, imageBuffer);
  } catch (error) {
    logger.error(
      `リッチメニュー画像のアップロードに失敗しました: ${richMenuId}`,
      error,
    );
    throw new AppError("リッチメニュー画像のアップロードに失敗しました", 500);
  }
};

/**
 * デフォルトのリッチメニューを設定
 * @param richMenuId リッチメニューID
 */
const setDefaultRichMenu = async (richMenuId: string): Promise<void> => {
  try {
    await lineClient.setDefaultRichMenu(richMenuId);
  } catch (error) {
    logger.error(
      `デフォルトリッチメニューの設定に失敗しました: ${richMenuId}`,
      error,
    );
    throw new AppError("デフォルトリッチメニューの設定に失敗しました", 500);
  }
};
