import type { FlexMessage } from "@line/bot-sdk";
import {
  type MealPlan,
  ParticipationStatus,
  PreparationRole,
} from "../../../domain/entities/MealPlan";
import { formatDate } from "../../../utils/date";

export const createMealPlanFlexMessage = (
  date: Date,
  lunch: MealPlan,
  dinner: MealPlan,
): FlexMessage => {
  return {
    type: "flex",
    altText: `${formatDate(date)}の食事予定`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${formatDate(date)}の食事予定`,
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
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "◆ 昼食",
                weight: "bold",
                margin: "md",
              },
              {
                type: "text",
                text: `Alice: ${getParticipationText(lunch.aliceParticipation)}\nBob: ${getParticipationText(lunch.bobParticipation)}\n準備: ${getPreparationText(lunch.preparationRole)}`,
                size: "sm",
                wrap: true,
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "◆ 夕食",
                weight: "bold",
                margin: "md",
              },
              {
                type: "text",
                text: `Alice: ${getParticipationText(dinner.aliceParticipation)}\nBob: ${getParticipationText(dinner.bobParticipation)}\n準備: ${getPreparationText(dinner.preparationRole)}`,
                size: "sm",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "button",
            action: {
              type: "postback",
              label: "昼食を編集",
              data: `action=edit_meal&date=${formatDate(date)}&mealType=LUNCH`,
            },
            style: "secondary",
            flex: 1,
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "夕食を編集",
              data: `action=edit_meal&date=${formatDate(date)}&mealType=DINNER`,
            },
            style: "secondary",
            flex: 1,
          },
        ],
      },
    },
  };
};

function getParticipationText(status: ParticipationStatus): string {
  switch (status) {
    case ParticipationStatus.WILL_PARTICIPATE:
      return "参加";
    case ParticipationStatus.WILL_NOT_PARTICIPATE:
      return "不参加";
    case ParticipationStatus.UNDECIDED:
      return "未定";
  }
}

function getPreparationText(role: PreparationRole): string {
  switch (role) {
    case PreparationRole.ALICE:
      return "Aliceが作る";
    case PreparationRole.BOB:
      return "Bobが作る";
    case PreparationRole.NONE:
      return "なし";
  }
}
