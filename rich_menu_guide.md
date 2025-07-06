# リッチメニューの登録方法

## 概要
このLINEボットプロジェクトでは、食事予定管理のためのリッチメニューが実装されています。リッチメニューは、ユーザーが簡単に機能にアクセスできるようにする画像ベースのメニューです。

## 実装済みの機能

### 1. リッチメニューの定義
現在のリッチメニューは、以下の仕様で定義されています：

```typescript
const richMenu: RichMenu = {
  size: {
    width: 2500,
    height: 1686,
  },
  selected: true,
  name: "食事予定管理メニュー",
  chatBarText: "メニュー",
  areas: [
    // 予定登録ボタン
    {
      bounds: {
        x: 0,
        y: 0,
        width: 1250,
        height: 1686,
      },
      action: {
        type: "message",
        text: "予定登録",
      },
    },
    // 予定確認ボタン
    {
      bounds: {
        x: 1250,
        y: 0,
        width: 1250,
        height: 1686,
      },
      action: {
        type: "message",
        text: "予定確認",
      },
    },
  ],
};
```

### 2. リッチメニューの主要機能

#### 2.1 リッチメニューの作成
```typescript
export const createRichMenu = async (): Promise<string> => {
  // リッチメニューの定義を作成し、LINE APIに送信
  const richMenuId = await lineClient.createRichMenu(richMenu);
  return richMenuId;
};
```

#### 2.2 画像のアップロード
```typescript
export const uploadRichMenuImage = async (
  richMenuId: string,
  imageBuffer: Buffer,
): Promise<void> => {
  await lineClient.setRichMenuImage(richMenuId, imageBuffer);
};
```

#### 2.3 デフォルトメニューの設定
```typescript
export const setDefaultRichMenu = async (richMenuId: string): Promise<void> => {
  await lineClient.setDefaultRichMenu(richMenuId);
};
```

#### 2.4 完全なセットアップ
```typescript
export const setupRichMenu = async (imageBuffer: Buffer): Promise<string> => {
  // 既存のリッチメニューを削除
  const richMenuIds = await getRichMenuList();
  for (const richMenuId of richMenuIds) {
    await deleteRichMenu(richMenuId);
  }

  // 新しいリッチメニューを作成
  const newRichMenuId = await createRichMenu();

  // 画像をアップロード
  await uploadRichMenuImage(newRichMenuId, imageBuffer);

  // デフォルトとして設定
  await setDefaultRichMenu(newRichMenuId);

  return newRichMenuId;
};
```

## 使用方法

### 1. APIエンドポイントを使用
リッチメニューの登録は、`/setup/richmenu`エンドポイントにGETリクエストを送信することで実行できます：

```bash
curl -X GET http://localhost:3000/setup/richmenu
```

### 2. プログラムでの使用
コード内で直接リッチメニューを登録する場合：

```typescript
import { setupRichMenu } from './services/richmenu';
import { generateRichMenuImage } from './utils/richMenuImage';

const setupMenu = async () => {
  const imageBuffer = generateRichMenuImage();
  const richMenuId = await setupRichMenu(imageBuffer);
  console.log(`リッチメニューが登録されました: ${richMenuId}`);
};
```

## 実装の改善点

### 1. リッチメニュー画像の生成
現在の実装では、プレースホルダーとしてダミーバッファが使用されています。実際の使用では、以下のような実装が推奨されます：

```typescript
import { createCanvas, loadImage } from 'canvas';

export const generateRichMenuImage = (): Buffer => {
  const canvas = createCanvas(2500, 1686);
  const ctx = canvas.getContext('2d');
  
  // 背景色を設定
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 2500, 1686);
  
  // 左側のボタン（予定登録）
  ctx.fillStyle = '#007bff';
  ctx.fillRect(0, 0, 1250, 1686);
  
  // 右側のボタン（予定確認）
  ctx.fillStyle = '#28a745';
  ctx.fillRect(1250, 0, 1250, 1686);
  
  // テキストを追加
  ctx.fillStyle = '#ffffff';
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('予定登録', 625, 850);
  ctx.fillText('予定確認', 1875, 850);
  
  return canvas.toBuffer('image/png');
};
```

### 2. 外部画像ファイルの使用
事前に作成した画像ファイルを使用する場合：

```typescript
import fs from 'fs';

export const generateRichMenuImage = (): Buffer => {
  return fs.readFileSync('path/to/your/richmenu.png');
};
```

## 注意事項

1. **画像サイズ**: リッチメニュー画像は2500x1686ピクセルである必要があります
2. **ファイル形式**: PNG形式を推奨します
3. **ファイルサイズ**: 1MB以下である必要があります
4. **エリア設定**: クリック可能なエリアは、画像の座標と正確に一致させる必要があります

## トラブルシューティング

### よくあるエラーと対処法

1. **画像のアップロードエラー**
   - 画像サイズが正しいか確認
   - ファイル形式がPNGまたはJPEGか確認
   - ファイルサイズが1MB以下か確認

2. **リッチメニューが表示されない**
   - デフォルトメニューとして設定されているか確認
   - LINE Botが正しくアプリケーションと連携されているか確認

3. **クリック反応しない**
   - エリアの座標が正しいか確認
   - アクションタイプが正しいか確認

## 参考リンク

- [LINE Bot SDK for Node.js](https://github.com/line/line-bot-sdk-nodejs)
- [LINE Messaging API Reference](https://developers.line.biz/en/reference/messaging-api/)
- [リッチメニューの仕様](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/)