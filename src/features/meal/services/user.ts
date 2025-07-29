import { logger } from "../../../lib/logger";

// TODO: User model has been removed from Prisma schema
// This file contains legacy user management functions that are no longer used
// in the new Alice/Bob fixed user system. These functions should be replaced
// with appropriate username-to-LINE-ID mapping logic when needed.

/**
 * LINE IDからユーザーを取得 (Legacy - currently disabled)
 * @param lineId LINE ID
 * @returns ユーザー情報（存在しない場合はnull）
 */
export const getUserByLineId = async (lineId: string): Promise<never> => {
  // Legacy function - User model no longer exists
  logger.warn(
    `getUserByLineId called with ${lineId} but User model has been removed`,
  );
  throw new Error(
    "Fetching user by LINE ID is no longer supported. Using fixed Alice/Bob system.",
  );
};

/**
 * 全ユーザーを取得 (Legacy - currently disabled)
 * @returns ユーザーの配列
 */
export const getAllUsers = async (): Promise<never> => {
  // Legacy function - User model no longer exists
  // In the new system, we have fixed Alice/Bob users
  logger.warn(
    "getAllUsers called but User model has been removed. Using fixed Alice/Bob system.",
  );
  throw new Error(
    "Fetching all users is no longer supported. Using fixed Alice/Bob system.",
  );
};

/**
 * ユーザーを作成 (Legacy - currently disabled)
 * @param lineId LINE ID
 * @param name ユーザー名
 * @returns 作成されたユーザー
 */
export const createUser = async (
  lineId: string,
  name: string,
): Promise<never> => {
  // Legacy function - User model no longer exists
  logger.warn(
    `createUser called with ${lineId}, ${name} but User model has been removed`,
  );
  throw new Error(
    "User creation is no longer supported. Using fixed Alice/Bob system.",
  );
};

/**
 * ユーザーを更新 (Legacy - currently disabled)
 * @param id ユーザーID
 * @param data 更新データ
 * @returns 更新されたユーザー
 */
export const updateUser = async (
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _data: { name?: string; lineId?: string },
): Promise<never> => {
  // Legacy function - User model no longer exists
  logger.warn(`updateUser called with ${id} but User model has been removed`);
  throw new Error(
    "User update is no longer supported. Using fixed Alice/Bob system.",
  );
};

/**
 * ユーザーを削除 (Legacy - currently disabled)
 * @param id ユーザーID
 * @returns 削除されたユーザー
 */
export const deleteUser = async (id: string): Promise<never> => {
  // Legacy function - User model no longer exists
  logger.warn(`deleteUser called with ${id} but User model has been removed`);
  throw new Error(
    "User deletion is no longer supported. Using fixed Alice/Bob system.",
  );
};
