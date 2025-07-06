import type { MealParticipation, MealPlan, User } from "@prisma/client";

// MealPlanの拡張型
export type MealPlanWithRelations = MealPlan & {
  participations: MealParticipationWithUser[];
  cooker?: User | null;
};

// MealParticipationの拡張型
export type MealParticipationWithUser = MealParticipation & {
  user: User;
};
