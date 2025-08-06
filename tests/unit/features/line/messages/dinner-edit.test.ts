import { describe, expect, it } from "vitest";
import {
  MealPlan,
  MealType,
  ParticipationStatus,
  PreparationRole,
} from "../../../../../src/domain/entities/MealPlan";
import { USERS } from "../../../../../src/constants/users";
import { createDinnerEditFlexMessage } from "../../../../../src/features/line/messages/dinner-edit";
import { CryptoIdGenerator } from "../../../../../src/infrastructure/utils/IdGenerator";

describe("createDinnerEditFlexMessage", () => {
  const idGenerator = new CryptoIdGenerator();
  const testDate = new Date("2024-01-15");
  const dateStr = "2024-01-15";

  it("基本的なFlexメッセージを作成する", () => {
    const plan = MealPlan.createDinnerPlan(
      testDate,
      PreparationRole.ALICE,
      idGenerator,
    );
    expect(plan.isSuccess).toBe(true);
    
    const mealPlan = plan.value;
    const result = createDinnerEditFlexMessage(dateStr, mealPlan, "Bob");

    expect(result.type).toBe("flex");
    expect(result.altText).toBe("2024-01-15 ディナーの編集");
    expect(result.contents.type).toBe("bubble");
    expect(result.contents.header?.contents?.[0]).toMatchObject({
      type: "text",
      text: "2024-01-15 ディナーの編集",
    });
  });

  it("準備者でないユーザーには「準備者を奪う」ボタンを表示する", () => {
    const plan = MealPlan.createDinnerPlan(
      testDate,
      PreparationRole.ALICE,
      idGenerator,
    );
    expect(plan.isSuccess).toBe(true);
    
    const mealPlan = plan.value;
    const result = createDinnerEditFlexMessage(dateStr, mealPlan, "Bob");

    const bodyContents = result.contents.body?.contents;
    expect(bodyContents).toBeDefined();
    
    // ボタンは「参加する」「参加しない」「準備者を奪う」の3つ
    const buttons = bodyContents?.slice(1); // 最初は状態表示テキスト
    expect(buttons).toHaveLength(3);
    
    const takePreparationButton = buttons?.[2];
    expect(takePreparationButton).toMatchObject({
      type: "button",
      action: {
        type: "postback",
        label: "準備者を奪う",
        data: `action=take_preparation&date=${dateStr}&mealType=DINNER`,
      },
    });
  });

  it("準備者には「準備者を奪う」ボタンを表示しない", () => {
    const plan = MealPlan.createDinnerPlan(
      testDate,
      PreparationRole.ALICE,
      idGenerator,
    );
    expect(plan.isSuccess).toBe(true);
    
    const mealPlan = plan.value;
    const result = createDinnerEditFlexMessage(dateStr, mealPlan, "Alice");

    const bodyContents = result.contents.body?.contents;
    expect(bodyContents).toBeDefined();
    
    // ボタンは「参加する」「参加しない」の2つのみ
    const buttons = bodyContents?.slice(1); // 最初は状態表示テキスト
    expect(buttons).toHaveLength(2);
    
    const buttonLabels = buttons?.map((button: any) => button.action.label);
    expect(buttonLabels).toEqual(["参加する", "参加しない"]);
  });

  it("準備者がNONEの場合は「準備者を奪う」ボタンを表示しない", () => {
    const plan = MealPlan.createDinnerPlan(
      testDate,
      PreparationRole.ALICE,
      idGenerator,
    );
    expect(plan.isSuccess).toBe(true);
    
    const mealPlan = plan.value;
    // 準備者を辞退させる
    mealPlan.preparerQuits();
    
    const result = createDinnerEditFlexMessage(dateStr, mealPlan, "Bob");

    const bodyContents = result.contents.body?.contents;
    expect(bodyContents).toBeDefined();
    
    // ボタンは「参加する」「参加しない」の2つのみ
    const buttons = bodyContents?.slice(1); // 最初は状態表示テキスト
    expect(buttons).toHaveLength(2);
    
    const buttonLabels = buttons?.map((button: any) => button.action.label);
    expect(buttonLabels).toEqual(["参加する", "参加しない"]);
  });

  it("現在の状態を正しく表示する", () => {
    const plan = MealPlan.createDinnerPlan(
      testDate,
      PreparationRole.ALICE,
      idGenerator,
    );
    expect(plan.isSuccess).toBe(true);
    
    const mealPlan = plan.value;
    const result = createDinnerEditFlexMessage(dateStr, mealPlan, "Bob");

    const statusText = result.contents.body?.contents?.[0];
    expect(statusText).toMatchObject({
      type: "text",
      text: `現在の状態:\n${USERS.ALICE.name}: ${ParticipationStatus.WILL_PARTICIPATE}\n${USERS.BOB.name}: ${ParticipationStatus.WILL_PARTICIPATE}\n準備担当: ${PreparationRole.ALICE}`,
      wrap: true,
    });
  });
});