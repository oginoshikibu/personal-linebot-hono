import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ユーザーを削除する
 * @param lineId LINEユーザーID
 */
async function deleteUser(lineId: string): Promise<void> {
  try {
    // ユーザーが存在するかチェック
    const user = await prisma.user.findUnique({
      where: { lineId },
    });

    if (!user) {
      console.log(`ユーザーが見つかりません: ${lineId}`);
      return;
    }

    // ユーザーを削除
    await prisma.user.delete({
      where: { lineId },
    });

    console.log(`ユーザーを削除しました: ${user.name} (${lineId})`);
  } catch (error) {
    console.error("ユーザー削除エラー:", error);
    throw error;
  }
}

// コマンドライン引数から値を取得
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("使用方法: npm run delete-user <lineId>");
  process.exit(1);
}

const [lineId] = args;

// ユーザーを削除
deleteUser(lineId)
  .then(() => {
    console.log("ユーザーの削除が完了しました");
  })
  .catch((error) => {
    console.error("ユーザー削除に失敗しました:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });