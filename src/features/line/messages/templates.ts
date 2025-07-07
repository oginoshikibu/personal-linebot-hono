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
        label: "今日の予定",
        text: "今日の予定",
      },
      {
        type: "message",
        label: "明日の予定",
        text: "明日の予定",
      },
      {
        type: "message",
        label: "今週の予定",
        text: "今週の予定",
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

/**
 * 編集オプション用のボタンテンプレートを作成
 * @param dateText 日付テキスト
 * @param dateStr 日付文字列
 * @returns テンプレートオブジェクト
 */
export const createEditOptionsTemplate = (
  dateText: string,
  dateStr: string,
): TemplateContent => {
  return {
    type: "buttons",
    text: `${dateText}の予定を編集しますか？`,
    actions: [
      {
        type: "postback",
        label: "はい",
        data: `action=edit&date=${dateStr}`,
        displayText: `${dateText}の予定を編集します`,
      },
      {
        type: "message",
        label: "いいえ",
        text: "キャンセル",
      },
    ],
  };
};

/**
 * 昼食の予定質問用のボタンテンプレートを作成
 * @param dateStr 日付文字列
 * @returns テンプレートオブジェクト
 */
export const createLunchOptionsTemplate = (dateStr: string): TemplateContent => {
  return {
    type: "buttons",
    text: "昼食の予定を選択してください",
    actions: [
      {
        type: "postback",
        label: "参加する",
        data: `action=lunch_attend&date=${dateStr}`,
        displayText: "昼食に参加します",
      },
      {
        type: "postback",
        label: "参加しない",
        data: `action=lunch_absent&date=${dateStr}`,
        displayText: "昼食に参加しません",
      },
      {
        type: "postback",
        label: "自分が作る",
        data: `action=lunch_cook&date=${dateStr}`,
        displayText: "昼食は自分が作ります",
      },
      {
        type: "postback",
        label: "未定",
        data: `action=lunch_undecided&date=${dateStr}`,
        displayText: "昼食は未定です",
      },
    ],
  };
};

/**
 * 夕食の予定質問用のボタンテンプレートを作成
 * @param dateStr 日付文字列
 * @param canCancel キャンセルボタンを表示するかどうか
 * @returns テンプレートオブジェクト
 */
export const createDinnerOptionsTemplate = (
  dateStr: string,
  canCancel = true,
): TemplateContent => {
  const actions = [
    {
      type: "postback",
      label: "参加する",
      data: `action=dinner_attend&date=${dateStr}`,
      displayText: "夕食に参加します",
    },
    {
      type: "postback",
      label: "参加しない",
      data: `action=dinner_absent&date=${dateStr}`,
      displayText: "夕食に参加しません",
    },
    {
      type: "postback",
      label: "自分が作る",
      data: `action=dinner_cook&date=${dateStr}`,
      displayText: "夕食は自分が作ります",
    },
    {
      type: "postback",
      label: "未定",
      data: `action=dinner_undecided&date=${dateStr}`,
      displayText: "夕食は未定です",
    },
  ];

  if (canCancel) {
    actions.push({
      type: "postback",
      label: "キャンセル",
      data: `action=dinner_cancel&date=${dateStr}`,
      displayText: "夕食の入力をキャンセルします",
    });
  }

  return {
    type: "buttons",
    text: "夕食の予定を選択してください",
    actions: actions.slice(0, 4), // LINEのボタンは最大4つまで
  };
};

/**
 * 日付選択オプション用のボタンテンプレートを作成
 * @param dateText 日付テキスト
 * @param dateStr 日付文字列
 * @returns テンプレートオブジェクト
 */
export const createDateSelectionOptionsTemplate = (
  dateText: string,
  dateStr: string,
): TemplateContent => {
  return {
    type: "buttons",
    text: `${dateText}の予定を確認・編集できます`,
    actions: [
      {
        type: "postback",
        label: "予定を確認",
        data: `action=check&date=${dateStr}`,
        displayText: `${dateText}の予定を確認します`,
      },
      {
        type: "postback",
        label: "予定を編集",
        data: `action=edit&date=${dateStr}`,
        displayText: `${dateText}の予定を編集します`,
      },
      {
        type: "message",
        label: "キャンセル",
        text: "キャンセル",
      },
    ],
  };
};
