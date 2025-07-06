# LINE Botユーザー管理スクリプト

このディレクトリには、LINE Botのユーザーを管理するためのスクリプトが含まれています。

## 前提条件

- Node.jsがインストールされていること
- プロジェクトのルートディレクトリで`npm install`が実行済みであること

## スクリプト一覧

### ユーザー一覧の表示

```bash
node scripts/list_users.js
```

データベースに登録されているすべてのユーザーを一覧表示します。

### ユーザーの追加

```bash
node scripts/add_user.js <LINE_ID> [ユーザー名]
```

- `<LINE_ID>`: 追加するLINE ID（必須）
- `[ユーザー名]`: ユーザーの名前（省略可能、デフォルトは「ユーザー」）

例:
```bash
node scripts/add_user.js Ubd6e392bbba3020dbdd6bb8c9b07894f "テストユーザー"
```

### ユーザーの検索

```bash
node scripts/find_user.js <LINE_ID>
```

- `<LINE_ID>`: 検索するLINE ID（必須）

例:
```bash
node scripts/find_user.js Ubd6e392bbba3020dbdd6bb8c9b07894f
```

### ユーザーの削除

```bash
node scripts/delete_user.js <LINE_ID>
```

- `<LINE_ID>`: 削除するLINE ID（必須）

例:
```bash
node scripts/delete_user.js Ubd6e392bbba3020dbdd6bb8c9b07894f
```

## 注意事項

- これらのスクリプトは、データベースに直接アクセスします。
- 本番環境で使用する場合は、十分な注意が必要です。
- ユーザーを削除する前に、関連するデータ（食事参加情報など）も削除する必要がある場合があります。 