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
  
  // 週間リマインダー設定
  WEEKLY_REMINDER_HOUR: z.coerce.number().int().min(0).max(23).default(21),
  WEEKLY_REMINDER_MINUTE: z.coerce.number().int().min(0).max(59).default(0),
  WEEKLY_REMINDER_DAY: z.coerce.number().int().min(0).max(6).default(0), // 0 = 日曜日
  
  // ファイルパス設定
  ASSETS_DIR: z.string().default("assets"),
  TEMP_DIR: z.string().default("temp"),
  RICHMENU_IMAGE_PATH: z.string().default("assets/images/richmenu.png"),
  
  // リッチメニューUI設定
  RICHMENU_SUBTEXT_VERTICAL_OFFSET: z.coerce.number().default(30),
  RICHMENU_SUBTEXT_VERTICAL_SPACING: z.coerce.number().default(60),
  RICHMENU_BORDER_PADDING: z.coerce.number().default(2),
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
    weekly: {
      hour: env.WEEKLY_REMINDER_HOUR,
      minute: env.WEEKLY_REMINDER_MINUTE,
      day: env.WEEKLY_REMINDER_DAY,
    },
  },
  paths: {
    assets: env.ASSETS_DIR,
    temp: env.TEMP_DIR,
    richMenuImage: env.RICHMENU_IMAGE_PATH,
  },
  richMenu: {
    ui: {
      subtextVerticalOffset: env.RICHMENU_SUBTEXT_VERTICAL_OFFSET,
      subtextVerticalSpacing: env.RICHMENU_SUBTEXT_VERTICAL_SPACING,
      borderPadding: env.RICHMENU_BORDER_PADDING,
    },
  },
};

export default config;
