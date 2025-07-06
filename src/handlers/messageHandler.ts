import type { TextEventMessage } from "@line/bot-sdk";
import type { User } from "@prisma/client";
import {
  createChangeMenuTemplate,
  createCheckMenuTemplate,
  createMainMenuTemplate,
  createRegisterMenuTemplate,
  sendCalendarMessage,
  sendTemplateMessage,
  sendTextMessage,
} from "../services/line";
import {
  handleRegisterCommand,
  handleCheckCommand,
  handleCalendarCommand,
  handleHelpCommand,
} from "./commands";
import { COMMAND_PREFIX, MESSAGES } from "../constants";

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
    case "予定登録":
      await handleRegisterMenu(user);
      break;
    case "予定変更":
      await handleChangeMenu(user);
      break;
    case "予定確認":
      await handleCheckMenu(user);
      break;
    case "今後の予定":
      await handleFutureMenu(user);
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
