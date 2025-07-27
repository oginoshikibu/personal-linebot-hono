# LINEボット ユーザーフロー

## 概要

AliceとBobの食事管理LINEボットの操作フローを図解したものです。統一された食事ドメインでの昼食・夕食計画の確認・編集フローを示しています。

### 重要な制約
- 昼食: Bob固定担当、担当者変更不可
- 夕食: 初回のみBobが担当者選択（Alice or Bob）、決定後変更不可
- 担当者は必ず参加状態
- 担当者辞退時は全員自動不参加

## ユーザー操作フロー

```mermaid
flowchart TD
    Start([LINE Bot起動]) --> RichMenu[リッチメニュー]
    
    %% リッチメニューの主要項目
    RichMenu --> Today[今日の予定]
    RichMenu --> Tomorrow[明日の予定]
    RichMenu --> ThisWeek[今週の予定]
    RichMenu --> Future[今後の予定]
    
    %% 直接アクセスフロー（予定表示）
    Today --> ShowToday[今日の予定表示]
    Tomorrow --> ShowTomorrow[明日の予定表示]
    ThisWeek --> ShowWeek[週間カレンダー表示]
    Future --> DateSelectView[月間カレンダー表示]
    
    ShowWeek --> SelectDateFromWeek[日付選択]
    DateSelectView --> SelectDateFromMonth[日付選択]
    SelectDateFromWeek --> ShowDate[選択日の予定表示]
    SelectDateFromMonth --> ShowDate
    
    %% 予定表示後の編集オプション
    ShowToday --> EditOption[編集オプション]
    ShowTomorrow --> EditOption
    ShowDate --> EditOption
    
    EditOption --> EditChoice{編集する?}
    EditChoice -->|はい| LunchQ[昼食の予定質問]
    EditChoice -->|いいえ| End([終了])
    
    %% 昼食編集フロー（Bob固定担当）
    LunchQ --> LunchChoice{昼食の選択肢}
    LunchChoice -->|参加する| LunchAttend[Alice参加]
    LunchChoice -->|参加しない| LunchAbsent[Alice不参加]
    LunchChoice -->|辞退する| LunchQuit[Bob辞退（全員不参加）]
    LunchChoice -->|未定| LunchUndecided[Bob未定]
    LunchChoice -->|キャンセル| Cancel1[キャンセル]
    
    Cancel1 --> End
    
    LunchAttend --> DinnerQ[夕食の予定質問]
    LunchAbsent --> DinnerQ
    LunchCook --> DinnerQ
    LunchQuit --> DinnerQ
    LunchUndecided --> DinnerQ
    
    DinnerQ --> DinnerRoleCheck{担当者確認}
    DinnerRoleCheck -->|未設定| DinnerRoleSelect[Bob担当者選択]
    DinnerRoleCheck -->|Alice担当| DinnerAliceOptions{Alice選択肢}
    DinnerRoleCheck -->|Bob担当| DinnerBobOptions{Bob選択肢}
    
    DinnerRoleSelect --> SelectAlice[Alice担当設定]
    DinnerRoleSelect --> SelectBob[Bob担当設定]
    SelectAlice --> DinnerAliceOptions
    SelectBob --> DinnerBobOptions
    
    DinnerAliceOptions -->|参加（固定）| DinnerAliceAttend[Alice参加]
    DinnerAliceOptions -->|辞退する| DinnerAliceQuit[Alice辞退（全員不参加）]
    DinnerBobOptions -->|参加状況変更| DinnerBobChange[Bob参加変更]
    
    DinnerBobOptions -->|参加（固定）| DinnerBobAttend[Bob参加]
    DinnerBobOptions -->|辞退する| DinnerBobQuit[Bob辞退（全員不参加）]
    DinnerAliceOptions -->|参加状況変更| DinnerAliceChange[Alice参加変更]
    
    DinnerAliceAttend --> Complete
    DinnerAliceQuit --> Complete
    DinnerBobAttend --> Complete
    DinnerBobQuit --> Complete
    DinnerAliceChange --> Complete
    DinnerBobChange --> Complete
    
    DinnerRoleCheck -->|キャンセル| SaveLunchOnly[昼食のみ保存]
    
    
    SaveLunchOnly --> Notify2[昼食予定登録完了]
    Notify2 --> CheckToday2{今日/明日?}
    CheckToday2 -->|はい| NotifyOthers2[他のユーザーに通知]
    CheckToday2 -->|いいえ| End
    NotifyOthers2 --> End
    
    Complete --> CheckToday{今日/明日?}
    CheckToday -->|はい| NotifyOthers[他のユーザーに通知]
    CheckToday -->|いいえ| End
    NotifyOthers --> End
    
    %% 週間予定入力リマインダー（日曜夜）- 未実装
    WeeklyReminder([日曜夜リマインダー\n（未実装）]) --> PlanNextWeek[来週の予定入力]
    PlanNextWeek --> WeeklyPlanning[曜日ごとに予定入力]
    WeeklyPlanning --> WeeklyComplete[週間予定入力完了]
    WeeklyPlanning -->|途中でキャンセル| PartialSave[入力済み分を保存]
    PartialSave --> End
```

## フロー概要

1. **リッチメニュー**
   - 「今日の予定」「明日の予定」「今週の予定」「今後の予定」の4つの主要エントリーポイント
   - 各ボタンから直接対応する時間軸の予定表示へ

2. **予定表示フロー**
   - 今日/明日：直接その日の予定を表示
   - 今週：週間カレンダー（7日間カレンダー）を表示し、日付を選択可能
   - 今後：月間カレンダーを表示し、日付を選択可能

3. **編集フロー**
   - 予定表示後に編集オプションを表示
   - 昼食→夕食の順に質問（統一ドメインモデル）
   - 昼食: Bob固定担当での参加状況変更または辞退
   - 夕食: 初回は担当者選択、設定後は参加状況変更または辞退
   - 各ステップでキャンセル可能
   - 夕食でキャンセルした場合は昼食のみ保存

4. **通知システム**
   - 今日/明日の予定変更時は他のユーザーに通知
   - 担当者辞退時の自動状態変更も通知対象
   - 日曜夜に来週の予定入力リマインダー（未実装）

5. **状態遷移の自動処理**
   - 担当者辞退時の全員不参加遷移
   - ビジネスルール違反時のエラー表示
   - 状態整合性の自動維持

6. **週間予定入力（未実装）**
   - 日曜夜のリマインダーから来週の予定を曜日ごとに入力
   - 途中でキャンセルした場合は入力済みの分だけ保存 