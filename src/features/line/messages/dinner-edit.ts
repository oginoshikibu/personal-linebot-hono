import type { FlexBubble } from "@line/bot-sdk";
import type { MealPlan } from "../../../domain/entities/MealPlan";
import { shouldShowTakePreparationButton } from "../../../utils/meal-preparation";

interface DinnerEditButton {
  type: "button";
  action: {
    type: "postback";
    label: string;
    data: string;
  };
  style: "primary" | "secondary";
}

/**
 * 夕食編集用のFlexメッセージを作成する
 * @param dateStr 日付文字列
 * @param mealPlan 食事プラン
 * @param person ユーザー名
 * @returns Flexメッセージの内容
 */
export const createDinnerEditFlexMessage = (
  dateStr: string,
  mealPlan: MealPlan,
  person: "Alice" | "Bob",
): { type: "flex"; altText: string; contents: FlexBubble } => {
  const buttons = createEditButtons(dateStr, mealPlan, person);

  return {
    type: "flex" as const,
    altText: `${dateStr} ディナーの編集`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${dateStr} ディナーの編集`,
            weight: "bold",
            size: "lg",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `現在の状態:\nAlice: ${mealPlan.aliceParticipation}\nBob: ${mealPlan.bobParticipation}\n準備担当: ${mealPlan.preparationRole}`,
            wrap: true,
          },
          ...buttons,
        ],
      },
    },
  };
};

/**
 * 編集用ボタンを作成する
 * @param dateStr 日付文字列
 * @param mealPlan 食事プラン
 * @param person ユーザー名
 * @returns ボタンの配列
 */
const createEditButtons = (
  dateStr: string,
  mealPlan: MealPlan,
  person: "Alice" | "Bob",
): DinnerEditButton[] => {
  const buttons: DinnerEditButton[] = [
    {
      type: "button",
      action: {
        type: "postback",
        label: "参加する",
        data: `action=participate&date=${dateStr}&mealType=DINNER`,
      },
      style: "primary",
    },
    {
      type: "button",
      action: {
        type: "postback",
        label: "参加しない",
        data: `action=not_participate&date=${dateStr}&mealType=DINNER`,
      },
      style: "secondary",
    },
  ];

  // 準備者を奪うボタンを条件付きで追加
  if (shouldShowTakePreparationButton(person, mealPlan.preparationRole)) {
    buttons.push({
      type: "button",
      action: {
        type: "postback",
        label: "準備者を奪う",
        data: `action=take_preparation&date=${dateStr}&mealType=DINNER`,
      },
      style: "secondary",
    });
  }

  return buttons;
};
