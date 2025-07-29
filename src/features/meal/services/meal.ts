import {
  type IdGenerator,
  MealPlan,
  MealType,
  type ParticipationStatus,
  PreparationRole,
} from "../../../domain/entities/MealPlan";
import type { MealPlanRepository } from "../../../domain/repositories/MealPlanRepository";
import { Result } from "../../../domain/types/Result";

export class MealPlanService {
  constructor(
    private readonly repository: MealPlanRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async getOrCreateTodayMealPlans(): Promise<{
    lunch: MealPlan;
    dinner: MealPlan;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log(`[MealPlanService] 今日の日付: ${today.toISOString()}`);

      console.log(`[MealPlanService] ランチプラン取得開始`);
      const lunch = await this.getOrCreateMealPlan(today, MealType.LUNCH);
      console.log(`[MealPlanService] ランチプラン取得完了: ${lunch.id}`);
      
      console.log(`[MealPlanService] ディナープラン取得開始`);
      const dinner = await this.getOrCreateMealPlan(today, MealType.DINNER, PreparationRole.BOB);
      console.log(`[MealPlanService] ディナープラン取得完了: ${dinner.id}`);

      return { lunch, dinner };
    } catch (error) {
      console.error(`[MealPlanService] getOrCreateTodayMealPlansエラー:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async getOrCreateMealPlan(
    date: Date,
    mealType: MealType,
    preparationRole?: PreparationRole,
  ): Promise<MealPlan> {
    try {
      console.log(`[MealPlanService] getOrCreateMealPlan開始: ${mealType}, ${date.toISOString()}`);
      
      let plan = await this.repository.findByDateAndType(date, mealType);
      console.log(`[MealPlanService] 既存プラン検索結果: ${plan ? `見つかった(${plan.id})` : '見つからない'}`);

      if (!plan) {
        console.log(`[MealPlanService] 新しいプランを作成: ${mealType}`);
        if (mealType === MealType.LUNCH) {
          console.log(`[MealPlanService] ランチプラン作成中`);
          plan = MealPlan.createLunchPlan(date, this.idGenerator);
          console.log(`[MealPlanService] ランチプラン作成完了: ${plan.id}`);
        } else {
          if (!preparationRole) {
            throw new Error(
              "Dinner plan creation requires preparationRole parameter to be specified (ALICE or BOB).",
            );
          }
          console.log(`[MealPlanService] ディナープラン作成中: ${preparationRole}`);
          const result = MealPlan.createDinnerPlan(
            date,
            preparationRole,
            this.idGenerator,
          );
          if (result.isFailure) {
            console.error(`[MealPlanService] ディナープラン作成エラー: ${result.error}`);
            throw new Error(result.error);
          }
          plan = result.value;
          console.log(`[MealPlanService] ディナープラン作成完了: ${plan.id}`);
        }

        console.log(`[MealPlanService] プランをデータベースに保存中`);
        plan = await this.repository.save(plan);
        console.log(`[MealPlanService] プラン保存完了: ${plan.id}`);
      }

      return plan;
    } catch (error) {
      console.error(`[MealPlanService] getOrCreateMealPlanエラー:`, {
        mealType,
        date: date.toISOString(),
        preparationRole,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
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
