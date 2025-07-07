import type { TemplateContent } from "@line/bot-sdk";

/**
 * 食事予定登録用のボタンテンプレートを作成
 * @returns テンプレートオブジェクト
 */
export const createRegisterMenuTemplate = (): TemplateContent => {
  return {
    type: "buttons",
    text: "登録する食事予定を選択してください",
    actions: [
      {
        type: "datetimepicker",
        label: "昼食を登録",
        data: "action=register&mealType=LUNCH",
        mode: "date",
      },
      {
        type: "datetimepicker",
        label: "夕食を登録",
        data: "action=register&mealType=DINNER",
        mode: "date",
      },
    ],
  };
};

/**
 * 食事予定変更用のボタンテンプレートを作成
 * @returns テンプレートオブジェクト
 */
export const createChangeMenuTemplate = (): TemplateContent => {
  return {
    type: "buttons",
    text: "変更する食事予定を選択してください",
    actions: [
      {
        type: "datetimepicker",
        label: "昼食を変更",
        data: "action=change&mealType=LUNCH",
        mode: "date",
      },
      {
        type: "datetimepicker",
        label: "夕食を変更",
        data: "action=change&mealType=DINNER",
        mode: "date",
      },
    ],
  };
};

/**
 * 食事予定確認用のボタンテンプレートを作成
 * @returns テンプレートオブジェクト
 */
export const createCheckMenuTemplate = (): TemplateContent => {
  return {
    type: "buttons",
    text: "確認する食事予定を選択してください",
    actions: [
      {
        type: "datetimepicker",
        label: "昼食を確認",
        data: "action=check&mealType=LUNCH",
        mode: "date",
      },
      {
        type: "datetimepicker",
        label: "夕食を確認",
        data: "action=check&mealType=DINNER",
        mode: "date",
      },
    ],
  };
};

/**
 * メインメニュー用のボタンテンプレートを作成
 * @returns テンプレートオブジェクト
 */
export const createMainMenuTemplate = (): TemplateContent => {
  return {
    type: "buttons",
    text: "メニューから選択してください",
    actions: [
      {
        type: "message",
        label: "予定登録",
        text: "予定登録",
      },
      {
        type: "message",
        label: "予定変更",
        text: "予定変更",
      },
      {
        type: "message",
        label: "予定確認",
        text: "予定確認",
      },
      {
        type: "message",
        label: "今後の予定",
        text: "今後の予定",
      },
    ],
  };
};

/**
 * 食事予定登録オプション用のボタンテンプレートを作成
 * @param dateText 日付テキスト
 * @param mealTypeText 食事タイプテキスト
 * @param dateStr 日付文字列
 * @param mealType 食事タイプ
 * @returns テンプレートオブジェクト
 */
export const createRegistrationOptionsTemplate = (
  dateText: string,
  mealTypeText: string,
  dateStr: string,
  mealType: string,
): TemplateContent => {
  return {
    type: "buttons",
    text: `${dateText}の${mealTypeText}の予定を登録します。\n参加状況を選択してください。`,
    actions: [
      {
        type: "postback",
        label: "参加する",
        data: `action=register_attend&date=${dateStr}&mealType=${mealType}`,
        displayText: `${dateText}の${mealTypeText}に参加します`,
      },
      {
        type: "postback",
        label: "参加しない",
        data: `action=register_absent&date=${dateStr}&mealType=${mealType}`,
        displayText: `${dateText}の${mealTypeText}に参加しません`,
      },
      {
        type: "postback",
        label: "自分が作る",
        data: `action=register_cook&date=${dateStr}&mealType=${mealType}`,
        displayText: `${dateText}の${mealTypeText}は自分が作ります`,
      },
      {
        type: "postback",
        label: "買って食べる",
        data: `action=register_buy&date=${dateStr}&mealType=${mealType}`,
        displayText: `${dateText}の${mealTypeText}は買って食べます`,
      },
    ],
  };
};
