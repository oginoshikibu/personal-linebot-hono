import type { TextEventMessage, WebhookEvent } from "@line/bot-sdk";
import type { User } from "@prisma/client";
import { MealType } from "@prisma/client";
import { COMMAND_PREFIX, MESSAGES } from "../../../constants";
import { logger } from "../../../lib/logger";
import { formatDate } from "../../../utils/date";
import { formatDateText } from "../../../utils/formatter";
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
import { getMealPlan } from "../../meal/services/meal";
import { getAllUsers, getUserByLineId } from "../../meal/services/user";
import { prepareMealPlanData } from "../../notification/templates/mealPlan";
import { replyFlexMessage, replyTextMessage } from "../client";
import { createMealPlanFlexMessage } from "../messages/flex";

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
    const user = await getUserByLineId(userId);
    logger.debug(`ユーザー情報取得: ${userId}`, {
      found: !!user,
      userName: user?.name,
    });

    // ユーザーが登録されていない場合
    if (!user) {
      logger.warn(`ユーザーがデータベースに登録されていません: ${userId}`);
      await replyTextMessage(
        event.replyToken,
        "申し訳ありませんが、システムに登録されていません。管理者に連絡してください。",
      );
      logger.info(`未登録ユーザーへの通知送信完了: ${userId}`);
      return;
    }

    // メッセージタイプに応じて処理
    switch (event.message.type) {
      case "text": {
        const textMessage = event.message;
        logger.info(`テキストメッセージ処理: ${userId}`, {
          text:
            textMessage.text.substring(0, 20) +
            (textMessage.text.length > 20 ? "..." : ""),
        });
        await handleTextMessage(textMessage, user, event.replyToken);
        logger.info(`テキストメッセージ処理完了: ${userId}`);
        break;
      }
      default:
        logger.info(`未対応のメッセージタイプ: ${event.message.type}`, {
          userId,
        });
        await replyTextMessage(
          event.replyToken,
          "テキストメッセージのみ対応しています。",
        );
        logger.info(`未対応メッセージタイプの通知送信完了: ${userId}`);
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
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
export const handleTextMessage = async (
  message: TextEventMessage,
  user: User,
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
          await handleRegisterCommand(args, user, replyToken);
          break;
        case "check":
        case "確認":
          await handleCheckCommand(args, user, replyToken);
          break;
        case "calendar":
        case "カレンダー":
          await handleCalendarCommand([], user, replyToken);
          break;
        case "help":
        case "ヘルプ":
          await handleHelpCommand([], user, replyToken);
          break;
        default:
          await replyTextMessage(
            replyToken,
            `未知のコマンド: ${action}\n使い方を確認するには「${COMMAND_PREFIX} help」と入力してください。`,
          );
      }
      return;
    } catch (error) {
      logger.error("コマンド処理エラー:", error);
      await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
      return;
    }
  }

  // リッチメニューのテキストに対応
  try {
    switch (text) {
      case "今日の予定":
        await handleTodayMenu(user, replyToken);
        break;
      case "明日の予定":
        await handleTomorrowMenu(user, replyToken);
        break;
      case "今週の予定":
        await handleThisWeekMenu(user, replyToken);
        break;
      case "今後の予定":
        await handleFutureMenu(user, replyToken);
        break;
      default:
        await replyTextMessage(
          replyToken,
          "リッチメニューから選択するか、「!help」と入力してコマンドを確認してください。",
        );
    }
  } catch (error) {
    logger.error("テキスト処理エラー:", error);
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 今日の予定メニューを処理
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleTodayMenu = async (
  _user: User,
  replyToken: string,
): Promise<void> => {
  try {
    // 今日の0時
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 昼食と夕食の予定を取得
    const [lunch, dinner, users] = await Promise.all([
      getMealPlan(today, MealType.LUNCH),
      getMealPlan(today, MealType.DINNER),
      getAllUsers(),
    ]);

    const dateText = formatDateText(today);
    const dateStr = formatDate(today);

    // Flexメッセージ用のデータを準備
    const lunchData = lunch
      ? prepareMealPlanData(lunch, users)
      : { participants: [], preparationType: "UNDECIDED" };

    const dinnerData = dinner
      ? prepareMealPlanData(dinner, users)
      : { participants: [], preparationType: "UNDECIDED" };

    // 編集ボタン付きのFlexメッセージを作成して送信
    const flexMessage = createMealPlanFlexMessage(
      `【${dateText}の食事予定】`,
      lunchData,
      dinnerData,
      dateStr, // 編集用の日付文字列を渡す
    );

    await replyFlexMessage(replyToken, flexMessage, `${dateText}の食事予定`);
  } catch (error) {
    logger.error("今日の予定表示エラー:", error);
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 明日の予定メニューを処理
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleTomorrowMenu = async (
  _user: User,
  replyToken: string,
): Promise<void> => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 昼食と夕食の予定を取得
    const [lunch, dinner, users] = await Promise.all([
      getMealPlan(tomorrow, MealType.LUNCH),
      getMealPlan(tomorrow, MealType.DINNER),
      getAllUsers(),
    ]);

    const dateText = formatDateText(tomorrow);
    const dateStr = formatDate(tomorrow);

    // Flexメッセージ用のデータを準備
    const lunchData = lunch
      ? prepareMealPlanData(lunch, users)
      : { participants: [], preparationType: "UNDECIDED" };

    const dinnerData = dinner
      ? prepareMealPlanData(dinner, users)
      : { participants: [], preparationType: "UNDECIDED" };

    // 編集ボタン付きのFlexメッセージを作成して送信
    const flexMessage = createMealPlanFlexMessage(
      `【${dateText}の食事予定】`,
      lunchData,
      dinnerData,
      dateStr, // 編集用の日付文字列を渡す
    );

    await replyFlexMessage(replyToken, flexMessage, `${dateText}の食事予定`);
  } catch (error) {
    logger.error("明日の予定表示エラー:", error);
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 今週の予定メニューを処理
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleThisWeekMenu = async (
  user: User,
  replyToken: string,
): Promise<void> => {
  try {
    // 今週の7日間カレンダーを表示
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 7日間カレンダーを送信（返信メッセージとして）
    await send7DayCalendarMessage(user.lineId, replyToken, today);
  } catch (error) {
    logger.error("今週の予定表示エラー:", error);
    // Flexメッセージが失敗した場合は、シンプルなテキストメッセージで対応
    try {
      await replyTextMessage(
        replyToken,
        "今週の予定機能で一時的な問題が発生しています。しばらく後にお試しください。\n\n代わりに「今日の予定」「明日の予定」「今後の予定」をお試しください。",
      );
    } catch (fallbackError) {
      logger.error("フォールバックメッセージ送信エラー:", fallbackError);
    }
  }
};

/**
 * 今後の予定メニューを処理
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleFutureMenu = async (
  _user: User,
  replyToken: string,
): Promise<void> => {
  try {
    // 月間カレンダーを表示
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 月間カレンダーを送信（返信メッセージとして）
    await sendCalendarMessage(_user.lineId, replyToken, today);
  } catch (error) {
    logger.error("今後の予定表示エラー:", error);
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};
