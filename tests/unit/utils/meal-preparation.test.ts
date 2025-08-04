import { describe, expect, it } from "vitest";
import { PreparationRole } from "../../../src/domain/entities/MealPlan";
import {
  isUserPreparer,
  shouldShowTakePreparationButton,
} from "../../../src/utils/meal-preparation";

describe("meal-preparation utils", () => {
  describe("isUserPreparer", () => {
    it("Aliceが準備者の場合、Aliceに対してtrueを返す", () => {
      expect(isUserPreparer("Alice", PreparationRole.ALICE)).toBe(true);
    });

    it("Aliceが準備者の場合、Bobに対してfalseを返す", () => {
      expect(isUserPreparer("Bob", PreparationRole.ALICE)).toBe(false);
    });

    it("Bobが準備者の場合、Bobに対してtrueを返す", () => {
      expect(isUserPreparer("Bob", PreparationRole.BOB)).toBe(true);
    });

    it("Bobが準備者の場合、Aliceに対してfalseを返す", () => {
      expect(isUserPreparer("Alice", PreparationRole.BOB)).toBe(false);
    });

    it("準備者がNONEの場合、誰に対してもfalseを返す", () => {
      expect(isUserPreparer("Alice", PreparationRole.NONE)).toBe(false);
      expect(isUserPreparer("Bob", PreparationRole.NONE)).toBe(false);
    });
  });

  describe("shouldShowTakePreparationButton", () => {
    it("準備者でないユーザーで、準備者が存在する場合、trueを返す", () => {
      expect(
        shouldShowTakePreparationButton("Bob", PreparationRole.ALICE),
      ).toBe(true);
      expect(
        shouldShowTakePreparationButton("Alice", PreparationRole.BOB),
      ).toBe(true);
    });

    it("準備者のユーザーに対してはfalseを返す", () => {
      expect(
        shouldShowTakePreparationButton("Alice", PreparationRole.ALICE),
      ).toBe(false);
      expect(
        shouldShowTakePreparationButton("Bob", PreparationRole.BOB),
      ).toBe(false);
    });

    it("準備者がNONEの場合、誰に対してもfalseを返す", () => {
      expect(
        shouldShowTakePreparationButton("Alice", PreparationRole.NONE),
      ).toBe(false);
      expect(
        shouldShowTakePreparationButton("Bob", PreparationRole.NONE),
      ).toBe(false);
    });
  });
});