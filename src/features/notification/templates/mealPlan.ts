import {
  type MealPlan,
  ParticipationStatus,
  PreparationRole,
} from "../../../domain/entities/MealPlan";

export const generateMorningNotification = (
  lunch: MealPlan,
  dinner: MealPlan,
): string => {
  return `【本日の食事予定】
◆ 昼食
Alice: ${getParticipationText(lunch.aliceParticipation)}
Bob: ${getParticipationText(lunch.bobParticipation)}
準備: ${getPreparationText(lunch.preparationRole)}

◆ 夕食
Alice: ${getParticipationText(dinner.aliceParticipation)}
Bob: ${getParticipationText(dinner.bobParticipation)}
準備: ${getPreparationText(dinner.preparationRole)}

予定を変更する場合はメニューから「予定変更」を選択してください。`;
};

export const generateEveningNotification = (
  lunch: MealPlan,
  dinner: MealPlan,
): string => {
  return `【明日の食事予定確認】
◆ 昼食
Alice: ${getParticipationText(lunch.aliceParticipation)}
Bob: ${getParticipationText(lunch.bobParticipation)}
準備: ${getPreparationText(lunch.preparationRole)}

◆ 夕食
Alice: ${getParticipationText(dinner.aliceParticipation)}
Bob: ${getParticipationText(dinner.bobParticipation)}
準備: ${getPreparationText(dinner.preparationRole)}

予定を変更する場合はメニューから「予定変更」を選択してください。`;
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

export function prepareMealPlanData(mealPlan: MealPlan): {
  participants: string[];
  preparationType: string;
} {
  const participants: string[] = [];

  if (mealPlan.aliceParticipation === ParticipationStatus.WILL_PARTICIPATE) {
    participants.push("Alice");
  }
  if (mealPlan.bobParticipation === ParticipationStatus.WILL_PARTICIPATE) {
    participants.push("Bob");
  }

  let preparationType = "UNDECIDED";
  switch (mealPlan.preparationRole) {
    case PreparationRole.ALICE:
      preparationType = "ALICE";
      break;
    case PreparationRole.BOB:
      preparationType = "BOB";
      break;
    case PreparationRole.NONE:
      preparationType = "NONE";
      break;
  }

  return { participants, preparationType };
}
