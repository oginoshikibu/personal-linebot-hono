import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RichMenuResponse } from "@line/bot-sdk";
import lineClient from "../../../src/services/line";
import {
  createRichMenu,
  uploadRichMenuImage,
  setDefaultRichMenu,
  deleteRichMenu,
  getRichMenuList,
  setupRichMenu,
} from "../../../src/services/richmenu";

// モックの設定
vi.mock("../../../src/services/line", () => ({
  default: {
    createRichMenu: vi.fn(),
    setRichMenuImage: vi.fn(),
    setDefaultRichMenu: vi.fn(),
    linkRichMenuToUser: vi.fn(),
    deleteRichMenu: vi.fn(),
    getRichMenuList: vi.fn(),
  },
}));

vi.mock("../../../src/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("リッチメニューサービス", () => {
  const mockRichMenuId = "rich-menu-id-123";
  const mockImageBuffer = Buffer.from("test-image");

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("createRichMenu", () => {
    it("リッチメニューを作成できること", async () => {
      // モックの設定
      vi.mocked(lineClient.createRichMenu).mockResolvedValue(mockRichMenuId);

      // 実行
      const result = await createRichMenu();

      // 検証
      expect(lineClient.createRichMenu).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockRichMenuId);
    });

    it("エラー時に例外をスローすること", async () => {
      // モックの設定
      vi.mocked(lineClient.createRichMenu).mockRejectedValue(new Error("テストエラー"));

      // 検証
      await expect(createRichMenu()).rejects.toThrow("リッチメニューの作成に失敗しました");
    });
  });

  describe("uploadRichMenuImage", () => {
    it("リッチメニュー画像をアップロードできること", async () => {
      // モックの設定
      vi.mocked(lineClient.setRichMenuImage).mockResolvedValue(undefined);

      // 実行
      await uploadRichMenuImage(mockRichMenuId, mockImageBuffer);

      // 検証
      expect(lineClient.setRichMenuImage).toHaveBeenCalledWith(mockRichMenuId, mockImageBuffer);
    });

    it("エラー時に例外をスローすること", async () => {
      // モックの設定
      vi.mocked(lineClient.setRichMenuImage).mockRejectedValue(new Error("テストエラー"));

      // 検証
      await expect(uploadRichMenuImage(mockRichMenuId, mockImageBuffer)).rejects.toThrow(
        "リッチメニュー画像のアップロードに失敗しました"
      );
    });
  });

  describe("setDefaultRichMenu", () => {
    it("デフォルトリッチメニューを設定できること", async () => {
      // モックの設定
      vi.mocked(lineClient.setDefaultRichMenu).mockResolvedValue(undefined);

      // 実行
      await setDefaultRichMenu(mockRichMenuId);

      // 検証
      expect(lineClient.setDefaultRichMenu).toHaveBeenCalledWith(mockRichMenuId);
    });

    it("エラー時に例外をスローすること", async () => {
      // モックの設定
      vi.mocked(lineClient.setDefaultRichMenu).mockRejectedValue(new Error("テストエラー"));

      // 検証
      await expect(setDefaultRichMenu(mockRichMenuId)).rejects.toThrow(
        "デフォルトリッチメニューの設定に失敗しました"
      );
    });
  });

  describe("setupRichMenu", () => {
    it("リッチメニューをセットアップできること", async () => {
      // モックの設定
      vi.mocked(lineClient.getRichMenuList).mockResolvedValue([
        { richMenuId: "old-menu-1" } as RichMenuResponse,
        { richMenuId: "old-menu-2" } as RichMenuResponse,
      ]);
      vi.mocked(lineClient.deleteRichMenu).mockResolvedValue(undefined);
      vi.mocked(lineClient.createRichMenu).mockResolvedValue(mockRichMenuId);
      vi.mocked(lineClient.setRichMenuImage).mockResolvedValue(undefined);
      vi.mocked(lineClient.setDefaultRichMenu).mockResolvedValue(undefined);

      // 実行
      const result = await setupRichMenu(mockImageBuffer);

      // 検証
      expect(lineClient.getRichMenuList).toHaveBeenCalledTimes(1);
      expect(lineClient.deleteRichMenu).toHaveBeenCalledTimes(2);
      expect(lineClient.createRichMenu).toHaveBeenCalledTimes(1);
      expect(lineClient.setRichMenuImage).toHaveBeenCalledWith(mockRichMenuId, mockImageBuffer);
      expect(lineClient.setDefaultRichMenu).toHaveBeenCalledWith(mockRichMenuId);
      expect(result).toBe(mockRichMenuId);
    });
  });
}); 