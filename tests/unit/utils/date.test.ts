import { describe, it, expect } from "vitest";
import {
  getStartOfDay,
  getEndOfDay,
  addDays,
  formatDate,
  formatDateJP,
  formatTime,
  toLocalISOString,
} from "../../../src/utils/date";

describe("日付ユーティリティ関数", () => {
  describe("getStartOfDay関数", () => {
    it("指定した日付の0時0分0秒のDateオブジェクトを返すこと", () => {
      const date = new Date(2023, 9, 15, 14, 30, 45); // 2023-10-15 14:30:45
      const result = getStartOfDay(date);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(9); // 0-indexed (10月)
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("引数なしの場合、現在日付の0時0分0秒のDateオブジェクトを返すこと", () => {
      const now = new Date();
      const result = getStartOfDay();
      
      expect(result.getFullYear()).toBe(now.getFullYear());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getDate()).toBe(now.getDate());
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe("getEndOfDay関数", () => {
    it("指定した日付の23時59分59秒999ミリ秒のDateオブジェクトを返すこと", () => {
      const date = new Date(2023, 9, 15, 14, 30, 45); // 2023-10-15 14:30:45
      const result = getEndOfDay(date);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(9); // 0-indexed (10月)
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it("引数なしの場合、現在日付の23時59分59秒999ミリ秒のDateオブジェクトを返すこと", () => {
      const now = new Date();
      const result = getEndOfDay();
      
      expect(result.getFullYear()).toBe(now.getFullYear());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getDate()).toBe(now.getDate());
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe("addDays関数", () => {
    it("指定した日数を加算した日付を返すこと（正の値）", () => {
      const date = new Date(2023, 9, 15); // 2023-10-15
      const result = addDays(5, date);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(9); // 0-indexed (10月)
      expect(result.getDate()).toBe(20); // 15 + 5 = 20
    });

    it("指定した日数を減算した日付を返すこと（負の値）", () => {
      const date = new Date(2023, 9, 15); // 2023-10-15
      const result = addDays(-5, date);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(9); // 0-indexed (10月)
      expect(result.getDate()).toBe(10); // 15 - 5 = 10
    });

    it("月をまたぐ日付計算が正しく行われること", () => {
      const date = new Date(2023, 9, 30); // 2023-10-30
      const result = addDays(5, date);
      
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(10); // 0-indexed (11月)
      expect(result.getDate()).toBe(4); // 10/30 + 5日 = 11/4
    });

    it("年をまたぐ日付計算が正しく行われること", () => {
      const date = new Date(2023, 11, 30); // 2023-12-30
      const result = addDays(5, date);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // 0-indexed (1月)
      expect(result.getDate()).toBe(4); // 12/30 + 5日 = 1/4
    });
  });

  describe("formatDate関数", () => {
    it("日付をYYYY-MM-DD形式の文字列に変換すること", () => {
      const date = new Date(2023, 9, 15); // 2023-10-15
      const result = formatDate(date);
      
      expect(result).toBe("2023-10-15");
    });

    it("月と日が1桁の場合、0埋めされること", () => {
      const date = new Date(2023, 0, 5); // 2023-01-05
      const result = formatDate(date);
      
      expect(result).toBe("2023-01-05");
    });
  });

  describe("formatDateJP関数", () => {
    it("日付を日本語の曜日付きフォーマットに変換すること", () => {
      // 2023-10-15は日曜日
      const date = new Date(2023, 9, 15);
      const result = formatDateJP(date);
      
      expect(result).toBe("2023年10月15日（日）");
    });

    it("すべての曜日が正しく表示されること", () => {
      // 2023-10-15（日）から始まる1週間をテスト
      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(2023, 9, 15 + i);
        const result = formatDateJP(date);
        const expectedDay = 15 + i;
        const expectedWeekday = weekdays[i];
        
        expect(result).toBe(`2023年10月${expectedDay}日（${expectedWeekday}）`);
      }
    });
  });

  describe("formatTime関数", () => {
    it("時刻をHH:MM形式の文字列に変換すること", () => {
      const date = new Date(2023, 9, 15, 14, 30); // 2023-10-15 14:30
      const result = formatTime(date);
      
      expect(result).toBe("14:30");
    });

    it("時と分が1桁の場合、0埋めされること", () => {
      const date = new Date(2023, 9, 15, 9, 5); // 2023-10-15 9:05
      const result = formatTime(date);
      
      expect(result).toBe("09:05");
    });
  });

  describe("toLocalISOString関数", () => {
    it("JST環境でタイムゾーンを考慮したISO文字列を返すこと", () => {
      // JST (GMT+9) 環境でのテスト
      const date = new Date(2023, 9, 15, 0, 0, 0, 0); // 2023-10-15 00:00:00 JST
      const result = toLocalISOString(date);
      
      // JST 00:00:00 がローカル時刻として正しく変換されること
      expect(result).toMatch(/^2023-10-15T00:00:00\.000Z$/);
    });

    it("午前中の時刻でタイムゾーンを考慮したISO文字列を返すこと", () => {
      const date = new Date(2023, 9, 15, 9, 30, 45, 123); // 2023-10-15 09:30:45.123 JST
      const result = toLocalISOString(date);
      
      expect(result).toMatch(/^2023-10-15T09:30:45\.123Z$/);
    });

    it("夜の時刻でタイムゾーンを考慮したISO文字列を返すこと", () => {
      const date = new Date(2023, 9, 15, 23, 59, 59, 999); // 2023-10-15 23:59:59.999 JST
      const result = toLocalISOString(date);
      
      expect(result).toMatch(/^2023-10-15T23:59:59\.999Z$/);
    });

    it("通常のtoISOString()との違いを確認すること", () => {
      const date = new Date(2023, 9, 15, 0, 0, 0, 0); // 2023-10-15 00:00:00 JST
      const normalISO = date.toISOString();
      const localISO = toLocalISOString(date);
      
      // 通常のtoISOString()はUTCに変換される（JST-9時間）
      expect(normalISO).toMatch(/^2023-10-14T15:00:00\.000Z$/);
      // toLocalISOString()はローカル時刻を維持
      expect(localISO).toMatch(/^2023-10-15T00:00:00\.000Z$/);
      
      // 2つの結果が異なることを確認
      expect(normalISO).not.toBe(localISO);
    });

    it("日付のズレが発生しないことを確認", () => {
      // 問題が発生していた00:00:00のケースをテスト
      const startOfDay = new Date(2023, 9, 15);
      startOfDay.setHours(0, 0, 0, 0);
      
      const localISO = toLocalISOString(startOfDay);
      const dateFromISO = localISO.split('T')[0];
      
      // 日付部分が変わらないことを確認
      expect(dateFromISO).toBe('2023-10-15');
    });
  });
}); 