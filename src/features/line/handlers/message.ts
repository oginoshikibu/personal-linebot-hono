import type { MessageEvent, TextEventMessage } from "@line/bot-sdk";
import type { User } from "@prisma/client";
import { COMMAND_PREFIX, MESSAGES } from "../../../constants";
import { logger } from "../../../utils/logger";
import {
  handleCalendarCommand,
  handleCheckCommand,
  handleHelpCommand,
  handleRegisterCommand,
} from "../../meal/commands";
import { sendCalendarMessage } from "../../meal/services/calendar";
import { getMealPlans } from "../../meal/services/meal";
import { getUserByLineId } from "../../meal/services/user";
import { sendTemplateMessage, sendTextMessage } from "../client";
import {
  createChangeMenuTemplate,
  createCheckMenuTemplate,
  createEditOptionsTemplate,
  createMainMenuTemplate,
  createRegisterMenuTemplate,
} from "../messages/templates";
import { formatDateText, formatMealPlans } from "../../../utils/formatter";
import { formatDate } from "../../../utils/date";

/**
 * メッセージイベントを処理
 * @param event メッセージイベント
 */
export const handleMessageEvent = async (
  event: MessageEvent,
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
      await sendTextMessage(
        userId,
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
        await handleTextMessage(textMessage, user);
        logger.info(`テキストメッセージ処理完了: ${userId}`);
        break;
      }
      default:
        logger.info(`未対応のメッセージタイプ: ${event.message.type}`, {
          userId,
        });
        await sendTextMessage(userId, "テキストメッセージのみ対応しています。");
        logger.info(`未対応メッセージタイプの通知送信完了: ${userId}`);
        break;
    }
  } catch (error) {
    logger.error(`メッセージイベント処理エラー: ${userId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    try {
      await sendTextMessage(
        userId,
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
 */
export const handleTextMessage = async (
  message: TextEventMessage,
  user: User,
): Promise<void> => {
  const text = message.text.trim();

  // コマンドかどうかを判定
  if (text.startsWith(COMMAND_PREFIX)) {
    await handleCommand(text.substring(1), user);
    return;
  }

  // メニュー選択に基づく処理
  switch (text) {
    case "今日の予定":
      await handleTodayMenu(user);
      break;
    case "明日の予定":
      await handleTomorrowMenu(user);
      break;
    case "今週の予定":
      await handleThisWeekMenu(user);
      break;
    case "今後の予定":
      await handleFutureMenu(user);
      break;
    case "予定登録":
      await handleRegisterMenu(user);
      break;
    case "予定変更":
      await handleChangeMenu(user);
      break;
    case "予定確認":
      await handleCheckMenu(user);
      break;
    case "ヘルプ":
      await handleHelpCommand([], user);
      break;
    default:
      // デフォルトのメニューを表示
      await sendDefaultMenu(user.lineId);
      break;
  }
};

/**
 * コマンドを処理
 * @param command コマンド
 * @param user ユーザー
 */
const handleCommand = async (command: string, user: User): Promise<void> => {
  const parts = command.split(" ");
  const mainCommand = parts[0].toLowerCase();

  switch (mainCommand) {
    case "help":
      await handleHelpCommand(parts.slice(1), user);
      break;
    case "register":
      await handleRegisterCommand(parts.slice(1), user);
      break;
    case "check":
      await handleCheckCommand(parts.slice(1), user);
      break;
    case "cal":
      await handleCalendarCommand(parts.slice(1), user);
      break;
    default:
      await sendTextMessage(
        user.lineId,
        `未知のコマンド: ${mainCommand}\n${MESSAGES.HELP.COMMAND_LIST}`,
      );
      break;
  }
};

/**
 * 今日の予定メニューを処理
 * @param user ユーザー
 */
const handleTodayMenu = async (user: User): Promise<void> => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 今日の0時
  today.setHours(0, 0, 0, 0);
  // 明日の0時
  tomorrow.setHours(0, 0, 0, 0);
  
  const mealPlans = await getMealPlans(today, tomorrow);
  const dateText = formatDateText(today);
  
  const message = mealPlans.length > 0 
    ? `${dateText}の予定:\n${formatMealPlans(mealPlans)}`
    : `${dateText}の予定はまだ登録されていません。`;
  
  await sendTextMessage(user.lineId, message);
  
  // 編集オプションを表示
  const dateStr = formatDate(today);
  const editTemplate = createEditOptionsTemplate(dateText, dateStr);
  await sendTemplateMessage(user.lineId, editTemplate, "予定編集");
};

/**
 * 明日の予定メニューを処理
 * @param user ユーザー
 */
const handleTomorrowMenu = async (user: User): Promise<void> => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  
  const mealPlans = await getMealPlans(tomorrow, dayAfterTomorrow);
  const dateText = formatDateText(tomorrow);
  
  const message = mealPlans.length > 0 
    ? `${dateText}の予定:\n${formatMealPlans(mealPlans)}`
    : `${dateText}の予定はまだ登録されていません。`;
  
  await sendTextMessage(user.lineId, message);
  
  // 編集オプションを表示
  const dateStr = formatDate(tomorrow);
  const editTemplate = createEditOptionsTemplate(dateText, dateStr);
  await sendTemplateMessage(user.lineId, editTemplate, "予定編集");
};

/**
 * 今週の予定メニューを処理
 * @param user ユーザー
 */
const handleThisWeekMenu = async (user: User): Promise<void> => {
  // 週間カレンダーを表示
  await sendCalendarMessage(user.lineId);
};

/**
 * 予定登録メニューを処理
 * @param user ユーザー
 */
const handleRegisterMenu = async (user: User): Promise<void> => {
  const buttonTemplate = createRegisterMenuTemplate();
  await sendTemplateMessage(user.lineId, buttonTemplate, "食事予定登録");
};

/**
 * 予定変更メニューを処理
 * @param user ユーザー
 */
const handleChangeMenu = async (user: User): Promise<void> => {
  const buttonTemplate = createChangeMenuTemplate();
  await sendTemplateMessage(user.lineId, buttonTemplate, "食事予定変更");
};

/**
 * 予定確認メニューを処理
 * @param user ユーザー
 */
const handleCheckMenu = async (user: User): Promise<void> => {
  const buttonTemplate = createCheckMenuTemplate();
  await sendTemplateMessage(user.lineId, buttonTemplate, "食事予定確認");
};

/**
 * 今後の予定メニューを処理
 * @param user ユーザー
 */
const handleFutureMenu = async (user: User): Promise<void> => {
  // カレンダーを表示
  await sendCalendarMessage(user.lineId);

  // 説明メッセージを送信
  await sendTextMessage(user.lineId, MESSAGES.HELP.CALENDAR_EXPLANATION);
};

/**
 * デフォルトメニューを送信
 * @param lineId LINE ID
 */
const sendDefaultMenu = async (lineId: string): Promise<void> => {
  const buttonTemplate = createMainMenuTemplate();
  await sendTemplateMessage(lineId, buttonTemplate, "メインメニュー");
};
