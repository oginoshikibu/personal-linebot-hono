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
 * 文字列からDateオブジェクトに変換
 * @param dateStr 日付文字列（YYYY-MM-DD形式）
 * @returns Dateオブジェクト、無効な形式の場合はnull
 */
export const parseDate = (dateStr: string): Date | null => {
  try {
    // YYYY-MM-DD形式かどうかをチェック
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return null;
    }

    const [year, month, day] = dateStr.split("-").map(Number);

    // 日付の妥当性をチェック
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);

    // 正しく変換できたかチェック
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    // 作成されたDateオブジェクトの年月日が元の入力と一致するかチェック
    // JavaScript の Date コンストラクタは無効な日付（例：2月30日）を自動的に調整するため
    // 調整後の日付が元の入力と一致しない場合は無効とみなす
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  } catch (_) {
    return null;
  }
};

/**
 * 日付をポストバック用のフォーマットに変換（例: 2023-10-01）
 * @param date 日付
 * @returns YYYY-MM-DD形式の日付文字列
 */
export const formatDateForPostback = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
