import type { TextEventMessage, WebhookEvent } from "@line/bot-sdk";
import { COMMAND_PREFIX, MESSAGES } from "../../../constants";
import { DIContainer } from "../../../di/container";
import { MealType, PreparationRole } from "../../../domain/entities/MealPlan";
import { logger } from "../../../lib/logger";
import {
  handleCalendarCommand,
  handleCheckCommand,
  handleHelpCommand,
  handleRegisterCommand,
} from "../../meal/commands";
import {
  send7DayCalendarMessage,
  sendCalendarMessage,
} from "../../meal/services/calendar";
import { replyFlexMessage, replyTextMessage } from "../client";
import { createMealPlanFlexMessage } from "../messages/flex";

// Alice/Bobの固定LINE ID（環境変数から取得）
const ALICE_LINE_ID = process.env.ALICE_LINE_ID || "alice_line_id";
const BOB_LINE_ID = process.env.BOB_LINE_ID || "bob_line_id";

/**
 * メッセージイベントを処理
 * @param event メッセージイベント
 */
export const handleMessageEvent = async (
  event: WebhookEvent & { type: "message" },
): Promise<void> => {
  // ユーザー情報を取得
  const userId = event.source.userId ?? "";
  if (!userId) {
    logger.error("ユーザーIDが取得できませんでした");
    return;
  }

  logger.info(`メッセージイベント処理開始: ${userId}`, {
    messageType: event.message.type,
  });

  try {
    // Alice/Bobの固定ユーザーのみ処理
    if (userId !== ALICE_LINE_ID && userId !== BOB_LINE_ID) {
      logger.warn(`未登録ユーザーからのメッセージ: ${userId}`);
      await replyTextMessage(
        event.replyToken,
        "申し訳ありませんが、システムに登録されていません。管理者に連絡してください。",
      );
      return;
    }

    const userName = userId === ALICE_LINE_ID ? "Alice" : "Bob";
    logger.debug(`ユーザー情報: ${userName} (${userId})`);

    // メッセージタイプに応じて処理
    switch (event.message.type) {
      case "text": {
        const textMessage = event.message;
        logger.info(`テキストメッセージ処理: ${userName}`, {
          text:
            textMessage.text.substring(0, 20) +
            (textMessage.text.length > 20 ? "..." : ""),
        });
        await handleTextMessage(textMessage, userName, event.replyToken);
        logger.info(`テキストメッセージ処理完了: ${userName}`);
        break;
      }
      default:
        logger.info(`未対応のメッセージタイプ: ${event.message.type}`, {
          userId: userName,
        });
        await replyTextMessage(
          event.replyToken,
          "テキストメッセージのみ対応しています。",
        );
        logger.info(`未対応メッセージタイプの通知送信完了: ${userName}`);
        break;
    }
  } catch (error) {
    logger.error(`メッセージイベント処理エラー: ${userId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    try {
      await replyTextMessage(
        event.replyToken,
        "メッセージの処理中にエラーが発生しました。もう一度お試しください。",
      );
      logger.info(`エラー通知送信完了: ${userId}`);
    } catch (sendError) {
      logger.error(`エラーメッセージの送信に失敗しました: ${userId}`, {
        error:
          sendError instanceof Error ? sendError.message : String(sendError),
      });
    }
  }
};

/**
 * テキストメッセージを処理
 * @param message テキストメッセージイベント
 * @param userName ユーザー名（AliceまたはBob）
 * @param replyToken 応答トークン
 */
export const handleTextMessage = async (
  message: TextEventMessage,
  userName: string,
  replyToken: string,
): Promise<void> => {
  const text = message.text.trim();

  // コマンドかどうかを判定
  if (text.startsWith(COMMAND_PREFIX)) {
    const command = text.slice(COMMAND_PREFIX.length).trim();
    const [action, ...args] = command.split(/\s+/);

    try {
      switch (action.toLowerCase()) {
        case "register":
        case "登録":
          await handleRegisterCommand(args, userName, replyToken);
          break;
        case "check":
        case "確認":
          await handleCheckCommand(args, userName, replyToken);
          break;
        case "calendar":
        case "カレンダー":
          await handleCalendarCommand([], userName, replyToken);
          break;
        case "help":
        case "ヘルプ":
          await handleHelpCommand([], userName, replyToken);
          break;
        default:
          await replyTextMessage(
            replyToken,
            `未知のコマンド: ${action}\n使い方を確認するには「${COMMAND_PREFIX} help」と入力してください。`,
          );
      }
      return;
    } catch (error) {
      logger.error("コマンド処理エラー:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        command: action,
        args,
      });
      await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
      return;
    }
  }

  // リッチメニューのテキストに対応
  try {
    switch (text) {
      case "今日の予定":
        await handleTodayMenu(userName, replyToken);
        break;
      case "明日の予定":
        await handleTomorrowMenu(userName, replyToken);
        break;
      case "今週の予定":
        await handleThisWeekMenu(userName, replyToken);
        break;
      case "今後の予定":
        await handleFutureMenu(userName, replyToken);
        break;
      default:
        await replyTextMessage(
          replyToken,
          "リッチメニューから選択するか、「!help」と入力してコマンドを確認してください。",
        );
    }
  } catch (error) {
    logger.error("テキスト処理エラー:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      text: text.substring(0, 50),
    });
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 今日の予定メニューを処理
 * @param userName ユーザー名
 * @param replyToken 応答トークン
 */
const handleTodayMenu = async (
  _userName: string,
  replyToken: string,
): Promise<void> => {
  try {
    // DIコンテナからサービスを取得
    logger.info("DIコンテナからサービス取得開始");
    const container = DIContainer.getInstance();
    const mealService = container.mealPlanService;
    logger.info("MealPlanService取得完了");

    // 今日の食事予定を取得
    logger.info("MealPlanService取得完了、今日の食事予定を取得中");
    const { lunch, dinner } = await mealService.getOrCreateTodayMealPlans();
    logger.info("今日の食事予定取得完了", {
      lunchId: lunch.id,
      dinnerId: dinner.id,
      lunchType: lunch.mealType,
      dinnerType: dinner.mealType,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Flexメッセージを作成して送信
    logger.info("Flexメッセージ作成開始");
    const flexMessage = createMealPlanFlexMessage(today, lunch, dinner);
    logger.info("Flexメッセージ作成完了", {
      altText: flexMessage.altText,
      hasContents: !!flexMessage.contents,
    });

    await replyFlexMessage(
      replyToken,
      flexMessage.contents,
      flexMessage.altText,
    );
  } catch (error) {
    logger.error("今日の予定表示エラー:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name || typeof error,
    });
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 明日の予定メニューを処理
 * @param userName ユーザー名
 * @param replyToken 応答トークン
 */
const handleTomorrowMenu = async (
  _userName: string,
  replyToken: string,
): Promise<void> => {
  try {
    // DIコンテナからサービスを取得
    const container = DIContainer.getInstance();
    const mealService = container.mealPlanService;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 明日の食事予定を取得または作成
    const lunch = await mealService.getOrCreateMealPlan(
      tomorrow,
      MealType.LUNCH,
    );
    const dinner = await mealService.getOrCreateMealPlan(
      tomorrow,
      MealType.DINNER,
      PreparationRole.BOB,
    );

    // Flexメッセージを作成して送信
    const flexMessage = createMealPlanFlexMessage(tomorrow, lunch, dinner);

    await replyFlexMessage(
      replyToken,
      flexMessage.contents,
      flexMessage.altText,
    );
  } catch (error) {
    logger.error("明日の予定表示エラー:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name || typeof error,
    });
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 今週の予定メニューを処理
 * @param userName ユーザー名
 * @param replyToken 応答トークン
 */
const handleThisWeekMenu = async (
  userName: string,
  replyToken: string,
): Promise<void> => {
  try {
    // 今週の7日間カレンダーを表示
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 7日間カレンダーを送信（返信メッセージとして）
    const lineId = userName === "Alice" ? ALICE_LINE_ID : BOB_LINE_ID;
    await send7DayCalendarMessage(lineId, replyToken, today);
  } catch (error) {
    logger.error("今週の予定表示エラー:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name || typeof error,
    });
    // Flexメッセージが失敗した場合は、シンプルなテキストメッセージで対応
    try {
      await replyTextMessage(
        replyToken,
        "今週の予定機能で一時的な問題が発生しています。しばらく後にお試しください。\n\n代わりに「今日の予定」「明日の予定」「今後の予定」をお試しください。",
      );
    } catch (fallbackError) {
      logger.error("フォールバックメッセージ送信エラー:", {
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
        stack: fallbackError instanceof Error ? fallbackError.stack : undefined,
      });
    }
  }
};

/**
 * 今後の予定メニューを処理
 * @param userName ユーザー名
 * @param replyToken 応答トークン
 */
const handleFutureMenu = async (
  userName: string,
  replyToken: string,
): Promise<void> => {
  try {
    // 月間カレンダーを表示
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 月間カレンダーを送信（返信メッセージとして）
    const lineId = userName === "Alice" ? ALICE_LINE_ID : BOB_LINE_ID;
    await sendCalendarMessage(lineId, replyToken, today);
  } catch (error) {
    logger.error("今後の予定表示エラー:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name || typeof error,
    });
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};
