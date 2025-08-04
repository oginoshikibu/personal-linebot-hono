import type { MealPlan, MealType } from "../entities/MealPlan";

export interface MealPlanRepository {
  findByDateAndType(date: Date, mealType: MealType): Promise<MealPlan | null>;
  save(plan: MealPlan): Promise<MealPlan>;
  findByDateRange(from: Date, to: Date): Promise<MealPlan[]>;
  findByDateRangeAndType(
    from: Date,
    to: Date,
    mealType: MealType,
  ): Promise<MealPlan[]>;
}
