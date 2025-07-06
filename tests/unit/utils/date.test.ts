import { describe, it, expect } from "vitest";
import {
  getStartOfDay,
  getEndOfDay,
  addDays,
  formatDate,
  formatDateJP,
  formatTime,
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
}); 