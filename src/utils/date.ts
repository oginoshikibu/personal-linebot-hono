/**
 * 指定された日付の0時0分0秒のDateオブジェクトを取得
 * @param date 日付
 * @returns 0時0分0秒に設定されたDateオブジェクト
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * 指定された日付の23時59分59秒のDateオブジェクトを取得
 * @param date 日付
 * @returns 23時59分59秒に設定されたDateオブジェクト
 */
export const getEndOfDay = (date: Date = new Date()): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * 指定された日数を加算した日付を取得
 * @param days 加算する日数
 * @param date 基準となる日付（デフォルトは現在）
 * @returns 日数を加算した新しいDateオブジェクト
 */
export const addDays = (days: number, date: Date = new Date()): Date => {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
};

/**
 * 日付をYYYY-MM-DD形式の文字列に変換
 * @param date 日付
 * @returns YYYY-MM-DD形式の文字列
 */
export const formatDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * 日付を日本語の曜日付きフォーマットに変換（例: 2023年10月1日（日））
 * @param date 日付
 * @returns 日本語の曜日付き日付文字列
 */
export const formatDateJP = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${year}年${month}月${day}日（${dayOfWeek}）`;
};

/**
 * 時刻をHH:MM形式の文字列に変換
 * @param date 日付
 * @returns HH:MM形式の文字列
 */
export const formatTime = (date: Date = new Date()): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};
