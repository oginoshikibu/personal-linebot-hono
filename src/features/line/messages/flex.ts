import type { FlexMessage } from "@line/bot-sdk";
import type { MealPlan } from "../../../domain/entities/MealPlan";
import {
  formatParticipationStatus,
  formatPreparationRoleForDisplay,
} from "../../../utils/mealPlanFormatters";
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
                text: `Alice: ${formatParticipationStatus(lunch.aliceParticipation)}\nBob: ${formatParticipationStatus(lunch.bobParticipation)}\n準備: ${formatPreparationRoleForDisplay(lunch.preparationRole)}`,
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
                text: `Alice: ${formatParticipationStatus(dinner.aliceParticipation)}\nBob: ${formatParticipationStatus(dinner.bobParticipation)}\n準備: ${formatPreparationRoleForDisplay(dinner.preparationRole)}`,
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

