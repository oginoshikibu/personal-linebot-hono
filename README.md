# 家庭用食事管理LINEボット

家庭での食事予定を管理するためのLINEボットです。家族メンバーが各食事に参加するかどうか、食事の準備方法などを管理し、定期的に確認メッセージを送信します。

## 機能

- 食事参加管理：各メンバーが昼食・夕食に参加するかどうかを登録
- 食事準備方法管理：各食事の準備方法（自炊、各自自由、買って一緒に食べる）を登録
- 定期通知：朝7時と夜22時に食事予定の確認メッセージを送信
- 予定変更機能：メニューから変更操作を選択し、他のメンバーに通知

## 技術スタック

- フレームワーク: [Hono](https://honojs.dev/)
- データベース: SQLite ([Prisma ORM](https://www.prisma.io/))
- インフラ: AWS EC2
- CI/CD: GitHub Actions
- 外部API: LINE Messaging API

## プロジェクト構造

```
src/
  ├── config/       # 設定ファイル
  ├── handlers/     # メッセージハンドラ
  ├── lib/          # ライブラリ（Prismaクライアントなど）
  ├── middleware/   # ミドルウェア
  ├── routes/       # ルーティング
  │   └── api/      # APIエンドポイント
  ├── services/     # サービス層
  ├── types/        # 型定義
  ├── utils/        # ユーティリティ
  └── index.ts      # エントリーポイント
```

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- npm 8以上

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/personal-linebot-hono.git
cd personal-linebot-hono

# 依存関係をインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定

# Prismaクライアントを生成
npx prisma generate

# データベースマイグレーションを実行
npx prisma migrate dev

# 開発サーバーを起動
npm run dev
```

### 環境変数

`.env`ファイルに以下の環境変数を設定してください：

```
# データベース設定
DATABASE_URL="file:./dev.db"

# LINE Bot設定
LINE_CHANNEL_SECRET="your_line_channel_secret"
LINE_CHANNEL_ACCESS_TOKEN="your_line_channel_access_token"

# 登録済みLINE ID（カンマ区切り）
ALLOWED_LINE_IDS="userId1,userId2"

# サーバー設定
PORT=3000
HOST="0.0.0.0"

# 通知設定
MORNING_NOTIFICATION_HOUR=7
MORNING_NOTIFICATION_MINUTE=0
EVENING_NOTIFICATION_HOUR=22
EVENING_NOTIFICATION_MINUTE=0
```

## デプロイ

### Terraformによるインフラ構築

```bash
cd terraform

# Terraformを初期化
terraform init

# 実行計画を確認
terraform plan -var="key_name=your-key-name"

# インフラをデプロイ
terraform apply -var="key_name=your-key-name"
```

### GitHub Actionsによる自動デプロイ

GitHub Secretsに以下の値を設定してください：

- `SSH_PRIVATE_KEY`: EC2インスタンスに接続するためのSSH秘密鍵
- `EC2_HOST`: EC2インスタンスのパブリックIP
- `EC2_USER`: EC2インスタンスのユーザー名（例：ubuntu）
- `APP_DIR`: アプリケーションのデプロイ先ディレクトリ（例：/home/ubuntu/app）

mainブランチにプッシュすると、GitHub Actionsによって自動的にデプロイされます。

## 使用方法

### LINEボットの操作

- **メニュー**
  - 予定登録: 食事予定を登録します
  - 予定変更: 食事予定を変更します
  - 予定確認: 食事予定を確認します
  - ヘルプ: ヘルプを表示します

- **コマンド**
  - `/help`: ヘルプを表示
  - `/register <日付> <食事タイプ> <参加> [準備方法]`: 予定を登録
    - 例: `/register today lunch yes cook`
  - `/check [日付]`: 予定を確認
    - 例: `/check tomorrow`

## 主な改善点

- **エラーハンドリングの強化**: 統一されたエラーハンドリング機構を導入
- **ロギングの改善**: 構造化ロギングによる運用性向上
- **コードの整理**: 関心事の分離と責務の明確化
- **型安全性の向上**: 型定義の整備と活用
- **メンテナンス性の向上**: ファイル構造の整理とコードの可読性向上
- **テスト容易性の向上**: 依存性注入パターンの適用

## ライセンス

[MIT](LICENSE)

## リッチメニューのセットアップ

リッチメニューは以下の方法でセットアップできます：

### 1. スクリプトを使用する方法

実際のLINE APIを使用してリッチメニューをセットアップする場合：

```bash
npm run setup-richmenu
```

モックを使用してリッチメニューのセットアップをテストする場合：

```bash
npm run setup-richmenu:mock
```

モック版を実行すると、`temp/` ディレクトリにリッチメニュー画像が保存されます。これにより、画像が正しく生成されているかを確認できます。

### 2. エンドポイントを使用する方法

サーバー起動後に以下のエンドポイントにアクセスしてリッチメニューをセットアップすることもできます：

```
# リッチメニューはスクリプトのみで完結（APIエンドポイントなし）
```

注意: この方法を使用するには、有効なLINE APIの認証情報が必要です。