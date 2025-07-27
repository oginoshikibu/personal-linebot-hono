# 実装チェックリスト - 統一食事ドメインモデル移行

## 概要
現在のLunch/DinnerドメインモデルからMeal統一ドメインモデルへの移行に必要な具体的なコード変更をタスク別に整理したチェックリストです。

---

## Phase 1: データベーススキーマの変更

### 1.1 Prismaスキーマの更新 
**ファイル**: `prisma/schema.prisma`

#### ✅ 新しい列挙型を追加
```prisma
// 準備担当者の列挙型（既存のPreparationTypeと置き換え）
enum PreparationRole {
  ALICE
  BOB  
  NONE
}

// 参加状況の列挙型（新規追加）
enum ParticipationStatus {
  WILL_PARTICIPATE
  WILL_NOT_PARTICIPATE
  UNDECIDED
}
```

#### ✅ MealPlanモデルを新しい構造に変更
```prisma
model MealPlan {
  id                  String              @id @default(uuid())
  date                DateTime            // 日付
  mealType            MealType            @map("meal_type")
  preparationRole     PreparationRole     @map("preparation_role")
  aliceParticipation  ParticipationStatus @map("alice_participation")
  bobParticipation    ParticipationStatus @map("bob_participation")
  currentState        Int                 @map("current_state")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")

  @@unique([date, mealType])
  @@map("meal_plans")
}
```

#### ✅ 不要なモデルを削除
```prisma
// 以下を削除
// - MealParticipation モデル
// - cookerId フィールド
// - User との relation
```

#### ✅ NotificationLogモデルを拡張
```prisma
model NotificationLog {
  id                String   @id @default(uuid())
  type              String   // MORNING_REMINDER, EVENING_REMINDER, PARTICIPATION_CHANGE, PREPARER_QUIT
  content           String
  targetUser        String   @map("target_user") // Alice, Bob, ALL
  relatedMealPlanId String?  @map("related_meal_plan_id")
  status            String   @default("PENDING") // PENDING, SENT, FAILED
  sentAt            DateTime? @map("sent_at")
  createdAt         DateTime @default(now()) @map("created_at")

  @@map("notification_logs")
}
```

#### ✅ マイグレーション実行
```bash
npx prisma migrate dev --name "unified-meal-domain-model"
npx prisma generate
```

---

## Phase 2: ドメインエンティティの実装

### 2.1 新しいMealPlanエンティティクラスを作成
**新規ファイル**: `src/domain/entities/MealPlan.ts`

```typescript
import { Result } from '../types/Result';

export enum MealType {
  LUNCH = 'LUNCH',
  DINNER = 'DINNER'
}

export enum PreparationRole {
  ALICE = 'ALICE',
  BOB = 'BOB', 
  NONE = 'NONE'
}

export enum ParticipationStatus {
  WILL_PARTICIPATE = 'WILL_PARTICIPATE',
  WILL_NOT_PARTICIPATE = 'WILL_NOT_PARTICIPATE',
  UNDECIDED = 'UNDECIDED'
}

// ドメイン定数
export const DEFAULT_LUNCH_PREPARER = PreparationRole.BOB;

export class MealPlan {
  constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly mealType: MealType,
    private _preparationRole: PreparationRole,
    private _aliceParticipation: ParticipationStatus,
    private _bobParticipation: ParticipationStatus,
    private _currentState: number,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  // getters
  get preparationRole(): PreparationRole { return this._preparationRole; }
  get aliceParticipation(): ParticipationStatus { return this._aliceParticipation; }
  get bobParticipation(): ParticipationStatus { return this._bobParticipation; }
  get currentState(): number { return this._currentState; }
  get updatedAt(): Date { return this._updatedAt; }

  // ファクトリーメソッド
  static createLunchPlan(date: Date): MealPlan {
    return new MealPlan(
      crypto.randomUUID(),
      date,
      MealType.LUNCH,
      DEFAULT_LUNCH_PREPARER, // 昼食固定担当者
      ParticipationStatus.WILL_PARTICIPATE,
      ParticipationStatus.WILL_PARTICIPATE,
      1, // 初期状態: Bob担当・両者参加
      new Date(),
      new Date()
    );
  }

  static createDinnerPlan(date: Date, preparationRole: PreparationRole): Result<MealPlan> {
    if (preparationRole === PreparationRole.NONE) {
      return Result.failure("Dinner plan requires a designated preparer.");
    }

    // 担当者は必ず参加、非担当者は参加で初期化（状態テーブルに基づく）
    const aliceParticipation = ParticipationStatus.WILL_PARTICIPATE;
    const bobParticipation = ParticipationStatus.WILL_PARTICIPATE;

    const mealPlan = new MealPlan(
      crypto.randomUUID(),
      date,
      MealType.DINNER,
      preparationRole,
      aliceParticipation,
      bobParticipation,
      preparationRole === PreparationRole.ALICE ? 3 : 1,
      new Date(),
      new Date()
    );

    return Result.success(mealPlan);
  }

  // ビジネスロジック
  preparerQuits(): Result<void> {
    if (this._preparationRole === PreparationRole.NONE) {
      return Result.failure("No preparer is currently assigned.");
    }

    this._preparationRole = PreparationRole.NONE;
    this._aliceParticipation = ParticipationStatus.WILL_NOT_PARTICIPATE;
    this._bobParticipation = ParticipationStatus.WILL_NOT_PARTICIPATE;
    this.updateCurrentState();
    this._updatedAt = new Date();

    return Result.success();
  }

  changeAliceParticipation(status: ParticipationStatus): Result<void> {
    // 担当者は参加必須
    if (this._preparationRole === PreparationRole.ALICE && 
        status === ParticipationStatus.WILL_NOT_PARTICIPATE) {
      return Result.failure("Preparer must participate in the meal.");
    }

    this._aliceParticipation = status;
    this.updateCurrentState();
    this._updatedAt = new Date();
    return Result.success();
  }

  changeBobParticipation(status: ParticipationStatus): Result<void> {
    // 担当者は参加必須
    if (this._preparationRole === PreparationRole.BOB && 
        status === ParticipationStatus.WILL_NOT_PARTICIPATE) {
      return Result.failure("Preparer must participate in the meal.");
    }

    this._bobParticipation = status;
    this.updateCurrentState();
    this._updatedAt = new Date();
    return Result.success();
  }

  private updateCurrentState(): void {
    // 状態計算ロジック（meal.mdの状態テーブルに基づく）
    if (this.mealType === MealType.LUNCH) {
      if (this._preparationRole === PreparationRole.BOB) {
        if (this._aliceParticipation === ParticipationStatus.WILL_PARTICIPATE) {
          this._currentState = 1; // Bob担当・両者参加
        } else {
          this._currentState = 2; // Bob担当・Bobのみ
        }
      } else {
        if (this._bobParticipation === ParticipationStatus.UNDECIDED) {
          this._currentState = 4; // 担当なし・Bob未定
        } else {
          this._currentState = 3; // 担当なし・両者不参加
        }
      }
    } else { // DINNER
      if (this._preparationRole === PreparationRole.BOB) {
        if (this._aliceParticipation === ParticipationStatus.WILL_PARTICIPATE) {
          this._currentState = 1; // Bob担当・両者参加
        } else {
          this._currentState = 2; // Bob担当・Bobのみ
        }
      } else if (this._preparationRole === PreparationRole.ALICE) {
        if (this._bobParticipation === ParticipationStatus.WILL_PARTICIPATE) {
          this._currentState = 3; // Alice担当・両者参加
        } else {
          this._currentState = 4; // Alice担当・Aliceのみ
        }
      } else {
        this._currentState = 5; // 担当なし・両者不参加
      }
    }
  }
}
```

### 2.2 Result型の実装
**新規ファイル**: `src/domain/types/Result.ts`

```typescript
export class Result<T> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: string
  ) {}

  static success<T>(value?: T): Result<T> {
    return new Result(true, value);
  }

  static failure<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error("Attempted to retrieve the success value from a failed result.");
    }
    return this._value!;
  }

  get error(): string {
    if (this._isSuccess) {
      throw new Error("Attempted to retrieve the error from a successful result.");
    }
    return this._error!;
  }
}
```

---

## Phase 3: リポジトリの実装

### 3.1 MealPlanRepository
**新規ファイル**: `src/domain/repositories/MealPlanRepository.ts`

```typescript
import { MealPlan, MealType } from '../entities/MealPlan';

export interface MealPlanRepository {
  findByDateAndType(date: Date, mealType: MealType): Promise<MealPlan | null>;
  save(plan: MealPlan): Promise<MealPlan>;
  findByDateRange(from: Date, to: Date): Promise<MealPlan[]>;
  findByDateRangeAndType(from: Date, to: Date, mealType: MealType): Promise<MealPlan[]>;
}
```

### 3.2 PrismaMealPlanRepository
**新規ファイル**: `src/infrastructure/repositories/PrismaMealPlanRepository.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { MealPlan, MealType, PreparationRole, ParticipationStatus } from '../../domain/entities/MealPlan';
import { MealPlanRepository } from '../../domain/repositories/MealPlanRepository';

export class PrismaMealPlanRepository implements MealPlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByDateAndType(date: Date, mealType: MealType): Promise<MealPlan | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const plan = await this.prisma.mealPlan.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        mealType
      }
    });

    return plan ? this.toDomain(plan) : null;
  }

  async save(plan: MealPlan): Promise<MealPlan> {
    const data = this.toPersistence(plan);
    
    const saved = await this.prisma.mealPlan.upsert({
      where: {
        date_mealType: {
          date: plan.date,
          mealType: plan.mealType
        }
      },
      update: data,
      create: data
    });

    return this.toDomain(saved);
  }

  async findByDateRange(from: Date, to: Date): Promise<MealPlan[]> {
    const plans = await this.prisma.mealPlan.findMany({
      where: {
        date: {
          gte: from,
          lte: to
        }
      },
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' }
      ]
    });

    return plans.map(plan => this.toDomain(plan));
  }

  async findByDateRangeAndType(from: Date, to: Date, mealType: MealType): Promise<MealPlan[]> {
    const plans = await this.prisma.mealPlan.findMany({
      where: {
        date: {
          gte: from,
          lte: to
        },
        mealType
      },
      orderBy: { date: 'asc' }
    });

    return plans.map(plan => this.toDomain(plan));
  }

  private toDomain(plan: any): MealPlan {
    return new MealPlan(
      plan.id,
      plan.date,
      plan.mealType as MealType,
      plan.preparationRole as PreparationRole,
      plan.aliceParticipation as ParticipationStatus,
      plan.bobParticipation as ParticipationStatus,
      plan.currentState,
      plan.createdAt,
      plan.updatedAt
    );
  }

  private toPersistence(plan: MealPlan) {
    return {
      id: plan.id,
      date: plan.date,
      mealType: plan.mealType,
      preparationRole: plan.preparationRole,
      aliceParticipation: plan.aliceParticipation,
      bobParticipation: plan.bobParticipation,
      currentState: plan.currentState,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };
  }
}
```

---

## Phase 4: アプリケーションサービスの更新

### 4.1 既存のmeal.tsサービスを置き換え
**ファイル**: `src/features/meal/services/meal.ts`

```typescript
import { MealPlan, MealType, PreparationRole } from '../../../domain/entities/MealPlan';
import { MealPlanRepository } from '../../../domain/repositories/MealPlanRepository';
import { Result } from '../../../domain/types/Result';
import { logger } from '../../../lib/logger';

export class MealPlanService {
  constructor(private readonly repository: MealPlanRepository) {}

  async getOrCreateTodayMealPlans(): Promise<{ lunch: MealPlan; dinner: MealPlan }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lunch = await this.getOrCreateMealPlan(today, MealType.LUNCH);
    const dinner = await this.getOrCreateMealPlan(today, MealType.DINNER);

    return { lunch, dinner };
  }

  async getOrCreateMealPlan(date: Date, mealType: MealType, preparationRole?: PreparationRole): Promise<MealPlan> {
    let plan = await this.repository.findByDateAndType(date, mealType);
    
    if (!plan) {
      if (mealType === MealType.LUNCH) {
        plan = MealPlan.createLunchPlan(date);
      } else {
        if (!preparationRole) {
          throw new Error("Dinner plan creation requires preparer designation.");
        }
        const result = MealPlan.createDinnerPlan(date, preparationRole);
        if (result.isFailure) {
          throw new Error(result.error);
        }
        plan = result.value;
      }
      
      plan = await this.repository.save(plan);
    }

    return plan;
  }

  async updateParticipation(
    date: Date, 
    mealType: MealType, 
    person: 'Alice' | 'Bob', 
    status: ParticipationStatus
  ): Promise<Result<MealPlan>> {
    const plan = await this.repository.findByDateAndType(date, mealType);
    if (!plan) {
      return Result.failure("Meal plan not found.");
    }

    const result = person === 'Alice' 
      ? plan.changeAliceParticipation(status)
      : plan.changeBobParticipation(status);

    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const savedPlan = await this.repository.save(plan);
    return Result.success(savedPlan);
  }

  async preparerQuits(date: Date, mealType: MealType): Promise<Result<MealPlan>> {
    const plan = await this.repository.findByDateAndType(date, mealType);
    if (!plan) {
      return Result.failure("Meal plan not found.");
    }

    const result = plan.preparerQuits();
    if (result.isFailure) {
      return Result.failure(result.error);
    }

    const savedPlan = await this.repository.save(plan);
    return Result.success(savedPlan);
  }
}
```

---

## Phase 5: LINEハンドラーの更新

### 5.1 ポストバックハンドラーの更新
**ファイル**: `src/features/line/handlers/postbacks/lunch.ts`

```typescript
// 既存のlunch.tsを以下に置き換える
import { PostbackEvent } from '@line/bot-sdk';
import { MealType, ParticipationStatus } from '../../../../domain/entities/MealPlan';
import { MealPlanService } from '../../../meal/services/meal';
import { parseDate } from '../../../../utils/date';

export const handleLunchPostback = async (event: PostbackEvent, mealService: MealPlanService) => {
  const data = new URLSearchParams(event.postback.data);
  const action = data.get('action');
  const dateStr = data.get('date');

  if (!dateStr) {
    throw new Error('日付が指定されていません');
  }

  const date = parseDate(dateStr);
  const userId = event.source.userId!;
  const person = await getUserName(userId); // Alice or Bob

  switch (action) {
    case 'participate':
      await mealService.updateParticipation(date, MealType.LUNCH, person, ParticipationStatus.WILL_PARTICIPATE);
      break;
    case 'not_participate':
      await mealService.updateParticipation(date, MealType.LUNCH, person, ParticipationStatus.WILL_NOT_PARTICIPATE);
      break;
    case 'undecided':
      if (person === 'Bob') {
        await mealService.updateParticipation(date, MealType.LUNCH, person, ParticipationStatus.UNDECIDED);
      }
      break;
    case 'quit_preparation':
      await mealService.preparerQuits(date, MealType.LUNCH);
      break;
  }

  // 更新後の状態を返信
  const plan = await mealService.getOrCreateMealPlan(date, MealType.LUNCH);
  // Flexメッセージで状態表示...
};
```

### 5.2 dinnerハンドラーの更新
**ファイル**: `src/features/line/handlers/postbacks/dinner.ts`

```typescript
// 夕食用の同様のハンドラーを実装
// 初回は担当者選択、設定後は参加状況変更・辞退のみ
export const handleDinnerPostback = async (event: PostbackEvent, mealService: MealPlanService) => {
  const data = new URLSearchParams(event.postback.data);
  const action = data.get('action');
  const dateStr = data.get('date');
  
  if (!dateStr) {
    throw new Error('日付が指定されていません');
  }

  const date = parseDate(dateStr);
  const userId = event.source.userId!;
  const person = await getUserName(userId);

  switch (action) {
    case 'select_role_alice':
      await mealService.getOrCreateMealPlan(date, MealType.DINNER, PreparationRole.ALICE);
      break;
    case 'select_role_bob':
      await mealService.getOrCreateMealPlan(date, MealType.DINNER, PreparationRole.BOB);
      break;
    case 'participate':
      await mealService.updateParticipation(date, MealType.DINNER, person, ParticipationStatus.WILL_PARTICIPATE);
      break;
    case 'not_participate':
      await mealService.updateParticipation(date, MealType.DINNER, person, ParticipationStatus.WILL_NOT_PARTICIPATE);
      break;
    case 'quit_preparation':
      await mealService.preparerQuits(date, MealType.DINNER);
      break;
  }

  // 状態表示...
};
```

---

## Phase 6: 通知システムの更新

### 6.1 通知メッセージテンプレートの更新
**ファイル**: `src/features/notification/templates/mealPlan.ts`

```typescript
import { MealPlan } from '../../../domain/entities/MealPlan';

export const generateMorningNotification = (lunch: MealPlan, dinner: MealPlan): string => {
  return `【本日の食事予定】
◆ 昼食
Alice: ${getParticipationText(lunch.aliceParticipation)}
Bob: ${getParticipationText(lunch.bobParticipation)}
準備: ${getPreparationText(lunch.preparationRole)}

◆ 夕食
Alice: ${getParticipationText(dinner.aliceParticipation)}
Bob: ${getParticipationText(dinner.bobParticipation)}
準備: ${getPreparationText(dinner.preparationRole)}

予定を変更する場合はメニューから「予定変更」を選択してください。`;
};

export const generateEveningNotification = (lunch: MealPlan, dinner: MealPlan): string => {
  return `【明日の食事予定確認】
◆ 昼食
Alice: ${getParticipationText(lunch.aliceParticipation)}
Bob: ${getParticipationText(lunch.bobParticipation)}
準備: ${getPreparationText(lunch.preparationRole)}

◆ 夕食
Alice: ${getParticipationText(dinner.aliceParticipation)}
Bob: ${getParticipationText(dinner.bobParticipation)}
準備: ${getPreparationText(dinner.preparationRole)}

予定を変更する場合はメニューから「予定変更」を選択してください。`;
};

function getParticipationText(status: ParticipationStatus): string {
  switch (status) {
    case ParticipationStatus.WILL_PARTICIPATE:
      return '参加';
    case ParticipationStatus.WILL_NOT_PARTICIPATE:
      return '不参加';
    case ParticipationStatus.UNDECIDED:
      return '未定';
  }
}

function getPreparationText(role: PreparationRole): string {
  switch (role) {
    case PreparationRole.ALICE:
      return 'Aliceが作る';
    case PreparationRole.BOB:
      return 'Bobが作る';
    case PreparationRole.NONE:
      return 'なし';
  }
}
```

---

## Phase 7: Flexメッセージの更新

### 7.1 新しいFlexメッセージ形式
**ファイル**: `src/features/line/messages/flex.ts`

```typescript
import { FlexMessage } from '@line/bot-sdk';
import { MealPlan, MealType } from '../../../domain/entities/MealPlan';

export const createMealPlanFlexMessage = (date: Date, lunch: MealPlan, dinner: MealPlan): FlexMessage => {
  return {
    type: 'flex',
    altText: `${formatDate(date)}の食事予定`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${formatDate(date)}の食事予定`,
            weight: 'bold',
            size: 'lg'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          // 昼食セクション
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '◆ 昼食',
                weight: 'bold',
                margin: 'md'
              },
              {
                type: 'text',
                text: `Alice: ${getParticipationText(lunch.aliceParticipation)}\nBob: ${getParticipationText(lunch.bobParticipation)}\n準備: ${getPreparationText(lunch.preparationRole)}`,
                size: 'sm',
                wrap: true
              }
            ]
          },
          // 夕食セクション
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '◆ 夕食',
                weight: 'bold',
                margin: 'md'
              },
              {
                type: 'text',
                text: `Alice: ${getParticipationText(dinner.aliceParticipation)}\nBob: ${getParticipationText(dinner.bobParticipation)}\n準備: ${getPreparationText(dinner.preparationRole)}`,
                size: 'sm',
                wrap: true
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '昼食を編集',
              data: `action=edit_meal&date=${formatDate(date)}&mealType=LUNCH`
            },
            style: 'secondary',
            flex: 1
          },
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '夕食を編集',
              data: `action=edit_meal&date=${formatDate(date)}&mealType=DINNER`
            },
            style: 'secondary',
            flex: 1
          }
        ]
      }
    }
  };
};
```

---

## Phase 8: テストの更新

### 8.1 ドメインエンティティテスト
**新規ファイル**: `tests/domain/entities/MealPlan.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { MealPlan, MealType, PreparationRole, ParticipationStatus } from '../../../src/domain/entities/MealPlan';

describe('MealPlan', () => {
  describe('createLunchPlan', () => {
    it('Bob固定担当で昼食計画を作成する', () => {
      const date = new Date('2024-01-15');
      const plan = MealPlan.createLunchPlan(date);

      expect(plan.mealType).toBe(MealType.LUNCH);
      expect(plan.preparationRole).toBe(PreparationRole.BOB);
      expect(plan.aliceParticipation).toBe(ParticipationStatus.WILL_PARTICIPATE);
      expect(plan.bobParticipation).toBe(ParticipationStatus.WILL_PARTICIPATE);
      expect(plan.currentState).toBe(1);
    });
  });

  describe('createDinnerPlan', () => {
    it('Alice担当で夕食計画を作成する', () => {
      const date = new Date('2024-01-15');
      const result = MealPlan.createDinnerPlan(date, PreparationRole.ALICE);

      expect(result.isSuccess).toBe(true);
      const plan = result.value;
      expect(plan.mealType).toBe(MealType.DINNER);
      expect(plan.preparationRole).toBe(PreparationRole.ALICE);
      expect(plan.currentState).toBe(3);
    });

    it('担当者なしの場合はエラーを返す', () => {
      const date = new Date('2024-01-15');
      const result = MealPlan.createDinnerPlan(date, PreparationRole.NONE);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe("夕食では担当者の指定が必要です");
    });
  });

  describe('preparerQuits', () => {
    it('担当者辞退時に全員不参加になる', () => {
      const plan = MealPlan.createLunchPlan(new Date());
      const result = plan.preparerQuits();

      expect(result.isSuccess).toBe(true);
      expect(plan.preparationRole).toBe(PreparationRole.NONE);
      expect(plan.aliceParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
      expect(plan.bobParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
    });
  });

  describe('changeAliceParticipation', () => {
    it('担当者でない場合は不参加に変更できる', () => {
      const result = MealPlan.createDinnerPlan(new Date(), PreparationRole.BOB);
      const plan = result.value;
      
      const changeResult = plan.changeAliceParticipation(ParticipationStatus.WILL_NOT_PARTICIPATE);
      
      expect(changeResult.isSuccess).toBe(true);
      expect(plan.aliceParticipation).toBe(ParticipationStatus.WILL_NOT_PARTICIPATE);
    });

    it('担当者の場合は不参加に変更できない', () => {
      const result = MealPlan.createDinnerPlan(new Date(), PreparationRole.ALICE);
      const plan = result.value;
      
      const changeResult = plan.changeAliceParticipation(ParticipationStatus.WILL_NOT_PARTICIPATE);
      
      expect(changeResult.isFailure).toBe(true);
      expect(changeResult.error).toBe("担当者は参加必須です");
    });
  });
});
```

### 8.2 既存テストの更新
**ファイル**: `tests/unit/features/line/messages/templates.test.ts`

```typescript
// 既存のテストを新しいMealPlanエンティティに合わせて更新
import { describe, it, expect } from 'vitest';
import { MealPlan, MealType, PreparationRole, ParticipationStatus } from '../../../../../src/domain/entities/MealPlan';
import { generateMorningNotification } from '../../../../../src/features/notification/templates/mealPlan';

describe('Notification Templates', () => {
  it('朝の通知メッセージが正しく生成される', () => {
    const lunch = new MealPlan(
      '1', new Date(), MealType.LUNCH, PreparationRole.BOB,
      ParticipationStatus.WILL_NOT_PARTICIPATE, ParticipationStatus.WILL_PARTICIPATE,
      2, new Date(), new Date()
    );
    
    const dinner = new MealPlan(
      '2', new Date(), MealType.DINNER, PreparationRole.ALICE,
      ParticipationStatus.WILL_PARTICIPATE, ParticipationStatus.WILL_PARTICIPATE,
      3, new Date(), new Date()
    );

    const message = generateMorningNotification(lunch, dinner);
    
    expect(message).toContain('【本日の食事予定】');
    expect(message).toContain('Alice: 不参加');
    expect(message).toContain('Bob: 参加');
    expect(message).toContain('準備: Bobが作る');
    expect(message).toContain('準備: Aliceが作る');
  });
});
```

---

## Phase 9: 依存関係注入の設定

### 9.1 DIコンテナの設定
**新規ファイル**: `src/di/container.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { MealPlanRepository } from '../domain/repositories/MealPlanRepository';
import { PrismaMealPlanRepository } from '../infrastructure/repositories/PrismaMealPlanRepository';
import { MealPlanService } from '../features/meal/services/meal';

export class DIContainer {
  private static instance: DIContainer;
  
  private _prisma: PrismaClient;
  private _mealPlanRepository: MealPlanRepository;
  private _mealPlanService: MealPlanService;

  private constructor() {
    this._prisma = new PrismaClient();
    this._mealPlanRepository = new PrismaMealPlanRepository(this._prisma);
    this._mealPlanService = new MealPlanService(this._mealPlanRepository);
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  get mealPlanService(): MealPlanService {
    return this._mealPlanService;
  }
}
```

### 9.2 既存のサービス呼び出しを更新
**ファイル**: `src/features/line/handlers/postback.ts`

```typescript
// 既存のimportを更新
import { DIContainer } from '../../../di/container';

export const handlePostback = async (event: PostbackEvent) => {
  const container = DIContainer.getInstance();
  const mealService = container.mealPlanService;
  
  // 既存のハンドラー呼び出しを更新
  const data = new URLSearchParams(event.postback.data);
  const action = data.get('action');

  switch (action) {
    case 'edit_meal':
      const mealType = data.get('mealType');
      if (mealType === 'LUNCH') {
        await handleLunchPostback(event, mealService);
      } else {
        await handleDinnerPostback(event, mealService);
      }
      break;
    // その他のハンドラー...
  }
};
```

---

## Phase 10: 削除・クリーンアップ

### 10.1 不要なファイルの削除
以下のファイルを削除または統合:

```bash
# 削除対象ファイル
rm src/features/line/handlers/postbacks/lunch.ts  # 新しい実装で置き換え
rm src/features/line/handlers/postbacks/dinner.ts # 新しい実装で置き換え

# 古いサービスファイルのバックアップとリネーム
mv src/features/meal/services/meal.ts src/features/meal/services/meal.old.ts
```

### 10.2 型定義の更新
**ファイル**: `src/types/index.ts`

```typescript
// 既存の型定義を新しいドメインエンティティに置き換え
export { MealPlan, MealType, PreparationRole, ParticipationStatus } from '../domain/entities/MealPlan';
export { Result } from '../domain/types/Result';

// 古いPrisma型の削除
// export type { MealPlan as PrismaMealPlan, ... } from '@prisma/client';
```

---

## Phase 11: 最終確認とテスト

### 11.1 統合テストの実行
```bash
# マイグレーション確認
npx prisma migrate status

# 全テスト実行
npm test

# E2Eテスト実行
npm run test:e2e

# ビルド確認
npm run build
```

### 11.2 データ移行スクリプト（必要な場合）
**新規ファイル**: `scripts/migrate_meal_data.ts`

```typescript
// 既存のMealPlan+MealParticipationデータを新しい形式に移行
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateMealData() {
  // 既存データの移行ロジック
  console.log('Starting data migration...');
  
  // 1. 既存のMealPlanデータを取得
  // 2. 新しい形式に変換
  // 3. 新しいテーブルに挿入
  // 4. 古いデータの削除
  
  console.log('Data migration completed');
}

migrateMealData().catch(console.error).finally(() => prisma.$disconnect());
```

---

## 完了チェックリスト

### データベース
- [ ] Prismaスキーマ更新
- [ ] マイグレーション実行
- [ ] 不要なテーブル削除

### ドメインレイヤー
- [ ] MealPlanエンティティ実装
- [ ] Result型実装
- [ ] リポジトリインターフェース定義

### インフラストラクチャレイヤー
- [ ] PrismaMealPlanRepository実装
- [ ] DIコンテナ設定

### アプリケーションレイヤー
- [ ] MealPlanService実装
- [ ] 既存サービスの置き換え

### プレゼンテーションレイヤー
- [ ] ポストバックハンドラー更新
- [ ] Flexメッセージ更新
- [ ] 通知テンプレート更新

### テスト
- [ ] ドメインエンティティテスト
- [ ] リポジトリテスト
- [ ] サービステスト
- [ ] 統合テスト

### クリーンアップ
- [ ] 不要ファイル削除
- [ ] 型定義更新
- [ ] データ移行実行

---

**注意事項:**
1. 各Phaseは順番に実行すること
2. データベースマイグレーション前に必ずバックアップを取ること
3. 本番環境への適用前に開発環境で十分にテストすること
4. 既存のLINEユーザーへの影響を考慮して段階的にリリースすること