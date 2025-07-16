import type {
  FlexBox,
  FlexBubble,
  FlexComponent,
  MessageAPIResponseBase,
} from "@line/bot-sdk";
import { formatDateForPostback } from "../../../utils/date";
import { AppError } from "../../../utils/error";
import { logger } from "../../../utils/logger";
import { replyFlexMessage, sendFlexMessage } from "../../line/client";

/**
 * カレンダーFlexメッセージを作成
 * @param selectedDate 選択された日付（デフォルトは現在の日付）
 * @returns Flexメッセージのコンテンツ
 */
export const createCalendarFlexMessage = (
  selectedDate: Date = new Date(),
): FlexBubble => {
  // 現在の年月を取得
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  // 月の最初の日と最後の日を取得
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 月の最初の日の曜日（0: 日曜日, 1: 月曜日, ..., 6: 土曜日）
  const firstDayOfWeek = firstDay.getDay();

  // 月の日数
  const daysInMonth = lastDay.getDate();

  // 曜日の配列
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  // カレンダーの行を作成
  const calendarRows: FlexBox[] = [];

  // 曜日ヘッダーを作成
  const weekdayHeader: FlexBox = {
    type: "box" as const,
    layout: "horizontal" as const,
    contents: weekdays.map((day) => ({
      type: "text" as const,
      text: day,
      size: "sm",
      align: "center",
      color: day === "日" ? "#FF0000" : day === "土" ? "#0000FF" : "#555555",
    })),
    margin: "md",
  };

  // 日付を配置するための配列
  let currentWeek: FlexComponent[] = [];
  let dayCount = 1;

  // 最初の週の空白を埋める
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({
      type: "text" as const,
      text: " ",
      size: "sm",
      align: "center",
    });
  }

  // 日付を埋める
  while (dayCount <= daysInMonth) {
    const isToday =
      dayCount === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear();

    const dayOfWeek = (firstDayOfWeek + dayCount - 1) % 7;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    currentWeek.push({
      type: "text" as const,
      text: String(dayCount),
      size: "sm",
      align: "center",
      weight: isToday ? "bold" : "regular",
      color: isToday
        ? "#FFFFFF"
        : isWeekend
          ? dayOfWeek === 0
            ? "#FF0000"
            : "#0000FF"
          : "#555555",
      action: {
        type: "postback" as const,
        data: `action=select_date&date=${formatDateForPostback(new Date(year, month, dayCount))}`,
        displayText: `${year}年${month + 1}月${dayCount}日を選択しました`,
        label: String(dayCount),
      },
    });

    // 週の最後または月の最後の日に達したら、行を追加
    if ((firstDayOfWeek + dayCount) % 7 === 0 || dayCount === daysInMonth) {
      // 最後の週の空白を埋める
      if (dayCount === daysInMonth) {
        const remainingDays = 7 - currentWeek.length;
        for (let i = 0; i < remainingDays; i++) {
          currentWeek.push({
            type: "text" as const,
            text: " ",
            size: "sm",
            align: "center",
          });
        }
      }

      calendarRows.push({
        type: "box" as const,
        layout: "horizontal" as const,
        contents: currentWeek,
        margin: "md",
      });

      currentWeek = [];
    }

    dayCount++;
  }

  // Flexメッセージを作成
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `${year}年${month + 1}月`,
          weight: "bold",
          color: "#1DB446",
          size: "lg",
          align: "center",
        },
      ],
      paddingAll: "md",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [weekdayHeader, ...calendarRows],
      paddingAll: "md",
    },
    styles: {
      footer: {
        separator: true,
      },
    },
  };
};

/**
 * 7日間カレンダーFlexメッセージを作成
 * @param startDate 開始日（デフォルトは今日）
 * @returns Flexメッセージのコンテンツ
 */
export const create7DayCalendarFlexMessage = (
  startDate: Date = new Date(),
): FlexBubble => {
  // 開始日を今日の0時に設定
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  // 曜日の配列
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  // 7日分の日付情報を作成
  const days: FlexComponent[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + i);

    const isToday = currentDate.getTime() === today.getTime();
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 各日付のボックスを簡素化
    days.push({
      type: "box" as const,
      layout: "vertical" as const,
      contents: [
        {
          type: "text" as const,
          text: weekdays[dayOfWeek],
          size: "xs",
          align: "center",
          color: isWeekend
            ? dayOfWeek === 0
              ? "#FF0000"
              : "#0000FF"
            : "#666666",
        },
        {
          type: "text" as const,
          text: String(currentDate.getDate()),
          size: "sm", // mdからsmに変更して小さくする
          align: "center",
          weight: isToday ? "bold" : "regular",
          color: isToday ? "#FFFFFF" : "#333333", // 色を単純化
        },
      ],
      ...(isToday && { backgroundColor: "#1DB446" }),
      action: {
        type: "postback" as const,
        label: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
        data: `date_${formatDateForPostback(currentDate)}`,
        displayText: `${currentDate.getMonth() + 1}/${currentDate.getDate()}を選択`,
      },
    });
  }

  // 7日間を2行に分割
  const firstRow = days.slice(0, 4);
  const secondRow = days.slice(4, 7);

  // Flexメッセージを作成 - 2行レイアウト
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "今後7日間",
          weight: "bold",
          color: "#1DB446",
          size: "md",
          align: "center",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: firstRow,
          spacing: "xs",
        },
        {
          type: "box",
          layout: "horizontal",
          contents: secondRow,
          spacing: "xs",
          margin: "sm",
        },
      ],
    },
  };
};

/**
 * カレンダーメッセージを送信
 * @param to 送信先ユーザーID
 * @param replyToken 応答トークン（指定された場合は応答メッセージとして送信）
 * @param selectedDate 選択された日付（デフォルトは現在の日付）
 * @returns 送信結果
 */
export const sendCalendarMessage = async (
  to: string,
  replyToken?: string,
  selectedDate?: Date,
): Promise<MessageAPIResponseBase> => {
  try {
    const flexMessage = createCalendarFlexMessage(selectedDate);
    const date = selectedDate || new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const altText = `${year}年${month}月のカレンダー`;

    // replyTokenが指定されていれば応答メッセージとして送信
    if (replyToken) {
      return await replyFlexMessage(replyToken, flexMessage, altText);
    }

    // そうでなければプッシュメッセージとして送信
    return await sendFlexMessage(to, flexMessage, altText);
  } catch (error) {
    logger.error(`カレンダーメッセージ送信エラー: ${to}`, error);
    throw new AppError("カレンダーメッセージの送信に失敗しました", 500);
  }
};

/**
 * 7日間カレンダーメッセージを送信
 * @param to 送信先ユーザーID
 * @param replyToken 応答トークン（指定された場合は応答メッセージとして送信）
 * @param startDate 開始日（デフォルトは今日）
 * @returns 送信結果
 */
export const send7DayCalendarMessage = async (
  to: string,
  replyToken?: string,
  startDate?: Date,
): Promise<MessageAPIResponseBase> => {
  try {
    const flexMessage = create7DayCalendarFlexMessage(startDate);
    const date = startDate || new Date();
    const altText = `今後7日間のカレンダー (${date.getMonth() + 1}/${date.getDate()}〜)`;

    // replyTokenが指定されていれば応答メッセージとして送信
    if (replyToken) {
      return await replyFlexMessage(replyToken, flexMessage, altText);
    }

    // そうでなければプッシュメッセージとして送信
    return await sendFlexMessage(to, flexMessage, altText);
  } catch (error) {
    logger.error(`7日間カレンダーメッセージ送信エラー: ${to}`, error);
    throw new AppError("7日間カレンダーメッセージの送信に失敗しました", 500);
  }
};
