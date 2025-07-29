import type { PostbackEvent } from "@line/bot-sdk";
import { DIContainer } from "../../../di/container";
import { logger } from "../../../lib/logger";
import { isAllowedLineId } from "../../../utils/auth";
import { getUserName } from "../../../utils/user";
import { replyTextMessage } from "../client";
import { handleDateSelection } from "./postbacks/date";
import { handleDinnerPostback } from "./postbacks/dinner";
import { handleEditPostback } from "./postbacks/edit";
import { handleLunchPostback } from "./postbacks/lunch";

export const handlePostbackEvent = async (
  event: PostbackEvent,
): Promise<void> => {
  const userId = event.source.userId ?? "";
  if (!userId) {
    logger.error("ユーザーIDが取得できませんでした");
    return;
  }

  logger.info(`ポストバックイベント処理開始: ${userId}`, {
    data: event.postback.data,
  });
  
  console.log(`[PostbackHandler] ポストバックデータ詳細: ${event.postback.data}`);

  try {
    const container = DIContainer.getInstance();
    const mealService = container.mealPlanService;

    // Alice/Bobの固定LINE IDと照合
    const isAllowed = await isAllowedLineId(userId);

    if (!isAllowed) {
      logger.warn(`未許可ユーザーからのポストバック: ${userId}`);
      await replyTextMessage(
        event.replyToken,
        "申し訳ありませんが、システムに登録されていません。管理者に連絡してください。",
      );
      logger.info(`未許可ユーザーへの通知送信完了: ${userId}`);
      return;
    }

    // Alice/Bobの場合はユーザー名を取得（configから安全に取得）
    const userName = await getUserName(userId);

    logger.debug(`ユーザー情報取得: ${userId}`, {
      allowed: isAllowed,
      userName,
    });

    const data = event.postback.data;
    const params = new URLSearchParams(data);
    const action = params.get("action");
    
    console.log(`[PostbackHandler] パラメータ解析結果:`, {
      action,
      allParams: Object.fromEntries(params.entries()),
    });

    switch (action) {
      case "edit_meal":
      case "participate":
      case "not_participate":
      case "undecided":
      case "quit_preparation": {
        const mealType = params.get("mealType");
        console.log(`[PostbackHandler] 食事アクション処理: ${action}, mealType: ${mealType}`);
        if (mealType === "LUNCH") {
          await handleLunchPostback(event, mealService);
        } else {
          await handleDinnerPostback(event, mealService);
        }
        break;
      }
      case "select_date": {
        const dateString = params.get("date");
        if (dateString) {
          await handleDateSelection(dateString, userName, event.replyToken);
        } else {
          await replyTextMessage(
            event.replyToken,
            "日付の選択に失敗しました。",
          );
        }
        break;
      }
      default:
        console.log(`[PostbackHandler] default分岐でデータ解析: ${data}`);
        if (data.startsWith("date_")) {
          console.log(`[PostbackHandler] 日付選択処理: ${data.substring(5)}`);
          await handleDateSelection(
            data.substring(5),
            userName,
            event.replyToken,
          );
        } else if (data.startsWith("action=edit")) {
          console.log(`[PostbackHandler] 編集処理: ${data}`);
          await handleEditPostback(data, userName, event.replyToken);
        } else if (data.startsWith("action=lunch_")) {
          console.log(`[PostbackHandler] ランチ処理: ${data}`);
          await handleLunchPostback(event, mealService);
        } else if (data.startsWith("action=dinner_")) {
          console.log(`[PostbackHandler] ディナー処理: ${data}`);
          await handleDinnerPostback(event, mealService);
        } else {
          console.log(`[PostbackHandler] 未対応データ: ${data}`);
          logger.warn(`未対応のポストバックデータ: ${data}`);
          await replyTextMessage(
            event.replyToken,
            "この操作はまだ対応していません。",
          );
        }
        break;
    }
  } catch (error) {
    logger.error(`ポストバックイベント処理エラー: ${userId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    try {
      await replyTextMessage(
        event.replyToken,
        "ポストバックの処理中にエラーが発生しました。もう一度お試しください。",
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
