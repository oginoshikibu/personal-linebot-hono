import type { FlexBubble, FlexCarousel, FlexComponent } from "@line/bot-sdk";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  getDay,
  getDaysInMonth,
  isEqual,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ja } from "date-fns/locale";

/**
 * 週の曜日ヘッダーを生成
 * @returns 曜日ヘッダーのFlexコンポーネント配列
 */
const createWeekdayHeader = (): FlexComponent[] => {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return weekdays.map((weekday, index) => {
    // 日曜は赤、土曜は青、その他は黒
    let color = "#000000";
    if (index === 0) color = "#ff0000";
    if (index === 6) color = "#0000ff";

    return {
      type: "text",
      text: weekday,
      size: "sm",
      color,
      align: "center",
      weight: "bold",
    };
  });
};

/**
 * 月のカレンダーを生成
 * @param baseDate 基準日
 * @param selectedDate 選択された日付（ハイライト表示）
 * @returns カレンダー月のFlexBubble
 */
const createMonthCalendar = (
  baseDate: Date,
  selectedDate?: Date,
): FlexBubble => {
  const monthStart = startOfMonth(baseDate);
  const daysInMonth = getDaysInMonth(baseDate);
  const startDate = startOfWeek(monthStart, { locale: ja });

  // 曜日ヘッダー行
  const weekdayHeader = createWeekdayHeader();

  // カレンダー日付セル作成
  const calendarDays: FlexComponent[] = [];
  let currentWeek: FlexComponent[] = [];

  // 最大6週間分のカレンダーを生成（月によって4〜6週になる）
  for (let i = 0; i < 42; i++) {
    const currentDate = addDays(startDate, i);
    const day = format(currentDate, "d");
    const isCurrentMonth = isSameMonth(currentDate, baseDate);

    // 日付の色を決定
    let color = "#000000"; // デフォルト黒
    if (getDay(currentDate) === 0) color = "#ff0000"; // 日曜は赤
    if (getDay(currentDate) === 6) color = "#0000ff"; // 土曜は青
    if (!isCurrentMonth) color = "#aaaaaa"; // 当月以外はグレー

    // 選択された日付は緑色でハイライト
    const isSelected = selectedDate && isEqual(currentDate, selectedDate);
    if (isSelected) color = "#1db446";

    // 日付セルを作成
    const dayCell: FlexComponent = {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: day,
          size: "sm",
          color,
          align: "center",
          action: {
            type: "postback",
            label: day,
            data: `date_${format(currentDate, "yyyy-MM-dd")}`,
            displayText: `${format(currentDate, "yyyy年MM月dd日")}を選択`,
          },
        },
      ],
      flex: 1,
    };

    currentWeek.push(dayCell);

    // 週の最後（土曜日）または最終日に達したら週を完成させる
    if (
      getDay(currentDate) === 6 ||
      i === daysInMonth + getDay(monthStart) - 1
    ) {
      calendarDays.push({
        type: "box",
        layout: "horizontal",
        contents: currentWeek,
        spacing: "sm",
        margin: "md",
      });

      currentWeek = [];

      // 月の最終日を超えたら終了
      if (i >= daysInMonth + getDay(monthStart) - 1) break;
    }
  }

  // カレンダーのFlexBubbleを作成
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: format(baseDate, "yyyy年MM月", { locale: ja }),
          weight: "bold",
          size: "lg",
          align: "center",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        // 曜日ヘッダー
        {
          type: "box",
          layout: "horizontal",
          contents: weekdayHeader,
          margin: "md",
        },
        // 区切り線
        {
          type: "separator",
          margin: "md",
        },
        // カレンダー本体
        ...calendarDays,
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "日付を選択してください",
          size: "xs",
          align: "center",
        },
      ],
    },
  };
};

/**
 * 4週間分のカレンダーを生成（今日から4週間分）
 * @param selectedDate 選択された日付（ハイライト表示）
 * @returns カレンダーのFlexCarousel
 */
export const createCalendarCarousel = (selectedDate?: Date): FlexCarousel => {
  const today = new Date();

  // 4週間分のカレンダーを生成
  const bubbles: FlexBubble[] = [];

  // 今月
  bubbles.push(createMonthCalendar(today, selectedDate));

  // 翌月
  const nextMonth = addMonths(today, 1);
  bubbles.push(createMonthCalendar(nextMonth, selectedDate));

  // 必要に応じて3ヶ月目も追加（今日から4週間をカバーするため）
  const fourWeeksLater = addWeeks(today, 4);
  if (!isSameMonth(nextMonth, fourWeeksLater)) {
    const thirdMonth = addMonths(today, 2);
    bubbles.push(createMonthCalendar(thirdMonth, selectedDate));
  }

  return {
    type: "carousel",
    contents: bubbles,
  };
};

/**
 * カレンダーFlexメッセージを作成
 * @param selectedDate 選択された日付（ハイライト表示）
 * @returns カレンダーのFlexContainer
 */
export const createCalendarFlexMessage = (
  selectedDate?: Date,
): FlexCarousel => {
  return createCalendarCarousel(selectedDate);
};
