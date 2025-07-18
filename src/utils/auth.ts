import crypto from "node:crypto";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { config } from "../config";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";

/**
 * LINE署名を検証する
 * @param signature 署名
 * @param body リクエストボディ
 * @returns 検証に成功した場合はtrue、失敗した場合はfalse
 */
export const verifyLineSignature = (
  signature: string,
  body: string,
): boolean => {
  try {
    const channelSecret = config.line.channelSecret;
    if (!channelSecret) {
      logger.error("LINE Channel Secretが設定されていません");
      return false;
    }

    const hmac = crypto.createHmac("SHA256", channelSecret);
    const digest = hmac.update(body).digest("base64");

    return signature === digest;
  } catch (error) {
    logger.error("LINE署名の検証中にエラーが発生しました", error);
    return false;
  }
};

/**
 * 許可されたLINE IDかどうかを確認する
 * @param lineId LINE ID
 * @returns 許可されたIDの場合はtrue、そうでない場合はfalse
 */
export const isAllowedLineId = async (lineId: string): Promise<boolean> => {
  try {
    // データベースからユーザーを検索
    const user = await prisma.user.findUnique({
      where: { lineId },
    });

    // ユーザーが存在すればtrue、存在しなければfalse
    return !!user;
  } catch (error) {
    logger.error(`LINE ID検証エラー: ${lineId}`, error);
    return false;
  }
};

/**
 * LINE署名検証ミドルウェア
 * @param c コンテキスト
 * @param next 次のハンドラ
 * @returns レスポンス
 */
export const lineSignatureMiddleware = async (
  c: Context,
  next: Next,
): Promise<Response> => {
  try {
    const signature = c.req.header("x-line-signature");
    if (!signature) {
      logger.warn("LINE署名がリクエストに含まれていません");
      throw new HTTPException(401, { message: "署名がありません" });
    }

    const body = await c.req.text();
    if (!verifyLineSignature(signature, body)) {
      logger.warn("LINE署名の検証に失敗しました");
      throw new HTTPException(401, { message: "署名が無効です" });
    }

    // リクエストボディをコンテキストに保存
    try {
      c.set("lineRequestBody", JSON.parse(body));
    } catch (error) {
      logger.error("リクエストボディのJSONパースに失敗しました", error);
      throw new HTTPException(400, { message: "不正なJSONフォーマット" });
    }

    await next();
    return new Response("OK", { status: 200 });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    logger.error("LINE署名検証ミドルウェアでエラーが発生しました", error);
    throw new HTTPException(500, { message: "内部サーバーエラー" });
  }
};
