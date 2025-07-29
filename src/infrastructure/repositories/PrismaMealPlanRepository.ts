import type { PrismaClient } from "@prisma/client";
import {
  MealPlan,
  MealType,
  ParticipationStatus,
  PreparationRole,
} from "../../domain/entities/MealPlan";
import type { MealPlanRepository } from "../../domain/repositories/MealPlanRepository";

export class PrismaMealPlanRepository implements MealPlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByDateAndType(
    date: Date,
    mealType: MealType,
  ): Promise<MealPlan | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const plan = await this.prisma.mealPlan.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        mealType,
      },
    });

    return plan ? this.toDomain(plan) : null;
  }

  async save(plan: MealPlan): Promise<MealPlan> {
    const data = this.toPersistence(plan);

    const saved = await this.prisma.mealPlan.upsert({
      where: {
        date_mealType: {
          date: plan.date,
          mealType: plan.mealType,
        },
      },
      update: data,
      create: data,
    });

    return this.toDomain(saved);
  }

  async findByDateRange(from: Date, to: Date): Promise<MealPlan[]> {
    const plans = await this.prisma.mealPlan.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: [{ date: "asc" }, { mealType: "asc" }],
    });

    return plans.map((plan) => this.toDomain(plan));
  }

  async findByDateRangeAndType(
    from: Date,
    to: Date,
    mealType: MealType,
  ): Promise<MealPlan[]> {
    const plans = await this.prisma.mealPlan.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
        mealType,
      },
      orderBy: { date: "asc" },
    });

    return plans.map((plan) => this.toDomain(plan));
  }

  private toDomain(plan: {
    id: string;
    date: Date;
    mealType: string;
    preparationRole: string;
    aliceParticipation: string;
    bobParticipation: string;
    currentState: number;
    createdAt: Date;
    updatedAt: Date;
  }): MealPlan {
    const mealType = this.parseMealType(plan.mealType);
    const preparationRole = this.parsePreparationRole(plan.preparationRole);
    const aliceParticipation = this.parseParticipationStatus(
      plan.aliceParticipation,
    );
    const bobParticipation = this.parseParticipationStatus(
      plan.bobParticipation,
    );

    return new MealPlan(
      plan.id,
      plan.date,
      mealType,
      preparationRole,
      aliceParticipation,
      bobParticipation,
      plan.currentState,
      plan.createdAt,
      plan.updatedAt,
    );
  }

  private parseMealType(value: string): MealType {
    if (value === MealType.LUNCH || value === MealType.DINNER) {
      return value;
    }
    throw new Error(
      `Invalid MealType: ${value}. Valid values are: LUNCH, DINNER`,
    );
  }

  private parsePreparationRole(value: string): PreparationRole {
    if (
      value === PreparationRole.ALICE ||
      value === PreparationRole.BOB ||
      value === PreparationRole.NONE
    ) {
      return value;
    }
    throw new Error(
      `Invalid PreparationRole: ${value}. Valid values are: ALICE, BOB, NONE`,
    );
  }

  private parseParticipationStatus(value: string): ParticipationStatus {
    if (
      value === ParticipationStatus.WILL_PARTICIPATE ||
      value === ParticipationStatus.WILL_NOT_PARTICIPATE ||
      value === ParticipationStatus.UNDECIDED
    ) {
      return value;
    }
    throw new Error(
      `Invalid ParticipationStatus: ${value}. Valid values are: WILL_PARTICIPATE, WILL_NOT_PARTICIPATE, UNDECIDED`,
    );
  }

  private toPersistence(plan: MealPlan) {
    return {
      id: plan.id,
      date: plan.date,
      mealType: plan.mealType,
      preparationRole: plan.preparationRole,
      aliceParticipation: plan.aliceParticipation,
      bobParticipation: plan.bobParticipation,
      currentState: plan.currentState,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
