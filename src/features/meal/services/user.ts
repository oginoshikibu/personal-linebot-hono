import type { User } from "@prisma/client";
import { logger } from "../../../lib/logger";
import { prisma } from "../../../lib/prisma";

/**
 * LINE IDからユーザーを取得
 * @param lineId LINE ID
 * @returns ユーザー情報（存在しない場合はnull）
 */
export const getUserByLineId = async (lineId: string): Promise<User | null> => {
  try {
    return await prisma.user.findUnique({
      where: { lineId },
    });
  } catch (error) {
    logger.error(`ユーザー取得エラー: ${lineId}`, error);
    return null;
  }
};

/**
 * 全ユーザーを取得
 * @returns ユーザーの配列
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await prisma.user.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    logger.error("全ユーザー取得エラー", error);
    return [];
  }
};

/**
 * ユーザーを作成
 * @param lineId LINE ID
 * @param name ユーザー名
 * @returns 作成されたユーザー
 */
export const createUser = async (
  lineId: string,
  name: string,
): Promise<User> => {
  try {
    return await prisma.user.create({
      data: {
        lineId,
        name,
      },
    });
  } catch (error) {
    logger.error(`ユーザー作成エラー: ${lineId}, ${name}`, error);
    throw error;
  }
};

/**
 * ユーザーを更新
 * @param id ユーザーID
 * @param data 更新データ
 * @returns 更新されたユーザー
 */
export const updateUser = async (
  id: string,
  data: { name?: string; lineId?: string },
): Promise<User> => {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`ユーザー更新エラー: ${id}`, error);
    throw error;
  }
};

/**
 * ユーザーを削除
 * @param id ユーザーID
 * @returns 削除されたユーザー
 */
export const deleteUser = async (id: string): Promise<User> => {
  try {
    return await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`ユーザー削除エラー: ${id}`, error);
    throw error;
  }
};
