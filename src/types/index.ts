// 新しいドメインエンティティをエクスポート
export {
  MealPlan,
  MealType,
  ParticipationStatus,
  PreparationRole,
} from "../domain/entities/MealPlan";
export { Result } from "../domain/types/Result";

// LINE関連の型
export interface LineMessage {
  type: string;
  text?: string;
  [key: string]: unknown;
}

// 通知関連の型
export interface NotificationConfig {
  hour: number;
  minute: number;
}

// API レスポンス型
export interface ApiResponse {
  status: "success" | "error";
  message: string;
  data?: unknown;
}
