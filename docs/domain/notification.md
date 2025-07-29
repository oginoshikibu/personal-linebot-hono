# 通知ドメイン (Notification Domain)

## 概要
LINEボットから家族メンバー（Alice・Bob）への通知を管理するドメイン。定期通知と変更通知の2つの主要な通知タイプを扱う。

## コア概念

### 通知タイプ (Notification Type)
- **定期通知**: 決まった時間に送信される通知
  - 朝の通知 (MORNING): 当日の食事予定確認
  - 夜の通知 (EVENING): 翌日の食事予定確認
- **変更通知**: 食事計画の変更時に送信される通知
  - 参加状況変更通知 (PARTICIPATION_CHANGE)
  - 担当者辞退通知 (PREPARER_QUIT)

### 通知対象 (Notification Target)
- **Alice**: Aliceへの通知
- **Bob**: Bobへの通知
- **ALL**: 全員への通知

### 通知状態 (Notification Status)
- **PENDING**: 送信待ち
- **SENT**: 送信完了
- **FAILED**: 送信失敗

## エンティティ

### NotificationLog
送信された通知の履歴を記録するエンティティ

#### 属性
- `id`: 一意識別子 (UUID)
- `type`: 通知タイプ
- `content`: 通知内容
- `targetUser`: 送信対象ユーザー
- `relatedMealPlanId`: 関連する食事計画ID（変更通知の場合）
- `status`: 送信状態
- `sentAt`: 送信日時
- `createdAt`: 作成日時

#### メソッド
- `markAsSent()`: 送信完了マーク
- `markAsFailed(reason: string)`: 送信失敗マーク

## 値オブジェクト

### NotificationType
```typescript
enum NotificationType {
  MORNING_REMINDER = 'MORNING_REMINDER',
  EVENING_REMINDER = 'EVENING_REMINDER',
  PARTICIPATION_CHANGE = 'PARTICIPATION_CHANGE',
  PREPARER_QUIT = 'PREPARER_QUIT'
}
```

### NotificationTarget
```typescript
enum NotificationTarget {
  ALICE = 'Alice',
  BOB = 'Bob',
  ALL = 'ALL'
}
```

### NotificationStatus
```typescript
enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}
```

## ドメインサービス

### NotificationService
通知の生成と送信を管理するサービス

#### メソッド
```typescript
class NotificationService {
  // 定期通知の生成
  generateMorningReminder(date: Date): Notification[];
  generateEveningReminder(date: Date): Notification[];
  
  // 変更通知の生成
  generateParticipationChangeNotification(
    mealPlan: MealPlan, 
    changedBy: 'Alice' | 'Bob'
  ): Notification[];
  
  generatePreparerQuitNotification(
    mealPlan: MealPlan, 
    quittedBy: 'Alice' | 'Bob'
  ): Notification[];
  
  // 通知送信
  send(notification: Notification): Promise<void>;
  
  // 失敗した通知の再送
  retrySending(notificationId: string): Promise<void>;
}
```

## ビジネスルール

### 定期通知ルール
1. **朝の通知 (7:00)**: 当日の食事予定を全員に送信
2. **夜の通知 (22:00)**: 翌日の食事予定を全員に送信
3. **送信対象**: Alice・Bob両方
4. **送信タイミング**: 毎日決まった時刻

### 変更通知ルール
1. **対象変更**: 当日・翌日の食事計画変更時のみ
2. **送信対象**: 変更を行っていない他のユーザー
3. **即時送信**: 変更発生時に即座に送信
4. **通知内容**: 変更内容の詳細を含む

### 通知内容生成ルール
1. **朝の通知**: 当日の昼食・夕食の予定を表形式で表示
2. **夜の通知**: 翌日の昼食・夕食の予定を表形式で表示
3. **変更通知**: 変更前後の状態比較を含む
4. **担当者辞退**: 全員不参加への自動変更を明記

## ユースケース

### 1. 定期通知送信
**アクター**: システム（スケジューラー）

**メインフロー**:
1. 設定時刻に通知生成をトリガー
2. 対象日の食事計画を取得
3. 通知内容を生成
4. 全ユーザーに送信
5. 送信結果をログに記録

### 2. 変更通知送信
**アクター**: 食事計画ドメイン

**メインフロー**:
1. 食事計画変更イベントを受信
2. 変更内容を分析
3. 通知対象ユーザーを特定
4. 通知内容を生成
5. 対象ユーザーに送信
6. 送信結果をログに記録

### 3. 通知履歴確認
**アクター**: システム管理者

**メインフロー**:
1. 通知ログを検索
2. 送信状況を確認
3. 失敗した通知の再送実行

## 通知メッセージテンプレート

### 朝の通知
```
【本日の食事予定】
◆ 昼食
Alice: {alice_status}
Bob: {bob_status}
準備: {preparation_role}

◆ 夕食
Alice: {alice_status}
Bob: {bob_status}
準備: {preparation_role}

予定を変更する場合はメニューから「予定変更」を選択してください。
```

### 夜の通知
```
【明日の食事予定確認】
◆ 昼食
Alice: {alice_status}
Bob: {bob_status}
準備: {preparation_role}

◆ 夕食
Alice: {alice_status}
Bob: {bob_status}
準備: {preparation_role}

予定を変更する場合はメニューから「予定変更」を選択してください。
```

### 参加状況変更通知
```
【食事予定が変更されました】
{changer}が{date}の{meal_type}の参加状況を変更しました。

変更後の予定:
Alice: {alice_status}
Bob: {bob_status}
準備: {preparation_role}
```

### 担当者辞退通知
```
【食事予定が変更されました】
{quitter}が{date}の{meal_type}の担当を辞退したため、全員不参加となりました。

変更後の予定:
Alice: 不参加
Bob: 不参加
準備: なし
```

## 外部依存

- **LINEメッセージドメイン**: 実際のメッセージ送信
- **食事ドメイン**: 食事計画の変更イベント
- **ユーザードメイン**: 送信対象ユーザーの識別
- **スケジューラー**: 定期通知のトリガー

## 設計パターン

### Observer Pattern
食事計画の変更を監視し、変更時に自動的に通知を生成・送信

### Template Method Pattern
通知内容の生成において、共通の構造を維持しながら通知タイプ別の詳細を変更

### Repository Pattern
通知ログの永続化とクエリを抽象化

## 不変条件

1. **通知対象制約**: 送信対象は必ずAlice・Bobのいずれかまたは両方
2. **関連性制約**: 変更通知は必ず関連する食事計画IDを持つ
3. **時系列制約**: 送信日時は作成日時以降である
4. **状態制約**: 送信済みの通知は失敗状態に変更できない