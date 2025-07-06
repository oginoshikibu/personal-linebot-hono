import { MealType, PreparationType, User } from "@prisma/client";

// LINE関連の型
export interface LineMessage {
  type: string;
  text?: string;
  [key: string]: unknown;
}

// 食事予定関連の型
export interface MealPlanData {
  participants: { name: string; attending: boolean }[];
  preparationType: string;
  cooker?: string;
}

// 通知関連の型
export interface NotificationConfig {
  hour: number;
  minute: number;
}

// コマンド関連の型
export interface CommandArgs {
  date?: Date;
  mealType?: MealType;
  isAttending?: boolean;
  preparationType?: PreparationType;
}

// API レスポンス型
export interface ApiResponse {
  status: "success" | "error";
  message: string;
  data?: unknown;
}

// エクスポートする型
export type { User };
