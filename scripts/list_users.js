const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function listUsers() {
  try {
    // すべてのユーザーを取得
    const users = await prisma.user.findMany();

    if (users.length === 0) {
      console.log("ユーザーが登録されていません");
      process.exit(0);
    }

    console.log("登録されているユーザー一覧:");
    users.forEach(user => {
      console.log("ID: " + user.id + ", LINE ID: " + user.lineId + ", 名前: " + user.name);
    });
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers(); 