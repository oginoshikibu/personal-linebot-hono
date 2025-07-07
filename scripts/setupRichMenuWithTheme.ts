import { setupRichMenu } from "../src/services/richmenu";
import { 
  generateThemedRichMenuImage, 
  saveRichMenuImageToTemp, 
  PREDEFINED_THEMES,
  type RichMenuContent 
} from "../src/utils/richMenuImage";
import { logger } from "../src/utils/logger";

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
    if (!PREDEFINED_THEMES[options.theme]) {
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
      if (!tempFilePath && options.save) {
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