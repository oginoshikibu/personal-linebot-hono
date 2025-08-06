// テスト用のモック環境変数設定（最初に設定）
process.env.NODE_ENV = "test";
process.env.ALICE_LINE_ID = "test-alice-id";
process.env.BOB_LINE_ID = "test-bob-id";
process.env.ALICE_NAME = "Alice";
process.env.BOB_NAME = "Bob";

import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";

// モックサーバーのセットアップ
export const server = setupServer();

// テスト前にモックサーバーを起動
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// 各テスト後にモックハンドラーをリセット
afterEach(() => {
  server.resetHandlers();
});

// すべてのテスト後にモックサーバーを閉じる
afterAll(() => {
  server.close();
});