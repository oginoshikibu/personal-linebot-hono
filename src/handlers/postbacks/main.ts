import type { User } from "@prisma/client";
import { MESSAGES } from "../../constants";
import {
  createMainMenuTemplate,
  sendTemplateMessage,
  sendTextMessage,
} from "../../services/line";
import { logger } from "../../utils/logger";
import { handleChangePostback } from "./change";
import { handleCheckPostback } from "./check";
import { handleDateSelection } from "./date";
import { handleRegisterPostback } from "./register";

/**
 * ポストバックデータを処理
 * @param data ポストバックデータ
 * @param user ユーザー
 */
export const handlePostbackData = async (
  data: string,
  user: User,
): Promise<void> => {
  logger.info(`ポストバックデータ処理: ${user.lineId}`, { data });

  try {
    // 日付選択のポストバック
    if (data.startsWith("date_")) {
      await handleDateSelection(data.substring(5), user);
      return;
    }

    // 特定日付の予定登録のポストバック
    if (data.startsWith("register_date_")) {
      await handleRegisterPostback(data.substring(14), user);
      return;
    }

    // 特定日付の予定確認のポストバック
    if (data.startsWith("check_date")) {
      await handleCheckPostback(data.substring(10), user);
      return;
    }

    // 予定登録のポストバック
    if (data.startsWith("register_")) {
      await handleRegisterPostback(data, user);
      return;
    }

    // 予定登録確認のポストバック
    if (data.startsWith("confirm_registration")) {
      await handleRegisterPostback(data, user);
      return;
    }

    // 予定変更のポストバック
    if (data.startsWith("change_")) {
      await handleChangePostback(data.substring(7), user);
      return;
    }

    // 予定確認のポストバック
    if (data.startsWith("check_")) {
      await handleCheckPostback(data.substring(6), user);
      return;
    }

    // 未知のポストバック
    logger.warn(`未知のポストバックデータ: ${data}`, { userId: user.lineId });
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.UNKNOWN_POSTBACK);
    await sendTemplateMessage(
      user.lineId,
      createMainMenuTemplate(),
      "メインメニュー",
    );
  } catch (error) {
    logger.error(`ポストバックデータ処理エラー: ${data}`, error);
    await sendTextMessage(user.lineId, MESSAGES.ERRORS.PROCESSING_ERROR);
    await sendTemplateMessage(
      user.lineId,
      createMainMenuTemplate(),
      "メインメニュー",
    );
  }
};
