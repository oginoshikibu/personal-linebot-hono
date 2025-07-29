import type { IdGenerator } from "../../domain/entities/MealPlan";

export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
