import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger";

/**
 * リッチメニューのテーマオプション
 */
export interface RichMenuTheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
}

/**
 * リッチメニューのコンテンツオプション
 */
export interface RichMenuContent {
  title: string;
  buttons: Array<{
    text: string;
    subtext?: string;
  }>;
  theme?: RichMenuTheme;
}

/**
 * デフォルトテーマ
 */
export const DEFAULT_THEME: RichMenuTheme = {
  backgroundColor: "#FFFFFF",
  textColor: "#333333",
  borderColor: "#CCCCCC",
  accentColor: "#00C851",
};

/**
 * デフォルトのリッチメニューコンテンツ
 */
export const DEFAULT_CONTENT: RichMenuContent = {
  title: "食事予定管理",
  buttons: [
    { text: "予定登録", subtext: "新しい予定を追加" },
    { text: "予定変更", subtext: "既存の予定を変更" },
    { text: "予定確認", subtext: "今後の予定を確認" },
    { text: "今後の予定", subtext: "カレンダー表示" },
    { text: "ヘルプ", subtext: "使い方を確認" },
  ],
  theme: DEFAULT_THEME,
};

/**
 * 事前定義されたテーマ
 */
export const PREDEFINED_THEMES: Record<string, RichMenuTheme> = {
  default: DEFAULT_THEME,
  dark: {
    backgroundColor: "#2C2C2C",
    textColor: "#FFFFFF",
    borderColor: "#555555",
    accentColor: "#4CAF50",
  },
  blue: {
    backgroundColor: "#E3F2FD",
    textColor: "#1976D2",
    borderColor: "#BBDEFB",
    accentColor: "#2196F3",
  },
  warm: {
    backgroundColor: "#FFF8E1",
    textColor: "#F57C00",
    borderColor: "#FFE0B2",
    accentColor: "#FF9800",
  },
};

/**
 * 既存のリッチメニュー画像を読み込み
 */
export const loadExistingRichMenuImage = (): Buffer => {
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
export const generateTransparentImage = (): Buffer => {
  // 1x1の透明PNG画像のBase64エンコードデータ
  const transparentPngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  return Buffer.from(transparentPngBase64, "base64");
};

/**
 * リッチメニュー画像を生成（現在は既存画像を返す）
 * TODO: canvas ライブラリを追加して動的な画像生成を実装
 */
export const generateRichMenuImage = (content?: RichMenuContent): Buffer => {
  try {
    logger.info("リッチメニュー画像を生成します", {
      content: content?.title || "デフォルト",
    });

    // 現在は既存の画像を返す
    // TODO: contentに基づいて動的に画像を生成する
    return loadExistingRichMenuImage();
  } catch (error) {
    logger.error("リッチメニュー画像の生成に失敗しました", error);
    return generateTransparentImage();
  }
};

/**
 * コンテンツに基づいてリッチメニュー画像を生成（未来の実装）
 * 注意: この関数を完全に実装するには canvas ライブラリが必要です
 */
export const generateDynamicRichMenuImage = async (
  _content: RichMenuContent = DEFAULT_CONTENT,
): Promise<Buffer> => {
  try {
    logger.info("動的リッチメニュー画像の生成を試行します");

    // TODO: canvas ライブラリを使用した実装
    // const canvas = createCanvas(2500, 1686);
    // const ctx = canvas.getContext('2d');
    //
    // // 背景を描画
    // ctx.fillStyle = content.theme?.backgroundColor || DEFAULT_THEME.backgroundColor;
    // ctx.fillRect(0, 0, 2500, 1686);
    //
    // // ボタンとテキストを描画
    // drawButtons(ctx, content.buttons, content.theme);
    //
    // return canvas.toBuffer('image/png');

    // 現在は既存画像を返す
    logger.warn("動的画像生成はまだ実装されていません。既存画像を使用します。");
    return loadExistingRichMenuImage();
  } catch (error) {
    logger.error("動的リッチメニュー画像の生成に失敗しました", error);
    return generateTransparentImage();
  }
};

/**
 * テーマ別のリッチメニュー画像を生成
 */
export const generateThemedRichMenuImage = (
  themeName = "default",
  customContent?: Partial<RichMenuContent>,
): Buffer => {
  try {
    const theme = Object.prototype.hasOwnProperty.call(PREDEFINED_THEMES, themeName) 
      ? PREDEFINED_THEMES[themeName] 
      : DEFAULT_THEME;
    const content: RichMenuContent = {
      ...DEFAULT_CONTENT,
      ...customContent,
      theme,
    };

    logger.info(`テーマ「${themeName}」でリッチメニュー画像を生成します`);
    return generateRichMenuImage(content);
  } catch (error) {
    logger.error(
      `テーマ「${themeName}」でのリッチメニュー画像生成に失敗しました`,
      error,
    );
    return generateTransparentImage();
  }
};

/**
 * リッチメニュー画像を一時ファイルとして保存（デバッグ用）
 */
export const saveRichMenuImageToTemp = (
  imageBuffer: Buffer,
  filename = `richmenu-${Date.now()}.png`,
): string => {
  try {
    const tempDir = path.resolve(process.cwd(), "temp");

    // tempディレクトリが存在しない場合は作成
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, imageBuffer);

    logger.info(`リッチメニュー画像を保存しました: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error("リッチメニュー画像の保存に失敗しました", error);
    throw error;
  }
};
