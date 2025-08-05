import { describe, it, expect } from "vitest";
import { formatDateForFlex } from "../../../../../src/features/line/messages/flex";

describe("Flexメッセージの日付フォーマット", () => {

  describe("formatDateForFlex関数", () => {
    it("JST時刻でも日付が正しくフォーマットされること", () => {
      const date = new Date(2023, 9, 15, 0, 0, 0, 0); // 2023-10-15 00:00:00 JST
      const result = formatDateForFlex(date);
      
      expect(result).toBe("2023-10-15");
    });

    it("深夜0時でも日付がズレないこと", () => {
      const date = new Date(2023, 9, 15);
      date.setHours(0, 0, 0, 0); // 2023-10-15 00:00:00 JST
      const result = formatDateForFlex(date);
      
      expect(result).toBe("2023-10-15");
    });

    it("23時59分でも日付が正しいこと", () => {
      const date = new Date(2023, 9, 15);
      date.setHours(23, 59, 59, 999); // 2023-10-15 23:59:59.999 JST
      const result = formatDateForFlex(date);
      
      expect(result).toBe("2023-10-15");
    });

    it("月と日が1桁の場合、0埋めされること", () => {
      const date = new Date(2023, 0, 5); // 2023-01-05
      const result = formatDateForFlex(date);
      
      expect(result).toBe("2023-01-05");
    });

    it("旧バージョン（toISOString().split('T')[0]）との比較", () => {
      // 問題が発生していたケース
      const date = new Date(2023, 9, 15);
      date.setHours(0, 0, 0, 0); // JST 00:00:00
      
      // 新しい方法（修正版）
      const newMethod = formatDateForFlex(date);
      
      // 古い方法（問題のあった方法）
      const oldMethod = date.toISOString().split("T")[0];
      
      expect(newMethod).toBe("2023-10-15");
      // 古い方法では日付がズレていた可能性がある
      // （環境によってはoldMethodが "2023-10-14" になる場合がある）
    });
  });

  describe("タイムゾーンの影響確認", () => {
    it("異なる時刻でも同じ日付が返されること", () => {
      const dates = [
        new Date(2023, 9, 15, 0, 0, 0, 0),   // 00:00:00
        new Date(2023, 9, 15, 6, 30, 0, 0),  // 06:30:00  
        new Date(2023, 9, 15, 12, 0, 0, 0),  // 12:00:00
        new Date(2023, 9, 15, 18, 45, 0, 0), // 18:45:00
        new Date(2023, 9, 15, 23, 59, 59, 999), // 23:59:59.999
      ];

      dates.forEach((date, index) => {
        const result = formatDateForFlex(date);
        expect(result).toBe("2023-10-15");
      });
    });
  });
});