import type { RichMenu } from "@line/bot-sdk";
import { logger } from "../utils/logger";
import lineClient from "./line";

/**
 * リッチメニューを作成
 * @returns 作成されたリッチメニューID
 */
export const createRichMenu = async (): Promise<string> => {
  try {
    // リッチメニューの定義
    const richMenu: RichMenu = {
      size: {
        width: 2500,
        height: 1686,
      },
      selected: true,
      name: "食事予定管理メニュー",
      chatBarText: "メニュー",
      areas: [
        // 予定登録ボタン
        {
          bounds: {
            x: 0,
            y: 0,
            width: 1250,
            height: 1686,
          },
          action: {
            type: "message",
            text: "予定登録",
          },
        },
        // 予定確認ボタン
        {
          bounds: {
            x: 1250,
            y: 0,
            width: 1250,
            height: 1686,
          },
          action: {
            type: "message",
            text: "予定確認",
          },
        },
      ],
    };

    // リッチメニューを作成
    const richMenuId = await lineClient.createRichMenu(richMenu);
    logger.info(`リッチメニューを作成しました: ${richMenuId}`);

    return richMenuId;
  } catch (error) {
    logger.error("リッチメニュー作成エラー:", error);
    throw new Error("リッチメニューの作成に失敗しました");
  }
};

/**
 * リッチメニュー画像をアップロード
 * @param richMenuId リッチメニューID
 * @param imagePath 画像パス
 */
export const uploadRichMenuImage = async (
  richMenuId: string,
  imageBuffer: Buffer,
): Promise<void> => {
  try {
    await lineClient.setRichMenuImage(richMenuId, imageBuffer);
    logger.info(`リッチメニュー画像をアップロードしました: ${richMenuId}`);
  } catch (error) {
    logger.error("リッチメニュー画像アップロードエラー:", error);
    throw new Error("リッチメニュー画像のアップロードに失敗しました");
  }
};

/**
 * リッチメニューをデフォルトとして設定
 * @param richMenuId リッチメニューID
 */
export const setDefaultRichMenu = async (richMenuId: string): Promise<void> => {
  try {
    await lineClient.setDefaultRichMenu(richMenuId);
    logger.info(`デフォルトリッチメニューを設定しました: ${richMenuId}`);
  } catch (error) {
    logger.error("デフォルトリッチメニュー設定エラー:", error);
    throw new Error("デフォルトリッチメニューの設定に失敗しました");
  }
};

/**
 * リッチメニューをユーザーに紐付け
 * @param userId ユーザーID
 * @param richMenuId リッチメニューID
 */
export const linkRichMenuToUser = async (
  userId: string,
  richMenuId: string,
): Promise<void> => {
  try {
    await lineClient.linkRichMenuToUser(userId, richMenuId);
    logger.info(
      `リッチメニューをユーザーに紐付けました: ${userId} -> ${richMenuId}`,
    );
  } catch (error) {
    logger.error("リッチメニューユーザー紐付けエラー:", error);
    throw new Error("リッチメニューのユーザー紐付けに失敗しました");
  }
};

/**
 * リッチメニューを削除
 * @param richMenuId リッチメニューID
 */
export const deleteRichMenu = async (richMenuId: string): Promise<void> => {
  try {
    await lineClient.deleteRichMenu(richMenuId);
    logger.info(`リッチメニューを削除しました: ${richMenuId}`);
  } catch (error) {
    logger.error("リッチメニュー削除エラー:", error);
    throw new Error("リッチメニューの削除に失敗しました");
  }
};

/**
 * 全てのリッチメニューを取得
 * @returns リッチメニューIDの配列
 */
export const getRichMenuList = async (): Promise<string[]> => {
  try {
    const response = await lineClient.getRichMenuList();
    const richMenuIds = response.map((richMenu) => richMenu.richMenuId);
    logger.info(`リッチメニュー一覧を取得しました: ${richMenuIds.length}件`);
    return richMenuIds;
  } catch (error) {
    logger.error("リッチメニュー一覧取得エラー:", error);
    throw new Error("リッチメニュー一覧の取得に失敗しました");
  }
};

/**
 * リッチメニューをセットアップ（既存のものを削除して新規作成）
 * @param imageBuffer リッチメニュー画像のバッファ
 * @returns 作成されたリッチメニューID
 */
export const setupRichMenu = async (imageBuffer: Buffer): Promise<string> => {
  try {
    // 既存のリッチメニューを取得して削除
    const richMenuIds = await getRichMenuList();
    for (const richMenuId of richMenuIds) {
      await deleteRichMenu(richMenuId);
    }

    // 新しいリッチメニューを作成
    const newRichMenuId = await createRichMenu();

    // 画像をアップロード
    await uploadRichMenuImage(newRichMenuId, imageBuffer);

    // デフォルトとして設定
    await setDefaultRichMenu(newRichMenuId);

    logger.info(`リッチメニューのセットアップが完了しました: ${newRichMenuId}`);
    return newRichMenuId;
  } catch (error) {
    logger.error("リッチメニューセットアップエラー:", error);
    throw new Error("リッチメニューのセットアップに失敗しました");
  }
};
