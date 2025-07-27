# ユーザードメイン (Users Domain)

## 概要
家庭用食事管理システムにおけるユーザー管理ドメイン。AliceとBobの2人のユーザーのシンプルな管理を行う。

## エンティティ

### User
家族メンバー（Alice、Bob）を表現するエンティティ

#### 属性
- `id`: 一意識別子 (UUID)
- `lineId`: LINE ユーザーID (認証・識別用)
- `name`: 表示名 ("Alice" または "Bob")
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

#### ビジネスルール
- LINE IDは一意である必要がある
- 名前は"Alice"または"Bob"のみ
- システムにはAliceとBobの2人のユーザーのみ存在する

## ユースケース

### 1. ユーザー認証
**アクター**: AliceまたはBob
**前提条件**: LINE IDがシステムに登録済み

**メインフロー**:
1. LINEでBotにメッセージ送信
2. LINE IDでユーザーを特定
3. 認証完了
4. 対応するユーザー情報を返却

## リポジトリ

### UserRepository
```typescript
interface UserRepository {
  findByLineId(lineId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>; // Alice, Bobの2人を返却
}
```

## 不変条件

1. **固定ユーザー**: システムにはAliceとBobの2人のみ存在
2. **一意性**: LINE IDは重複不可
3. **完全性**: ユーザーは有効な名前を持つ

## 外部依存

- LINE Messaging API (LINE ID取得)
- データベース (ユーザー情報永続化)