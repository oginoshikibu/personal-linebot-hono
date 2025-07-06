import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { rest } from "msw";

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

// テスト用のモック環境変数設定
process.env.NODE_ENV = "test"; 