# リッチメニューの設定と管理

このドキュメントでは、LINE Botのリッチメニューの設定と管理方法について説明します。

## リッチメニューとは

リッチメニューは、LINEチャット画面の下部に表示されるカスタマイズ可能なメニューです。ユーザーがよく使う機能に素早くアクセスできるようにするためのUIコンポーネントです。

## リッチメニューの設定方法

### 1. スクリプトを使用する方法

#### 実際のLINE APIを使用する場合

```bash
npm run setup-richmenu
```

このコマンドは `scripts/setupRichMenu.ts` を実行し、以下の処理を行います：

1. リッチメニュー画像の生成
2. 既存のリッチメニューの削除
3. 新しいリッチメニューの作成
4. リッチメニュー画像のアップロード
5. デフォルトリッチメニューとして設定

#### モックを使用してテストする場合

```bash
npm run setup-richmenu:mock
```

このコマンドは `scripts/setupRichMenuWithMock.ts` を実行し、LINE APIをモック化してリッチメニューのセットアップをシミュレートします。モック版を実行すると、`temp/` ディレクトリにリッチメニュー画像が保存されます。

### 2. エンドポイントを使用する方法

サーバー起動後に以下のエンドポイントにアクセスしてリッチメニューをセットアップできます：

```
GET /setup/richmenu
```

## リッチメニューの画像について

リッチメニューの画像は以下の要件を満たす必要があります：

- サイズ: 2500 x 1686 ピクセル
- フォーマット: JPEG または PNG
- ファイルサイズ: 1MB以下

このアプリケーションでは、`assets/images/richmenu.png` にリッチメニュー画像を配置します。ファイルが存在しない場合は、透明な画像が自動生成されます。

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
import { getRichMenuList } from "../src/services/richmenu";

const richMenuIds = await getRichMenuList();
console.log(richMenuIds);
```

### リッチメニューの削除

```typescript
import { deleteRichMenu } from "../src/services/richmenu";

await deleteRichMenu("richmenu-xxx-xxx-xxx");
```

### ユーザーへのリッチメニュー紐付け

```typescript
import { linkRichMenuToUser } from "../src/services/richmenu";

await linkRichMenuToUser("user-id", "richmenu-xxx-xxx-xxx");
```

## 参考リソース

- [LINE Developers - リッチメニュー](https://developers.line.biz/ja/docs/messaging-api/using-rich-menus/)
- [LINE Bot SDK for Node.js](https://github.com/line/line-bot-sdk-nodejs) 