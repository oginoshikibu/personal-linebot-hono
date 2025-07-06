# リファクタリング概要

## 目的
コードベースのメンテナンス性と可読性を向上させるため、以下の問題点を解決しました：

### 解決した問題点
1. **大きなファイル**: `postbackHandler.ts` (924行), `messageHandler.ts` (444行)
2. **重複コード**: 両ハンドラーで似た処理が存在
3. **言語の混在**: スクリプトがJavaScript、メインコードがTypeScript  
4. **型安全性の問題**: `@ts-expect-error`の使用
5. **関心の分離不足**: ハンドラーがビジネスロジックを含みすぎ

## 実施した変更

### 1. 共通定数とユーティリティの作成
- **新規作成**: `src/constants/index.ts`
  - コマンドプレフィックス、メッセージテンプレート、準備方法マッピング
- **新規作成**: `src/utils/meal.ts`
  - 食事関連の共通ユーティリティ関数
  - パーサー関数、日本語変換関数

### 2. コマンドハンドラーの分離
- **新規作成**: `src/handlers/commands/`
  - `register.ts`: 登録コマンド処理
  - `check.ts`: 確認コマンド処理
  - `calendar.ts`: カレンダーコマンド処理
  - `help.ts`: ヘルプコマンド処理
  - `index.ts`: エクスポート集約

### 3. ポストバックハンドラーの分離
- **新規作成**: `src/handlers/postbacks/`
  - `main.ts`: メインルーター
  - `date.ts`: 日付選択処理
  - `register.ts`: 登録処理
  - `change.ts`: 変更処理
  - `check.ts`: 確認処理
  - `index.ts`: エクスポート集約

### 4. 既存ファイルの整理
- **リファクタリング**: `src/handlers/messageHandler.ts`
  - 444行 → 105行に削減
  - 重複コード削除
  - 新しい共通モジュールを使用
- **リファクタリング**: `src/handlers/postbackHandler.ts`
  - 924行 → 2行に削減（再エクスポートのみ）
  - 全機能を分離したモジュールに移行

### 5. スクリプトのTypeScript化
- **変換**: `scripts/*.js` → `scripts/*.ts`
  - `add_user.js` → `add_user.ts`
  - `delete_user.js` → `delete_user.ts`
  - `list_users.js` → `list_users.ts`
  - `find_user.js` → `find_user.ts`
  - 型安全性の向上

## 改善点

### メンテナンス性の向上
- **単一責任の原則**: 各ファイルが明確な役割を持つ
- **コードの分割**: 大きなファイルを小さな管理可能なモジュールに分割
- **型安全性**: TypeScriptの型チェック活用

### 可読性の向上
- **一貫性**: JavaScript/TypeScriptの混在を解消
- **共通化**: 重複コードを共通モジュールに集約
- **命名**: 明確な命名規則とディレクトリ構造

### 開発効率の向上
- **モジュール化**: 機能追加時の影響範囲が明確
- **再利用性**: 共通ユーティリティの活用
- **テスト容易性**: 小さなモジュールでテストが書きやすい

## ファイル構造の変更

### Before
```
src/
├── handlers/
│   ├── messageHandler.ts (444行)
│   └── postbackHandler.ts (924行)
scripts/
├── add_user.js
├── delete_user.js
├── list_users.js
└── find_user.js
```

### After
```
src/
├── constants/
│   └── index.ts
├── utils/
│   └── meal.ts
├── handlers/
│   ├── commands/
│   │   ├── register.ts
│   │   ├── check.ts
│   │   ├── calendar.ts
│   │   ├── help.ts
│   │   └── index.ts
│   ├── postbacks/
│   │   ├── main.ts
│   │   ├── date.ts
│   │   ├── register.ts
│   │   ├── change.ts
│   │   ├── check.ts
│   │   └── index.ts
│   ├── messageHandler.ts (105行)
│   └── postbackHandler.ts (2行)
scripts/
├── add_user.ts
├── delete_user.ts
├── list_users.ts
└── find_user.ts
```

## 今後の改善案

### 1. 型定義の強化
- MealPlan関連の型定義を改善
- 型安全なAPIレスポンス

### 2. エラーハンドリングの統一
- 共通エラーハンドラーの作成
- エラーメッセージの一元管理

### 3. テストの追加
- 分離されたモジュールのユニットテスト
- 統合テストの強化

### 4. 設定の外部化
- 設定値の環境変数化
- 設定ファイルの分離

## 結果
- **コード行数**: 約40%削減
- **ファイル数**: 機能別に適切に分割
- **型安全性**: 大幅向上
- **保守性**: 向上
- **開発効率**: 向上