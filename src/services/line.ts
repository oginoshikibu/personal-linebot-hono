import {
  Client,
  type FlexBubble,
  type FlexContainer,
  type FlexMessage,
  type MessageAPIResponseBase,
  type TemplateContent,
  type TemplateMessage,
  type TextMessage,
} from "@line/bot-sdk";
import type { MealType } from "@prisma/client";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import type { MealPlanData } from "../types";
import { isAllowedLineId } from "../utils/auth";
import { AppError } from "../utils/error";
import { logger } from "../utils/logger";
import { createCalendarFlexMessage } from "./calendar";

// LINE Client初期化（遅延初期化）
let lineClient: Client | null = null;

const getLineClient = (): Client => {
  if (!lineClient) {
    if (!config.line.channelSecret || !config.line.channelAccessToken) {
      throw new AppError(
        "LINE APIの設定が不足しています。環境変数を確認してください。",
        500,
      );
    }
    lineClient = new Client({
      channelSecret: config.line.channelSecret,
      channelAccessToken: config.line.channelAccessToken,
    });
  }
  return lineClient;
};

/**
 * テキストメッセージを送信
 * @param to 送信先ユーザーID
 * @param text メッセージテキスト
 * @returns 送信結果
 */
export const sendTextMessage = async (
  to: string,
  text: string,
): Promise<MessageAPIResponseBase> => {
  try {
    const isAllowed = await isAllowedLineId(to);
    if (!isAllowed) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    const message: TextMessage = {
      type: "text",
      text,
    };

    const client = getLineClient();
    return await client.pushMessage(to, message);
  } catch (error) {
    logger.error(`テキストメッセージ送信エラー: ${to}`, error);
    throw new AppError(`メッセージの送信に失敗しました: ${to}`, 500);
  }
};

/**
 * 複数のテキストメッセージを送信
 * @param to 送信先ユーザーID
 * @param texts メッセージテキストの配列
 * @returns 送信結果
 */
export const sendTextMessages = async (
  to: string,
  texts: string[],
): Promise<MessageAPIResponseBase> => {
  try {
    const isAllowed = await isAllowedLineId(to);
    if (!isAllowed) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    const messages: TextMessage[] = texts.map((text) => ({
      type: "text",
      text,
    }));

    const client = getLineClient();
    return await client.pushMessage(to, messages);
  } catch (error) {
    logger.error(`複数テキストメッセージ送信エラー: ${to}`, error);
    throw new AppError(`複数メッセージの送信に失敗しました: ${to}`, 500);
  }
};

/**
 * Flexメッセージを送信
 * @param to 送信先ユーザーID
 * @param flexContent Flexメッセージのコンテンツ
 * @param altText 代替テキスト
 * @returns 送信結果
 */
export const sendFlexMessage = async (
  to: string,
  flexContent: FlexContainer,
  altText: string,
): Promise<MessageAPIResponseBase> => {
  try {
    const isAllowed = await isAllowedLineId(to);
    if (!isAllowed) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    const message: FlexMessage = {
      type: "flex",
      altText,
      contents: flexContent,
    };

    const client = getLineClient();
    return await client.pushMessage(to, message);
  } catch (error) {
    logger.error(`Flexメッセージ送信エラー: ${to}`, error);
    throw new AppError(`Flexメッセージの送信に失敗しました: ${to}`, 500);
  }
};

/**
 * テンプレートメッセージを送信
 * @param to 送信先ユーザーID
 * @param template テンプレートオブジェクト
 * @param altText 代替テキスト
 * @returns 送信結果
 */
export const sendTemplateMessage = async (
  to: string,
  template: TemplateContent,
  altText: string,
): Promise<MessageAPIResponseBase> => {
  try {
    const isAllowed = await isAllowedLineId(to);
    if (!isAllowed) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    const message: TemplateMessage = {
      type: "template",
      altText,
      template,
    };

    const client = getLineClient();
    return await client.pushMessage(to, message);
  } catch (error) {
    logger.error(`テンプレートメッセージ送信エラー: ${to}`, error);
    throw new AppError(
      `テンプレートメッセージの送信に失敗しました: ${to}`,
      500,
    );
  }
};

/**
 * 全ての登録ユーザーにメッセージを送信
 * @param text メッセージテキスト
 * @returns 送信結果の配列
 */
export const broadcastTextMessage = async (
  text: string,
): Promise<MessageAPIResponseBase[]> => {
  try {
    // データベースから全ユーザーを取得
    const users = await prisma.user.findMany();

    // Promise.allSettledを使用して並列処理（エラーがあっても全てのプロミスを実行）
    const settledResults = await Promise.allSettled(
      users.map(async (user) => {
        try {
          return await sendTextMessage(user.lineId, text);
        } catch (error) {
          logger.error(
            `ユーザーへのメッセージ送信に失敗: ${user.lineId}`,
            error,
          );
          throw error;
        }
      }),
    );

    // 成功した結果のみを抽出
    const results = settledResults
      .filter(
        (result): result is PromiseFulfilledResult<MessageAPIResponseBase> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);

    // エラーの数をカウント
    const errors = settledResults.filter(
      (result) => result.status === "rejected",
    );
    if (errors.length > 0) {
      logger.error(`一部のメッセージ送信に失敗: ${errors.length}件`);
    }

    return results;
  } catch (error) {
    logger.error("ブロードキャストメッセージ送信エラー", error);
    throw new AppError("ブロードキャストメッセージの送信に失敗しました", 500);
  }
};

/**
 * 食事予定確認用のFlexメッセージを作成
 * @param title メッセージタイトル
 * @param lunchData 昼食データ
 * @param dinnerData 夕食データ
 * @returns Flexメッセージのコンテンツ
 */
export const createMealPlanFlexMessage = (
  title: string,
  lunchData: MealPlanData,
  dinnerData: MealPlanData,
): FlexBubble => {
  // 準備方法の日本語表示
  const getPreparationTypeText = (type: string, cooker?: string) => {
    switch (type) {
      case "COOK_BY_SELF":
        return cooker ? `${cooker}が作る` : "自分が作る";
      case "INDIVIDUAL":
        return "各自自由に";
      case "BUY_TOGETHER":
        return "買って一緒に食べる";
      default:
        return "未定";
    }
  };

  // 参加者リストを作成
  const createParticipantComponents = (
    participants: { name: string; attending: boolean }[],
  ) => {
    return participants.map((p) => ({
      type: "text" as const,
      text: `${p.name}: ${p.attending ? "参加" : "不参加"}`,
      size: "sm",
      margin: "sm",
    }));
  };

  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: title,
          weight: "bold",
          size: "lg",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        // 昼食セクション
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "◆ 昼食",
              weight: "bold",
            },
            ...createParticipantComponents(lunchData.participants),
            {
              type: "text",
              text: `準備: ${getPreparationTypeText(lunchData.preparationType, lunchData.cooker)}`,
              size: "sm",
              margin: "sm",
            },
          ],
          margin: "md",
        },
        // セパレーター
        {
          type: "separator",
          margin: "md",
        },
        // 夕食セクション
        {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "◆ 夕食",
              weight: "bold",
            },
            ...createParticipantComponents(dinnerData.participants),
            {
              type: "text",
              text: `準備: ${getPreparationTypeText(dinnerData.preparationType, dinnerData.cooker)}`,
              size: "sm",
              margin: "sm",
            },
          ],
          margin: "md",
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "予定を変更する場合はメニューから「予定変更」を選択してください。",
          size: "xs",
          wrap: true,
        },
      ],
    },
  };
};

/**
 * LINE通知を初期化
 * @returns 初期化メッセージ
 */
export const initializeLineNotification = async (): Promise<string> => {
  try {
    // 設定の検証
    if (!config.line.channelSecret || !config.line.channelAccessToken) {
      throw new AppError("LINE APIの設定が不足しています", 500);
    }

    // データベースからユーザーを確認
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      throw new AppError("登録されたユーザーがいません", 500);
    }

    // テストメッセージを送信
    await broadcastTextMessage("LINE通知システムが起動しました。");

    return "LINE通知システムの初期化に成功しました。";
  } catch (error) {
    logger.error("LINE通知システムの初期化に失敗しました", error);
    throw new AppError("LINE通知システムの初期化に失敗しました", 500);
  }
};

/**
 * 予定登録メニューを作成
 */
export const createRegisterMenuTemplate = (): TemplateContent => {
  return {
    type: "buttons" as const,
    title: "食事予定登録",
    text: "登録する内容を選択してください",
    actions: [
      {
        type: "postback" as const,
        label: "今日の昼食",
        data: "register_today_lunch",
        displayText: "今日の昼食を登録",
      },
      {
        type: "postback" as const,
        label: "今日の夕食",
        data: "register_today_dinner",
        displayText: "今日の夕食を登録",
      },
      {
        type: "postback" as const,
        label: "明日の昼食",
        data: "register_tomorrow_lunch",
        displayText: "明日の昼食を登録",
      },
      {
        type: "postback" as const,
        label: "明日の夕食",
        data: "register_tomorrow_dinner",
        displayText: "明日の夕食を登録",
      },
    ],
  };
};

/**
 * 予定変更メニューを作成
 */
export const createChangeMenuTemplate = (): TemplateContent => {
  return {
    type: "buttons" as const,
    title: "食事予定変更",
    text: "変更する内容を選択してください",
    actions: [
      {
        type: "postback" as const,
        label: "今日の昼食",
        data: "change_today_lunch",
        displayText: "今日の昼食を変更",
      },
      {
        type: "postback" as const,
        label: "今日の夕食",
        data: "change_today_dinner",
        displayText: "今日の夕食を変更",
      },
      {
        type: "postback" as const,
        label: "明日の昼食",
        data: "change_tomorrow_lunch",
        displayText: "明日の昼食を変更",
      },
      {
        type: "postback" as const,
        label: "明日の夕食",
        data: "change_tomorrow_dinner",
        displayText: "明日の夕食を変更",
      },
    ],
  };
};

/**
 * 予定確認メニューを作成
 */
export const createCheckMenuTemplate = (): TemplateContent => {
  return {
    type: "buttons" as const,
    title: "食事予定確認",
    text: "確認する内容を選択してください",
    actions: [
      {
        type: "postback" as const,
        label: "今日の予定",
        data: "check_today",
        displayText: "今日の予定を確認",
      },
      {
        type: "postback" as const,
        label: "明日の予定",
        data: "check_tomorrow",
        displayText: "明日の予定を確認",
      },
    ],
  };
};

/**
 * メインメニューを作成
 */
export const createMainMenuTemplate = (): TemplateContent => {
  return {
    type: "buttons" as const,
    title: "メインメニュー",
    text: "操作を選択してください",
    actions: [
      {
        type: "message" as const,
        label: "予定登録",
        text: "予定登録",
      },
      {
        type: "message" as const,
        label: "予定変更",
        text: "予定変更",
      },
      {
        type: "message" as const,
        label: "予定確認",
        text: "予定確認",
      },
      {
        type: "message" as const,
        label: "今後の予定",
        text: "今後の予定",
      },
    ],
  };
};

/**
 * カレンダー選択メッセージを送信
 * @param to 送信先ユーザーID
 * @param selectedDate 選択された日付（ハイライト表示）
 * @returns 送信結果
 */
export const sendCalendarMessage = async (
  to: string,
  selectedDate?: Date,
): Promise<MessageAPIResponseBase> => {
  try {
    const isAllowed = await isAllowedLineId(to);
    if (!isAllowed) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    const calendarContent = createCalendarFlexMessage(selectedDate);
    return await sendFlexMessage(to, calendarContent, "カレンダー");
  } catch (error) {
    logger.error(`カレンダーメッセージ送信エラー: ${to}`, error);
    throw new AppError(`カレンダーメッセージの送信に失敗しました: ${to}`, 500);
  }
};

/**
 * 参加状態と準備方法を選択するためのテンプレートメッセージを送信
 * @param to 送信先ユーザーID
 * @param dateText 日付の表示テキスト
 * @param mealTypeText 食事タイプの表示テキスト
 * @param dateStr ISO形式の日付文字列
 * @param mealType 食事タイプ
 * @returns 送信結果
 */
export const sendRegistrationOptions = async (
  to: string,
  dateText: string,
  mealTypeText: string,
  dateStr: string,
  mealType: MealType,
): Promise<MessageAPIResponseBase> => {
  try {
    const isAllowed = await isAllowedLineId(to);
    if (!isAllowed) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    // 参加状態を選択するテンプレート
    const attendanceTemplate: TemplateContent = {
      type: "buttons",
      title: `${dateText}の${mealTypeText}予定`,
      text: "参加しますか？",
      actions: [
        {
          type: "postback",
          label: "家で食べる（担当：自分）",
          data: `confirm_registration?date=${dateStr}&mealType=${mealType}&attend=true&prepType=COOK_BY_SELF`,
          displayText: "家で食べる（担当：自分）",
        },
        {
          type: "postback",
          label: "家で食べる（担当：誰か）",
          data: `confirm_registration?date=${dateStr}&mealType=${mealType}&attend=true&prepType=BUY_TOGETHER`,
          displayText: "家で食べる（担当：誰か）",
        },
        {
          type: "postback",
          label: "各自外で食べる",
          data: `confirm_registration?date=${dateStr}&mealType=${mealType}&attend=true&prepType=INDIVIDUAL`,
          displayText: "各自外で食べる",
        },
        {
          type: "postback",
          label: "参加しない",
          data: `confirm_registration?date=${dateStr}&mealType=${mealType}&attend=false&prepType=INDIVIDUAL`,
          displayText: "参加しない",
        },
      ],
    };

    return await sendTemplateMessage(
      to,
      attendanceTemplate,
      `${dateText}の${mealTypeText}予定登録`,
    );
  } catch (error) {
    logger.error(`登録オプション送信エラー: ${to}`, error);
    throw new AppError(`登録オプションの送信に失敗しました: ${to}`, 500);
  }
};

// LINEクライアントをエクスポート
export default lineClient;
