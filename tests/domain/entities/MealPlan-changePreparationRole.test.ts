import { describe, expect, it } from "vitest";
import {
  MealPlan,
  MealType,
  ParticipationStatus,
  PreparationRole,
} from "../../../src/domain/entities/MealPlan";
import { CryptoIdGenerator } from "../../../src/infrastructure/utils/IdGenerator";

describe("MealPlan.changePreparationRole", () => {
  const idGenerator = new CryptoIdGenerator();
  const testDate = new Date("2024-01-15");

  describe("成功ケース", () => {
    it("AliceからBobに準備者を変更できる", () => {
      const plan = MealPlan.createDinnerPlan(
        testDate,
        PreparationRole.ALICE,
        idGenerator,
      );
      expect(plan.isSuccess).toBe(true);
      
      const mealPlan = plan.value;
      const result = mealPlan.changePreparationRole(PreparationRole.BOB);
      
      expect(result.isSuccess).toBe(true);
      expect(mealPlan.preparationRole).toBe(PreparationRole.BOB);
      expect(mealPlan.bobParticipation).toBe(ParticipationStatus.WILL_PARTICIPATE);
      // Aliceの参加状況は変更されない
      expect(mealPlan.aliceParticipation).toBe(ParticipationStatus.WILL_PARTICIPATE);
    });

    it("BobからAliceに準備者を変更できる", () => {
      const plan = MealPlan.createDinnerPlan(
        testDate,
        PreparationRole.BOB,
        idGenerator,
      );
      expect(plan.isSuccess).toBe(true);
      
      const mealPlan = plan.value;
      const result = mealPlan.changePreparationRole(PreparationRole.ALICE);
      
      expect(result.isSuccess).toBe(true);
      expect(mealPlan.preparationRole).toBe(PreparationRole.ALICE);
      expect(mealPlan.aliceParticipation).toBe(ParticipationStatus.WILL_PARTICIPATE);
      // Bobの参加状況は変更されない
      expect(mealPlan.bobParticipation).toBe(ParticipationStatus.WILL_PARTICIPATE);
    });

    it("準備者変更時に新しい準備者の参加状況が確実に設定される", () => {
      const plan = MealPlan.createDinnerPlan(
        testDate,
        PreparationRole.ALICE,
        idGenerator,
      );
      expect(plan.isSuccess).toBe(true);
      
      const mealPlan = plan.value;
      // Bobを一度不参加にする
      mealPlan.changeBobParticipation(ParticipationStatus.WILL_NOT_PARTICIPATE);
      expect(mealPlan.bobParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
      
      // Bobを準備者にする
      const result = mealPlan.changePreparationRole(PreparationRole.BOB);
      
      expect(result.isSuccess).toBe(true);
      expect(mealPlan.preparationRole).toBe(PreparationRole.BOB);
      // Bobは自動的に参加になる
      expect(mealPlan.bobParticipation).toBe(ParticipationStatus.WILL_PARTICIPATE);
    });
  });

  describe("失敗ケース", () => {
    it("昼食の準備者は変更できない", () => {
      const lunchPlan = MealPlan.createLunchPlan(testDate, idGenerator);
      
      const result = lunchPlan.changePreparationRole(PreparationRole.ALICE);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Lunch preparation role cannot be changed.");
    });

    it("準備者をNONEに設定することはできない", () => {
      const plan = MealPlan.createDinnerPlan(
        testDate,
        PreparationRole.ALICE,
        idGenerator,
      );
      expect(plan.isSuccess).toBe(true);
      
      const mealPlan = plan.value;
      const result = mealPlan.changePreparationRole(PreparationRole.NONE);
      
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Cannot set preparation role to NONE. Use preparerQuits() instead.");
    });
  });

  describe("状態更新", () => {
    it("準備者変更時にupdatedAtが更新される", () => {
      const plan = MealPlan.createDinnerPlan(
        testDate,
        PreparationRole.ALICE,
        idGenerator,
      );
      expect(plan.isSuccess).toBe(true);
      
      const mealPlan = plan.value;
      const originalUpdatedAt = mealPlan.updatedAt;
      
      // 少し時間を置く
      setTimeout(() => {
        mealPlan.changePreparationRole(PreparationRole.BOB);
        expect(mealPlan.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });
});