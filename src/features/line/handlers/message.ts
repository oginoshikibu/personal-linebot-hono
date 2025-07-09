import type { MessageEvent, TextEventMessage } from "@line/bot-sdk";
import type { User } from "@prisma/client";
import { MealType } from "@prisma/client";
import { COMMAND_PREFIX, MESSAGES } from "../../../constants";
import { formatDate } from "../../../utils/date";
import { formatDateText } from "../../../utils/formatter";
import { logger } from "../../../utils/logger";
import {
  handleCalendarCommand,
  handleCheckCommand,
  handleHelpCommand,
  handleRegisterCommand,
} from "../../meal/commands";
import { send7DayCalendarMessage } from "../../meal/services/calendar";
import { getMealPlan } from "../../meal/services/meal";
import { getAllUsers, getUserByLineId } from "../../meal/services/user";
import { prepareMealPlanData } from "../../notification/templates/mealPlan";
import {
  replyFlexMessage,
  replyTemplateMessage,
  replyTextMessage,
  sendTemplateMessage,
} from "../client";
import { createMealPlanFlexMessage } from "../messages/flex";
import {
  createChangeMenuTemplate,
  createCheckMenuTemplate,
  createEditOptionsTemplate,
  createMainMenuTemplate,
  createRegisterMenuTemplate,
} from "../messages/templates";

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
    await handleCommand(text.substring(1), user, replyToken);
    return;
  }

  // メニュー選択に基づく処理
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
    case "予定登録":
      await handleRegisterMenu(user, replyToken);
      break;
    case "予定変更":
      await handleChangeMenu(user, replyToken);
      break;
    case "予定確認":
      await handleCheckMenu(user, replyToken);
      break;
    case "ヘルプ":
      await handleHelpCommand([], user, replyToken);
      break;
    default:
      // デフォルトのメニューを表示
      await sendDefaultMenu(user.lineId, replyToken);
      break;
  }
};

/**
 * コマンドを処理
 * @param command コマンド
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleCommand = async (
  command: string,
  user: User,
  replyToken: string,
): Promise<void> => {
  const parts = command.split(" ");
  const mainCommand = parts[0].toLowerCase();

  switch (mainCommand) {
    case "help":
      await handleHelpCommand(parts.slice(1), user, replyToken);
      break;
    case "register":
      await handleRegisterCommand(parts.slice(1), user, replyToken);
      break;
    case "check":
      await handleCheckCommand(parts.slice(1), user, replyToken);
      break;
    case "cal":
      await handleCalendarCommand(parts.slice(1), user, replyToken);
      break;
    default:
      await replyTextMessage(
        replyToken,
        `未知のコマンド: ${mainCommand}\n${MESSAGES.HELP.COMMAND_LIST}`,
      );
      break;
  }
};

/**
 * 今日の予定メニューを処理
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleTodayMenu = async (
  user: User,
  replyToken: string,
): Promise<void> => {
  const today = new Date();
  // 今日の0時
  today.setHours(0, 0, 0, 0);

  try {
    // 昼食と夕食の予定を取得
    const [lunch, dinner, users] = await Promise.all([
      getMealPlan(today, MealType.LUNCH),
      getMealPlan(today, MealType.DINNER),
      getAllUsers(),
    ]);

    const dateText = formatDateText(today);

    // 予定がない場合のメッセージ
    if (!lunch && !dinner) {
      await replyTextMessage(
        replyToken,
        `${dateText}の食事予定はまだ登録されていません。`,
      );
      return;
    }

    // Flexメッセージ用のデータを準備
    const lunchData = lunch
      ? prepareMealPlanData(lunch, users)
      : { participants: [], preparationType: "UNDECIDED" };

    const dinnerData = dinner
      ? prepareMealPlanData(dinner, users)
      : { participants: [], preparationType: "UNDECIDED" };

    // Flexメッセージを作成して送信
    const flexMessage = createMealPlanFlexMessage(
      `【${dateText}の食事予定】`,
      lunchData,
      dinnerData,
    );

    await replyFlexMessage(replyToken, flexMessage, `${dateText}の食事予定`);

    // 編集オプションを表示（プッシュメッセージとして送信）
    const dateStr = formatDate(today);
    const editTemplate = createEditOptionsTemplate(dateText, dateStr);
    await sendTemplateMessage(user.lineId, editTemplate, "予定編集");
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
  user: User,
  replyToken: string,
): Promise<void> => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  try {
    // 昼食と夕食の予定を取得
    const [lunch, dinner, users] = await Promise.all([
      getMealPlan(tomorrow, MealType.LUNCH),
      getMealPlan(tomorrow, MealType.DINNER),
      getAllUsers(),
    ]);

    const dateText = formatDateText(tomorrow);

    // 予定がない場合のメッセージ
    if (!lunch && !dinner) {
      await replyTextMessage(
        replyToken,
        `${dateText}の食事予定はまだ登録されていません。`,
      );
      return;
    }

    // Flexメッセージ用のデータを準備
    const lunchData = lunch
      ? prepareMealPlanData(lunch, users)
      : { participants: [], preparationType: "UNDECIDED" };

    const dinnerData = dinner
      ? prepareMealPlanData(dinner, users)
      : { participants: [], preparationType: "UNDECIDED" };

    // Flexメッセージを作成して送信
    const flexMessage = createMealPlanFlexMessage(
      `【${dateText}の食事予定】`,
      lunchData,
      dinnerData,
    );

    await replyFlexMessage(replyToken, flexMessage, `${dateText}の食事予定`);

    // 編集オプションを表示（プッシュメッセージとして送信）
    const dateStr = formatDate(tomorrow);
    const editTemplate = createEditOptionsTemplate(dateText, dateStr);
    await sendTemplateMessage(user.lineId, editTemplate, "予定編集");
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
    // 今日の日付を準備
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 最初の日付の予定を取得して表示
    const [lunch, dinner, users] = await Promise.all([
      getMealPlan(today, MealType.LUNCH),
      getMealPlan(today, MealType.DINNER),
      getAllUsers(),
    ]);

    const dateText = formatDateText(today);

    // Flexメッセージ用のデータを準備
    const lunchData = lunch
      ? prepareMealPlanData(lunch, users)
      : { participants: [], preparationType: "UNDECIDED" };

    const dinnerData = dinner
      ? prepareMealPlanData(dinner, users)
      : { participants: [], preparationType: "UNDECIDED" };

    // Flexメッセージを作成して送信
    const flexMessage = createMealPlanFlexMessage(
      `【${dateText}の食事予定】`,
      lunchData,
      dinnerData,
    );

    // 先にFlexメッセージとして今日の予定を送信
    await replyFlexMessage(replyToken, flexMessage, `${dateText}の食事予定`);

    // その後、7日間カレンダーをプッシュメッセージとして表示
    await send7DayCalendarMessage(user.lineId);
  } catch (error) {
    logger.error("今週の予定表示エラー:", error);
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 今後の予定メニューを処理
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleFutureMenu = async (
  user: User,
  replyToken: string,
): Promise<void> => {
  try {
    // 今日の日付を準備
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 最初の日付の予定を取得して表示
    const [lunch, dinner, users] = await Promise.all([
      getMealPlan(today, MealType.LUNCH),
      getMealPlan(today, MealType.DINNER),
      getAllUsers(),
    ]);

    const dateText = formatDateText(today);

    // Flexメッセージ用のデータを準備
    const lunchData = lunch
      ? prepareMealPlanData(lunch, users)
      : { participants: [], preparationType: "UNDECIDED" };

    const dinnerData = dinner
      ? prepareMealPlanData(dinner, users)
      : { participants: [], preparationType: "UNDECIDED" };

    // Flexメッセージを作成して送信
    const flexMessage = createMealPlanFlexMessage(
      `【${dateText}の食事予定】`,
      lunchData,
      dinnerData,
    );

    // 先にFlexメッセージとして今日の予定を送信
    await replyFlexMessage(replyToken, flexMessage, `${dateText}の食事予定`);

    // その後、7日間カレンダーをプッシュメッセージとして表示
    await send7DayCalendarMessage(user.lineId);
  } catch (error) {
    logger.error("今後の予定表示エラー:", error);
    await replyTextMessage(replyToken, MESSAGES.ERRORS.PROCESSING_ERROR);
  }
};

/**
 * 予定登録メニューを処理
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleRegisterMenu = async (
  _user: User,
  replyToken: string,
): Promise<void> => {
  const template = createRegisterMenuTemplate();
  await replyTemplateMessage(replyToken, template, "予定登録");
};

/**
 * 予定変更メニューを処理
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleChangeMenu = async (
  _user: User,
  replyToken: string,
): Promise<void> => {
  const template = createChangeMenuTemplate();
  await replyTemplateMessage(replyToken, template, "予定変更");
};

/**
 * 予定確認メニューを処理
 * @param user ユーザー
 * @param replyToken 応答トークン
 */
const handleCheckMenu = async (
  _user: User,
  replyToken: string,
): Promise<void> => {
  const template = createCheckMenuTemplate();
  await replyTemplateMessage(replyToken, template, "予定確認");
};

/**
 * デフォルトのメニューを送信
 * @param lineId LINE ID
 * @param replyToken 応答トークン
 */
const sendDefaultMenu = async (
  _lineId: string,
  replyToken: string,
): Promise<void> => {
  const template = createMainMenuTemplate();
  await replyTemplateMessage(replyToken, template, "メインメニュー");
};
