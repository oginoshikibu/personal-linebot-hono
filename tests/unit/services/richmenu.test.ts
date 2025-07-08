import { describe, expect, it, vi } from "vitest";
import { getDefaultRichMenuProperties } from "../../../scripts/setupRichMenu";

describe("リッチメニューの設定", () => {
  it("リッチメニューの項目が正しく設定されていること", () => {
    const richMenuProperties = getDefaultRichMenuProperties();
    
    // リッチメニューの項目が正しいか確認
    expect(richMenuProperties.areas).toHaveLength(5); // 4つの主要項目と1つのヘルプ
    
    // 項目のテキストを確認
    expect(richMenuProperties.areas[0].action.text).toBe("今日の予定");
    expect(richMenuProperties.areas[1].action.text).toBe("明日の予定");
    expect(richMenuProperties.areas[2].action.text).toBe("今週の予定");
    expect(richMenuProperties.areas[3].action.text).toBe("今後の予定");
    expect(richMenuProperties.areas[4].action.text).toBe("ヘルプ");
  });
}); 