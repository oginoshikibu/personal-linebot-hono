import type { MealPlan } from "../../../domain/entities/MealPlan";
import {
  createAllUserMentions,
  createMentionMessage,
} from "../../../services/mentionService";
import type { TextV2Message } from "../../../types/line";
import {
  formatParticipationStatus,
  formatPreparationRole,
} from "../../../utils/mealPlanFormatters";

export const generateMorningNotification = (
  lunch: MealPlan,
  dinner: MealPlan,
): TextV2Message => {
  const text = `【本日の食事予定】
◆ 昼食
{alice}: ${formatParticipationStatus(lunch.aliceParticipation)}
{bob}: ${formatParticipationStatus(lunch.bobParticipation)}
準備: ${formatPreparationRole(lunch.preparationRole)}

◆ 夕食
{alice}: ${formatParticipationStatus(dinner.aliceParticipation)}
{bob}: ${formatParticipationStatus(dinner.bobParticipation)}
準備: ${formatPreparationRole(dinner.preparationRole)}

予定を変更する場合はメニューから「予定変更」を選択してください。`;

  return createMentionMessage(text, createAllUserMentions());
};

export const generateEveningNotification = (
  lunch: MealPlan,
  dinner: MealPlan,
): TextV2Message => {
  const text = `【明日の食事予定確認】
◆ 昼食
{alice}: ${formatParticipationStatus(lunch.aliceParticipation)}
{bob}: ${formatParticipationStatus(lunch.bobParticipation)}
準備: ${formatPreparationRole(lunch.preparationRole)}

◆ 夕食
{alice}: ${formatParticipationStatus(dinner.aliceParticipation)}
{bob}: ${formatParticipationStatus(dinner.bobParticipation)}
準備: ${formatPreparationRole(dinner.preparationRole)}

予定を変更する場合はメニューから「予定変更」を選択してください。`;

  return createMentionMessage(text, createAllUserMentions());
};

export function prepareMealPlanData(mealPlan: MealPlan): {
  participants: string[];
  preparationType: string;
} {
  const participants: string[] = [];

  if (mealPlan.aliceParticipation === "WILL_PARTICIPATE") {
    participants.push("Alice");
  }
  if (mealPlan.bobParticipation === "WILL_PARTICIPATE") {
    participants.push("Bob");
  }

  return { participants, preparationType: mealPlan.preparationRole };
}
