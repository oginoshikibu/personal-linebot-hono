# プロジェクト構造

```
personal-linebot-hono/
├── docs/                       # ドキュメント
│   ├── requirements.md         # 要件定義書
│   └── project_structure.md    # プロジェクト構造
├── src/                        # ソースコード
│   ├── index.ts                # エントリーポイント
│   ├── routes/                 # ルート定義
│   │   ├── index.ts           # ルートのエクスポート
│   │   ├── webhook.ts         # LINE Webhookハンドラ
│   │   └── api/               # APIエンドポイント
│   │       └── index.ts       # APIルート
│   ├── services/              # サービス層
│   │   ├── line.ts           # LINE関連サービス
│   │   ├── meal.ts           # 食事予定サービス
│   │   └── notification.ts   # 通知サービス
│   ├── models/               # データモデル
│   │   └── index.ts          # モデルのエクスポート
│   ├── utils/                # ユーティリティ
│   │   ├── auth.ts          # 認証ユーティリティ
│   │   └── date.ts          # 日付操作ユーティリティ
│   └── config/               # 設定ファイル
│       └── index.ts          # 設定のエクスポート
├── prisma/                   # Prisma関連
│   ├── schema.prisma         # データベーススキーマ
│   └── migrations/           # マイグレーションファイル
├── terraform/                # Terraformファイル
│   ├── main.tf              # メインの定義ファイル
│   ├── variables.tf         # 変数定義
│   └── outputs.tf           # 出力定義
├── .github/                  # GitHub関連
│   └── workflows/            # GitHub Actions
│       └── deploy.yml        # デプロイワークフロー
├── package.json              # パッケージ定義
├── tsconfig.json             # TypeScript設定
├── .env.example              # 環境変数のサンプル
├── .gitignore                # Gitの除外設定
├── README.md                 # プロジェクト説明
└── LICENSE                   # ライセンス
``` 