import { Client } from "@line/bot-sdk";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../src/utils/logger";
import { config } from "../src/config";

// LINE Client初期化（条件付き）
let lineClient: Client | null = null;

const getLineClient = (): Client => {
  if (!lineClient) {
    if (!config.line.channelSecret || !config.line.channelAccessToken) {
      throw new Error("LINE APIの設定が不足しています。環境変数を確認してください。");
    }
    lineClient = new Client({
      channelSecret: config.line.channelSecret,
      channelAccessToken: config.line.channelAccessToken,
    });
  }
  return lineClient;
};

/**
 * リッチメニューのテーマオプション
 */
interface RichMenuTheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
}

/**
 * リッチメニューのコンテンツオプション
 */
interface RichMenuContent {
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
const DEFAULT_THEME: RichMenuTheme = {
  backgroundColor: "#FFFFFF",
  textColor: "#333333",
  borderColor: "#CCCCCC",
  accentColor: "#00C851",
};

/**
 * デフォルトのリッチメニューコンテンツ
 */
const DEFAULT_CONTENT: RichMenuContent = {
  title: "食事予定管理",
  buttons: [
    { text: "今日の予定", subtext: "今日の食事予定" },
    { text: "明日の予定", subtext: "明日の食事予定" },
    { text: "今週の予定", subtext: "週間カレンダー" },
    { text: "今後の予定", subtext: "カレンダー表示" },
    { text: "ヘルプ", subtext: "使い方を確認" },
  ],
  theme: DEFAULT_THEME,
};

/**
 * 事前定義されたテーマ
 */
const PREDEFINED_THEMES: Record<string, RichMenuTheme> = {
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
 * デフォルトのリッチメニュープロパティ
 */
const getDefaultRichMenuProperties = () => {
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
const generateRichMenuImage = (content?: RichMenuContent): Buffer => {
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
 * テーマ別のリッチメニュー画像を生成
 */
const generateThemedRichMenuImage = (
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
const saveRichMenuImageToTemp = (
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

/**
 * リッチメニュー一覧を取得
 */
const getRichMenuList = async (): Promise<string[]> => {
  try {
    const client = getLineClient();
    const richMenus = await client.getRichMenuList();
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
    const client = getLineClient();
    await client.deleteRichMenu(richMenuId);
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
    const client = getLineClient();
    const response = await client.createRichMenu(richMenuProperties);
    const richMenuId = typeof response === 'string' ? response : (response as any).richMenuId;
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
  contentType: string = 'image/png'
): Promise<void> => {
  try {
    const client = getLineClient();
    await client.setRichMenuImage(richMenuId, imageBuffer, contentType);
    logger.info(`リッチメニュー画像をアップロードしました: ${richMenuId}`);
  } catch (error) {
    logger.error(`リッチメニュー画像アップロードエラー: ${richMenuId}`, error);
    throw new Error(`リッチメニュー画像のアップロードに失敗しました: ${richMenuId}`);
  }
};

/**
 * デフォルトリッチメニューを設定
 */
const setDefaultRichMenu = async (richMenuId: string): Promise<void> => {
  try {
    const client = getLineClient();
    await client.setDefaultRichMenu(richMenuId);
    logger.info(`デフォルトリッチメニューを設定しました: ${richMenuId}`);
  } catch (error) {
    logger.error(`デフォルトリッチメニュー設定エラー: ${richMenuId}`, error);
    throw new Error(`デフォルトリッチメニューの設定に失敗しました: ${richMenuId}`);
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
 * コマンドライン引数を解析する
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    theme: "default",
    save: false,
    mock: false,
    content: undefined as RichMenuContent | undefined,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--theme":
      case "-t":
        options.theme = args[i + 1] || "default";
        i++; // 次の引数をスキップ
        break;
      case "--save":
      case "-s":
        options.save = true;
        break;
      case "--mock":
      case "-m":
        options.mock = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

/**
 * ヘルプメッセージを表示
 */
function showHelp() {
  console.log(`
リッチメニューセットアップスクリプト（テーマ対応版）

使用方法:
  npm run setup-richmenu:theme [オプション]

オプション:
  -t, --theme <theme>    使用するテーマ (default: default)
  -s, --save            画像を一時ファイルとして保存
  -m, --mock            モックモードで実行
  -h, --help            このヘルプを表示

利用可能なテーマ:
  ${Object.keys(PREDEFINED_THEMES).map(theme => `- ${theme}`).join('\n  ')}

例:
  npm run setup-richmenu:theme -- --theme dark --save
  npm run setup-richmenu:theme -- --theme blue --mock
  npm run setup-richmenu:theme -- --help
`);
}

/**
 * 季節やイベントに基づいたカスタムコンテンツを生成
 */
function getSeasonalContent(): Partial<RichMenuContent> {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // 季節に基づいたコンテンツ
  if (month === 12 && day >= 20 || month === 1 || month === 2) {
    // 冬
    return {
      title: "冬の食事予定管理",
      buttons: [
        { text: "温かい料理", subtext: "鍋・スープなど" },
        { text: "予定変更", subtext: "既存の予定を変更" },
        { text: "予定確認", subtext: "今後の予定を確認" },
        { text: "今後の予定", subtext: "カレンダー表示" },
        { text: "冬のレシピ", subtext: "季節の料理提案" },
      ],
    };
  } else if (month >= 3 && month <= 5) {
    // 春
    return {
      title: "春の食事予定管理",
      buttons: [
        { text: "春野菜料理", subtext: "旬の食材を使用" },
        { text: "予定変更", subtext: "既存の予定を変更" },
        { text: "予定確認", subtext: "今後の予定を確認" },
        { text: "今後の予定", subtext: "カレンダー表示" },
        { text: "お花見弁当", subtext: "外食プラン" },
      ],
    };
  } else if (month >= 6 && month <= 8) {
    // 夏
    return {
      title: "夏の食事予定管理",
      buttons: [
        { text: "さっぱり料理", subtext: "冷やし中華・そうめん" },
        { text: "予定変更", subtext: "既存の予定を変更" },
        { text: "予定確認", subtext: "今後の予定を確認" },
        { text: "今後の予定", subtext: "カレンダー表示" },
        { text: "夏祭りグルメ", subtext: "外食プラン" },
      ],
    };
  } else {
    // 秋
    return {
      title: "秋の食事予定管理",
      buttons: [
        { text: "秋の味覚", subtext: "きのこ・栗など" },
        { text: "予定変更", subtext: "既存の予定を変更" },
        { text: "予定確認", subtext: "今後の予定を確認" },
        { text: "今後の予定", subtext: "カレンダー表示" },
        { text: "秋のレシピ", subtext: "季節の料理提案" },
      ],
    };
  }
}

/**
 * テーマ付きリッチメニューをセットアップするスクリプト
 */
async function main() {
  try {
    const options = parseArguments();

    logger.info("テーマ付きリッチメニューのセットアップを開始します", {
      theme: options.theme,
      save: options.save,
      mock: options.mock,
    });

    // テーマの検証
    if (!Object.prototype.hasOwnProperty.call(PREDEFINED_THEMES, options.theme)) {
      logger.error(`無効なテーマです: ${options.theme}`);
      logger.info(`利用可能なテーマ: ${Object.keys(PREDEFINED_THEMES).join(", ")}`);
      process.exit(1);
    }

    // 季節に基づいたコンテンツを取得
    const seasonalContent = getSeasonalContent();
    logger.info("季節に基づいたコンテンツを適用しました", { 
      title: seasonalContent.title 
    });

    // テーマに基づいてリッチメニュー画像を生成
    const imageBuffer = generateThemedRichMenuImage(options.theme, seasonalContent);
    logger.info(`テーマ「${options.theme}」でリッチメニュー画像を生成しました`);

    // 一時ファイルとして保存（オプション）
    let tempFilePath: string | undefined;
    if (options.save) {
      tempFilePath = saveRichMenuImageToTemp(
        imageBuffer, 
        `richmenu-${options.theme}-${Date.now()}.png`
      );
      logger.info(`画像を一時ファイルとして保存しました: ${tempFilePath}`);
    }

    let richMenuId: string;

    if (options.mock) {
      // モックモードの場合
      logger.info("モックモードでセットアップを実行します");
      richMenuId = `mock-richmenu-${options.theme}-${Date.now()}`;
      
      // モック版では画像の保存のみ行う
      if (!tempFilePath) {
        tempFilePath = saveRichMenuImageToTemp(
          imageBuffer, 
          `richmenu-mock-${options.theme}-${Date.now()}.png`
        );
      }
      
      logger.info(`モック: リッチメニューID = ${richMenuId}`);
    } else {
      // 実際のLINE APIを使用
      richMenuId = await setupRichMenu(imageBuffer);
    }

    logger.info(`リッチメニューのセットアップが完了しました`, {
      richMenuId,
      theme: options.theme,
      tempFilePath,
      mock: options.mock,
    });

    console.log(`
✅ セットアップ完了

リッチメニューID: ${richMenuId}
使用テーマ: ${options.theme}
季節コンテンツ: ${seasonalContent.title}
${tempFilePath ? `保存先: ${tempFilePath}` : ""}
${options.mock ? "※ モックモードで実行されました" : ""}
`);

    return richMenuId;
  } catch (error) {
    logger.error("リッチメニューのセットアップに失敗しました", error);
    console.error(`❌ エラー: ${error instanceof Error ? error.message : "不明なエラー"}`);
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