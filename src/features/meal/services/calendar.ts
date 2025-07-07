import type {
  FlexBox,
  FlexBubble,
  FlexComponent,
  MessageAPIResponseBase,
} from "@line/bot-sdk";
import { AppError } from "../../../utils/error";
import { logger } from "../../../utils/logger";
import { sendFlexMessage } from "../../line/client";

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
        data: `action=select_date&date=${year}-${String(month + 1).padStart(
          2,
          "0",
        )}-${String(dayCount).padStart(2, "0")}`,
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
 * カレンダーメッセージを送信
 * @param to 送信先ユーザーID
 * @param selectedDate 選択された日付（デフォルトは現在の日付）
 * @returns 送信結果
 */
export const sendCalendarMessage = async (
  to: string,
  selectedDate?: Date,
): Promise<MessageAPIResponseBase> => {
  try {
    const flexMessage = createCalendarFlexMessage(selectedDate);
    const date = selectedDate || new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    return await sendFlexMessage(
      to,
      flexMessage,
      `${year}年${month}月のカレンダー`,
    );
  } catch (error) {
    logger.error(`カレンダーメッセージ送信エラー: ${to}`, error);
    throw new AppError("カレンダーメッセージの送信に失敗しました", 500);
  }
};
