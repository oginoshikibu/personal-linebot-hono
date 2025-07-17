import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 全ユーザーを一覧表示する
 */
async function listUsers(): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    if (users.length === 0) {
      console.log("ユーザーが見つかりません");
      return;
    }

    console.log("=== ユーザー一覧 ===");
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.lineId})`);
      if (user.email) {
        console.log(`   Email: ${user.email}`);
      }
      console.log(`   登録日: ${user.createdAt.toLocaleDateString()}`);
      console.log("");
    });
  } catch (error) {
    console.error("ユーザー一覧取得エラー:", error);
    throw error;
  }
}

// ユーザー一覧を表示
listUsers()
  .then(() => {
    console.log("ユーザー一覧の表示が完了しました");
  })
  .catch((error) => {
    console.error("ユーザー一覧取得に失敗しました:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
