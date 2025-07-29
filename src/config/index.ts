import "dotenv/config";
import { z } from "zod";

// 環境変数のスキーマ定義
const envSchema = z.object({
  // データベース
  DATABASE_URL: z.string().default("file:./dev.db"),

  // LINE
  LINE_CHANNEL_SECRET: z.string().default(""),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().default(""),
  ALLOWED_LINE_IDS: z
    .string()
    .transform((val) => (val ? val.split(",").map((item) => item.trim()) : []))
    .default(""),

  // 固定ユーザー（必須）
  ALICE_LINE_ID: z
    .string()
    .min(1, "ALICE_LINE_ID is required and cannot be empty"),
  BOB_LINE_ID: z.string().min(1, "BOB_LINE_ID is required and cannot be empty"),

  // サーバー
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),

  // 通知設定
  MORNING_NOTIFICATION_HOUR: z.coerce.number().int().min(0).max(23).default(7),
  MORNING_NOTIFICATION_MINUTE: z.coerce
    .number()
    .int()
    .min(0)
    .max(59)
    .default(0),
  EVENING_NOTIFICATION_HOUR: z.coerce.number().int().min(0).max(23).default(22),
  EVENING_NOTIFICATION_MINUTE: z.coerce
    .number()
    .int()
    .min(0)
    .max(59)
    .default(0),
});

// 環境変数のバリデーション
const env = envSchema.parse(process.env);

// 設定オブジェクト
export const config = {
  database: {
    url: env.DATABASE_URL,
  },
  line: {
    channelSecret: env.LINE_CHANNEL_SECRET,
    channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
    allowedLineIds: env.ALLOWED_LINE_IDS,
    users: {
      alice: env.ALICE_LINE_ID,
      bob: env.BOB_LINE_ID,
    },
  },
  server: {
    port: env.PORT,
    host: env.HOST,
  },
  notification: {
    morning: {
      hour: env.MORNING_NOTIFICATION_HOUR,
      minute: env.MORNING_NOTIFICATION_MINUTE,
    },
    evening: {
      hour: env.EVENING_NOTIFICATION_HOUR,
      minute: env.EVENING_NOTIFICATION_MINUTE,
    },
  },
};

export default config;
