import { describe, it, expect } from 'vitest';
import { MealPlan, MealType, PreparationRole, ParticipationStatus, IdGenerator } from '../../../src/domain/entities/MealPlan';

const mockIdGenerator: IdGenerator = {
  generate: () => 'test-id'
};

describe('MealPlan', () => {
  describe('createLunchPlan', () => {
    it('Bob固定担当で昼食計画を作成する', () => {
      const date = new Date('2024-01-15');
      const plan = MealPlan.createLunchPlan(date, mockIdGenerator);

      expect(plan.id).toBe('test-id');
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
      const result = MealPlan.createDinnerPlan(date, PreparationRole.ALICE, mockIdGenerator);

      expect(result.isSuccess).toBe(true);
      const plan = result.value;
      expect(plan.id).toBe('test-id');
      expect(plan.mealType).toBe(MealType.DINNER);
      expect(plan.preparationRole).toBe(PreparationRole.ALICE);
      expect(plan.currentState).toBe(3);
    });

    it('担当者なしの場合はエラーを返す', () => {
      const date = new Date('2024-01-15');
      const result = MealPlan.createDinnerPlan(date, PreparationRole.NONE, mockIdGenerator);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("Dinner plan creation requires preparationRole parameter to be specified (ALICE or BOB).");
    });
  });

  describe('preparerQuits', () => {
    it('担当者辞退時に全員不参加になる', () => {
      const plan = MealPlan.createLunchPlan(new Date(), mockIdGenerator);
      const result = plan.preparerQuits();

      expect(result.isSuccess).toBe(true);
      expect(plan.preparationRole).toBe(PreparationRole.NONE);
      expect(plan.aliceParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
      expect(plan.bobParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
    });
  });

  describe('changeAliceParticipation', () => {
    it('担当者でない場合は不参加に変更できる', () => {
      const result = MealPlan.createDinnerPlan(new Date(), PreparationRole.BOB, mockIdGenerator);
      const plan = result.value;
      
      const changeResult = plan.changeAliceParticipation(ParticipationStatus.WILL_NOT_PARTICIPATE);
      
      expect(changeResult.isSuccess).toBe(true);
      expect(plan.aliceParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
    });

    it('担当者の場合は不参加に変更できない', () => {
      const result = MealPlan.createDinnerPlan(new Date(), PreparationRole.ALICE, mockIdGenerator);
      const plan = result.value;
      
      const changeResult = plan.changeAliceParticipation(ParticipationStatus.WILL_NOT_PARTICIPATE);
      
      expect(changeResult.isFailure).toBe(true);
      expect(changeResult.error).toBe("Preparer must participate in the meal.");
    });
  });
});