import type { TextEventMessage } from "@line/bot-sdk";
import {
  type MealParticipation,
  MealType,
  PreparationType,
  type User,
} from "@prisma/client";
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
  createOrUpdateMealPlan,
  getAllUsers,
  getMealPlan,
  setMealParticipation,
} from "../services/meal";
import { sendMealPlanChangeNotification } from "../services/notification";
import { addDays, formatDateJP } from "../utils/date";

// コマンドのプレフィックス
const COMMAND_PREFIX = "/";

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
    case "ヘルプ":
      await sendHelpMessage(user.lineId);
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
      await sendHelpMessage(user.lineId);
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
        `未知のコマンド: ${mainCommand}\n/help でコマンド一覧を表示します。`,
      );
      break;
  }
};

/**
 * 登録コマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
const handleRegisterCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  // 引数が足りない場合
  if (args.length < 3) {
    await sendTextMessage(
      user.lineId,
      "使用方法: /register <日付(today/tomorrow/YYYY-MM-DD)> <食事タイプ(lunch/dinner)> <参加(yes/no)> [準備方法(cook/individual/buy)]",
    );
    return;
  }

  // 日付を解析
  let date: Date;
  if (args[0].toLowerCase() === "today") {
    date = new Date();
  } else if (args[0].toLowerCase() === "tomorrow") {
    date = addDays(1);
  } else {
    try {
      date = new Date(args[0]);
      if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (_error) {
      await sendTextMessage(
        user.lineId,
        "無効な日付形式です。YYYY-MM-DD形式、または today/tomorrow を使用してください。",
      );
      return;
    }
  }

  // 食事タイプを解析
  let mealType: MealType;
  if (args[1].toLowerCase() === "lunch") {
    mealType = MealType.LUNCH;
  } else if (args[1].toLowerCase() === "dinner") {
    mealType = MealType.DINNER;
  } else {
    await sendTextMessage(
      user.lineId,
      "無効な食事タイプです。lunch または dinner を使用してください。",
    );
    return;
  }

  // 参加状態を解析
  const isAttending = args[2].toLowerCase() === "yes";

  // 準備方法を解析（オプション）
  let preparationType: PreparationType = PreparationType.INDIVIDUAL;
  if (args.length >= 4) {
    const prepType = args[3].toLowerCase();
    if (prepType === "cook") {
      preparationType = PreparationType.COOK_BY_SELF;
    } else if (prepType === "buy") {
      preparationType = PreparationType.BUY_TOGETHER;
    } else if (prepType !== "individual") {
      await sendTextMessage(
        user.lineId,
        "無効な準備方法です。cook, individual, または buy を使用してください。",
      );
      return;
    }
  }

  try {
    // 食事予定を作成または更新
    const mealPlan = await createOrUpdateMealPlan(
      date,
      mealType,
      preparationType,
      preparationType === PreparationType.COOK_BY_SELF ? user.id : undefined,
    );

    // 参加状態を設定
    await setMealParticipation(mealPlan.id, user.id, isAttending);

    // 確認メッセージを送信
    await sendTextMessage(
      user.lineId,
      `${formatDateJP(date)}の${mealType === MealType.LUNCH ? "昼食" : "夕食"}予定を登録しました。\n` +
        `参加: ${isAttending ? "はい" : "いいえ"}\n` +
        `準備: ${getPreparationTypeText(preparationType)}`,
    );

    // 他のユーザーに通知
    await sendMealPlanChangeNotification(user.id, mealPlan);
  } catch (error) {
    console.error("食事予定登録エラー:", error);
    await sendTextMessage(
      user.lineId,
      "予定の登録中にエラーが発生しました。もう一度お試しください。",
    );
  }
};

/**
 * 確認コマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
const handleCheckCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  // 日付を解析
  let date: Date;
  if (!args.length || args[0].toLowerCase() === "today") {
    date = new Date();
  } else if (args[0].toLowerCase() === "tomorrow") {
    date = addDays(1);
  } else {
    try {
      date = new Date(args[0]);
      if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (_error) {
      await sendTextMessage(
        user.lineId,
        "無効な日付形式です。YYYY-MM-DD形式、または today/tomorrow を使用してください。",
      );
      return;
    }
  }

  try {
    // 昼食の予定を取得
    const lunch = await getMealPlan(date, MealType.LUNCH);

    // 夕食の予定を取得
    const dinner = await getMealPlan(date, MealType.DINNER);

    // 全ユーザーを取得
    const users = await getAllUsers();

    // 予定がない場合のメッセージ
    if (!lunch && !dinner) {
      await sendTextMessage(
        user.lineId,
        `${formatDateJP(date)}の食事予定はまだ登録されていません。`,
      );
      return;
    }

    // 予定を表示
    let message = `【${formatDateJP(date)}の食事予定】\n\n`;

    if (lunch) {
      message += "◆ 昼食\n";
      for (const u of users) {
        // participationsプロパティは型定義上は存在するが、実行時には存在する
        // @ts-expect-error - getMealPlan includes participations in the query but TypeScript doesn't know this
        const participation = lunch.participations?.find(
          (p: MealParticipation) => p.userId === u.id,
        );
        message += `${u.name}: ${participation?.isAttending ? "参加" : "不参加"}\n`;
      }
      message += `準備: ${getPreparationTypeText(lunch.preparationType)}\n`;
      if (
        lunch.preparationType === PreparationType.COOK_BY_SELF &&
        lunch.cookerId
      ) {
        const cooker = users.find((u) => u.id === lunch.cookerId);
        if (cooker) {
          message += `調理担当: ${cooker.name}\n`;
        }
      }
      message += "\n";
    }

    if (dinner) {
      message += "◆ 夕食\n";
      for (const u of users) {
        // participationsプロパティは型定義上は存在するが、実行時には存在する
        // @ts-expect-error - getMealPlan includes participations in the query but TypeScript doesn't know this
        const participation = dinner.participations?.find(
          (p: MealParticipation) => p.userId === u.id,
        );
        message += `${u.name}: ${participation?.isAttending ? "参加" : "不参加"}\n`;
      }
      message += `準備: ${getPreparationTypeText(dinner.preparationType)}\n`;
      if (
        dinner.preparationType === PreparationType.COOK_BY_SELF &&
        dinner.cookerId
      ) {
        const cooker = users.find((u) => u.id === dinner.cookerId);
        if (cooker) {
          message += `調理担当: ${cooker.name}\n`;
        }
      }
    }

    await sendTextMessage(user.lineId, message);
  } catch (error) {
    console.error("食事予定確認エラー:", error);
    await sendTextMessage(
      user.lineId,
      "予定の確認中にエラーが発生しました。もう一度お試しください。",
    );
  }
};

/**
 * カレンダーコマンドを処理
 * @param args コマンド引数
 * @param user ユーザー
 */
const handleCalendarCommand = async (
  args: string[],
  user: User,
): Promise<void> => {
  try {
    // 選択日付の指定がある場合
    let selectedDate: Date | undefined;
    if (args.length > 0) {
      try {
        selectedDate = new Date(args[0]);
        if (Number.isNaN(selectedDate.getTime())) {
          selectedDate = undefined;
        }
      } catch (_error) {
        // 無効な日付形式の場合は無視
        selectedDate = undefined;
      }
    }

    // カレンダーを送信
    await sendCalendarMessage(user.lineId, selectedDate);
  } catch (error) {
    console.error("カレンダー表示エラー:", error);
    await sendTextMessage(
      user.lineId,
      "カレンダーの表示中にエラーが発生しました。もう一度お試しください。",
    );
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
 * ヘルプメッセージを送信
 * @param lineId LINEユーザーID
 */
const sendHelpMessage = async (lineId: string): Promise<void> => {
  const helpMessage = `【コマンド一覧】
/help - このヘルプを表示
/register <日付> <食事タイプ> <参加> [準備方法] - 食事予定を登録
  例: /register today lunch yes cook
  日付: today, tomorrow, YYYY-MM-DD
  食事タイプ: lunch, dinner
  参加: yes, no
  準備方法: cook, individual, buy
/check [日付] - 食事予定を確認
  例: /check tomorrow
  日付: today, tomorrow, YYYY-MM-DD (省略時は today)
/cal [日付] - カレンダーを表示
  例: /cal 2023-07-15
  日付: YYYY-MM-DD (省略時は選択なし)

【メニュー】
予定登録 - 食事予定を登録
予定変更 - 食事予定を変更
予定確認 - 食事予定を確認
ヘルプ - このヘルプを表示`;

  await sendTextMessage(lineId, helpMessage);
};

/**
 * デフォルトメニューを送信
 * @param lineId LINE ID
 */
const sendDefaultMenu = async (lineId: string): Promise<void> => {
  const buttonTemplate = createMainMenuTemplate();
  await sendTemplateMessage(lineId, buttonTemplate, "メインメニュー");
};

/**
 * 準備方法の日本語表示を取得
 * @param preparationType 準備方法
 * @returns 準備方法の日本語表示
 */
const getPreparationTypeText = (preparationType: PreparationType): string => {
  switch (preparationType) {
    case PreparationType.COOK_BY_SELF:
      return "自炊";
    case PreparationType.INDIVIDUAL:
      return "各自自由";
    case PreparationType.BUY_TOGETHER:
      return "買って一緒に食べる";
    default:
      return "未定";
  }
};
