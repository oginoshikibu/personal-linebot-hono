const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function deleteUser() {
  try {
    // 引数からLINE IDを取得
    const lineId = process.argv[2];

    if (!lineId) {
      console.error("削除するLINE IDを指定してください");
      process.exit(1);
    }

    // ユーザーの存在確認
    const existingUser = await prisma.user.findUnique({
      where: { lineId },
    });

    if (!existingUser) {
      console.log("LINE ID: " + lineId + " のユーザーは登録されていません");
      process.exit(0);
    }

    // ユーザーの削除
    await prisma.user.delete({
      where: { lineId },
    });

    console.log("ユーザーを削除しました:");
    console.log(existingUser);
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser(); 