import type { FlexBox, FlexBubble, FlexComponent } from "@line/bot-sdk";
import type { MealPlanData } from "../../../types";

/**
 * 食事予定確認用のFlexメッセージを作成
 * @param title メッセージタイトル
 * @param lunchData 昼食データ
 * @param dinnerData 夕食データ
 * @returns Flexメッセージのコンテンツ
 */
export const createMealPlanFlexMessage = (
  title: string,
  lunchData: MealPlanData,
  dinnerData: MealPlanData,
): FlexBubble => {
  // 準備方法の日本語表示
  const getPreparationTypeText = (type: string, cooker?: string) => {
    switch (type) {
      case "COOK_BY_SELF":
        return cooker ? `${cooker}が作る` : "自分が作る";
      case "INDIVIDUAL":
        return "各自自由に";
      case "BUY_TOGETHER":
        return "買って一緒に食べる";
      default:
        return "未定";
    }
  };

  // 参加者コンポーネントを作成
  const createParticipantComponents = (
    participants: { name: string; attending: boolean }[],
  ): FlexComponent[] => {
    return participants.map((participant) => ({
      type: "box" as const,
      layout: "baseline" as const,
      contents: [
        {
          type: "text" as const,
          text: participant.name,
          size: "sm",
          color: "#555555",
          flex: 2,
        },
        {
          type: "text" as const,
          text: participant.attending ? "参加" : "不参加",
          size: "sm",
          color: participant.attending ? "#1DB446" : "#FF5551",
          align: "end",
          flex: 1,
        },
      ],
      spacing: "sm",
    }));
  };

  // 食事情報セクションを作成
  const createMealSection = (
    title: string,
    mealData: MealPlanData,
    color: string,
  ): FlexBox => {
    return {
      type: "box" as const,
      layout: "vertical" as const,
      contents: [
        {
          type: "box" as const,
          layout: "horizontal" as const,
          contents: [
            {
              type: "text" as const,
              text: title,
              size: "md",
              color: color,
              weight: "bold",
            },
          ],
        },
        {
          type: "box" as const,
          layout: "vertical" as const,
          contents: [
            {
              type: "box" as const,
              layout: "horizontal" as const,
              contents: [
                {
                  type: "text" as const,
                  text: "準備方法",
                  size: "sm",
                  color: "#555555",
                  flex: 2,
                },
                {
                  type: "text" as const,
                  text: getPreparationTypeText(
                    mealData.preparationType,
                    mealData.cooker,
                  ),
                  size: "sm",
                  color: "#111111",
                  align: "end",
                  flex: 3,
                },
              ],
            },
            {
              type: "separator" as const,
              margin: "md",
            },
            {
              type: "text" as const,
              text: "参加者",
              size: "xs",
              color: "#aaaaaa",
              margin: "md",
            },
            ...createParticipantComponents(mealData.participants),
          ],
          paddingAll: "md",
        },
      ],
      paddingTop: "xl",
    };
  };

  // Flexメッセージを作成
  return {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: title,
          weight: "bold",
          color: "#1DB446",
          size: "lg",
        },
      ],
      paddingAll: "md",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        createMealSection("昼食", lunchData, "#FF6B6E"),
        createMealSection("夕食", dinnerData, "#6B66FF"),
      ],
      paddingAll: "md",
    },
    styles: {
      footer: {
        separator: true,
      },
    },
  };
};
