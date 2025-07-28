import {
  MealPlan,
  MealType,
  type ParticipationStatus,
  type PreparationRole,
} from "../../../domain/entities/MealPlan";
import type { MealPlanRepository } from "../../../domain/repositories/MealPlanRepository";
import { Result } from "../../../domain/types/Result";

export class MealPlanService {
  constructor(private readonly repository: MealPlanRepository) {}

  async getOrCreateTodayMealPlans(): Promise<{
    lunch: MealPlan;
    dinner: MealPlan;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lunch = await this.getOrCreateMealPlan(today, MealType.LUNCH);
    const dinner = await this.getOrCreateMealPlan(today, MealType.DINNER);

    return { lunch, dinner };
  }

  async getOrCreateMealPlan(
    date: Date,
    mealType: MealType,
    preparationRole?: PreparationRole,
  ): Promise<MealPlan> {
    let plan = await this.repository.findByDateAndType(date, mealType);

    if (!plan) {
      if (mealType === MealType.LUNCH) {
        plan = MealPlan.createLunchPlan(date);
      } else {
        if (!preparationRole) {
          throw new Error(
            "Dinner plan creation requires preparer designation.",
          );
        }
        const result = MealPlan.createDinnerPlan(date, preparationRole);
        if (result.isFailure) {
          throw new Error(result.error);
        }
        plan = result.value;
      }

      plan = await this.repository.save(plan);
    }

    return plan;
  }

  async updateParticipation(
    date: Date,
    mealType: MealType,
    person: "Alice" | "Bob",
    status: ParticipationStatus,
  ): Promise<Result<MealPlan>> {
    const plan = await this.repository.findByDateAndType(date, mealType);
    if (!plan) {
      return Result.failure("Meal plan not found.");
    }

    const result =
      person === "Alice"
        ? plan.changeAliceParticipation(status)
        : plan.changeBobParticipation(status);

    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const savedPlan = await this.repository.save(plan);
    return Result.success(savedPlan);
  }

  async preparerQuits(
    date: Date,
    mealType: MealType,
  ): Promise<Result<MealPlan>> {
    const plan = await this.repository.findByDateAndType(date, mealType);
    if (!plan) {
      return Result.failure("Meal plan not found.");
    }

    const result = plan.preparerQuits();
    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const savedPlan = await this.repository.save(plan);
    return Result.success(savedPlan);
  }
}
