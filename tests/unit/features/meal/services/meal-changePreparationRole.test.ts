import { describe, expect, it, vi } from "vitest";
import {
  MealPlan,
  MealType,
  PreparationRole,
} from "../../../../../src/domain/entities/MealPlan";
import type { MealPlanRepository } from "../../../../../src/domain/repositories/MealPlanRepository";
import { MealPlanService } from "../../../../../src/features/meal/services/meal";
import { CryptoIdGenerator } from "../../../../../src/infrastructure/utils/IdGenerator";

// モックリポジトリの作成
class MockMealPlanRepository implements MealPlanRepository {
  private plans = new Map<string, MealPlan>();

  async findByDateAndType(date: Date, mealType: MealType): Promise<MealPlan | null> {
    const key = `${date.toISOString()}_${mealType}`;
    return this.plans.get(key) || null;
  }

  async save(plan: MealPlan): Promise<MealPlan> {
    const key = `${plan.date.toISOString()}_${plan.mealType}`;
    this.plans.set(key, plan);
    return plan;
  }

  async findByDateRange(): Promise<MealPlan[]> {
    return Array.from(this.plans.values());
  }

  // テスト用ヘルパーメソッド
  setPlan(plan: MealPlan): void {
    const key = `${plan.date.toISOString()}_${plan.mealType}`;
    this.plans.set(key, plan);
  }
}

describe("MealPlanService.changePreparationRole", () => {
  const idGenerator = new CryptoIdGenerator();
  const testDate = new Date("2024-01-15");

  it("準備者を正常に変更できる", async () => {
    const mockRepository = new MockMealPlanRepository();
    const service = new MealPlanService(mockRepository, idGenerator);

    // 既存のディナープランを設定
    const existingPlan = MealPlan.createDinnerPlan(
      testDate,
      PreparationRole.ALICE,
      idGenerator,
    );
    expect(existingPlan.isSuccess).toBe(true);
    mockRepository.setPlan(existingPlan.value);

    // 準備者をBobに変更
    const result = await service.changePreparationRole(
      testDate,
      MealType.DINNER,
      PreparationRole.BOB,
    );

    expect(result.isSuccess).toBe(true);
    expect(result.value.preparationRole).toBe(PreparationRole.BOB);
  });

  it("存在しない食事プランの場合はエラーを返す", async () => {
    const mockRepository = new MockMealPlanRepository();
    const service = new MealPlanService(mockRepository, idGenerator);

    const result = await service.changePreparationRole(
      testDate,
      MealType.DINNER,
      PreparationRole.BOB,
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Meal plan not found.");
  });

  it("MealPlanのchangePreparationRoleが失敗した場合はエラーを返す", async () => {
    const mockRepository = new MockMealPlanRepository();
    const service = new MealPlanService(mockRepository, idGenerator);

    // 昼食プランを設定（昼食は準備者変更不可）
    const lunchPlan = MealPlan.createLunchPlan(testDate, idGenerator);
    mockRepository.setPlan(lunchPlan);

    const result = await service.changePreparationRole(
      testDate,
      MealType.LUNCH,
      PreparationRole.ALICE,
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Lunch preparation role cannot be changed.");
  });

  it("リポジトリのsaveメソッドが呼ばれる", async () => {
    const mockRepository = new MockMealPlanRepository();
    const saveSpy = vi.spyOn(mockRepository, "save");
    const service = new MealPlanService(mockRepository, idGenerator);

    // 既存のディナープランを設定
    const existingPlan = MealPlan.createDinnerPlan(
      testDate,
      PreparationRole.ALICE,
      idGenerator,
    );
    expect(existingPlan.isSuccess).toBe(true);
    mockRepository.setPlan(existingPlan.value);

    await service.changePreparationRole(
      testDate,
      MealType.DINNER,
      PreparationRole.BOB,
    );

    expect(saveSpy).toHaveBeenCalledOnce();
    expect(saveSpy).toHaveBeenCalledWith(existingPlan.value);
  });
});