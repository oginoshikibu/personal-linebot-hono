const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function findUser() {
  try {
    // 引数からLINE IDを取得
    const lineId = process.argv[2];

    if (!lineId) {
      console.error("検索するLINE IDを指定してください");
      process.exit(1);
    }

    // ユーザーの検索
    const user = await prisma.user.findUnique({
      where: { lineId },
    });

    if (!user) {
      console.log("LINE ID: " + lineId + " のユーザーは登録されていません");
      process.exit(0);
    }

    console.log("ユーザーが見つかりました:");
    console.log(user);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await prisma.$disconnect();
  }
}

findUser(); 