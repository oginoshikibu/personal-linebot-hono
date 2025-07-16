# リッチメニューの設定と管理

このドキュメントでは、LINE Botのリッチメニューの設定と管理方法について説明します。

## リッチメニューとは

リッチメニューは、LINEチャット画面の下部に表示されるカスタマイズ可能なメニューです。ユーザーがよく使う機能に素早くアクセスできるようにするためのUIコンポーネントです。

## リッチメニューの設定方法

### 1. スクリプトを使用する方法

#### 基本的なセットアップ（実際のLINE APIを使用）

```bash
npm run setup-richmenu
```

このコマンドは `scripts/setupRichMenu.ts` を実行し、以下の処理を行います：

1. リッチメニュー画像の生成
2. 既存のリッチメニューの削除
3. 新しいリッチメニューの作成
4. リッチメニュー画像のアップロード
5. デフォルトリッチメニューとして設定

#### テーマ対応セットアップ（NEW!）

```bash
# デフォルトテーマでセットアップ
npm run setup-richmenu:theme

# 特定のテーマを指定してセットアップ
npm run setup-richmenu:theme -- --theme dark

# 画像を一時ファイルとして保存
npm run setup-richmenu:theme -- --theme blue --save

# モックモードで実行（テスト用）
npm run setup-richmenu:theme -- --theme warm --mock

# ヘルプを表示
npm run setup-richmenu:theme -- --help
```

**利用可能なテーマ：**
- `default`: 標準的な白ベースのテーマ
- `dark`: ダークモード風のテーマ
- `blue`: 青系のカラーテーマ
- `warm`: 温かみのあるオレンジ系テーマ

**季節自動対応機能：**
スクリプトは実行時期に基づいて、季節に応じたコンテンツを自動的に適用します：
- 春（3-5月）: 春野菜料理、お花見弁当など
- 夏（6-8月）: さっぱり料理、夏祭りグルメなど
- 秋（9-11月）: 秋の味覚、季節のレシピなど
- 冬（12-2月）: 温かい料理、冬のレシピなど

#### モックモードでのテスト

```bash
npm run setup-richmenu:mock
```

このコマンドは `scripts/setupRichMenuWithMock.ts` を実行し、LINE APIをモック化してリッチメニューのセットアップをシミュレートします。モック版を実行すると、`temp/` ディレクトリにリッチメニュー画像が保存されます。

### 2. メインアプリケーションへの影響について

リッチメニュー機能は**スクリプトのみで完結**し、メインアプリケーションには一切影響を与えません。

- リッチメニュー関連のAPIエンドポイントは存在しません
- データベースへの影響はありません
- 既存のLINE Bot機能には影響しません
- 完全に独立したスクリプトとして動作します

この設計により、リッチメニューの設定や変更がメインアプリケーションの動作に影響することはありません。

## リッチメニューの画像について

リッチメニューの画像は以下の要件を満たす必要があります：

- サイズ: 2500 x 1686 ピクセル
- フォーマット: JPEG または PNG
- ファイルサイズ: 1MB以下

このアプリケーションでは、`assets/images/richmenu.png` にリッチメニュー画像を配置します。ファイルが存在しない場合は、透明な画像が自動生成されます。

### 動的画像生成について

現在の実装では、テーマとコンテンツに基づいたリッチメニュー画像の生成機能が含まれていますが、完全な動的画像生成を実現するには、`canvas` ライブラリの追加が必要です。

**完全な動的画像生成を有効にするには：**

```bash
npm install canvas @types/canvas
```

その後、`src/utils/richMenuImage.ts` の `generateDynamicRichMenuImage` 関数のコメントアウトされた部分を実装してください。これにより以下が可能になります：

- リアルタイムでの画像生成
- テーマに基づいた背景色とテキスト色の適用
- 季節やイベントに応じたレイアウトの変更
- カスタムフォントや画像の埋め込み

**注意：** Canvas ライブラリはネイティブの依存関係を持つため、インストール時にコンパイルが必要です。Docker環境では追加の設定が必要な場合があります。

## トラブルシューティング

### 1. 認証エラー (401)

```
Error: Request failed with status code 401
```

このエラーは、LINE APIの認証情報が無効である場合に発生します。以下を確認してください：

- `.env` ファイルに正しい `LINE_CHANNEL_SECRET` と `LINE_CHANNEL_ACCESS_TOKEN` が設定されているか
- チャネルアクセストークンの有効期限が切れていないか
- チャネルに適切な権限が付与されているか

### 2. 画像アップロードエラー

```
TypeError: Cannot read properties of undefined (reading 'mime')
```

このエラーは、画像バッファにMIMEタイプ情報が含まれていない場合に発生します。`uploadRichMenuImage` 関数で明示的に `'image/png'` を指定することで解決できます。

### 3. 画像サイズエラー

```
Error: Request failed with status code 400
```

リッチメニュー画像のサイズが要件を満たしていない場合に発生することがあります。画像が2500 x 1686ピクセルであることを確認してください。

## リッチメニューの管理

### リッチメニュー一覧の取得

```typescript
// リッチメニュー管理は scripts/setupRichMenu.ts を使用してください
// npm run setup-richmenu
```

### リッチメニューの削除

```typescript
// リッチメニューの削除は LINE Developers Console で行ってください
```

### ユーザーへのリッチメニュー紐付け

```typescript
// ユーザーへの紐付けは自動的に行われます
```

## 参考リソース

- [LINE Developers - リッチメニュー](https://developers.line.biz/ja/docs/messaging-api/using-rich-menus/)
- [LINE Bot SDK for Node.js](https://github.com/line/line-bot-sdk-nodejs) 