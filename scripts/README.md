# スクリプトディレクトリ

このディレクトリには、アプリケーションの管理や設定に使用する各種スクリプトが含まれています。

## リッチメニュー関連スクリプト

### setupRichMenu.ts

実際のLINE APIを使用してリッチメニューをセットアップするスクリプトです。

```bash
npm run setup-richmenu
```

### setupRichMenuWithMock.ts

LINE APIをモック化してリッチメニューのセットアップをテストするスクリプトです。
実際のAPIを呼び出さずに、リッチメニューのセットアップフローをテストできます。

```bash
npm run setup-richmenu:mock
```

このスクリプトは以下の機能を持っています：

- リッチメニュー画像の生成
- 画像バッファのMIMEタイプ検証
- モックLINE APIによるリッチメニューのセットアップシミュレーション
- 生成された画像の保存（`temp/` ディレクトリ）

## ユーザー管理スクリプト

### create_user.ts

新しいユーザーを作成するスクリプトです。

```bash
npm run create-user
```

### delete_user.ts

既存のユーザーを削除するスクリプトです。

```bash
npm run delete-user
```

### list_users.ts

登録されているユーザーの一覧を表示するスクリプトです。

```bash
npm run list-users
```

### find_user.ts

特定のユーザーを検索するスクリプトです。

```bash
npm run find-user
```

## スクリプトの追加方法

新しいスクリプトを追加する場合は、以下の手順に従ってください：

1. `scripts/` ディレクトリに新しいTypeScriptファイルを作成
2. `package.json` の `scripts` セクションにコマンドを追加
3. このREADMEファイルに説明を追加 