import {
  Client,
  type FlexContainer,
  type FlexMessage,
  type MessageAPIResponseBase,
  type TemplateContent,
  type TemplateMessage,
  type TextMessage,
} from "@line/bot-sdk";
import { config } from "../../config";
import { prisma } from "../../lib/prisma";
import { isAllowedLineId } from "../../utils/auth";
import { AppError } from "../../utils/error";
import { logger } from "../../utils/logger";

// LINE Client初期化
const lineClient = new Client({
  channelSecret: config.line.channelSecret,
  channelAccessToken: config.line.channelAccessToken,
});

/**
 * LINE通知システムを初期化
 */
export const initializeLineNotification = async (): Promise<void> => {
  try {
    logger.info("LINE通知システムを初期化しています...");
    // 必要に応じて初期化処理を追加
    logger.info("LINE通知システムの初期化が完了しました");
  } catch (error) {
    logger.error("LINE通知システムの初期化に失敗しました", error);
    throw new AppError("LINE通知システムの初期化に失敗しました", 500);
  }
};

/**
 * LINE クライアントサービスクラス
 * LINE メッセージ送信の基本機能を提供
 */
export class LineClientService {
  private client: Client;

  constructor(client: Client = lineClient) {
    this.client = client;
  }

  /**
   * テキストメッセージを送信
   * @param to 送信先ユーザーID
   * @param text メッセージテキスト
   * @returns 送信結果
   */
  async sendTextMessage(
    to: string,
    text: string,
  ): Promise<MessageAPIResponseBase> {
    try {
      const isAllowed = await isAllowedLineId(to);
      if (!isAllowed) {
        throw new AppError(`未承認のLINE ID: ${to}`, 403);
      }

      const message: TextMessage = {
        type: "text",
        text,
      };

      return await this.client.pushMessage(to, message);
    } catch (error) {
      logger.error(`テキストメッセージ送信エラー: ${to}`, error);
      throw new AppError(`メッセージの送信に失敗しました: ${to}`, 500);
    }
  }

  /**
   * 複数のテキストメッセージを送信
   * @param to 送信先ユーザーID
   * @param texts メッセージテキストの配列
   * @returns 送信結果
   */
  async sendTextMessages(
    to: string,
    texts: string[],
  ): Promise<MessageAPIResponseBase> {
    try {
      const isAllowed = await isAllowedLineId(to);
      if (!isAllowed) {
        throw new AppError(`未承認のLINE ID: ${to}`, 403);
      }

      const messages: TextMessage[] = texts.map((text) => ({
        type: "text",
        text,
      }));

      return await this.client.pushMessage(to, messages);
    } catch (error) {
      logger.error(`複数テキストメッセージ送信エラー: ${to}`, error);
      throw new AppError(`複数メッセージの送信に失敗しました: ${to}`, 500);
    }
  }

  /**
   * Flexメッセージを送信
   * @param to 送信先ユーザーID
   * @param flexContent Flexメッセージのコンテンツ
   * @param altText 代替テキスト
   * @returns 送信結果
   */
  async sendFlexMessage(
    to: string,
    flexContent: FlexContainer,
    altText: string,
  ): Promise<MessageAPIResponseBase> {
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

      return await this.client.pushMessage(to, message);
    } catch (error) {
      logger.error(`Flexメッセージ送信エラー: ${to}`, error);
      throw new AppError(`Flexメッセージの送信に失敗しました: ${to}`, 500);
    }
  }

  /**
   * テンプレートメッセージを送信
   * @param to 送信先ユーザーID
   * @param template テンプレートオブジェクト
   * @param altText 代替テキスト
   * @returns 送信結果
   */
  async sendTemplateMessage(
    to: string,
    template: TemplateContent,
    altText: string,
  ): Promise<MessageAPIResponseBase> {
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

      return await this.client.pushMessage(to, message);
    } catch (error) {
      logger.error(`テンプレートメッセージ送信エラー: ${to}`, error);
      throw new AppError(
        `テンプレートメッセージの送信に失敗しました: ${to}`,
        500,
      );
    }
  }

  /**
   * 全ての登録ユーザーにメッセージを送信
   * @param text メッセージテキスト
   * @returns 送信結果の配列
   */
  async broadcastTextMessage(text: string): Promise<MessageAPIResponseBase[]> {
    try {
      const results: MessageAPIResponseBase[] = [];
      const errors: Error[] = [];

      // データベースから全ユーザーを取得
      const users = await prisma.user.findMany();

      for (const user of users) {
        try {
          const result = await this.sendTextMessage(user.lineId, text);
          results.push(result);
        } catch (error) {
          if (error instanceof Error) {
            errors.push(error);
          }
        }
      }

      if (errors.length > 0) {
        logger.error(
          `一部のメッセージ送信に失敗: ${errors.length}件`,
          errors[0],
        );
      }

      return results;
    } catch (error) {
      logger.error("ブロードキャストメッセージ送信エラー", error);
      throw new AppError("ブロードキャストメッセージの送信に失敗しました", 500);
    }
  }
}

// シングルトンインスタンスをエクスポート
export const lineService = new LineClientService();

// 後方互換性のために従来の関数もエクスポート
export const sendTextMessage = (
  to: string,
  text: string,
): Promise<MessageAPIResponseBase> => lineService.sendTextMessage(to, text);

export const sendTextMessages = (
  to: string,
  texts: string[],
): Promise<MessageAPIResponseBase> => lineService.sendTextMessages(to, texts);

export const sendFlexMessage = (
  to: string,
  flexContent: FlexContainer,
  altText: string,
): Promise<MessageAPIResponseBase> =>
  lineService.sendFlexMessage(to, flexContent, altText);

export const sendTemplateMessage = (
  to: string,
  template: TemplateContent,
  altText: string,
): Promise<MessageAPIResponseBase> =>
  lineService.sendTemplateMessage(to, template, altText);

export const broadcastTextMessage = (
  text: string,
): Promise<MessageAPIResponseBase[]> => lineService.broadcastTextMessage(text);

export { lineClient };
