import type { PrismaClient } from "@prisma/client";
import {
  MealPlan,
  type MealType,
  type ParticipationStatus,
  type PreparationRole,
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
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mealType = plan.mealType as MealType;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const preparationRole = plan.preparationRole as PreparationRole;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const aliceParticipation = plan.aliceParticipation as ParticipationStatus;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const bobParticipation = plan.bobParticipation as ParticipationStatus;

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
