// コマンドのプレフィックス
export const COMMAND_PREFIX = "/";

// 準備方法の日本語表示マッピング
export const PREPARATION_TYPE_TEXT = {
  COOK_BY_SELF: "自炊",
  INDIVIDUAL: "各自自由",
  BUY_TOGETHER: "買って一緒に食べる",
} as const;

// 食事タイプの日本語表示マッピング
export const MEAL_TYPE_TEXT = {
  LUNCH: "昼食",
  DINNER: "夕食",
} as const;

// メッセージテンプレート
export const MESSAGES = {
  ERRORS: {
    INVALID_DATE:
      "無効な日付形式です。YYYY-MM-DD形式、または today/tomorrow を使用してください。",
    INVALID_MEAL_TYPE:
      "無効な食事タイプです。lunch または dinner を使用してください。",
    INVALID_PREPARATION_TYPE:
      "無効な準備方法です。cook, individual, または buy を使用してください。",
    MISSING_PARAMETERS:
      "必要なパラメータが不足しています。もう一度お試しください。",
    REGISTRATION_FAILED:
      "予定の登録中にエラーが発生しました。もう一度お試しください。",
    UNKNOWN_COMMAND: "未知のコマンドです。/help でコマンド一覧を表示します。",
    UNKNOWN_POSTBACK: "不明な操作です。もう一度お試しください。",
    PROCESSING_ERROR: "処理中にエラーが発生しました。もう一度お試しください。",
  },
  HELP: {
    COMMAND_LIST: `【コマンド一覧】
/help - このヘルプを表示
/register <日付> <食事タイプ> <参加> [準備方法] - 食事予定を登録
  例: /register today lunch yes cook
  日付: today, tomorrow, YYYY-MM-DD
  食事タイプ: lunch, dinner
  参加: yes, no
  準備方法: cook, individual, buy
/check [日付] - 食事予定を確認
  例: /check tomorrow
  日付: today, tomorrow, YYYY-MM-DD (省略時は today)
/cal [日付] - カレンダーを表示
  例: /cal 2023-07-15
  日付: YYYY-MM-DD (省略時は選択なし)

【メニュー】
予定登録 - 食事予定を登録
予定変更 - 食事予定を変更
予定確認 - 食事予定を確認
ヘルプ - このヘルプを表示`,
    CALENDAR_EXPLANATION: "カレンダーから日付を選択して、予定を確認できます。",
    REGISTER_USAGE:
      "使用方法: /register <日付(today/tomorrow/YYYY-MM-DD)> <食事タイプ(lunch/dinner)> <参加(yes/no)> [準備方法(cook/individual/buy)]",
  },
  SUCCESS: {
    REGISTRATION_COMPLETE: "予定を登録しました。",
  },
} as const;
