import { describe, it, expect } from 'vitest';
import { MealPlan, MealType, PreparationRole, ParticipationStatus } from '../../../src/domain/entities/MealPlan';

describe('MealPlan', () => {
  describe('createLunchPlan', () => {
    it('Bob固定担当で昼食計画を作成する', () => {
      const date = new Date('2024-01-15');
      const plan = MealPlan.createLunchPlan(date);

      expect(plan.mealType).toBe(MealType.LUNCH);
      expect(plan.preparationRole).toBe(PreparationRole.BOB);
      expect(plan.aliceParticipation).toBe(ParticipationStatus.WILL_PARTICIPATE);
      expect(plan.bobParticipation).toBe(ParticipationStatus.WILL_PARTICIPATE);
      expect(plan.currentState).toBe(1);
    });
  });

  describe('createDinnerPlan', () => {
    it('Alice担当で夕食計画を作成する', () => {
      const date = new Date('2024-01-15');
      const result = MealPlan.createDinnerPlan(date, PreparationRole.ALICE);

      expect(result.isSuccess).toBe(true);
      const plan = result.value;
      expect(plan.mealType).toBe(MealType.DINNER);
      expect(plan.preparationRole).toBe(PreparationRole.ALICE);
      expect(plan.currentState).toBe(3);
    });

    it('担当者なしの場合はエラーを返す', () => {
      const date = new Date('2024-01-15');
      const result = MealPlan.createDinnerPlan(date, PreparationRole.NONE);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Dinner plan requires a designated preparer.");
    });
  });

  describe('preparerQuits', () => {
    it('担当者辞退時に全員不参加になる', () => {
      const plan = MealPlan.createLunchPlan(new Date());
      const result = plan.preparerQuits();

      expect(result.isSuccess).toBe(true);
      expect(plan.preparationRole).toBe(PreparationRole.NONE);
      expect(plan.aliceParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
      expect(plan.bobParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
    });
  });

  describe('changeAliceParticipation', () => {
    it('担当者でない場合は不参加に変更できる', () => {
      const result = MealPlan.createDinnerPlan(new Date(), PreparationRole.BOB);
      const plan = result.value;
      
      const changeResult = plan.changeAliceParticipation(ParticipationStatus.WILL_NOT_PARTICIPATE);
      
      expect(changeResult.isSuccess).toBe(true);
      expect(plan.aliceParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
    });

    it('担当者の場合は不参加に変更できない', () => {
      const result = MealPlan.createDinnerPlan(new Date(), PreparationRole.ALICE);
      const plan = result.value;
      
      const changeResult = plan.changeAliceParticipation(ParticipationStatus.WILL_NOT_PARTICIPATE);
      
      expect(changeResult.isFailure).toBe(true);
      expect(changeResult.error).toBe("Preparer must participate in the meal.");
    });
  });
});