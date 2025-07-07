import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ユーザーを検索する
 * @param searchTerm 検索キーワード（LINE ID または名前）
 */
async function findUser(searchTerm: string): Promise<void> {
  try {
    // LINE IDで検索
    let user = await prisma.user.findUnique({
      where: { lineId: searchTerm },
    });

    // 見つからなかった場合は名前で検索
    if (!user) {
      const users = await prisma.user.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      });

      if (users.length === 0) {
        console.log(`ユーザーが見つかりません: ${searchTerm}`);
        return;
      }

      if (users.length === 1) {
        user = users[0];
      } else {
        console.log(`複数のユーザーが見つかりました: ${searchTerm}`);
        users.forEach((u, index) => {
          console.log(`${index + 1}. ${u.name} (${u.lineId})`);
        });
        return;
      }
    }

    // ユーザー情報を表示
    console.log("=== ユーザー情報 ===");
    console.log(`名前: ${user.name}`);
    console.log(`LINE ID: ${user.lineId}`);
    if (user.email) {
      console.log(`Email: ${user.email}`);
    }
    console.log(`登録日: ${user.createdAt.toLocaleDateString()}`);
    console.log(`更新日: ${user.updatedAt.toLocaleDateString()}`);
  } catch (error) {
    console.error("ユーザー検索エラー:", error);
    throw error;
  }
}

// コマンドライン引数から値を取得
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("使用方法: npm run find-user <lineId または name>");
  process.exit(1);
}

const [searchTerm] = args;

// ユーザーを検索
findUser(searchTerm)
  .then(() => {
    console.log("ユーザー検索が完了しました");
  })
  .catch((error) => {
    console.error("ユーザー検索に失敗しました:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });