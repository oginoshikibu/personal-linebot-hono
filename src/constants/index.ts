// コマンドのプレフィックス
export const COMMAND_PREFIX = "/";

// 準備方法の日本語表示マッピング
export const PREPARATION_TYPE_TEXT = {
  COOK_BY_SELF: "家で食べる（担当：自分）",
  INDIVIDUAL: "各自外で食べる",
  BUY_TOGETHER: "家で食べる（担当：誰か）",
} as const;

// 食事タイプの日本語表示マッピング
export const MEAL_TYPE_TEXT = {
  LUNCH: "昼食",
  DINNER: "夕食",
} as const;

// 削除されました - services/mentionService.ts と constants/users.ts に移動

// メッセージテンプレート
export const MESSAGES = {
  ERRORS: {
    INVALID_DATE:
      "無効な日付形式です。YYYY-MM-DD形式、または today/tomorrow を使用してください。",
    INVALID_MEAL_TYPE:
      "無効な食事タイプです。lunch または dinner を使用してください。",
    INVALID_PREPARATION_TYPE:
      "無効な準備方法です。cook（家で食べる・担当：自分）, individual（各自外で食べる）, または buy（家で食べる・担当：誰か）を使用してください。",
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
  準備方法: cook（家で食べる・担当：自分）, individual（各自外で食べる）, buy（家で食べる・担当：誰か）
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
      "使用方法: /register <日付(today/tomorrow/YYYY-MM-DD)> <食事タイプ(lunch/dinner)> <参加(yes/no)> [準備方法(cook:家で食べる・担当：自分/individual:各自外で食べる/buy:家で食べる・担当：誰か)]",
    GENERAL:
      "食事予定管理ボットへようこそ！\n\n以下のコマンドが利用可能です：\n\n/help - このヘルプを表示\n/register - 食事予定を登録\n/check - 食事予定を確認\n/cal - カレンダーを表示",
    REGISTER_COMMAND:
      "【登録コマンド】\n/register <日付> <食事タイプ> <参加> [準備方法]\n\n例: /register today lunch yes cook\n\n日付: today, tomorrow, YYYY-MM-DD\n食事タイプ: lunch, dinner\n参加: yes, no\n準備方法: cook（家で食べる・担当：自分）, individual（各自外で食べる）, buy（家で食べる・担当：誰か）",
    CHECK_COMMAND:
      "【確認コマンド】\n/check [日付]\n\n例: /check tomorrow\n\n日付: today, tomorrow, YYYY-MM-DD (省略時は today)",
    CALENDAR_COMMAND:
      "【カレンダーコマンド】\n/cal [日付]\n\n例: /cal 2023-07-15\n\n日付: YYYY-MM-DD (省略時は選択なし)",
  },
  SUCCESS: {
    REGISTRATION_COMPLETE: "予定を登録しました。",
  },
} as const;
