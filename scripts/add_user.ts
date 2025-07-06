import { PrismaClient } from "@prisma/client";
import { config } from "../src/config";

const prisma = new PrismaClient();

interface UserData {
  lineId: string;
  name: string;
  email?: string;
}

/**
 * ユーザーを追加する
 * @param userData ユーザーデータ
 */
async function addUser(userData: UserData): Promise<void> {
  try {
    const user = await prisma.user.create({
      data: {
        lineId: userData.lineId,
        name: userData.name,
        email: userData.email || "",
      },
    });
    console.log("ユーザーを追加しました:", user);
  } catch (error) {
    console.error("ユーザー追加エラー:", error);
    throw error;
  }
}

// コマンドライン引数から値を取得
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("使用方法: npm run add-user <lineId> <name> [email]");
  process.exit(1);
}

const [lineId, name, email] = args;

// ユーザーを追加
addUser({ lineId, name, email })
  .then(() => {
    console.log("ユーザーの追加が完了しました");
  })
  .catch((error) => {
    console.error("ユーザー追加に失敗しました:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });