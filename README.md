# 家庭用食事管理LINEボット

家庭での食事予定を管理するためのLINEボットです。家族メンバーが各食事に参加するかどうか、食事の準備方法などを管理し、定期的に確認メッセージを送信します。

## 主な機能

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

## クイックスタート

### 前提条件

- Node.js 18以上
- npm 8以上

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/personal-linebot-hono.git
cd personal-linebot-hono

# 依存関係をインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定

# データベースのセットアップ
npx prisma generate
npx prisma migrate dev

# 開発サーバーを起動
npm run dev
```

### 環境変数

`.env`ファイルに以下の環境変数を設定してください：

```
DATABASE_URL="file:./dev.db"
LINE_CHANNEL_SECRET="your_line_channel_secret"
LINE_CHANNEL_ACCESS_TOKEN="your_line_channel_access_token"
ALLOWED_LINE_IDS="userId1,userId2"
PORT=3000
HOST="0.0.0.0"
MORNING_NOTIFICATION_HOUR=7
MORNING_NOTIFICATION_MINUTE=0
EVENING_NOTIFICATION_HOUR=22
EVENING_NOTIFICATION_MINUTE=0
```

## ドキュメント

- [要件定義書](docs/requirements.md) - 機能要件と仕様の詳細
- [デプロイ手順書](docs/DEPLOYMENT.md) - AWS EC2への本番デプロイ手順
- [アーキテクチャ設計](docs/domain_model.md) - ドメインモデルとシステム設計
- [データベース設計](docs/er_diagram.md) - ER図とデータベーススキーマ
- [ユーザーフロー](docs/user_flow.md) - LINEボットの操作フロー
- [リッチメニュー設定](docs/RICHMENU.md) - リッチメニューのセットアップガイド

## リッチメニューのセットアップ

```bash
# 実際のLINE APIを使用
npm run setup-richmenu

# テーマ対応セットアップ
npm run setup-richmenu:theme

# モックモードでテスト
npm run setup-richmenu:mock
```

## デプロイ

本番環境へのデプロイについては [デプロイ手順書](docs/DEPLOYMENT.md) を参照してください。

### 簡易デプロイ手順

1. [Terraformによるインフラ構築](docs/DEPLOYMENT.md#2-awsインフラのセットアップ)
2. [アプリケーションのデプロイ](docs/DEPLOYMENT.md#5-アプリケーションのデプロイ)
3. [LINE Webhook URLの設定](docs/DEPLOYMENT.md#7-line-webhook-urlの設定)

## 貢献

プルリクエストや課題報告は歓迎します。大きな変更を行う前に、まずIssueで議論してください。

## ライセンス

[MIT](LICENSE)