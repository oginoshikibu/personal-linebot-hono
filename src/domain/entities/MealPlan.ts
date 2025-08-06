import { Result } from "../types/Result";

export enum MealType {
  LUNCH = "LUNCH",
  DINNER = "DINNER",
}

export enum PreparationRole {
  ALICE = "ALICE",
  BOB = "BOB",
  NONE = "NONE",
}

export enum ParticipationStatus {
  WILL_PARTICIPATE = "WILL_PARTICIPATE",
  WILL_NOT_PARTICIPATE = "WILL_NOT_PARTICIPATE",
  UNDECIDED = "UNDECIDED",
}

export interface IdGenerator {
  generate(): string;
}

export class MealPlan {
  static readonly DEFAULT_LUNCH_PREPARER = PreparationRole.BOB;
  constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly mealType: MealType,
    private _preparationRole: PreparationRole,
    private _aliceParticipation: ParticipationStatus,
    private _bobParticipation: ParticipationStatus,
    private _currentState: number,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  get preparationRole(): PreparationRole {
    return this._preparationRole;
  }
  get aliceParticipation(): ParticipationStatus {
    return this._aliceParticipation;
  }
  get bobParticipation(): ParticipationStatus {
    return this._bobParticipation;
  }
  get currentState(): number {
    return this._currentState;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  static createLunchPlan(date: Date, idGenerator: IdGenerator): MealPlan {
    return new MealPlan(
      idGenerator.generate(),
      date,
      MealType.LUNCH,
      MealPlan.DEFAULT_LUNCH_PREPARER,
      ParticipationStatus.WILL_PARTICIPATE,
      ParticipationStatus.WILL_PARTICIPATE,
      1,
      new Date(),
      new Date(),
    );
  }

  static createDinnerPlan(
    date: Date,
    preparationRole: PreparationRole,
    idGenerator: IdGenerator,
  ): Result<MealPlan> {
    if (preparationRole === PreparationRole.NONE) {
      return Result.failure(
        "Dinner plan creation requires preparationRole parameter to be specified (ALICE or BOB).",
      );
    }

    const aliceParticipation = ParticipationStatus.WILL_PARTICIPATE;
    const bobParticipation = ParticipationStatus.WILL_PARTICIPATE;

    const mealPlan = new MealPlan(
      idGenerator.generate(),
      date,
      MealType.DINNER,
      preparationRole,
      aliceParticipation,
      bobParticipation,
      preparationRole === PreparationRole.ALICE ? 3 : 1,
      new Date(),
      new Date(),
    );

    return Result.success(mealPlan);
  }

  preparerQuits(): Result<void> {
    if (this._preparationRole === PreparationRole.NONE) {
      return Result.failure("No preparer is currently assigned.");
    }

    this._preparationRole = PreparationRole.NONE;
    this._aliceParticipation = ParticipationStatus.WILL_NOT_PARTICIPATE;
    this._bobParticipation = ParticipationStatus.WILL_NOT_PARTICIPATE;
    this.updateCurrentState();
    this._updatedAt = new Date();

    return Result.success();
  }

  changeAliceParticipation(status: ParticipationStatus): Result<void> {
    if (
      this._preparationRole === PreparationRole.ALICE &&
      status === ParticipationStatus.WILL_NOT_PARTICIPATE
    ) {
      return Result.failure("Preparer must participate in the meal.");
    }

    this._aliceParticipation = status;
    this.updateCurrentState();
    this._updatedAt = new Date();
    return Result.success();
  }

  changeBobParticipation(status: ParticipationStatus): Result<void> {
    if (
      this._preparationRole === PreparationRole.BOB &&
      status === ParticipationStatus.WILL_NOT_PARTICIPATE
    ) {
      return Result.failure("Preparer must participate in the meal.");
    }

    this._bobParticipation = status;
    this.updateCurrentState();
    this._updatedAt = new Date();
    return Result.success();
  }

  /**
   * Changes the meal preparation role to the specified new preparer.
   *
   * This method enforces business rules:
   * - The preparation role for lunch cannot be changed; attempting to do so will fail.
   * - The preparation role cannot be set to `NONE` using this method; use `preparerQuits()` instead.
   * - When the preparation role is changed, the new preparer's participation status is automatically set to `WILL_PARTICIPATE`.
   *
   * @param {PreparationRole} newPreparer - The new preparer role to assign. Must be either `ALICE` or `BOB`.
   * @returns {Result<void>} A Result indicating success, or failure with a message if the change is not allowed.
   */
  changePreparationRole(newPreparer: PreparationRole): Result<void> {
    if (this.mealType === MealType.LUNCH) {
      return Result.failure("Lunch preparation role cannot be changed.");
    }

    if (newPreparer === PreparationRole.NONE) {
      return Result.failure(
        "Cannot set preparation role to NONE. Use preparerQuits() instead.",
      );
    }

    this._preparationRole = newPreparer;

    // 新しい準備者の参加状況を確実に「参加する」に設定
    this._setPreparerParticipationStatus(
      newPreparer,
      ParticipationStatus.WILL_PARTICIPATE,
    );

    this.updateCurrentState();
    this._updatedAt = new Date();
    return Result.success();
  }

  /**
   * 指定した準備者の参加ステータスを設定する
   * @param preparer 準備者（ALICEまたはBOBのみ対応）
   * @param status 参加ステータス
   */
  private _setPreparerParticipationStatus(
    preparer: PreparationRole,
    status: ParticipationStatus,
  ): void {
    if (preparer === PreparationRole.ALICE) {
      this._aliceParticipation = status;
    } else if (preparer === PreparationRole.BOB) {
      this._bobParticipation = status;
    }
  }

  private updateCurrentState(): void {
    if (this.mealType === MealType.LUNCH) {
      if (this._preparationRole === PreparationRole.BOB) {
        if (this._aliceParticipation === ParticipationStatus.WILL_PARTICIPATE) {
          this._currentState = 1;
        } else {
          this._currentState = 2;
        }
      } else {
        if (this._bobParticipation === ParticipationStatus.UNDECIDED) {
          this._currentState = 4;
        } else {
          this._currentState = 3;
        }
      }
    } else {
      if (this._preparationRole === PreparationRole.BOB) {
        if (this._aliceParticipation === ParticipationStatus.WILL_PARTICIPATE) {
          this._currentState = 1;
        } else {
          this._currentState = 2;
        }
      } else if (this._preparationRole === PreparationRole.ALICE) {
        if (this._bobParticipation === ParticipationStatus.WILL_PARTICIPATE) {
          this._currentState = 3;
        } else {
          this._currentState = 4;
        }
      } else {
        this._currentState = 5;
      }
    }
  }
}
