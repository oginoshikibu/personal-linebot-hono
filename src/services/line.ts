import {
  Client,
  type FlexMessage,
  type FlexContainer,
  type FlexBubble,
  type FlexComponent,
  type FlexBox,
  type MessageAPIResponseBase,
  type TemplateMessage,
  type TemplateContent,
  type TextMessage,
  type Action,
  type PostbackAction,
  type MessageAction,
} from "@line/bot-sdk";
import { config } from "../config";
import { MealPlanData } from "../types";
import { AppError } from "../utils/error";
import { isAllowedLineId } from "../utils/auth";
import { logger } from "../utils/logger";

// LINE Client初期化
const lineClient = new Client({
  channelSecret: config.line.channelSecret,
  channelAccessToken: config.line.channelAccessToken,
});

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
    if (!isAllowedLineId(to)) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    const message: TextMessage = {
      type: "text",
      text,
    };

    return await lineClient.pushMessage(to, message);
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
    if (!isAllowedLineId(to)) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    const messages: TextMessage[] = texts.map((text) => ({
      type: "text",
      text,
    }));

    return await lineClient.pushMessage(to, messages);
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
    if (!isAllowedLineId(to)) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    const message: FlexMessage = {
      type: "flex",
      altText,
      contents: flexContent,
    };

    return await lineClient.pushMessage(to, message);
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
    if (!isAllowedLineId(to)) {
      throw new AppError(`未承認のLINE ID: ${to}`, 403);
    }

    const message: TemplateMessage = {
      type: "template",
      altText,
      template,
    };

    return await lineClient.pushMessage(to, message);
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
    const results: MessageAPIResponseBase[] = [];
    const errors: Error[] = [];

    for (const userId of config.line.allowedLineIds) {
      try {
        const result = await sendTextMessage(userId, text);
        results.push(result);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(error);
        }
      }
    }

    if (errors.length > 0) {
      logger.error(
        "一部のメッセージ送信に失敗: " + errors.length + "件",
        errors[0],
      );
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
        return cooker ? `${cooker}が作る` : "自炊";
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

    // 許可されたLINE IDの検証
    if (config.line.allowedLineIds.length === 0) {
      throw new AppError("許可されたLINE IDがありません", 500);
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
        label: "ヘルプ",
        text: "ヘルプ",
      },
    ],
  };
};

// LINEクライアントをエクスポート
export default lineClient;
