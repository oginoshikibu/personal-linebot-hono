# 🍽️ 家庭用食事管理LINEボット

家庭での食事予定を効率的に管理するためのLINEボットアプリケーションです。家族メンバーが各食事（昼食・夕食）への参加状況や準備方法を登録・管理し、定期的な確認通知により食事計画をスムーズに進行できます。

## ✨ 主な機能

### 📊 食事予定管理
- **参加状況管理**: 各メンバーが昼食・夕食に参加するかどうかを登録
- **準備方法管理**: 食事の準備方法を選択（自炊、各自自由、買って一緒に食べる）
- **カレンダー表示**: 週間・月間の食事予定をカレンダー形式で確認

### 🔔 自動通知機能
- **朝の確認通知**: 毎朝7時に当日の食事予定を確認
- **夜の翌日確認**: 毎晩22時に翌日の食事予定を事前確認
- **リアルタイム更新**: 予定変更時の即座な全メンバー通知

### 🎛️ 直感的なUI
- **リッチメニュー**: ワンタッチで主要機能にアクセス
- **Flexメッセージ**: 見やすい食事予定の表示
- **インタラクティブ操作**: ボタンタップによる簡単な予定変更

## 技術スタック

- **フレームワーク**: [Hono](https://honojs.dev/) - 高速なWebフレームワーク
- **データベース**: MySQL + [Prisma ORM](https://www.prisma.io/) - 型安全なデータベースアクセス
- **インフラ**: AWS EC2 + Terraform - Infrastructure as Code
- **外部API**: LINE Messaging API - ボット機能の実現
- **開発ツール**: 
  - [Biome](https://biomejs.dev/) - リンター・フォーマッター
  - [Vitest](https://vitest.dev/) - 高速テストフレームワーク
  - [Zod](https://zod.dev/) - スキーマバリデーション
  - TypeScript - 型安全性の確保

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

```bash
# データベース設定
DATABASE_URL="mysql://user:password@localhost:3306/linebot_db"

# LINE Bot設定
LINE_CHANNEL_SECRET="your_line_channel_secret"
LINE_CHANNEL_ACCESS_TOKEN="your_line_channel_access_token"

# サーバー設定
PORT=3000
HOST="0.0.0.0"
NODE_ENV="development"

# 通知時刻設定
MORNING_NOTIFICATION_HOUR=7
MORNING_NOTIFICATION_MINUTE=0
EVENING_NOTIFICATION_HOUR=22
EVENING_NOTIFICATION_MINUTE=0

# ログレベル
LOG_LEVEL="info"
```

## ドキュメント

### 📋 設計・仕様書
- [要件定義書](docs/requirements.md) - 機能要件と仕様の詳細
- [ユーザーフロー](docs/user_flow.md) - LINEボットの操作フロー図

### 🏗️ アーキテクチャ・技術設計
- [アーキテクチャ設計書](docs/architecture.md) - システム全体のアーキテクチャと層別責務
- [データベース設計](docs/er_diagram.md) - ER図とデータベーススキーマ
- [ドメインモデル](docs/domain/) - ドメイン別の詳細設計
  - [ユーザー管理](docs/domain/users.md)
  - [食事管理](docs/domain/meal.md)
  - [通知機能](docs/domain/notification.md)
  - [LINEメッセージ](docs/domain/line_message.md)

### 🚀 運用・デプロイ
- [デプロイ手順書](docs/DEPLOYMENT.md) - AWS EC2への本番デプロイ手順
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

## ユーザー管理

ユーザーの管理には以下のスクリプトを使用できます：

```bash
# ユーザーを追加
npm run add-user

# ユーザーを削除
npm run delete-user

# ユーザー一覧を表示
npm run list-users

# ユーザーを検索
npm run find-user
```

## 開発

### コード品質管理

```bash
# Biomeによるリント・フォーマット
npm run check

# 型チェック
npm run type-check

# テストの実行
npm run test

# テスト（ウォッチモード）
npm run test:watch

# テストカバレッジ確認
npm run test:coverage

# テストUI
npm run test:ui

# CI用統合チェック
npm run ci
```

### データベース管理

```bash
# Prismaクライアント生成
npm run prisma:generate

# マイグレーション実行
npm run prisma:migrate

# Prisma Studio（データベースGUI）
npm run prisma:studio
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