# LINEメッセージドメイン (LINE Message Domain)

## 概要
LINE Messaging APIを通じたメッセージ送信とユーザーインタラクションを管理するドメイン。テキストメッセージ、リッチメニュー、Flexメッセージ、ポストバックアクションなどのLINE特有の機能を抽象化する。

## コア概念

### メッセージタイプ (Message Type)
- **TEXT**: テキストメッセージ
- **FLEX**: Flexメッセージ（リッチなレイアウト）
- **TEMPLATE**: テンプレートメッセージ（ボタン付き）
- **RICH_MENU**: リッチメニューの更新

### インタラクションタイプ (Interaction Type)
- **POSTBACK**: ポストバックアクション
- **MESSAGE**: テキストメッセージ受信
- **FOLLOW**: 友だち追加
- **UNFOLLOW**: ブロック

## エンティティ

### LINEMessage
送信するLINEメッセージを表現するエンティティ

#### 属性
- `id`: 一意識別子 (UUID)
- `recipientLineId`: 送信先のLINE ID
- `messageType`: メッセージタイプ
- `content`: メッセージ内容
- `flexData`: Flexメッセージのデータ（該当する場合）
- `replyToken`: 返信トークン（該当する場合）
- `status`: 送信状態
- `sentAt`: 送信日時
- `createdAt`: 作成日時

#### メソッド
- `send()`: メッセージ送信
- `markAsSent()`: 送信完了マーク
- `markAsFailed(error: string)`: 送信失敗マーク

### LINEInteraction
LINEからの受信イベントを表現するエンティティ

#### 属性
- `id`: 一意識別子 (UUID)
- `sourceLineId`: 送信者のLINE ID
- `interactionType`: インタラクションタイプ
- `messageText`: メッセージテキスト（該当する場合）
- `postbackData`: ポストバックデータ（該当する場合）
- `replyToken`: 返信トークン
- `timestamp`: 受信日時
- `processed`: 処理済みフラグ
- `createdAt`: 作成日時

#### メソッド
- `markAsProcessed()`: 処理済みマーク
- `extractPostbackParams()`: ポストバックパラメータの抽出

## 値オブジェクト

### MessageType
```typescript
enum MessageType {
  TEXT = 'TEXT',
  FLEX = 'FLEX',
  TEMPLATE = 'TEMPLATE',
  RICH_MENU = 'RICH_MENU'
}
```

### InteractionType
```typescript
enum InteractionType {
  POSTBACK = 'POSTBACK',
  MESSAGE = 'MESSAGE',
  FOLLOW = 'FOLLOW',
  UNFOLLOW = 'UNFOLLOW'
}
```

### SendStatus
```typescript
enum SendStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}
```

### FlexMessageTemplate
```typescript
interface FlexMessageTemplate {
  type: 'bubble' | 'carousel';
  body: FlexComponent;
  footer?: FlexComponent;
  action?: FlexAction;
}

interface FlexComponent {
  type: 'box' | 'text' | 'button' | 'image';
  layout?: 'vertical' | 'horizontal';
  contents?: FlexComponent[];
  text?: string;
  action?: FlexAction;
}

interface FlexAction {
  type: 'postback' | 'uri' | 'message';
  data?: string;
  uri?: string;
  text?: string;
}
```

### PostbackData
```typescript
interface PostbackData {
  action: string;
  date?: string;
  mealType?: 'LUNCH' | 'DINNER';
  participationStatus?: 'WILL_PARTICIPATE' | 'WILL_NOT_PARTICIPATE' | 'UNDECIDED';
  preparationRole?: 'Alice' | 'Bob' | 'None';
  [key: string]: string | undefined;
}
```

## ドメインサービス

### LINEMessageService
LINEメッセージの送信を管理するサービス

#### メソッド
```typescript
class LINEMessageService {
  // テキストメッセージ送信
  sendTextMessage(lineId: string, text: string): Promise<void>;
  
  // Flexメッセージ送信
  sendFlexMessage(lineId: string, flexData: FlexMessageTemplate): Promise<void>;
  
  // 返信メッセージ送信
  replyMessage(replyToken: string, message: LINEMessage): Promise<void>;
  
  // リッチメニュー設定
  setRichMenu(lineId: string, richMenuId: string): Promise<void>;
  
  // グループメッセージ送信
  broadcastMessage(lineIds: string[], message: LINEMessage): Promise<void>;
}
```

### LINEInteractionService
LINEからの受信イベントを処理するサービス

#### メソッド
```typescript
class LINEInteractionService {
  // ポストバックイベント処理
  handlePostback(interaction: LINEInteraction): Promise<void>;
  
  // テキストメッセージ処理
  handleTextMessage(interaction: LINEInteraction): Promise<void>;
  
  // 友だち追加処理
  handleFollow(interaction: LINEInteraction): Promise<void>;
  
  // ブロック処理
  handleUnfollow(interaction: LINEInteraction): Promise<void>;
  
  // インタラクションのルーティング
  routeInteraction(interaction: LINEInteraction): Promise<void>;
}
```

### FlexMessageBuilder
Flexメッセージを構築するビルダーサービス

#### メソッド
```typescript
class FlexMessageBuilder {
  // カレンダー表示用Flexメッセージ
  buildCalendarMessage(year: number, month: number): FlexMessageTemplate;
  
  // 食事予定表示用Flexメッセージ
  buildMealPlanMessage(date: Date, mealPlans: MealPlan[]): FlexMessageTemplate;
  
  // 編集操作用Flexメッセージ
  buildEditMealMessage(mealPlan: MealPlan): FlexMessageTemplate;
  
  // 確認ダイアログ用Flexメッセージ
  buildConfirmationMessage(message: string, action: string): FlexMessageTemplate;
}
```

## ビジネスルール

### メッセージ送信ルール
1. **認証チェック**: 送信対象はAlice・Bobの登録済みLINE IDのみ
2. **レート制限**: 短時間での大量送信を防ぐ
3. **エラーハンドリング**: 送信失敗時の自動リトライ機能
4. **ログ記録**: 全ての送信を履歴として記録

### インタラクション処理ルール
1. **権限チェック**: 未登録ユーザーからのメッセージは無視
2. **重複処理防止**: 同じインタラクションの重複処理を防ぐ
3. **タイムアウト**: 返信トークンの有効期限チェック
4. **状態管理**: 対話の文脈を維持

### Flexメッセージルール
1. **レスポンシブ対応**: 様々な画面サイズに対応
2. **アクセシビリティ**: 分かりやすいラベルとアクション
3. **一貫性**: UIデザインの統一
4. **パフォーマンス**: 軽量なデータ構造

## ユースケース

### 1. 通知メッセージ送信
**アクター**: 通知ドメイン

**メインフロー**:
1. 通知ドメインからメッセージ送信要求
2. 送信対象のLINE IDを確認
3. メッセージ内容をLINE形式に変換
4. LINE Messaging APIで送信
5. 送信結果を通知ドメインに返却

### 2. ユーザーインタラクション処理
**アクター**: LINEプラットフォーム

**メインフロー**:
1. LINEからWebhookでイベント受信
2. イベントタイプに応じて処理を分岐
3. ユーザー認証チェック
4. 対応するドメインサービスを呼び出し
5. 必要に応じて返信メッセージを送信

### 3. カレンダー表示
**アクター**: Alice または Bob

**メインフロー**:
1. リッチメニューから「今後の予定」選択
2. 月間カレンダーのFlexメッセージを生成
3. ユーザーに送信
4. 日付選択のポストバックを待機
5. 選択された日付の詳細を表示

## Flexメッセージテンプレート

### カレンダー表示
```json
{
  "type": "bubble",
  "header": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "2024年1月",
        "weight": "bold",
        "size": "lg"
      }
    ]
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      // カレンダーの日付ボタンを動的生成
    ]
  }
}
```

### 食事予定表示
```json
{
  "type": "bubble",
  "header": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "1月15日(月)の予定",
        "weight": "bold"
      }
    ]
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": "◆ 昼食",
            "weight": "bold"
          },
          {
            "type": "text",
            "text": "Alice: 不参加\nBob: 参加\n準備: Bob"
          }
        ]
      }
    ]
  },
  "footer": {
    "type": "box",
    "layout": "horizontal",
    "contents": [
      {
        "type": "button",
        "action": {
          "type": "postback",
          "label": "編集",
          "data": "action=edit&date=2024-01-15"
        }
      }
    ]
  }
}
```

## ポストバックアクション定義

### 日付選択
```
action=select_date&date=2024-01-15
```

### 食事編集
```
action=edit_meal&date=2024-01-15&mealType=LUNCH
```

### 参加状況変更
```
action=change_participation&date=2024-01-15&mealType=DINNER&status=WILL_NOT_PARTICIPATE
```

### 担当者辞退
```
action=quit_preparation&date=2024-01-15&mealType=LUNCH
```

## 外部依存

- **LINE Messaging API**: 実際のメッセージ送信・受信
- **ユーザードメイン**: ユーザー認証とLINE ID管理
- **食事ドメイン**: 食事計画の取得・更新
- **通知ドメイン**: 通知メッセージの内容

## セキュリティ考慮事項

1. **認証**: 署名検証によるWebhookの正当性確認
2. **認可**: 登録済みユーザーのみの操作許可
3. **入力検証**: ポストバックデータの妥当性チェック
4. **レート制限**: 不正な大量アクセスの防止

## パフォーマンス考慮事項

1. **非同期処理**: メッセージ送信の非同期実行
2. **キャッシュ**: Flexテンプレートのキャッシュ
3. **バッチ処理**: 複数ユーザーへの一括送信
4. **リトライ機能**: 送信失敗時の自動再試行

## 不変条件

1. **認証制約**: 送信対象・送信者は必ずAlice・Bobのいずれか
2. **トークン制約**: 返信トークンは1回のみ使用可能
3. **形式制約**: Flexメッセージは LINE仕様に準拠
4. **状態制約**: 送信済みメッセージは変更不可