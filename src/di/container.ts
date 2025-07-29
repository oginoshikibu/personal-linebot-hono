import { PrismaClient } from "@prisma/client";
import type { IdGenerator } from "../domain/entities/MealPlan";
import type { MealPlanRepository } from "../domain/repositories/MealPlanRepository";
import { MealPlanService } from "../features/meal/services/meal";
import { PrismaMealPlanRepository } from "../infrastructure/repositories/PrismaMealPlanRepository";
import { CryptoIdGenerator } from "../infrastructure/utils/IdGenerator";

export class DIContainer {
  private static instance: DIContainer | undefined;

  private _prisma: PrismaClient;
  private _idGenerator: IdGenerator;
  private _mealPlanRepository: MealPlanRepository;
  private _mealPlanService: MealPlanService;

  private constructor() {
    this._prisma = new PrismaClient();
    this._idGenerator = new CryptoIdGenerator();
    this._mealPlanRepository = new PrismaMealPlanRepository(this._prisma);
    this._mealPlanService = new MealPlanService(
      this._mealPlanRepository,
      this._idGenerator,
    );
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  get mealPlanService(): MealPlanService {
    return this._mealPlanService;
  }
}
