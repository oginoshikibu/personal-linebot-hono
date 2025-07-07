/**
 * リッチメニュー画像を生成するユーティリティ
 *
 * このファイルはリッチメニュー画像を生成または読み込みます。
 * 本番環境では、実際のデザインされた画像ファイルを使用するか、
 * Canvas APIなどを使って動的に画像を生成することを推奨します。
 */
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger';

/**
 * シンプルなリッチメニュー画像を生成
 * @returns 画像のバッファ
 */
export const generateRichMenuImage = (): Buffer => {
  try {
    // 事前に用意した画像ファイルを読み込む
    const imagePath = path.resolve(__dirname, '../../assets/images/richmenu.png');
    
    // ファイルが存在するかチェック
    if (fs.existsSync(imagePath)) {
      return fs.readFileSync(imagePath);
    }
    
    // ファイルが存在しない場合、デフォルトの画像を作成
    // この例では、シンプルな1x1ピクセルの透明なPNG画像を作成
    // 実際のリッチメニュー画像は2500x1686ピクセルのサイズが必要
    logger.warn('リッチメニュー画像ファイルが見つかりません。デフォルト画像を生成します。');
    
    // 1x1ピクセルの透明なPNG画像のバイナリデータ
    // LINE APIはPNGまたはJPEG形式の画像を期待します
    const transparentPngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    return transparentPngBuffer;
  } catch (error) {
    logger.error('リッチメニュー画像の生成に失敗しました:', error);
    throw new Error('リッチメニュー画像の生成に失敗しました');
  }
};
